import * as React from "react";
import { toast } from "sonner";
import type { SurveyDraft } from "@/components/survey-builder";
import type { SurveyResults } from "@/mocks/surveyResults";
import type { DownloadEntry, ReportRequest } from "./downloadTypes";
import { reportTypeFor } from "./downloadTypes";
import {
  buildAnswersWorkbook,
  buildCommentsWorkbook,
  buildQuestionsWorkbook,
  buildResultsWorkbook,
  fileStamp,
  saveBlob,
  slugify,
} from "./reportFiles";
import { openPdfReport } from "./pdfReport";

interface UseDownloadCenterInput {
  draft: SurveyDraft;
  results: SurveyResults;
}

export interface DownloadCenter {
  entries: readonly DownloadEntry[];
  /** True while at least one report is still preparing. */
  isBusy: boolean;
  /** Queues a report and starts its (simulated) preparation. */
  start: (request: ReportRequest) => void;
  /**
   * Re-hands a ready file to the browser. Delivery already happened on its own
   * when the preparation ended, so this only serves the retry path.
   */
  deliver: (id: string) => void;
  /** Copies a shareable link to the report and reports it to the reader. */
  share: (id: string) => void;
}

/**
 * The download center's state, owned by the screen rather than the drawer:
 * closing the drawer must not kill a report that is half-prepared, and the
 * floating widget needs the same list the drawer's "Descargas" tab shows.
 *
 * Preparation is simulated with a ticking progress — the prototype has no
 * backend — but delivery is real: the moment a report finishes it hands the
 * browser an actual file built from the same aggregate the screen renders. No
 * second click: asking for a report *is* asking for the download, so the row
 * that stays behind is a receipt, not a pending action.
 */
export function useDownloadCenter({ draft, results }: UseDownloadCenterInput): DownloadCenter {
  const [entries, setEntries] = React.useState<readonly DownloadEntry[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearInterval(timer));
      timers.clear();
    };
  }, []);

  const start = React.useCallback(
    (request: ReportRequest) => {
      const type = reportTypeFor(request.kind);
      const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const extension = type.format === "PDF" ? "pdf" : "xls";
      const fileName = `${type.fileSlug}-${slugify(draft.name)}-${fileStamp()}.${extension}`;

      const deliver = (): boolean => {
        const xlsMime = "application/vnd.ms-excel";
        switch (request.kind) {
          // The print view is a popup, and an automatic delivery has no click
          // behind it — a blocked window is a normal outcome here, not a bug,
          // so it travels back as `false` and the row offers "Reintentar".
          case "pdf":
            return openPdfReport(draft, results, request);
          case "xlsx":
            saveBlob(fileName, xlsMime, buildResultsWorkbook(draft, results, request));
            return true;
          case "comments":
            saveBlob(fileName, xlsMime, buildCommentsWorkbook(draft, results, request));
            return true;
          case "questions-csv":
            saveBlob(fileName, xlsMime, buildQuestionsWorkbook(draft, results, request));
            return true;
          case "answers-csv":
            saveBlob(fileName, xlsMime, buildAnswersWorkbook(draft, results, request));
            return true;
        }
      };

      const entry: DownloadEntry = {
        id,
        kind: request.kind,
        fileName,
        format: type.format,
        status: "preparing",
        progress: 0,
        startedAt: Date.now(),
        delivered: false,
        deliver,
      };
      setEntries((current) => [entry, ...current]);

      // Uneven ticks on purpose: a perfectly linear progress reads as fake.
      //
      // The randomness and the hand-off live in the interval body, never inside
      // the state updater: React runs updaters twice under StrictMode, and a
      // second roll of the dice would both re-deliver the file and undo the
      // completion the first roll reached.
      const tickMs = 220;
      const meanStep = (100 * tickMs) / type.prepareMs;
      let progress = 0;
      const timer = setInterval(() => {
        progress = Math.min(100, progress + meanStep * (0.4 + Math.random() * 1.2));
        const done = progress >= 100;

        if (!done) {
          setEntries((current) =>
            current.map((candidate) =>
              candidate.id === id ? { ...candidate, progress } : candidate
            )
          );
          return;
        }

        const stored = timersRef.current.get(id);
        if (stored) clearInterval(stored);
        timersRef.current.delete(id);

        const delivered = deliver();
        if (delivered) {
          toast.success(`${type.format} descargado`, { description: fileName });
        } else {
          toast.error("No se pudo abrir la vista de impresión", {
            description: "Reintenta la descarga desde la lista de descargas.",
          });
        }
        setEntries((current) =>
          current.map((candidate) =>
            candidate.id === id
              ? { ...candidate, progress: 100, status: "ready" as const, delivered }
              : candidate
          )
        );
      }, tickMs);
      timersRef.current.set(id, timer);
    },
    [draft, results]
  );

  const deliver = React.useCallback(
    (id: string) => {
      const entry = entries.find((candidate) => candidate.id === id);
      if (entry?.status !== "ready") return;
      const delivered = entry.deliver();
      setEntries((current) =>
        current.map((candidate) => (candidate.id === id ? { ...candidate, delivered } : candidate))
      );
      if (!delivered) {
        toast.error("No se pudo abrir la vista de impresión", {
          description: "Revisa si el navegador está bloqueando las ventanas emergentes.",
        });
      }
    },
    [entries]
  );

  const share = React.useCallback(
    (id: string) => {
      const entry = entries.find((candidate) => candidate.id === id);
      if (!entry || entry.status !== "ready") return;
      // No backend to host the file, so sharing is the link to this results
      // view plus the report's name — enough for a colleague to find it.
      const link = `${window.location.href.split("#")[0]}#reporte=${encodeURIComponent(entry.fileName)}`;
      copyToClipboard(link).then((copied) => {
        if (copied) {
          toast.success("Enlace copiado", {
            description: "Compártelo con quien deba ver este reporte.",
          });
        } else {
          toast.error("No se pudo copiar el enlace", {
            description: "Copia la URL desde la barra del navegador.",
          });
        }
      });
    },
    [entries]
  );

  const isBusy = entries.some((entry) => entry.status === "preparing");

  return { entries, isBusy, start, deliver, share };
}

/**
 * The async Clipboard API needs a permission the embedded and older browsers
 * do not always grant, so a denied write falls back to the selection trick
 * rather than telling the reader that sharing is broken.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      return copied;
    } catch {
      return false;
    }
  }
}
