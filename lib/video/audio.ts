/**
 * Pulls the audio track out of a local video file as 16 kHz mono 16-bit WAV,
 * the format Whisper handles best. 3 minutes comes to about 5.8 MB.
 */

export const AUDIO_SAMPLE_RATE = 16_000;

export type AudioResult =
  | { ok: true; wav: Blob; seconds: number }
  | { ok: false; reason: "no_audio" | "silent" | "unsupported" };

export async function extractAudio(file: File): Promise<AudioResult> {
  if (typeof OfflineAudioContext === "undefined") return { ok: false, reason: "unsupported" };

  // An OfflineAudioContext resamples while decoding, so we get 16 kHz directly.
  const ctx = new OfflineAudioContext(1, 1, AUDIO_SAMPLE_RATE);
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    // Thrown for videos with no audio track as well as undecodable audio.
    return { ok: false, reason: "no_audio" };
  }

  const mono = new Float32Array(decoded.length);
  const channels = decoded.numberOfChannels;
  for (let c = 0; c < channels; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < data.length; i++) mono[i] += data[i] / channels;
  }

  let peak = 0;
  for (let i = 0; i < mono.length; i++) {
    const v = Math.abs(mono[i]);
    if (v > peak) peak = v;
  }
  if (peak < 0.01) return { ok: false, reason: "silent" };

  return { ok: true, wav: encodeWav(mono, decoded.sampleRate), seconds: decoded.duration };
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
