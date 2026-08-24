import { ChevronDownCircle, CircleDot, ListChecks } from "lucide-react";
import { MIN_OPTIONS, buildOption, type CatalogEntry } from "./questionCatalog";
import type {
  DemographicField,
  DemographicSource,
  DemographicType,
  DemographicsConfig,
  ImportedDemographic,
} from "./surveyBuilderTypes";

/**
 * Demographics — catalog and helpers.
 *
 * A demographic is a small closed question whose answer becomes a filter in
 * the results. Three sources coexist, each its own accordion in the editor:
 *
 *   del sistema     variables the platform already models. Their answer
 *                   options are locked: a response only works as a filter if
 *                   it lands on one of the values the platform stores. Some of
 *                   them are also *preloadable* — the platform knows each
 *                   participant's value already — and the author decides
 *                   whether to use that.
 *   del módulo      questions already created in some other survey, reused
 *                   here. They arrive pre-filled but stay fully editable —
 *                   nothing about a reused question is locked.
 *   de esta encuesta written from scratch, for this survey only.
 */

export const DEMOGRAPHIC_TYPES: readonly CatalogEntry<DemographicType>[] = [
  { value: "single", label: "Opción única", icon: CircleDot },
  { value: "dropdown", label: "Desplegable", icon: ChevronDownCircle },
  { value: "multiple", label: "Múltiples respuestas", icon: ListChecks },
];

export const demographicTypeLabel = (type: DemographicType): string =>
  DEMOGRAPHIC_TYPES.find((entry) => entry.value === type)?.label ?? "";

export interface SystemDemographic {
  key: string;
  label: string;
  /** Where the value comes from, in the author's own terms. */
  origin: string;
  type: DemographicType;
  /** True when the platform already holds this value for every participant. */
  preloadable: boolean;
  optionLabels: readonly string[];
}

/**
 * The variables the platform can contribute.
 *
 * `preloadable: false` marks the ones that are standard demographics but are
 * *not* part of a user's record — nobody types their age band when an account
 * is created — so they can only ever be asked fresh, with no visibility
 * choice to make.
 */
export const SYSTEM_DEMOGRAPHICS: readonly SystemDemographic[] = [
  {
    key: "age",
    label: "Edad",
    origin: "No está en el perfil, así que se le pregunta al participante.",
    type: "single",
    preloadable: false,
    optionLabels: ["Menos de 25", "25 a 34", "35 a 44", "45 a 54", "55 o más"],
  },
  {
    key: "biologicalSex",
    label: "Sexo biológico",
    origin: "No está en el perfil, así que se le pregunta al participante.",
    type: "single",
    preloadable: false,
    optionLabels: ["Femenino", "Masculino", "Prefiero no responder"],
  },
  {
    key: "area",
    label: "Departamento o área de trabajo",
    origin: "Se toma del área asignada al usuario en la plataforma.",
    type: "dropdown",
    preloadable: true,
    // The same areas the company directory is built from, so a prototype filter
    // lands on real-looking segments.
    optionLabels: [
      "Tecnología",
      "Comercial",
      "Marketing",
      "Operaciones",
      "Gente y Cultura",
      "Finanzas",
      "Servicio al cliente",
      "Producto",
      "Legal",
      "Logística",
    ],
  },
  {
    key: "hierarchyLevel",
    label: "Nivel jerárquico en la empresa",
    origin: "Se toma del rol y el nivel del usuario en la plataforma.",
    type: "single",
    preloadable: true,
    optionLabels: [
      "Colaborador",
      "Líder de equipo",
      "Gerencia",
      "Dirección",
      "Alta dirección",
    ],
  },
  {
    key: "seniority",
    label: "Antigüedad en la empresa",
    origin: "Se calcula con la fecha de ingreso registrada en la plataforma.",
    type: "single",
    preloadable: true,
    optionLabels: [
      "Menos de 1 año",
      "1 a 3 años",
      "3 a 5 años",
      "5 a 10 años",
      "Más de 10 años",
    ],
  },
  {
    key: "location",
    label: "Sede o ciudad",
    origin: "Se toma de la sede asignada al usuario en la plataforma.",
    type: "dropdown",
    preloadable: true,
    optionLabels: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Remoto"],
  },
  {
    key: "contract",
    label: "Tipo de contrato",
    origin: "Se toma del tipo de vinculación registrado en la plataforma.",
    type: "single",
    preloadable: true,
    optionLabels: [
      "Término indefinido",
      "Término fijo",
      "Prestación de servicios",
      "Aprendiz o practicante",
    ],
  },
];

export const findSystemDemographic = (key: string): SystemDemographic | null =>
  SYSTEM_DEMOGRAPHICS.find((entry) => entry.key === key) ?? null;

/** The subset that can be preloaded — the only rows that carry a visibility choice. */
export const PRELOADABLE_SYSTEM_DEMOGRAPHICS: readonly SystemDemographic[] =
  SYSTEM_DEMOGRAPHICS.filter((entry) => entry.preloadable);

/**
 * Builds the field for a system catalog entry, or null when the key is
 * unknown. Shown rather than hidden by default — the safer starting point,
 * since the author can see exactly what came in before deciding to hide
 * anything.
 */
export function buildSystemDemographic(key: string): DemographicField | null {
  const entry = findSystemDemographic(key);
  if (!entry) return null;

  return {
    id: `dem-${crypto.randomUUID()}`,
    label: entry.label,
    source: "system",
    catalogKey: entry.key,
    preloadable: entry.preloadable,
    visible: true,
    type: entry.type,
    required: true,
    options: entry.optionLabels.map((label) => buildOption(label)),
  };
}

export interface LibraryDemographic {
  key: string;
  label: string;
  type: DemographicType;
  optionLabels: readonly string[];
  /**
   * When someone authored it, as an ISO date. Only the ones a person created
   * carry this — a system demographic has always existed as far as the
   * platform is concerned, so the column reads "—" for those rather than
   * inventing a date.
   */
  createdAt?: string;
}

/**
 * Questions already authored in some other survey, kept around so the next
 * one doesn't start from a blank page. Never preloadable — nothing here comes
 * from a participant's profile, only from a previous author's wording.
 */
export const LIBRARY_DEMOGRAPHICS: readonly LibraryDemographic[] = [
  {
    key: "workMode",
    label: "Modalidad de trabajo",
    type: "single",
    optionLabels: ["Presencial", "Híbrido", "Remoto"],
    createdAt: "2025-02-18",
  },
  {
    key: "shift",
    label: "Turno de trabajo",
    type: "single",
    optionLabels: ["Diurno", "Nocturno", "Rotativo"],
    createdAt: "2025-04-07",
  },
  {
    key: "education",
    label: "Nivel de formación académica",
    type: "dropdown",
    optionLabels: ["Bachillerato", "Técnico o tecnólogo", "Profesional", "Posgrado"],
    createdAt: "2025-06-23",
  },
  {
    key: "maritalStatus",
    label: "Estado civil",
    type: "single",
    optionLabels: ["Soltero/a", "Casado/a", "Unión libre", "Divorciado/a", "Viudo/a"],
    createdAt: "2025-09-15",
  },
  {
    key: "dependents",
    label: "Personas a cargo",
    type: "single",
    optionLabels: ["Ninguna", "1", "2", "3 o más"],
    createdAt: "2026-01-29",
  },
];

export const findLibraryDemographic = (key: string): LibraryDemographic | null =>
  LIBRARY_DEMOGRAPHICS.find((entry) => entry.key === key) ?? null;

/** Builds the field for a library entry, or null when the key is unknown. */
export function buildLibraryDemographic(key: string): DemographicField | null {
  const entry = findLibraryDemographic(key);
  if (!entry) return null;

  return {
    id: `dem-${crypto.randomUUID()}`,
    label: entry.label,
    source: "library",
    catalogKey: entry.key,
    preloadable: false,
    visible: true,
    type: entry.type,
    required: true,
    options: entry.optionLabels.map((label) => buildOption(label)),
  };
}

export function buildCustomDemographic(): DemographicField {
  return {
    id: `dem-${crypto.randomUUID()}`,
    label: "",
    source: "custom",
    catalogKey: null,
    preloadable: false,
    visible: true,
    type: "single",
    required: true,
    options: Array.from({ length: MIN_OPTIONS }, () => buildOption()),
  };
}

/**
 * Imported columns are keyed under their own namespace. Without it, a file's
 * `area` column would collide with the system's `area` variable — both would
 * answer to the same catalog key, and turning one on would block the other.
 */
export const importedCatalogKey = (column: string): string => `import:${column}`;

/**
 * Builds the field for a demographic column detected in the imported file.
 * The file already holds each new participant's value, so — exactly like a
 * system variable — it is preloadable and the author decides whether the
 * participant sees it. Unlike a system variable, nothing is locked: the
 * options come from the file but remain as editable as any other wording.
 */
export function buildImportedDemographic(entry: ImportedDemographic): DemographicField {
  return {
    id: `dem-${crypto.randomUUID()}`,
    label: entry.label,
    source: "import",
    catalogKey: importedCatalogKey(entry.key),
    preloadable: true,
    visible: true,
    type: "dropdown",
    required: true,
    options: entry.optionLabels.map((label) => buildOption(label)),
  };
}

/**
 * A brand-new survey starts with the reusable library already in — it costs
 * nothing to have it there and saves rewriting questions other surveys
 * already settled on. The system catalog starts untouched: preloading a
 * platform value is a deliberate choice the author still has to make.
 */
export const createDefaultDemographics = (): DemographicsConfig => ({
  enabled: true,
  fields: LIBRARY_DEMOGRAPHICS.map((entry) => buildLibraryDemographic(entry.key)).filter(
    (field): field is DemographicField => field !== null
  ),
});

/** The field backed by a given catalog key, or null while it isn't in use. */
export const findFieldByCatalogKey = (
  fields: readonly DemographicField[],
  key: string
): DemographicField | null => fields.find((field) => field.catalogKey === key) ?? null;

/**
 * Turns one catalog entry (system or library) on or off. Rendering these
 * sections always iterates the catalog itself, not `fields`, so where the
 * resulting field lands in the array doesn't affect what the author sees —
 * appending is enough.
 */
export function toggleCatalogDemographic(
  fields: readonly DemographicField[],
  key: string,
  active: boolean,
  buildOne: (key: string) => DemographicField | null
): readonly DemographicField[] {
  if (!active) return fields.filter((field) => field.catalogKey !== key);
  if (findFieldByCatalogKey(fields, key)) return fields;

  const field = buildOne(key);
  return field ? [...fields, field] : fields;
}

/** Adds every catalog entry not yet in use, from either the system or library list. */
export function activateAllCatalogDemographics<Entry extends { key: string }>(
  fields: readonly DemographicField[],
  catalog: readonly Entry[],
  buildOne: (key: string) => DemographicField | null
): readonly DemographicField[] {
  const missing = catalog.filter((entry) => !findFieldByCatalogKey(fields, entry.key));
  const newFields = missing
    .map((entry) => buildOne(entry.key))
    .filter((field): field is DemographicField => field !== null);
  return [...fields, ...newFields];
}

/** Drops every field of one source at once — the "Quitar todos" half of the bulk pair. */
export const deactivateAllBySource = (
  fields: readonly DemographicField[],
  source: DemographicSource
): readonly DemographicField[] => fields.filter((field) => field.source !== source);

/** Fields the participant will actually see and answer. */
export const visibleFields = (
  fields: readonly DemographicField[]
): readonly DemographicField[] => fields.filter((field) => field.visible);

/**
 * Whether every active preloaded field is shown, every one is hidden, or they
 * disagree. Null when none are active — that is what hides the bulk control
 * rather than showing one that would govern nothing.
 */
export function bulkVisibility(
  fields: readonly DemographicField[]
): boolean | "mixed" | null {
  const preloaded = fields.filter((field) => field.preloadable);
  if (preloaded.length === 0) return null;

  const first = preloaded[0].visible;
  return preloaded.every((field) => field.visible === first) ? first : "mixed";
}

/** Sets one visibility on every active preloaded field, leaving the rest as they are. */
export const applyVisibilityToAll = (
  fields: readonly DemographicField[],
  visible: boolean
): readonly DemographicField[] =>
  fields.map((field) => (field.preloadable ? { ...field, visible } : field));

/**
 * Same pair as `bulkVisibility`/`applyVisibilityToAll` but over whatever list
 * the caller passes — the accordion-scoped actives. The preloadable-scoped
 * helpers stay for callers that only ever want to touch preloaded values; the
 * section-wide "mostrar todos / ocultar todos" controls use these so they can
 * hide an ask-only field too (not asking a question is a legitimate choice).
 */
export function bulkVisibilityOf(fields: readonly DemographicField[]): boolean | "mixed" | null {
  if (fields.length === 0) return null;
  const first = fields[0].visible;
  return fields.every((field) => field.visible === first) ? first : "mixed";
}

export const applyVisibilityToFields = (
  fields: readonly DemographicField[],
  visible: boolean
): readonly DemographicField[] => fields.map((field) => ({ ...field, visible }));

/**
 * A demographic is ready when it asks something and offers somewhere to answer.
 * A hidden field is ready by definition: the platform provides both, and
 * nothing about it is shown for the author to still be writing.
 */
export const isDemographicComplete = (field: DemographicField): boolean => {
  if (!field.visible) return true;
  return (
    field.label.trim() !== "" &&
    field.options.length >= MIN_OPTIONS &&
    field.options.every((option) => option.label.trim() !== "")
  );
};
