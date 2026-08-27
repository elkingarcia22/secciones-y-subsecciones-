import * as React from "react";
import {
  LIBRARY_DEMOGRAPHICS,
  SYSTEM_DEMOGRAPHICS,
  type LibraryDemographic,
} from "./demographics";
import { buildOption } from "./questionCatalog";
import type { DemographicField, DemographicType } from "./surveyBuilderTypes";

export type { LibraryDemographic };

/**
 * The "módulo de encuestas" library — the reusable demographics an author can
 * pull into any survey. It starts as the built-in list in `demographics.ts`
 * and grows with whatever the author saves from this survey, persisted in
 * localStorage so it survives the page and is there for the next one.
 */

const STORAGE_KEY = "ubits.demographics.library.v1";

const labelKey = (label: string): string => label.trim().toLowerCase();

const isEntry = (value: unknown): value is LibraryDemographic => {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<LibraryDemographic>;
  return (
    typeof entry.key === "string" &&
    typeof entry.label === "string" &&
    typeof entry.type === "string" &&
    Array.isArray(entry.optionLabels)
  );
};

function readSaved(): LibraryDemographic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function writeSaved(entries: readonly LibraryDemographic[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or blocked — the session still works, just without persistence.
  }
}

/**
 * Built-in seeds (`LIBRARY_DEMOGRAPHICS`) live in code, not storage, so an
 * edit or delete on one can't mutate the seed itself. Instead it's layered on
 * top: an override replaces the seed's wording, a deletion hides it — both
 * kept in their own storage keys, separate from genuinely author-created
 * entries in `STORAGE_KEY`.
 */
const OVERRIDES_KEY = "ubits.demographics.library.overrides.v1";
const DELETED_KEY = "ubits.demographics.library.deleted.v1";

function readOverrides(): Readonly<Record<string, LibraryDemographic>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const entries = Object.entries(parsed as Record<string, unknown>).filter(([, value]) =>
      isEntry(value)
    );
    return Object.fromEntries(entries) as Record<string, LibraryDemographic>;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Readonly<Record<string, LibraryDemographic>>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Storage full or blocked — the session still works, just without persistence.
  }
}

function readDeletedKeys(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return new Set(
      Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []
    );
  } catch {
    return new Set();
  }
}

function writeDeletedKeys(keys: ReadonlySet<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DELETED_KEY, JSON.stringify([...keys]));
  } catch {
    // Storage full or blocked — the session still works, just without persistence.
  }
}

/** Accent-free lowercase dash form: "Tipo de contrato" → "tipo-de-contrato". */
function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The full library: built-in entries first, then the author's saved ones.
 * A saved entry whose key collides with a built-in one never replaces it.
 */
export function getLibraryDemographics(): readonly LibraryDemographic[] {
  const saved = readSaved();
  const overrides = readOverrides();
  const deleted = readDeletedKeys();
  // Against the *built-in* keys, not the saved ones: a set built from `saved`
  // matches every entry in `saved`, so the filter dropped the whole stored
  // library and nothing an author saved ever came back.
  const builtInKeys = new Set(LIBRARY_DEMOGRAPHICS.map((entry) => entry.key));

  const builtIns = LIBRARY_DEMOGRAPHICS.filter((entry) => !deleted.has(entry.key)).map(
    (entry) => overrides[entry.key] ?? entry
  );
  const extra = saved.filter((entry) => !builtInKeys.has(entry.key) && !deleted.has(entry.key));

  return [...builtIns, ...extra];
}

export const findLibraryDemographic = (key: string): LibraryDemographic | null =>
  getLibraryDemographics().find((entry) => entry.key === key) ?? null;

/** Builds the field for a library entry, or null when the key is unknown. */
export function buildLibraryDemographic(key: string): DemographicField | null {
  const entry = findLibraryDemographic(key);
  if (!entry) return null;

  return {
    id: `dem-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
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

/** Whether an entry with this wording already exists in the library. */
export const isInLibrary = (label: string): boolean =>
  getLibraryDemographics().some((entry) => labelKey(entry.label) === labelKey(label));

/** A unique catalog key for a label, the slug padded until it collides with nothing. */
function freeKey(label: string): string {
  const base = slug(label) || "dato-demografico";
  const taken = new Set(getLibraryDemographics().map((entry) => entry.key));
  let key = base;
  let n = 2;
  while (taken.has(key)) {
    key = `${base}-${n}`;
    n += 1;
  }
  return key;
}

/**
 * Saves fields into the module library for future surveys. Skips the ones
 * that already exist by wording and the ones with no wording at all; returns
 * how many were actually added, so a caller can tell "saved" from "already
 * there".
 */
export function addFieldsToLibrary(fields: readonly DemographicField[]): number {
  const saved = [...readSaved()];
  const known = new Set(getLibraryDemographics().map((entry) => labelKey(entry.label)));
  let added = 0;

  for (const field of fields) {
    const label = field.label.trim();
    if (label === "" || known.has(labelKey(label))) continue;

    saved.push({
      key: freeKey(label),
      label,
      type: field.type,
      optionLabels: field.options
        .map((option) => option.label.trim())
        .filter((value) => value !== ""),
      createdAt: today(),
    });
    known.add(labelKey(label));
    added += 1;
  }

  if (added > 0) {
    writeSaved(saved);
    notifyLibraryChanged();
  }
  return added;
}

export const addFieldToLibrary = (field: DemographicField): boolean =>
  addFieldsToLibrary([field]) > 0;

/** ISO day, so the stored date sorts and formats without a timezone surprise. */
const today = (): string => new Date().toISOString().slice(0, 10);

/**
 * Creates a library entry straight from a label, type and option wording —
 * the path the demographics screen's own "Crear demográfico" takes, where
 * there is no survey and therefore no `DemographicField` to save from.
 *
 * Returns the stored entry, or null when the wording is blank or already
 * taken: two demographics with the same name would be indistinguishable in
 * every "ver por" menu in the app.
 */
export function createLibraryDemographic(input: {
  label: string;
  type: DemographicType;
  optionLabels: readonly string[];
}): LibraryDemographic | null {
  const label = input.label.trim();
  const optionLabels = input.optionLabels
    .map((option) => option.trim())
    .filter((option) => option !== "");
  if (label === "" || optionLabels.length === 0 || isInLibrary(label)) return null;
  if (SYSTEM_DEMOGRAPHICS.some((entry) => labelKey(entry.label) === labelKey(label))) return null;

  const entry: LibraryDemographic = {
    key: freeKey(label),
    label,
    type: input.type,
    optionLabels,
    createdAt: today(),
  };
  writeSaved([...readSaved(), entry]);
  notifyLibraryChanged();
  return entry;
}

/**
 * Updates an existing library entry by key — a built-in seed or an author's
 * own. Returns null when the key is unknown, the wording is blank, there are
 * no options, or the new wording collides with another entry (including a
 * system demographic's).
 */
export function updateLibraryDemographic(
  key: string,
  input: { label: string; type: DemographicType; optionLabels: readonly string[] }
): LibraryDemographic | null {
  const existing = findLibraryDemographic(key);
  if (!existing) return null;

  const label = input.label.trim();
  const optionLabels = input.optionLabels.map((option) => option.trim()).filter((option) => option !== "");
  if (label === "" || optionLabels.length === 0) return null;
  if (SYSTEM_DEMOGRAPHICS.some((entry) => labelKey(entry.label) === labelKey(label))) return null;
  const collidesWithAnother = getLibraryDemographics().some(
    (entry) => entry.key !== key && labelKey(entry.label) === labelKey(label)
  );
  if (collidesWithAnother) return null;

  const updated: LibraryDemographic = { ...existing, label, type: input.type, optionLabels };

  const builtInKeys = new Set(LIBRARY_DEMOGRAPHICS.map((entry) => entry.key));
  if (builtInKeys.has(key)) {
    writeOverrides({ ...readOverrides(), [key]: updated });
  } else {
    writeSaved(readSaved().map((entry) => (entry.key === key ? updated : entry)));
  }

  notifyLibraryChanged();
  return updated;
}

/** Removes a library entry by key, built-in seed or author-saved alike. */
export function deleteLibraryDemographic(key: string): boolean {
  const existing = findLibraryDemographic(key);
  if (!existing) return false;

  const builtInKeys = new Set(LIBRARY_DEMOGRAPHICS.map((entry) => entry.key));
  if (builtInKeys.has(key)) {
    writeDeletedKeys(new Set([...readDeletedKeys(), key]));
    const overrides = readOverrides();
    if (key in overrides) {
      writeOverrides(Object.fromEntries(Object.entries(overrides).filter(([entryKey]) => entryKey !== key)));
    }
  } else {
    writeSaved(readSaved().filter((entry) => entry.key !== key));
  }

  notifyLibraryChanged();
  return true;
}

/**
 * Copies a demographic's shape into a new library entry, wording padded with
 * "(copia)" until it's unique. Works from a system demographic too — nothing
 * about copying its shape needs to touch the system catalog, it just becomes
 * a fresh author-owned entry.
 */
export function duplicateAsLibraryDemographic(input: {
  label: string;
  type: DemographicType;
  optionLabels: readonly string[];
}): LibraryDemographic | null {
  const base = `${input.label} (copia)`;
  let label = base;
  let n = 2;
  while (
    isInLibrary(label) ||
    SYSTEM_DEMOGRAPHICS.some((entry) => labelKey(entry.label) === labelKey(label))
  ) {
    label = `${base} ${n}`;
    n += 1;
  }
  return createLibraryDemographic({ label, type: input.type, optionLabels: input.optionLabels });
}

const libraryListeners = new Set<() => void>();

function notifyLibraryChanged(): void {
  libraryListeners.forEach((listener) => listener());
}

/**
 * Subscribes a component to the library. The module library lives outside
 * React (it is localStorage-backed), so any save must nudge every consumer —
 * the "Datos creados en el módulo" accordion and the save buttons alike.
 */
export function useDemographicsLibrary(): readonly LibraryDemographic[] {
  const [library, setLibrary] = React.useState<readonly LibraryDemographic[]>(() =>
    getLibraryDemographics()
  );

  React.useEffect(() => {
    const listener = () => setLibrary(getLibraryDemographics());
    libraryListeners.add(listener);
    return () => {
      libraryListeners.delete(listener);
    };
  }, []);

  return library;
}
