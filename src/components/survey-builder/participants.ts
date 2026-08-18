import { Building2, FileUp, UserRoundSearch, type LucideIcon } from "lucide-react";
import { COLLABORATOR_COUNT, type Collaborator } from "@/mocks/collaborators";
import type {
  ImportedUser,
  ParticipantMode,
  ParticipantsSelection,
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

/**
 * How many people the survey would actually reach, given the active mode.
 *
 * Only the active mode counts: the other two keep their state so switching
 * back is lossless, but they are not part of the audience while they are not
 * the answer to "who receives this".
 */
export function participantCount(participants: ParticipantsSelection): number {
  switch (participants.mode) {
    case "company":
      return COLLABORATOR_COUNT;
    case "individual":
      return participants.selectedIds.length;
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

/** Menu order for the three modes, from broadest audience to most specific. */
export const PARTICIPANT_MODES: readonly ParticipantMode[] = [
  "company",
  "individual",
  "import",
];

/** Thousands separators, so six-thousand-odd people don't read as one blur. */
export function formatCount(value: number): string {
  return value.toLocaleString("es-CO");
}
