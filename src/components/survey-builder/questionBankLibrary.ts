import * as React from "react";
import { questionBankData, type QuestionBankItem, type QuestionBankSection, type QuestionBankType } from "./questionBankData";

/**
 * The question bank's "guardado por el usuario" layer — an author can save a
 * question or a whole section from their survey into the bank for reuse
 * later. `questionBankData` stays UBITS-only and is never mutated; everything
 * an author saves lives in `localStorage`, layered on top the same way
 * `demographicsLibrary.ts` layers the demographics module library over its
 * built-in seeds.
 *
 * Two separate stores, because a saved question can land in two different
 * places:
 * - a whole new section (created here or earlier) — kept together as one
 *   `StoredCustomSection`, tagged with the `typeId` it belongs under;
 * - one more question dropped into an *existing* UBITS section — UBITS
 *   sections are static, so the extra question is kept apart and merged in
 *   at read time instead.
 */

interface StoredCustomSection extends QuestionBankSection {
  typeId: string;
}

interface StoredCustomQuestion {
  sectionId: string;
  question: QuestionBankItem;
}

const CUSTOM_SECTIONS_KEY = "ubits.questionBank.library.customSections.v1";
const CUSTOM_QUESTIONS_KEY = "ubits.questionBank.library.customQuestions.v1";

const isQuestion = (value: unknown): value is QuestionBankItem => {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<QuestionBankItem>;
  return typeof entry.id === "string" && typeof entry.text === "string";
};

const isCustomSection = (value: unknown): value is StoredCustomSection => {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<StoredCustomSection>;
  return (
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.typeId === "string" &&
    Array.isArray(entry.questions) &&
    entry.questions.every(isQuestion)
  );
};

const isCustomQuestion = (value: unknown): value is StoredCustomQuestion => {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<StoredCustomQuestion>;
  return typeof entry.sectionId === "string" && isQuestion(entry.question);
};

function readJson<T>(key: string, isEntry: (value: unknown) => value is T): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, entries: readonly T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // Storage full or blocked — the session still works, just without persistence.
  }
}

const readCustomSections = (): StoredCustomSection[] => readJson(CUSTOM_SECTIONS_KEY, isCustomSection);
const writeCustomSections = (entries: readonly StoredCustomSection[]): void =>
  writeJson(CUSTOM_SECTIONS_KEY, entries);

const readCustomQuestions = (): StoredCustomQuestion[] => readJson(CUSTOM_QUESTIONS_KEY, isCustomQuestion);
const writeCustomQuestions = (entries: readonly StoredCustomQuestion[]): void =>
  writeJson(CUSTOM_QUESTIONS_KEY, entries);

/** Accent-free lowercase dash form: "Bienestar laboral" → "bienestar-laboral". */
function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function freeQuestionId(): string {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `q-custom-${random}`;
}

function freeSectionId(name: string): string {
  const base = `custom-${slug(name) || "seccion"}`;
  const taken = new Set([
    ...questionBankData.flatMap((type) => type.sections.map((section) => section.id)),
    ...readCustomSections().map((section) => section.id),
  ]);
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

/**
 * The full bank: UBITS seeds first, with whatever an author has saved merged
 * in — extra questions inside their existing UBITS section, and whole custom
 * sections appended after the seeded ones for their type.
 */
export function getBankTypesWithLibrary(): QuestionBankType[] {
  const customSections = readCustomSections();
  const customQuestions = readCustomQuestions();

  return questionBankData.map((type) => {
    const sections = type.sections.map((section) => {
      const extra = customQuestions
        .filter((entry) => entry.sectionId === section.id)
        .map((entry) => entry.question);
      return extra.length === 0 ? section : { ...section, questions: [...section.questions, ...extra] };
    });

    const ownCustomSections: QuestionBankSection[] = customSections
      .filter((section) => section.typeId === type.id)
      .map((section) => ({ id: section.id, name: section.name, questions: section.questions, origin: section.origin }));

    return ownCustomSections.length === 0 ? { ...type, sections } : { ...type, sections: [...sections, ...ownCustomSections] };
  });
}

/**
 * Saves one question into the bank: either into an existing section (a UBITS
 * one, via the loose-question overlay, or a custom one, appended directly),
 * or into a brand-new custom section under `typeId`. Returns null when
 * neither a target section nor a new section name was given, or the text is
 * blank.
 */
export function addQuestionToBank(input: {
  typeId: string;
  sectionId?: string;
  newSectionName?: string;
  text: string;
}): QuestionBankItem | null {
  const text = input.text.trim();
  if (text === "") return null;

  const question: QuestionBankItem = { id: freeQuestionId(), text, origin: "custom" };

  if (input.sectionId) {
    const customSections = readCustomSections();
    const targetCustom = customSections.find((section) => section.id === input.sectionId);
    if (targetCustom) {
      writeCustomSections(
        customSections.map((section) =>
          section.id === input.sectionId
            ? { ...section, questions: [...section.questions, question] }
            : section
        )
      );
      notifyLibraryChanged();
      return question;
    }

    const belongsToType = questionBankData
      .find((type) => type.id === input.typeId)
      ?.sections.some((section) => section.id === input.sectionId);
    if (!belongsToType) return null;

    writeCustomQuestions([...readCustomQuestions(), { sectionId: input.sectionId, question }]);
    notifyLibraryChanged();
    return question;
  }

  const name = (input.newSectionName ?? "").trim();
  if (name === "") return null;

  const newSection: StoredCustomSection = {
    id: freeSectionId(name),
    name,
    origin: "custom",
    typeId: input.typeId,
    questions: [question],
  };
  writeCustomSections([...readCustomSections(), newSection]);
  notifyLibraryChanged();
  return question;
}

/**
 * Saves a whole section into the bank as a brand-new custom section under
 * `typeId` — a saved section is never merged into an existing one. Returns
 * null when the name is blank.
 */
export function addSectionToBank(input: {
  typeId: string;
  sectionName: string;
  questions: readonly string[];
}): QuestionBankSection | null {
  const name = input.sectionName.trim();
  if (name === "") return null;

  const questions: QuestionBankItem[] = input.questions
    .map((text) => text.trim())
    .filter((text) => text !== "")
    .map((text) => ({ id: freeQuestionId(), text, origin: "custom" as const }));

  const newSection: StoredCustomSection = {
    id: freeSectionId(name),
    name,
    origin: "custom",
    typeId: input.typeId,
    questions,
  };
  writeCustomSections([...readCustomSections(), newSection]);
  notifyLibraryChanged();

  return { id: newSection.id, name: newSection.name, questions: newSection.questions, origin: newSection.origin };
}

const libraryListeners = new Set<() => void>();

function notifyLibraryChanged(): void {
  libraryListeners.forEach((listener) => listener());
}

/**
 * Subscribes a component to the question bank library. It lives outside
 * React (localStorage-backed), so any save must nudge every consumer — the
 * browse drawer and the "guardar en el banco" drawers alike.
 */
export function useQuestionBankLibrary(): readonly QuestionBankType[] {
  const [types, setTypes] = React.useState<readonly QuestionBankType[]>(() => getBankTypesWithLibrary());

  React.useEffect(() => {
    const listener = () => setTypes(getBankTypesWithLibrary());
    libraryListeners.add(listener);
    return () => {
      libraryListeners.delete(listener);
    };
  }, []);

  return types;
}
