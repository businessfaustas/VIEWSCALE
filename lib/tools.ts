import {
  Fingerprint,
  GitCompareArrows,
  Languages,
  Repeat2,
  Sprout,
  Video,
  type LucideIcon,
} from "lucide-react";

export type Tool = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
};

/** Dashboard tools. `href: null` renders the "Coming soon" state. */
export const tools: Tool[] = [
  {
    id: "analyze",
    title: "Analyze Video",
    description: "Timestamped diagnosis with exact fixes.",
    icon: Video,
    href: "/upload",
  },
  {
    id: "compare",
    title: "Compare Videos",
    description: "See why one video beat another.",
    icon: GitCompareArrows,
    href: "/compare",
  },
  {
    id: "identity",
    title: "Creator Identity",
    description: "Pin down what makes your content yours.",
    icon: Fingerprint,
    href: null,
  },
  {
    id: "translator",
    title: "Analytics Translator",
    description: "Turn platform stats into next steps.",
    icon: Languages,
    href: null,
  },
  {
    id: "repurpose",
    title: "Repurpose Engine",
    description: "Adapt one video for every platform.",
    icon: Repeat2,
    href: null,
  },
  {
    id: "growth",
    title: "Growth Plan",
    description: "A weekly plan built from your reports.",
    icon: Sprout,
    href: null,
  },
];
