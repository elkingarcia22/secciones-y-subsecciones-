import {
  BarChart3,
  CalendarClock,
  CircleCheckBig,
  Copy,
  Eye,
  Pencil,
  RotateCcw,
  Share2,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Every action a single selected survey can offer, across all statuses. */
export type SurveyActionId =
  | "results"
  | "preview"
  | "edit"
  | "duplicate"
  | "finish"
  | "editDates"
  | "editParticipants"
  | "share"
  | "reopen"
  | "delete";

export interface SurveyActionSpec {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
}

export const SURVEY_ACTIONS: Readonly<Record<SurveyActionId, SurveyActionSpec>> = {
  results: { label: "Ver resultados", icon: BarChart3 },
  preview: { label: "Vista previa", icon: Eye },
  edit: { label: "Editar", icon: Pencil },
  duplicate: { label: "Duplicar", icon: Copy },
  finish: { label: "Finalizar encuesta", icon: CircleCheckBig },
  editDates: { label: "Editar fechas", icon: CalendarClock },
  editParticipants: { label: "Editar participantes", icon: Users },
  share: { label: "Compartir encuesta", icon: Share2 },
  reopen: { label: "Reabrir encuesta", icon: RotateCcw },
  delete: { label: "Eliminar", icon: Trash2, tone: "danger" },
};

/**
 * What each lifecycle stage offers, in the order it is offered.
 *
 * A survey's stage decides what can honestly be done to it: a draft has no
 * responses to read or remind about, and a finished one has nothing left to
 * edit. Listing them per status rather than disabling a fixed set keeps the
 * rail down to what is actually actionable, so nothing on it is a dead end.
 */
export const SURVEY_ACTIONS_BY_STATUS: Readonly<Record<string, readonly SurveyActionId[]>> = {
  Borrador: ["edit", "preview", "delete"],
  "En curso": [
    "results",
    "preview",
    "edit",
    "duplicate",
    "finish",
    "editDates",
    "editParticipants",
    "share",
    "delete",
  ],
  Finalizado: ["results", "preview", "duplicate", "reopen", "delete"],
};

/**
 * How many actions stay as icons on the bar before the rest fold into "Más
 * acciones". Five is what a reader can still tell apart at a glance; past that
 * an icon row turns into a puzzle solved one tooltip at a time.
 */
export const INLINE_ACTION_LIMIT = 5;

/** The actions for a status, split into what the bar shows and what folds away. */
export function splitSurveyActions(status: string): {
  inline: readonly SurveyActionId[];
  overflow: readonly SurveyActionId[];
} {
  const all = SURVEY_ACTIONS_BY_STATUS[status] ?? [];
  // One lone action in the menu is a worse trade than a sixth icon: the menu
  // costs a click and a label to say what an icon already said.
  if (all.length <= INLINE_ACTION_LIMIT + 1) return { inline: all, overflow: [] };
  return {
    inline: all.slice(0, INLINE_ACTION_LIMIT),
    overflow: all.slice(INLINE_ACTION_LIMIT),
  };
}
