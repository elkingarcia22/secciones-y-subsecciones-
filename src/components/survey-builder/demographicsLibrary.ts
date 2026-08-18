import * as React from "react";
import { LIBRARY_DEMOGRAPHICS, type LibraryDemographic } from "./demographics";
import { buildOption } from "./questionCatalog";
import type { DemographicField } from "./surveyBuilderTypes";

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
  const savedKeys = new Set(saved.map((entry) => entry.key));
  return [...LIBRARY_DEMOGRAPHICS, ...saved.filter((entry) => !savedKeys.has(entry.key))];
}

export const findLibraryDemographic = (key: string): LibraryDemographic | null =>
  getLibraryDemographics().find((entry) => entry.key === key) ?? null;

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
