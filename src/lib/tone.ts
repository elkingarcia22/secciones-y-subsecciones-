import type * as React from "react";

/**
 * The app's accent palette, as named tones.
 *
 * The home already speaks this language: a template tile, a pulse card and a
 * status pill all take one accent and wash it down to a tint for the surface,
 * a stronger tint for the icon chip and the full color for the mark itself.
 * This module is that recipe in one place, so any screen can pick a tone and
 * get the same three weights out of it.
 *
 * Every tone resolves to a real CSS color, so `color-mix()` can produce the
 * whole ramp — including for the tones (`neutral`, `ai`, `violet`) whose
 * accent is not a token with an alpha-ready hsl triple behind it.
 */
export type Tone = "brand" | "positive" | "warning" | "neutral" | "ai" | "violet";

/**
 * The "official / other" indigo. A flat gray (tried first, on the template
 * tiles) read as "no tint at all" next to the saturated tones, so this family
 * gets a hue of its own — distinct from brand blue, positive green and the
 * warning orange.
 */
export const NEUTRAL_ACCENT = "var(--color-indigo)";

interface ToneDefinition {
  /** Accent color — text, borders and solid fills come from this. */
  accent: string;
  /** Second stop, for the one tone drawn as a gradient rather than a flat
   *  color. `ai` is a gradient everywhere else in the app, so it is here too —
   *  which also keeps it from reading as a third shade of blue next to
   *  `brand` and `neutral`. */
  accentEnd?: string;
}

const TONES: Readonly<Record<Tone, ToneDefinition>> = {
  brand: { accent: "var(--color-brand)" },
  positive: { accent: "var(--color-positive)" },
  warning: { accent: "var(--color-warning)" },
  neutral: { accent: NEUTRAL_ACCENT },
  ai: { accent: "var(--color-ai-gradient-start)", accentEnd: "var(--color-ai-gradient-end)" },
  // Flat on purpose — the gradient is reserved for real AI actions, so
  // anything only *themed* around AI (like the "Evaluación y adopción de
  // IA" survey kind) gets its own solid color instead of borrowing that
  // treatment.
  violet: { accent: "var(--color-violet)" },
};

/** @param alpha 0–100. `100` returns the accent itself. */
const mix = (color: string, alpha: number) =>
  alpha >= 100 ? color : `color-mix(in srgb, ${color} ${alpha}%, transparent)`;

/**
 * A fill at `alpha`: a flat wash for a one-stop tone, the gradient for `ai`.
 * Returns `backgroundImage` in the gradient case, so a caller can still set
 * its own `backgroundColor` underneath without the two fighting.
 */
function fill(tone: Tone, alpha: number): React.CSSProperties {
  const { accent, accentEnd } = TONES[tone];
  if (!accentEnd) return { backgroundColor: mix(accent, alpha) };
  return {
    backgroundImage: `linear-gradient(135deg, ${mix(accent, alpha)}, ${mix(accentEnd, alpha)})`,
  };
}

/** The tone's accent as a plain color — for text, icons and borders. */
export const toneAccent = (tone: Tone): string => TONES[tone].accent;

/** `color: <accent>` — the mark itself: a label, an icon, a caption. */
export const toneText = (tone: Tone): React.CSSProperties => ({ color: TONES[tone].accent });

/**
 * The soft square behind an icon: accent-colored glyph on a light tint of the
 * same hue. The home's badges and shelf icons are this shape.
 */
export const toneChip = (tone: Tone): React.CSSProperties => ({
  ...fill(tone, 12),
  color: TONES[tone].accent,
});

/** The full-strength badge — a numbering pill, a selected marker. */
export const toneSolid = (tone: Tone): React.CSSProperties => ({
  ...fill(tone, 100),
  color: "var(--color-text-inverse)",
});

/**
 * The faint wash a card or a header sits on. Kept low on purpose: a tint is
 * there to group and to give the surface a hue, never to become a block of
 * color. Pair it with a light overlay when it has to stretch across something
 * wide.
 */
export const toneWash = (tone: Tone, alpha = 6): React.CSSProperties => fill(tone, alpha);

/** A hairline rule or a 3px side accent. */
export const toneBar = (tone: Tone, alpha = 100): React.CSSProperties => fill(tone, alpha);

/** `border-color` at `alpha`, for a card outlined in its own tone. */
export const toneBorder = (tone: Tone, alpha = 55): React.CSSProperties => ({
  borderColor: mix(TONES[tone].accent, alpha),
});

/**
 * A selected card: outlined and washed in its tone, with its label in the
 * accent. One call so every "this one is picked" card across the builder
 * lands on the same three weights.
 */
export const toneSelected = (tone: Tone): React.CSSProperties => ({
  ...toneBorder(tone),
  ...fill(tone, 7),
  color: TONES[tone].accent,
});

/**
 * Tones handed out by position — for lists whose items carry no meaning of
 * their own, like the survey's root sections. The cycle starts on brand so a
 * one-section survey still looks like the rest of the app.
 */
export const TONE_CYCLE: readonly Tone[] = ["brand", "positive", "warning", "neutral", "ai"];

export const toneForIndex = (index: number): Tone =>
  TONE_CYCLE[((index % TONE_CYCLE.length) + TONE_CYCLE.length) % TONE_CYCLE.length];
