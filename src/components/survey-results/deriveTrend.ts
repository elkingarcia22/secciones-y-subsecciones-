import { jitter } from "@/mocks/surveyResults";

/**
 * A plausible history for a metric this app has no real measurement-over-
 * measurement record of (eNPS, average sentiment, AI confidence). Each past
 * point is deterministically jittered around today's value — stable for the
 * same seed, never `Math.random` — and the series always ends exactly on the
 * value the rest of the tab reports, so the sparkline reads as a real trend
 * instead of a flat line without inventing a genuine series.
 */
export function deriveTrendSeries(
  labels: readonly string[],
  seedPrefix: string,
  current: number,
  spread: number,
  bounds: readonly [number, number]
): readonly number[] {
  const [min, max] = bounds;
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  const history = labels
    .slice(0, -1)
    .map((label) => Math.round(clamp(jitter(`${seedPrefix}:${label}`, current - spread * 0.4, spread)) * 10) / 10);
  return [...history, current];
}
