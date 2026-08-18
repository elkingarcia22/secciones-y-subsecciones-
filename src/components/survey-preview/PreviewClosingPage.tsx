import { Check, RotateCcw } from "lucide-react";
import { isHtmlBlank } from "@/lib/sanitizeHtml";
import { PreviewRichText } from "./PreviewRichText";
import type { PreviewSummary } from "./previewModel";

/**
 * The last page. Nothing is asked here, so nothing competes with the message:
 * one mark, one heading, and whatever the author wrote to close.
 *
 * The counters underneath are the preview's own honesty — they report what was
 * answered in this run, which is also the clearest way to say that this run was
 * a rehearsal.
 */

interface PreviewClosingPageProps {
  html: string;
  summary: PreviewSummary;
  answeredCount: number;
  onRestart: () => void;
}

export function PreviewClosingPage({
  html,
  summary,
  answeredCount,
  onRestart,
}: PreviewClosingPageProps) {
  const total = summary.questionCount + summary.demographicCount;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center sm:px-8">
      <span className="relative mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-status-positive/10 text-status-positive">
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-status-positive/10 blur-xl"
        />
        <Check className="relative h-8 w-8" strokeWidth={2.6} />
      </span>

      <h1 className="text-[30px] font-bold leading-tight tracking-tight text-text-primary">
        Respuestas enviadas
      </h1>
      <p className="mt-2 text-[14px] text-text-secondary">
        Esto es lo que verá el participante al terminar.
      </p>

      {!isHtmlBlank(html) && (
        <section className="mt-8 w-full rounded-2xl border border-border/50 bg-surface p-7 text-left shadow-card">
          <PreviewRichText html={html} />
        </section>
      )}

      <div className="mt-8 flex w-full items-stretch divide-x divide-border/60 rounded-2xl border border-border/50 bg-surface shadow-card">
        <Stat value={`${answeredCount}/${total}`} label="Respondidas en esta prueba" />
        <Stat value={String(summary.rootSections)} label={summary.rootSections === 1 ? "Sección" : "Secciones"} />
        <Stat value={`${summary.estimatedMinutes} min`} label="Tiempo estimado" />
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
        Volver a empezar la vista previa
      </button>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-4 py-4">
      <p className="text-[17px] font-bold leading-none tracking-tight text-text-primary">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-text-secondary">{label}</p>
    </div>
  );
}
