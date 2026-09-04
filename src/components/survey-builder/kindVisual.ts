import { BrainCircuit, Gauge, Heart, Shapes, Sprout, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/tone";
import type { SurveyKind } from "./surveyBuilderTypes";

/**
 * One icon and one tone per survey kind — the single place that decides what
 * "Cultura" looks like.
 *
 * The home's template tiles read from this too (`getTemplateVisual`), so the
 * green heart on the "Cultura" tile in the shelf is the same green heart on
 * the "Cultura" card inside the builder. A type you recognized on the home is
 * the one you recognize while creating.
 */
export interface KindVisual {
  icon: LucideIcon;
  tone: Tone;
}

export const KIND_VISUAL: Readonly<Record<SurveyKind, KindVisual>> = {
  cultura: { icon: Heart, tone: "positive" },
  clima: { icon: Sprout, tone: "brand" },
  enps: { icon: Gauge, tone: "warning" },
  // Not `"ai"`: that tone's gradient is reserved for real AI actions
  // (Generar con IA, AI badges) — this is a survey topic, not an AI
  // feature, so it gets its own flat color instead of borrowing that look.
  ia: { icon: BrainCircuit, tone: "violet" },
  otros: { icon: Shapes, tone: "neutral" },
};
