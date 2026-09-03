import { Building2, Scale, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/tone";
import { templates } from "@/lib/templates/nom035Templates";
import { KIND_VISUAL, MINUTES_PER_QUESTION, countQuestions, type SurveyDraft } from "@/components/survey-builder";

/**
 * Everything the app needs to *show* a template — icon, color tone, short
 * name, size summary and which shelf it sits on — in one place, so the home
 * strip and the picker drawer draw the same template the same way.
 */

/** The app-wide accent palette — a template's tone is one of the same five
 *  every other surface picks from. */
export type TemplateTone = Tone;

export const NOM035_PREFIX = "NOM 035";

export interface TemplateVisual {
  icon: LucideIcon;
  tone: TemplateTone;
}

/** One icon and tone per template family, so a shelf is scannable by shape
 *  and color as well as by name. Read from the same `KIND_VISUAL` map the
 *  builder's "Tipo de encuesta" cards use, so a kind looks identical on the
 *  home shelf and inside the wizard. NOM 035 gets its own mark since every
 *  guide in that family shares the generic "otros" kind. */
export function getTemplateVisual(template: SurveyDraft): TemplateVisual {
  if (template.name.startsWith(NOM035_PREFIX)) return { icon: ShieldCheck, tone: "neutral" };
  return KIND_VISUAL[template.kind ?? "otros"];
}

/** The name without the family prefix — inside a "NOM 035" shelf the prefix
 *  is already said by the heading. */
export function getTemplateDisplayName(template: SurveyDraft): string {
  const prefixed = `${NOM035_PREFIX} - `;
  return template.name.startsWith(prefixed) ? template.name.slice(prefixed.length) : template.name;
}

export interface TemplateSize {
  sections: number;
  questions: number;
  /** Same rhythm the builder uses for its "tiempo estimado", so the figure
   *  promised here is the one the survey ends up showing. */
  minutes: number;
}

export function measureTemplate(template: SurveyDraft): TemplateSize {
  const questions = countQuestions(template.sections);
  return {
    sections: template.sections.length,
    questions,
    minutes: questions === 0 ? 0 : Math.max(1, Math.round(questions * MINUTES_PER_QUESTION)),
  };
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "4 secciones · 8 preguntas · 4 min" */
export function describeTemplateSize(size: TemplateSize): string {
  return [
    pluralize(size.sections, "sección", "secciones"),
    pluralize(size.questions, "pregunta", "preguntas"),
    `${size.minutes} min`,
  ].join(" · ");
}

/**
 * A shelf in the gallery: a category label over its templates. `path` is the
 * folder trail under the category ("NOM 035 › México") — kept as data rather
 * than nested folders because the gallery lays every shelf out flat; the
 * trail is what tells the reader where the shelf lives.
 */
export interface TemplateShelf {
  id: string;
  category: string;
  /** One line on what the shelf holds, under its title in the gallery. */
  description: string;
  icon: LucideIcon;
  path: readonly string[];
  items: readonly SurveyDraft[];
}

export const TEMPLATE_SHELVES: readonly TemplateShelf[] = [
  {
    id: "organizacional",
    category: "Organizacional",
    description: "Cultura, clima laboral, lealtad y adopción de IA: cómo vive tu gente la empresa.",
    icon: Building2,
    path: [],
    items: templates.filter((template) => !template.name.startsWith(NOM035_PREFIX)),
  },
  {
    id: "legales-nom035-mexico",
    category: "Legales",
    description: "Guías de referencia oficiales de la NOM-035 (STPS) para cumplir con la norma en México.",
    icon: Scale,
    path: [NOM035_PREFIX, "México"],
    items: templates.filter((template) => template.name.startsWith(NOM035_PREFIX)),
  },
];

export const DEFAULT_TEMPLATE: SurveyDraft =
  templates.find((template) => template.name === "Cultura") ?? templates[0];

/** The one the gallery puts on its spotlight — short, general and the usual
 *  first survey a team sends, so it is the safest answer to "where do I
 *  start?". Same template the picker already fell back to. */
export const FEATURED_TEMPLATE: SurveyDraft = DEFAULT_TEMPLATE;

export const FEATURED_REASON =
  "Corta y general: la forma más rápida de tener una primera lectura de tu equipo y ver cómo funciona una encuesta de punta a punta.";

export function findTemplateByName(name: string | undefined): SurveyDraft | undefined {
  return name === undefined ? undefined : templates.find((template) => template.name === name);
}

export function findShelfOf(template: SurveyDraft): TemplateShelf | undefined {
  return TEMPLATE_SHELVES.find((shelf) => shelf.items.some((item) => item.name === template.name));
}

/**
 * What to show next to a template someone is already reading: the rest of its
 * own shelf first (the closest alternatives), then the other shelves, capped
 * so the row stays one line.
 */
export function suggestTemplates(current: SurveyDraft, limit: number): readonly SurveyDraft[] {
  const ownShelf = findShelfOf(current);
  const siblings = ownShelf ? ownShelf.items.filter((item) => item.name !== current.name) : [];
  const others = TEMPLATE_SHELVES.filter((shelf) => shelf !== ownShelf).flatMap((shelf) => shelf.items);
  return [...siblings, ...others].slice(0, limit);
}

/** Case- and accent-insensitive match on name and objective. */
export function matchesTemplateQuery(template: SurveyDraft, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length === 0) return true;
  return normalize(`${template.name} ${template.description ?? ""}`).includes(normalizedQuery);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
