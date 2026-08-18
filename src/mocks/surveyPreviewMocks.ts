import { createDefaultDemographics } from "@/components/survey-builder/demographics";
import {
  DEFAULT_ANONYMITY_THRESHOLD,
  DEFAULT_PARTICIPANTS,
  type QuestionOption,
  type ScaleType,
  type SurveyDraft,
  type SurveyKind,
  type SurveyQuestion,
  type SurveySection,
} from "@/components/survey-builder/surveyBuilderTypes";
import type { SurveyListItem } from "./types";

/**
 * A published survey, reconstructed for the preview.
 *
 * The dashboard list only carries a row's metadata — name, type, dates — but
 * "ver la encuesta" has to show the whole thing, so this fills in the structure
 * a survey of that type would have. It is a mock: the day the list is backed by
 * real content, this file is what gets replaced, and nothing else changes,
 * because the preview only ever reads a `SurveyDraft`.
 *
 * Ids are derived from the row id rather than generated, so re-opening the same
 * survey produces the same object and answers stay keyed to the same questions.
 */

const MONTHS: Readonly<Record<string, string>> = {
  ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
  jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
};

/** "15 ene 2026" → "2026-01-15", the format the draft stores. */
function toIsoDate(label: string): string {
  const [day, month, year] = label.trim().split(/\s+/);
  const monthNumber = MONTHS[month?.toLowerCase().slice(0, 3) ?? ""];
  if (!day || !monthNumber || !year) return "";
  return `${year}-${monthNumber}-${day.padStart(2, "0")}`;
}

const KIND_BY_TYPE: Readonly<Record<string, SurveyKind>> = {
  Clima: "clima",
  Cultura: "cultura",
  NPS: "enps",
  IA: "ia",
};

const option = (id: string, label: string): QuestionOption => ({ id, label });

interface QuestionSeed {
  statement: string;
  scale?: ScaleType;
  rating?: "agreement" | "frequency" | "satisfaction" | "importance";
  open?: boolean;
  multiple?: readonly string[];
  followUps?: { detractors: string; neutrals: string; promoters: string };
  minLabel?: string;
  maxLabel?: string;
}

function buildSeedQuestion(prefix: string, index: number, seed: QuestionSeed): SurveyQuestion {
  const id = `${prefix}-q${index + 1}`;

  if (seed.open) {
    return {
      id,
      statement: seed.statement,
      type: "open",
      required: false,
      scale: emptyScale(),
      options: [],
    };
  }

  if (seed.multiple) {
    return {
      id,
      statement: seed.statement,
      type: "multiple",
      required: false,
      scale: emptyScale(),
      options: seed.multiple.map((label, position) => option(`${id}-o${position + 1}`, label)),
    };
  }

  return {
    id,
    statement: seed.statement,
    type: "scale",
    required: true,
    scale: {
      kind: seed.scale ?? "likert",
      ratingType: (seed.scale ?? "likert") === "likert" ? seed.rating ?? "agreement" : null,
      minLabel: seed.minLabel ?? "",
      maxLabel: seed.maxLabel ?? "",
      allowDontKnow: false,
      followUpEnabled: Boolean(seed.followUps),
      followUps: seed.followUps ?? { detractors: "", neutrals: "", promoters: "" },
    },
    options: [],
  };
}

const emptyScale = (): SurveyQuestion["scale"] => ({
  kind: null,
  ratingType: null,
  minLabel: "",
  maxLabel: "",
  allowDontKnow: false,
  followUpEnabled: false,
  followUps: { detractors: "", neutrals: "", promoters: "" },
});

interface SectionSeed {
  title: string;
  description?: string;
  questions?: readonly QuestionSeed[];
  children?: readonly SectionSeed[];
}

function buildSeedSection(prefix: string, index: number, seed: SectionSeed): SurveySection {
  const id = `${prefix}-s${index + 1}`;
  return {
    id,
    title: seed.title,
    description: seed.description ?? "",
    questions: (seed.questions ?? []).map((question, position) =>
      buildSeedQuestion(id, position, question)
    ),
    children: (seed.children ?? []).map((child, position) => buildSeedSection(id, position, child)),
  };
}

/** The shape a climate or culture survey takes in this product: blocks at level
 * 1, the questions themselves one or two levels down. */
const SECTION_SEEDS: readonly SectionSeed[] = [
  {
    title: "Propósito y estrategia",
    description:
      "Qué tan claro es hacia dónde va la organización y cómo el trabajo de cada persona contribuye a ello.",
    children: [
      {
        title: "Misión y objetivos",
        description: "Claridad sobre el rumbo de la organización.",
        questions: [
          { statement: "Entiendo claramente la misión de la organización y cómo impacta mi trabajo." },
          { statement: "Conozco los objetivos estratégicos y es claro cómo contribuyo a ellos." },
          { statement: "La organización comunica sus prioridades con la frecuencia suficiente.", rating: "frequency" },
        ],
      },
      {
        title: "Alineación con el día a día",
        questions: [
          { statement: "Mis tareas diarias están conectadas con los objetivos del equipo." },
          { statement: "Sé qué se espera de mí en mi rol." },
        ],
      },
    ],
  },
  {
    title: "Liderazgo",
    description: "La relación con quien lidera el equipo y la calidad del acompañamiento.",
    children: [
      {
        title: "Mi líder directo",
        description: "Acompañamiento, claridad y cercanía en el día a día.",
        questions: [
          { statement: "Mi líder me da retroalimentación útil sobre mi trabajo.", rating: "frequency" },
          { statement: "Puedo hablar con mi líder sobre problemas o desacuerdos.", rating: "frequency" },
        ],
        children: [
          {
            title: "Comunicación",
            questions: [
              { statement: "Recibo la información que necesito para hacer bien mi trabajo.", rating: "frequency" },
              { statement: "Los cambios importantes se comunican a tiempo." },
            ],
          },
          {
            title: "Confianza",
            questions: [
              { statement: "Confío en las decisiones que toma mi líder." },
              { statement: "Me siento seguro/a al proponer ideas nuevas." },
            ],
          },
        ],
      },
      {
        title: "Reconocimiento",
        questions: [
          { statement: "Mi trabajo es reconocido cuando hago un buen aporte.", rating: "frequency" },
          {
            statement: "¿Qué forma de reconocimiento valoras más?",
            multiple: [
              "Reconocimiento público del equipo",
              "Conversación uno a uno con mi líder",
              "Oportunidades de crecimiento",
              "Compensación o beneficios",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Experiencia general",
    description: "Cómo se siente trabajar aquí, en conjunto.",
    children: [
      {
        title: "Recomendabilidad",
        questions: [
          {
            statement: "¿Qué tan probable es que recomiendes a esta organización como un buen lugar para trabajar?",
            scale: "nps",
            minLabel: "Nada probable",
            maxLabel: "Muy probable",
            followUps: {
              detractors: "¿Qué tendría que cambiar para que la recomendaras?",
              neutrals: "¿Qué falta para que la recomiendes sin dudarlo?",
              promoters: "¿Qué es lo que más valoras de trabajar aquí?",
            },
          },
        ],
      },
      {
        title: "Bienestar",
        questions: [
          {
            statement: "¿Cómo calificarías tu bienestar en el trabajo durante los últimos tres meses?",
            scale: "stars",
            minLabel: "Muy bajo",
            maxLabel: "Muy alto",
          },
          {
            statement: "¿Con qué ánimo terminas normalmente tu jornada?",
            scale: "emoji",
            minLabel: "Agotado/a",
            maxLabel: "Con energía",
          },
        ],
      },
      {
        title: "Comentarios abiertos",
        description: "Espacio libre para lo que no cabe en una escala.",
        questions: [
          { statement: "¿Qué es lo primero que cambiarías de tu experiencia de trabajo?", open: true },
        ],
      },
    ],
  },
];

/**
 * Turns a dashboard row into the draft the preview renders. Only the framing —
 * name, kind, dates, visibility — comes from the row; the content is the shared
 * seed above.
 */
export function createPublishedSurveyDraft(item: SurveyListItem): SurveyDraft {
  const kind = KIND_BY_TYPE[item.type] ?? "otros";
  const isAnonymous = kind !== "enps";

  return {
    name: item.name,
    status: "closed",
    description:
      "Medición periódica de la experiencia de trabajo. Los resultados alimentan los planes de acción de cada área.",
    startDate: toIsoDate(item.startDate),
    endDate: toIsoDate(item.endDate),
    kind,
    visibility: isAnonymous ? "anonymous" : "public",
    anonymityThreshold: DEFAULT_ANONYMITY_THRESHOLD,
    sections: SECTION_SEEDS.map((seed, index) => buildSeedSection(item.id, index, seed)),
    participants: DEFAULT_PARTICIPANTS,
    demographics: createDefaultDemographics(),
    welcomeEnabled: true,
    closingEnabled: true,
    welcomeDescription:
      "<p><strong>Tu opinión cuenta.</strong></p>" +
      "<p>Esta encuesta busca entender cómo se vive el día a día en la organización: el ambiente, la comunicación y el liderazgo, entre otros aspectos.</p>" +
      `<p>${
        isAnonymous
          ? "Tus respuestas son anónimas. Los resultados se muestran siempre agrupados, nunca de forma individual."
          : "Tus respuestas quedan asociadas a tu nombre y las verá el equipo responsable de la encuesta."
      }</p>` +
      "<p>Puedes responder en varios momentos: tu avance se guarda automáticamente.</p>",
    closingDescription:
      "<p><strong>¡Gracias por tu participación!</strong></p>" +
      "<p>Tu retroalimentación se analizará junto con la del resto del equipo para construir los planes de acción del próximo trimestre.</p>" +
      "<p>Compartiremos los resultados generales una vez cerrada la medición.</p>",
  };
}
