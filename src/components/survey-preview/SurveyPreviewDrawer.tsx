import * as React from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Eye, ListTree, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { depthLabel, type SurveyDraft } from "@/components/survey-builder";
import { PreviewContents } from "./PreviewContents";
import { PreviewWelcomePage } from "./PreviewWelcomePage";
import { PreviewClosingPage } from "./PreviewClosingPage";
import { PreviewQuestionsPage } from "./PreviewQuestionsPage";
import type { PreviewAnswer } from "./PreviewAnswerField";
import {
  buildPreviewOutline,
  buildPreviewPages,
  pageQuestionIds,
  previewSummary,
  type PreviewOutlineRow,
  type PreviewPage,
} from "./previewModel";

/**
 * Survey preview.
 *
 * A full-screen drawer that reproduces the *journey*, one page at a time: the
 * author is checking what it is like to answer this survey, not reading a
 * document.
 *
 * There is no permanent side panel. The survey's own welcome page is its table
 * of contents, and from there on the header carries the location — breadcrumb,
 * page counter, progress — with the full index one click away. That keeps the
 * page itself the widest, quietest thing on screen, which is what a respondent
 * actually sees.
 *
 * It renders the draft, so it is as live as the builder: close it, change a
 * question, open it again and the change is there. Answers typed inside are
 * thrown away on close — this is a rehearsal, and it says so.
 *
 * Built on the Sheet primitives rather than DrawerShell because that shell owns
 * its own scroll container, and this layout needs the header and footer to stay
 * put while only the page scrolls.
 */

interface SurveyPreviewDrawerProps {
  draft: SurveyDraft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const answeredCount = (value: PreviewAnswer): number => {
  if (Array.isArray(value)) return value.length > 0 ? 1 : 0;
  return typeof value === "string" && value.trim() !== "" ? 1 : 0;
};

export function SurveyPreviewDrawer({ draft, open, onOpenChange }: SurveyPreviewDrawerProps) {
  const pages = React.useMemo(() => buildPreviewPages(draft), [draft]);
  const outline = React.useMemo(() => buildPreviewOutline(draft), [draft]);
  const summary = React.useMemo(() => previewSummary(draft, pages), [draft, pages]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Readonly<Record<string, PreviewAnswer>>>({});
  const [followUps, setFollowUps] = React.useState<Readonly<Record<string, string>>>({});
  const [isContentsOpen, setIsContentsOpen] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Each opening is a fresh run-through: the point of the preview is to see the
  // survey as someone meeting it for the first time.
  React.useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    setAnswers({});
    setFollowUps({});
    setIsContentsOpen(false);
  }, [open]);

  // Editing the draft can remove the page being previewed.
  const safeIndex = Math.min(activeIndex, Math.max(pages.length - 1, 0));
  const page: PreviewPage | undefined = pages[safeIndex];

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [safeIndex]);

  const goTo = (index: number) => {
    setActiveIndex(Math.min(Math.max(index, 0), pages.length - 1));
    setIsContentsOpen(false);
  };

  const goToPage = (pageId: string) => {
    const index = pages.findIndex((item) => item.id === pageId);
    if (index !== -1) goTo(index);
  };

  const progressByPage = React.useMemo(() => {
    const entries: Record<string, { answered: number; total: number }> = {};
    for (const item of pages) {
      const ids = pageQuestionIds(item);
      if (ids.length === 0) continue;
      entries[item.id] = {
        total: ids.length,
        answered: ids.reduce((total, id) => total + answeredCount(answers[id] ?? null), 0),
      };
    }
    return entries;
  }, [pages, answers]);

  const totals = React.useMemo(
    () =>
      Object.values(progressByPage).reduce(
        (acc, item) => ({ answered: acc.answered + item.answered, total: acc.total + item.total }),
        { answered: 0, total: 0 }
      ),
    [progressByPage]
  );

  const percent = totals.total === 0 ? 0 : Math.round((totals.answered / totals.total) * 100);

  const handleAnswer = (questionId: string, value: PreviewAnswer) =>
    setAnswers((current) => ({ ...current, [questionId]: value }));

  const handleFollowUp = (questionId: string, value: string) =>
    setFollowUps((current) => ({ ...current, [questionId]: value }));

  const isLast = safeIndex === pages.length - 1;
  const isNextClosing = !isLast && pages[safeIndex + 1]?.kind === "closing";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        // `!` on the widths: SheetContent's own `data-[side=right]` rules are
        // more specific than a plain utility, so a right-side drawer stays
        // 384px wide unless it is overridden outright.
        className="!w-[80vw] !max-w-none gap-0 border-l border-border/60 bg-background p-0 shadow-drawer"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">
          Vista previa de {draft.name.trim() || "la encuesta"}
        </SheetTitle>

        <div className="flex h-full min-h-0 w-full flex-col">
          <PreviewHeader
            name={draft.name}
            page={page}
            index={safeIndex}
            total={pages.length}
            answered={totals.answered}
            askedTotal={totals.total}
            percent={percent}
            pages={pages}
            outline={outline}
            progressByPage={progressByPage}
            isContentsOpen={isContentsOpen}
            onContentsOpenChange={setIsContentsOpen}
            onJumpTo={goToPage}
            onClose={() => onOpenChange(false)}
          />

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {page?.kind === "welcome" && (
              <PreviewWelcomePage
                draft={draft}
                summary={summary}
                pages={pages}
                outline={outline}
                progressByPage={progressByPage}
                onStart={() => goTo(safeIndex + 1)}
                onJumpTo={goToPage}
              />
            )}

            {(page?.kind === "section" || page?.kind === "demographics") && (
              <PreviewQuestionsPage
                page={page}
                answers={answers}
                followUps={followUps}
                onAnswer={handleAnswer}
                onFollowUp={handleFollowUp}
              />
            )}

            {page?.kind === "closing" && (
              <PreviewClosingPage
                html={draft.closingDescription}
                summary={summary}
                answeredCount={totals.answered}
                onRestart={() => goTo(0)}
              />
            )}
          </div>

          <footer className="mx-3 mb-3 flex shrink-0 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-surface px-5 py-3.5 shadow-card">
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              disabled={safeIndex === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition-colors hover:border-border hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Anterior
            </button>

            <PageDots count={pages.length} activeIndex={safeIndex} onSelect={goTo} />

            <button
              type="button"
              onClick={() => (isLast ? onOpenChange(false) : goTo(safeIndex + 1))}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-text-inverse transition-colors hover:bg-brand-hover"
            >
              {isLast
                ? "Cerrar vista previa"
                : isNextClosing
                  ? "Enviar y finalizar"
                  : "Siguiente"}
              {!isLast && !isNextClosing && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </button>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface PreviewHeaderProps {
  name: string;
  page: PreviewPage | undefined;
  index: number;
  total: number;
  answered: number;
  askedTotal: number;
  percent: number;
  pages: readonly PreviewPage[];
  outline: readonly PreviewOutlineRow[];
  progressByPage: Readonly<Record<string, { answered: number; total: number }>>;
  isContentsOpen: boolean;
  onContentsOpenChange: (open: boolean) => void;
  onJumpTo: (pageId: string) => void;
  onClose: () => void;
}

/**
 * Two bands: what you are looking at, and where you are inside it.
 *
 * The location line repeats the page's own breadcrumb because the cover scrolls
 * away and the question you are answering three screens down still has to say
 * which subsection it belongs to.
 */
function PreviewHeader({
  name,
  page,
  index,
  total,
  answered,
  askedTotal,
  percent,
  pages,
  outline,
  progressByPage,
  isContentsOpen,
  onContentsOpenChange,
  onJumpTo,
  onClose,
}: PreviewHeaderProps) {
  return (
    <header className="mx-3 mt-3 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-5">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
          Vista previa
        </span>

        <h2 className="min-w-0 flex-1 truncate text-[14px] font-bold tracking-tight text-text-primary">
          {name.trim() || "Encuesta sin título"}
        </h2>

        {askedTotal > 0 && (
          <div className="hidden items-center gap-2.5 md:flex">
            <span className="text-[12px] font-semibold text-text-secondary">
              {answered} de {askedTotal} respondidas
            </span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-8 text-right text-[12px] font-bold tabular-nums text-text-primary">
              {percent}%
            </span>
          </div>
        )}

        <Popover open={isContentsOpen} onOpenChange={onContentsOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors",
                isContentsOpen
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-surface text-text-secondary hover:border-primary/40 hover:text-primary"
              )}
            >
              <ListTree className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Contenido</span>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-[320px] rounded-2xl p-2">
            <p className="px-2.5 pb-2 pt-1.5 text-[12px] font-bold text-text-secondary">
              Contenido de la encuesta
            </p>
            <div className="max-h-[55vh] overflow-y-auto">
              <PreviewContents
                pages={pages}
                outline={outline}
                activePageId={page?.id ?? null}
                progressByPage={progressByPage}
                onJumpTo={onJumpTo}
                compact
              />
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista previa"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-status-negative/10 hover:text-status-negative"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-surface-muted px-4 py-2 sm:px-5">
        <Location page={page} />
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-text-secondary">
          {index + 1} / {total}
        </span>
      </div>
    </header>
  );
}

function Location({ page }: { page: PreviewPage | undefined }) {
  if (!page) return null;

  if (page.kind !== "section") {
    const label =
      page.kind === "welcome"
        ? "Página de bienvenida"
        : page.kind === "closing"
          ? "Página de cierre"
          : "Datos demográficos";
    return <p className="truncate text-[12px] font-semibold text-text-secondary">{label}</p>;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {page.trail.map((crumb) => (
        <React.Fragment key={crumb.numbering}>
          <span className="hidden shrink-0 truncate text-[12px] font-medium text-text-secondary sm:inline">
            {crumb.numbering}. {crumb.title}
          </span>
          <ChevronRight
            className="hidden h-3.5 w-3.5 shrink-0 text-text-muted sm:block"
            strokeWidth={2}
          />
        </React.Fragment>
      ))}
      <span className="shrink-0 text-[12px] font-bold text-primary">
        {depthLabel(page.depth)} {page.numbering}
      </span>
      <span className="min-w-0 truncate text-[12px] font-semibold text-text-primary">
        · {page.title}
      </span>
    </div>
  );
}

/** Compact map of the run. Long surveys fall back to a plain counter — forty
 * identical dots stop being a map. */
function PageDots({
  count,
  activeIndex,
  onSelect,
}: {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  if (count > 14) {
    return (
      <span className="text-[12px] font-semibold text-text-secondary">
        Página {activeIndex + 1} de {count}
      </span>
    );
  }

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Ir a la página ${index + 1}`}
          aria-current={index === activeIndex ? "step" : undefined}
          className={cn(
            "h-1.5 rounded-full transition-all duration-200",
            index === activeIndex
              ? "w-6 bg-primary"
              : index < activeIndex
                ? "w-1.5 bg-primary/40 hover:bg-primary/60"
                : "w-1.5 bg-border hover:bg-text-muted"
          )}
        />
      ))}
    </div>
  );
}
