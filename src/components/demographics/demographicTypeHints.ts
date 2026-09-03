import type { DemographicType } from "@/components/survey-builder/surveyBuilderTypes";

/** How the answer type reads in one line, next to its name. */
export const TYPE_HINTS: Readonly<Record<DemographicType, string>> = {
  single: "Una sola respuesta, con todas las opciones a la vista",
  dropdown: "Una sola respuesta, en una lista plegada",
  multiple: "Permite elegir varias opciones a la vez",
};
