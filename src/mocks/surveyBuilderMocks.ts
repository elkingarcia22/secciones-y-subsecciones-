import { createDefaultDemographics } from "@/components/survey-builder/demographics";
import {
  DEFAULT_ANONYMITY_THRESHOLD,
  DEFAULT_PARTICIPANTS,
} from "@/components/survey-builder/surveyBuilderTypes";
import type { SurveyDraft } from "@/components/survey-builder/surveyBuilderTypes";

/**
 * Starting point for "Crear en blanco": every field at its neutral default,
 * no sections, no questions. "Crear con plantilla" is where prefilled
 * content belongs — this one has to actually be empty.
 */
export const createBlankSurveyDraft = (): SurveyDraft => ({
  name: "",
  status: "draft",
  description: "",
  startDate: "",
  endDate: "",
  kind: "clima",
  visibility: "public",
  anonymityThreshold: DEFAULT_ANONYMITY_THRESHOLD,
  sections: [],
  participants: DEFAULT_PARTICIPANTS,
  // Not empty on purpose: the four variables every climate report is read by are
  // what "en blanco" means for demographics — starting with none would quietly
  // produce a survey whose results can't be segmented at all.
  demographics: createDefaultDemographics(),
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "",
  closingDescription: "",
});
