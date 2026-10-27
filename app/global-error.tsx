"use client";

/**
 * Last-resort error page when the root layout itself fails. It renders its own
 * document, so global styles aren't available; styles are inline.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#05070D",
          color: "#F2F4F8",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: 16,
        }}
      >
        <title>Something went wrong · ViewScale</title>
        <div
          style={{
            maxWidth: 440,
            textAlign: "center",
            background: "#0A0E16",
            border: "1px solid #1A2030",
            borderRadius: 16,
            padding: 32,
          }}
        >
          <h1 style={{ fontSize: 20, margin: 0 }}>ViewScale couldn&apos;t load</h1>
          <p style={{ color: "#8A93A6", fontSize: 14, lineHeight: 1.6 }}>
            Something went wrong on the server. Try again in a moment.
          </p>
          {error.digest && (
            <p style={{ color: "#8A93A6", fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 12,
              background: "#B8FF3C",
              color: "#05070D",
              border: 0,
              borderRadius: 12,
              padding: "12px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
