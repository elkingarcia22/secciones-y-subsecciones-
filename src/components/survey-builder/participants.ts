import { Building2, FileUp, UserRoundSearch, Users2, type LucideIcon } from "lucide-react";
import { COLLABORATORS, COLLABORATOR_COUNT, type Collaborator } from "@/mocks/collaborators";
import type {
  ImportedUser,
  ParticipantMode,
  ParticipantsSelection,
  SegmentKey,
} from "./surveyBuilderTypes";

/** Re-exported so importing "the imported-user row" from here stays the same
 * home it always was. */
export type { ImportedUser };

export interface ResolvedImportRow {
  user: ImportedUser;
  /** The directory entry this row matched, or null when it is new. */
  person: Collaborator | null;
}

/**
 * Resolves an imported file against the directory, exactly once and with a
 * single rule: a row belongs to an existing platform user when its username
 * or its email matches — either identifier is enough. The preview table and
 * the "new users" count that feeds the demographics step must agree on this,
 * so both read from here.
 */
export function resolveImportedRows(
  users: readonly ImportedUser[],
  collaborators: readonly Collaborator[]
): readonly ResolvedImportRow[] {
  const byUsername = new Map(collaborators.map((person) => [person.username.toLowerCase(), person]));
  const byEmail = new Map(collaborators.map((person) => [person.email.toLowerCase(), person]));

  return users.map((user) => ({
    user,
    person:
      byUsername.get(user.username.toLowerCase()) ??
      (user.email !== "" ? byEmail.get(user.email.toLowerCase()) ?? null : null),
  }));
}

/**
 * Turns a raw column name into a demographic label the participant will read:
 * "tipo_contrato" → "Tipo de contrato", "sede" → "Sede".
 */
export function humanizeColumn(column: string): string {
  return column
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Column names the parser knows are demographic data, not identifiers — they
 * get a curated label ("Área", "Líder") instead of a blind humanization.
 * Anything else beyond `username`, `name` and `email` is humanized on the fly.
 */
export const DEMOGRAPHIC_COLUMN_LABELS: Readonly<Record<string, string>> = {
  area: "Área",
  leader: "Líder",
};

/** Human label for each way collaborators can be bucketed into groups. */
export const SEGMENT_LABELS: Readonly<Record<SegmentKey, string>> = {
  area: "Área",
  leader: "Líder",
  country: "País",
  age: "Edad",
  gender: "Sexo",
};

/**
 * How many collaborators fall under each distinct value of a category
 * ("Marketing" → 214, "Andrés Beltrán" → 88…). Shared by the company summary
 * table and the "Por grupos" mode, since both are the same bucketing.
 */
export function segmentCounts(
  segmentBy: SegmentKey,
  collaborators: readonly Collaborator[] = COLLABORATORS
): Map<string, number> {
  const counts = new Map<string, number>();
  collaborators.forEach((person) => {
    const value = person[segmentBy] ?? "Sin asignar";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return counts;
}

/**
 * Everyone whose `groupSegmentBy` value is one of `selectedGroups`. A
 * selected group is all-or-nothing, so this is also "who that group
 * contributes to the audience" — there is no partial-membership case to
 * account for separately.
 */
export function groupMemberIds(
  groupSegmentBy: SegmentKey,
  selectedGroups: readonly string[],
  collaborators: readonly Collaborator[] = COLLABORATORS
): ReadonlySet<string> {
  if (selectedGroups.length === 0) return new Set();
  const groups = new Set(selectedGroups);
  const ids = new Set<string>();
  collaborators.forEach((person) => {
    if (groups.has(person[groupSegmentBy] ?? "Sin asignar")) ids.add(person.id);
  });
  return ids;
}

/**
 * "Por colaborador" mode's real checked set: whoever a selected group brings
 * in, plus anyone picked by hand on top of that. Picking a group and
 * switching to "Por colaborador" is meant to land with that group's people
 * already ticked — this union is what makes that true without either mode
 * having to know about the other's state.
 */
export function effectiveIndividualIds(participants: ParticipantsSelection): ReadonlySet<string> {
  const ids = new Set(groupMemberIds(participants.groupSegmentBy, participants.selectedGroups));
  participants.selectedIds.forEach((id) => ids.add(id));
  return ids;
}

/** A clean slate for group selection. */
export function clearedGroupSelection(): Pick<ParticipantsSelection, "selectedGroups"> {
  return { selectedGroups: [] };
}

/**
 * Drops one whole group, and with it everyone from it — the "deselect it
 * completely" outcome "Por colaborador" offers when unchecking one of its
 * members. Anyone from it picked by hand elsewhere is dropped too, so none of
 * them stay in the audience.
 */
export function withGroupDeselected(
  participants: ParticipantsSelection,
  groupValue: string
): Partial<ParticipantsSelection> {
  const members = groupMemberIds(participants.groupSegmentBy, [groupValue]);
  return {
    selectedGroups: participants.selectedGroups.filter((value) => value !== groupValue),
    selectedIds: participants.selectedIds.filter((id) => !members.has(id)),
  };
}

/**
 * The other outcome "Por colaborador" offers for the same case: the group
 * stops being tracked as a selected unit — it wasn't picked as "everyone
 * except one person", so it can no longer claim to be the whole group — but
 * everyone in it besides `excludedPersonId` keeps their spot, now as an
 * ad-hoc pick rather than group membership. "Por grupos" will show that group
 * as unselected again even though most of its people are still in.
 */
export function withGroupConvertedToIndividuals(
  participants: ParticipantsSelection,
  groupValue: string,
  excludedPersonId: string
): Partial<ParticipantsSelection> {
  const members = groupMemberIds(participants.groupSegmentBy, [groupValue]);
  const kept = [...members].filter((id) => id !== excludedPersonId);
  return {
    selectedGroups: participants.selectedGroups.filter((value) => value !== groupValue),
    selectedIds: [...new Set([...participants.selectedIds, ...kept])],
  };
}

export interface ParticipantsGroupBreakdown {
  /** Each selected group and how many people it contributes, in the order
   * they were picked. */
  groups: readonly { label: string; count: number }[];
  /** Ad-hoc individual picks not covered by any selected group. */
  outsideCount: number;
  /** Rows brought in from an imported file — added on top of whichever
   * groups/individuals are selected, regardless of which mode is active. */
  importedCount: number;
}

/**
 * How the active audience actually breaks down between the groups feeding it,
 * anyone picked by hand on top, and anyone brought in from an import — the
 * same distinction "Por colaborador"'s own caption reads, surfaced here for
 * the "Información" card so it isn't one flat number whenever groups or an
 * import are involved. The group/individual split is empty for "company" and
 * "import" modes, where there is nothing to break down, but an import's count
 * still shows up there since it always adds to the total (see
 * `totalParticipantCount`).
 */
export function participantsGroupBreakdown(participants: ParticipantsSelection): ParticipantsGroupBreakdown {
  const importedCount = participants.importedCount;
  if (participants.mode !== "groups" && participants.mode !== "individual") {
    return { groups: [], outsideCount: 0, importedCount };
  }
  const counts = segmentCounts(participants.groupSegmentBy);
  const groups = participants.selectedGroups.map((value) => ({
    label: value,
    count: counts.get(value) ?? 0,
  }));
  if (participants.mode === "groups") {
    return { groups, outsideCount: 0, importedCount };
  }
  const covered = groupMemberIds(participants.groupSegmentBy, participants.selectedGroups);
  const outsideCount = participants.selectedIds.filter((id) => !covered.has(id)).length;
  return { groups, outsideCount, importedCount };
}

/**
 * The whole audience, combined across every source at once rather than just
 * whichever mode tab happens to be open: "Toda la empresa" already means
 * everyone, so it stands alone, but groups, hand-picked collaborators, and an
 * imported file all add to one running total regardless of which of them is
 * the active mode. Sources are summed as-is — an imported row that happens to
 * match a collaborator already selected elsewhere is still counted once per
 * source, not deduplicated.
 */
export function totalParticipantCount(participants: ParticipantsSelection): number {
  const audienceBase =
    participants.mode === "company" ? COLLABORATOR_COUNT : effectiveIndividualIds(participants).size;
  return audienceBase + participants.importedCount;
}

/**
 * How many people a given mode would contribute on its own — what the "Por
 * colaborador" card's caption reads while "Toda la empresa" is active, for
 * instance. Every mode keeps its own state alive in the background (see
 * `ParticipantsSelection`), so this answers for whichever mode you name, not
 * just whichever is active. `totalParticipantCount` above is the sum that
 * actually matters for "who receives this".
 */
export function participantCountForMode(mode: ParticipantMode, participants: ParticipantsSelection): number {
  switch (mode) {
    case "company":
      return COLLABORATOR_COUNT;
    case "groups":
      return groupMemberIds(participants.groupSegmentBy, participants.selectedGroups).size;
    case "individual":
      return effectiveIndividualIds(participants).size;
    case "import":
      return participants.importedCount;
  }
}

interface ParticipantModeCopy {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PARTICIPANT_MODE_COPY: Readonly<Record<ParticipantMode, ParticipantModeCopy>> = {
  company: {
    icon: Building2,
    title: "Toda la empresa",
    description: "Todos los colaboradores que tengas en la plataforma hoy.",
  },
  groups: {
    icon: Users2,
    title: "Por grupos",
    description: "Elige áreas, líderes u otros grupos que deben responder.",
  },
  individual: {
    icon: UserRoundSearch,
    title: "Por colaborador",
    description: "Busca y filtra el directorio para armar una lista a la medida.",
  },
  import: {
    icon: FileUp,
    title: "Importar archivo",
    description: "Carga la lista desde un archivo si ya la tienes por fuera.",
  },
};

/** Menu order for the four modes, from broadest audience to most specific. */
export const PARTICIPANT_MODES: readonly ParticipantMode[] = [
  "company",
  "groups",
  "individual",
  "import",
];

/** Thousands separators, so six-thousand-odd people don't read as one blur. */
export function formatCount(value: number): string {
  return value.toLocaleString("es-CO");
}
