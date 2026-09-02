import type * as React from "react";
import { Check, RotateCcw } from "lucide-react";
import { isHtmlBlank } from "@/lib/sanitizeHtml";
import { ConfettiBurst } from "./ConfettiBurst";
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
  /** The drawer's own root — confetti portals there so the burst stays
   * inside the panel instead of covering the whole screen. */
  drawerRef: React.RefObject<HTMLElement | null>;
}

export function PreviewClosingPage({
  html,
  summary,
  answeredCount,
  onRestart,
  drawerRef,
}: PreviewClosingPageProps) {
  const total = summary.questionCount + summary.demographicCount;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center sm:px-8">
      <ConfettiBurst containerRef={drawerRef} />

      <span
        className="relative mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-status-positive/10 text-status-positive animate-in fade-in zoom-in-75 duration-500 ease-out fill-mode-both"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-status-positive/10 blur-xl"
        />
        <Check className="relative h-8 w-8" strokeWidth={2.5} />
      </span>

      <h1
        className="text-[28px] font-bold leading-tight tracking-tight text-text-primary animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both"
        style={{ animationDelay: "120ms" }}
      >
        Respuestas enviadas
      </h1>
      <p
        className="mt-2 text-[14px] text-text-secondary animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both"
        style={{ animationDelay: "220ms" }}
      >
        Esto es lo que verá el participante al terminar.
      </p>

      {!isHtmlBlank(html) && (
        <section
          className="mt-8 w-full rounded-2xl border border-border/60 bg-surface p-7 text-left shadow-card animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both"
          style={{ animationDelay: "340ms" }}
        >
          <PreviewRichText html={html} />
        </section>
      )}

      <div
        className="mt-8 flex w-full items-stretch divide-x divide-border/60 rounded-2xl border border-border/60 bg-surface shadow-card animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both"
        style={{ animationDelay: isHtmlBlank(html) ? "340ms" : "440ms" }}
      >
        <Stat value={`${answeredCount}/${total}`} label="Respondidas en esta prueba" />
        <Stat value={String(summary.rootSections)} label={summary.rootSections === 1 ? "Sección" : "Secciones"} />
        <Stat value={`${summary.estimatedMinutes} min`} label="Tiempo estimado" />
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both"
        style={{ animationDelay: isHtmlBlank(html) ? "460ms" : "560ms" }}
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2} />
        Volver a empezar la vista previa
      </button>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-4 py-4">
      <p className="text-[16px] font-bold leading-none tracking-tight text-text-primary">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-text-secondary">{label}</p>
    </div>
  );
}
