import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Eye,
  Layers,
  ListChecks,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isHtmlBlank } from "@/lib/sanitizeHtml";
import {
  SURVEY_KIND_LABELS,
  SURVEY_VISIBILITY_LABELS,
  type SurveyDraft,
} from "@/components/survey-builder";
import { PreviewRichText } from "./PreviewRichText";
import { PreviewContents } from "./PreviewContents";
import {
  formatPreviewDate,
  type PreviewOutlineRow,
  type PreviewPage,
  type PreviewSummary,
} from "./previewModel";

/**
 * The first thing a participant sees: what this survey is, what it will cost
 * them in time and privacy, what it covers, and what the author wanted to say
 * before they start.
 *
 * It is not a question page and it should not look like one. The hero carries
 * the survey's identity, the facts sit in a strip of tiles right under it, and
 * the author's message shares the last band with the table of contents — the
 * message reads as copy, the contents as a map.
 */

interface PreviewWelcomePageProps {
  draft: SurveyDraft;
  summary: PreviewSummary;
  pages: readonly PreviewPage[];
  outline: readonly PreviewOutlineRow[];
  progressByPage: Readonly<Record<string, { answered: number; total: number }>>;
  onStart: () => void;
  onJumpTo: (pageId: string) => void;
}

export function PreviewWelcomePage({
  draft,
  summary,
  pages,
  outline,
  progressByPage,
  onStart,
  onJumpTo,
}: PreviewWelcomePageProps) {
  const hasMessage = !isHtmlBlank(draft.welcomeDescription);
  const deadline = formatPreviewDate(draft.endDate);
  const start = formatPreviewDate(draft.startDate);
  const isAnonymous = draft.visibility === "anonymous";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-8 sm:px-8">
      {/* Hero. Updated with a modern vibrant gradient and blur effects. */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/95 via-primary to-brand-hover px-7 py-10 sm:px-10 sm:py-12">
        {/* Decorative blur elements */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-[80px]" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-white/10 blur-[100px]" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {draft.kind && (
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm">
                {SURVEY_KIND_LABELS[draft.kind]}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/90 backdrop-blur-sm">
              {isAnonymous ? (
                <Lock className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <Eye className="h-3 w-3" strokeWidth={2.5} />
              )}
              {SURVEY_VISIBILITY_LABELS[draft.visibility]}
            </span>
          </div>

          <h1 className="max-w-2xl text-[28px] font-bold leading-[1.1] tracking-tight text-white sm:text-[38px]">
            {draft.name.trim() || "Encuesta sin título"}
          </h1>

          {draft.description.trim() && (
            <p className="max-w-2xl text-[14px] leading-relaxed text-white/65">
              {draft.description}
            </p>
          )}

          {(start || deadline) && (
            <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] font-medium text-white/55">
              {start && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                  Abre el {start}
                </span>
              )}
              {deadline && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                  Cierra el {deadline}
                </span>
              )}
            </p>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex items-center gap-2 rounded-xl bg-surface px-6 py-3 text-[14px] font-bold text-primary shadow-lg shadow-black/10 transition-all duration-200 hover:scale-105 hover:bg-white/90"
            >
              Comenzar encuesta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* Facts strip. Four numbers, equal weight — they answer "what am I
          getting into" before any prose does. */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Layers}
          value={String(summary.rootSections)}
          label={summary.rootSections === 1 ? "Sección" : "Secciones"}
        />
        <StatTile
          icon={ListChecks}
          value={String(summary.questionCount)}
          label={summary.questionCount === 1 ? "Pregunta" : "Preguntas"}
        />
        <StatTile icon={Clock3} value={`${summary.estimatedMinutes} min`} label="Tiempo estimado" />
        <StatTile
          icon={isAnonymous ? Lock : Eye}
          value={SURVEY_VISIBILITY_LABELS[draft.visibility]}
          label={isAnonymous ? `Mínimo ${draft.anonymityThreshold} respuestas` : "Respuestas con nombre"}
        />
      </section>

      <div className="flex flex-col gap-4">
        {hasMessage && (
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface p-6 sm:p-8">
            <h2 className="mb-4 text-[14px] font-bold text-primary">
              Antes de empezar
            </h2>
            <div className="text-[14px] leading-relaxed text-text-secondary">
              <PreviewRichText html={draft.welcomeDescription} />
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-border/60 bg-surface p-6 sm:p-8">
          <h2 className="mb-4 text-[14px] font-bold text-primary">
            Contenido de la encuesta
          </h2>
          <PreviewContents pages={pages} outline={outline} progressByPage={progressByPage} onJumpTo={onJumpTo} />
        </section>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface px-4 py-4">
      <Icon className="mb-2.5 h-4 w-4 text-primary" strokeWidth={2} />
      <p className="text-[20px] font-bold leading-none tracking-tight text-text-primary">{value}</p>
      <p className="mt-1.5 text-[12px] font-medium text-text-secondary">{label}</p>
    </div>
  );
}
