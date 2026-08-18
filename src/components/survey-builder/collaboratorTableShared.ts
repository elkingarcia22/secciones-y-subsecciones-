/**
 * Pure helpers shared by the directory table and the import preview. Kept
 * apart from any component file so fast-refresh rules hold: no file mixes
 * component and non-component exports.
 */

/** Sentinel for collaborator rows that have no direct leader, so they get
 * their own entry in the "Líder" filter. */
export const NO_LEADER = "Sin líder";

/** First letter of the first two words — enough to tell rows apart at a glance. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

/** Cycled by id rather than by row position, so a name keeps its color across
 * pages and filters instead of reshuffling every time the list changes. */
const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-status-info/10 text-status-info",
  "bg-status-positive/10 text-status-positive",
  "bg-status-warning/10 text-status-warning",
] as const;

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
