import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronUp, MessageSquareQuote, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback";
import {
  depthTheme,
  SECTION_HEADER_DIVIDER,
  SIBLING_DIVIDER,
} from "@/components/survey-builder/depthTheme";
import type { SurveyDraft } from "@/components/survey-builder";
import {
  NPS_BAND_LABELS,
  npsDepthBySection,
  type NpsDepthBand,
  type NpsDepthQuestion,
  type NpsDepthSection,
} from "@/mocks/npsDepth";
import type { NpsBand, SegmentFilter, SurveyResults } from "@/mocks/surveyResults";
import {
  cascadeContainer,
  cascadeItem,
  cascadeItemSettleTime,
  CASCADE_CONTENT_GAP,
} from "@/lib/cascadeAnimation";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/** Answers drawn before the list stops being readable. The rest are counted. */
const VISIBLE_ANSWERS = 8;

/** The three bands, in the colors the eNPS legend already uses. */
const BAND_PALETTE: Readonly<
  Record<NpsBand, { background: string; border: string; foreground: string }>
> = {
  promoter: { background: "#dcfce7", border: "#bbf7d0", foreground: "#15803d" },
  passive: { background: "#fef9c3", border: "#fef08a", foreground: "#a16207" },
  detractor: { background: "#fee2e2", border: "#fecaca", foreground: "#b91c1c" },
};

/**
 * Profundidad — the follow-up each recommendability question asks back.
 *
 * The other two views of this tab reduce: "Secciones" scores the outline,
 * "Por segmento" cuts it by demographic. Neither can answer the question a
 * reader arrives with after seeing a bad eNPS — *and what did they say when we
 * asked why* — so this view keeps the depth questions themselves.
 *
 * It reads the author's own outline, not a tree of its own: depth questions are
 * a property of a scale question, so they appear in the section and subsection
 * where that question was written. A branch that asked no follow-up is not
 * drawn — an empty section is a promise the survey never made.
 *
 * Each band states both halves of what it knows: how many people it was shown
 * to and how many wrote back, because a verbatim list without its coverage is
 * an anecdote. The answers open underneath, and when they are more than the
 * list can hold the row says how many are left rather than trimming in silence.
 */
export function NpsDepthView({
  draft,
  results,
  filters,
  tierBands,
}: {
  draft: SurveyDraft;
  results: SurveyResults;
  filters: readonly SegmentFilter[];
  tierBands?: ReadonlySet<string>;
}) {
  const sections = React.useMemo(
    () => npsDepthBySection(draft, results, filters),
    [draft, results, filters]
  );

  const [openSection, setOpenSection] = React.useState<string | undefined>(sections[0]?.id);

  if (sections.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="Ninguna pregunta pidió profundidad"
        description="Las preguntas de profundidad se activan en el editor, sobre una pregunta de escala: cada banda —detractores, neutros y promotores— recibe su propia pregunta abierta. Cuando alguna las tenga, sus respuestas se leen aquí."
        className="mt-6"
      />
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {sections.map((section) => (
        <DepthSectionRoot
          key={section.id}
          section={section}
          isOpen={openSection === section.id}
          onToggle={() =>
            setOpenSection((current) => (current === section.id ? undefined : section.id))
          }
          tierBands={tierBands}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ outline */

function countDepthQuestions(section: NpsDepthSection): number {
  return (
    section.questions.length +
    section.children.reduce((sum, child) => sum + countDepthQuestions(child), 0)
  );
}

function sectionCaption(section: NpsDepthSection): string {
  const questions = countDepthQuestions(section);
  const label = `${questions} ${questions === 1 ? "pregunta con profundidad" : "preguntas con profundidad"}`;
  return section.children.length > 0
    ? `${label} · ${section.children.length} ${section.children.length === 1 ? "subsección" : "subsecciones"}`
    : label;
}


function DepthSectionRoot({
  section,
  isOpen,
  onToggle,
  tierBands,
}: {
  section: NpsDepthSection;
  isOpen: boolean;
  onToggle: () => void;
  tierBands?: ReadonlySet<string>;
}) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface">
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isOpen}
        className={cn(
          "group flex items-start gap-3.5 bg-muted/40 px-6 py-5 transition-colors hover:bg-muted/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          isOpen && ["border-b", SECTION_HEADER_DIVIDER]
        )}
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/50 transition-colors group-hover:bg-border/40 group-hover:text-text-primary">
          <ChevronUp
            className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")}
            strokeWidth={2.5}
          />
        </div>
        <span
          aria-hidden
          className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/60 px-1 text-[10px] font-bold tabular-nums text-muted-foreground"
        >
          {section.numbering}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md px-1 py-0.5 text-[14px] font-bold tracking-tight text-text-primary">
            {section.title}
            <span className="text-[12px] font-medium tracking-normal text-muted-foreground">
              {sectionCaption(section)}
            </span>
          </p>
        </div>
      </div>

      {isOpen && (
        <div className="flex min-h-0 flex-col gap-5 px-6 py-5 duration-300 animate-in fade-in slide-in-from-top-1">
          {section.questions.length > 0 && (
            <DepthQuestionList questions={section.questions} tierBands={tierBands} />
          )}
          {section.children.length > 0 && (
            <DepthSubsectionOutline sections={section.children} depth={2} tierBands={tierBands} />
          )}
        </div>
      )}
    </section>
  );
}


function DepthSubsectionOutline({
  sections,
  depth,
  tierBands,
  baseDelay = 0,
}: {
  sections: readonly NpsDepthSection[];
  depth: number;
  tierBands?: ReadonlySet<string>;
  /** When this list itself sits inside another cascade, how long to wait
   * before its own rows start staggering in. */
  baseDelay?: number;
}) {
  return (
    <motion.ul
      className={cn("flex flex-col", SIBLING_DIVIDER)}
      initial="hidden"
      animate="show"
      custom={baseDelay}
      variants={cascadeContainer}
    >
      {sections.map((section, index) => (
        <DepthSubsectionRow
          key={section.id}
          section={section}
          depth={depth}
          defaultOpen={index === 0}
          tierBands={tierBands}
          // This row's own content starts right as the row itself settles
          // in, not after every sibling row has.
          contentDelay={cascadeItemSettleTime(baseDelay, index) + CASCADE_CONTENT_GAP}
        />
      ))}
    </motion.ul>
  );
}

function DepthSubsectionRow({
  section,
  depth,
  defaultOpen,
  tierBands,
  contentDelay = 0,
}: {
  section: NpsDepthSection;
  depth: number;
  defaultOpen?: boolean;
  tierBands?: ReadonlySet<string>;
  /** Delay before this subsection's own questions/nested subsections start
   * cascading in — set by the sibling list so they wait their turn. */
  contentDelay?: number;
}) {
  const [expanded, setExpanded] = React.useState(defaultOpen ?? false);
  const theme = depthTheme(depth);

  return (
    <motion.li variants={cascadeItem}>
      <div
        onClick={() => setExpanded((value) => !value)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((value) => !value);
          }
        }}
        aria-expanded={expanded}
        className="group -mx-2 flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-muted/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors group-hover:bg-border/40 group-hover:text-text-primary">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              expanded && "rotate-90"
            )}
            strokeWidth={2.5}
          />
        </div>
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums transition-colors group-hover:border-border",
            theme.chip
          )}
        >
          {section.numbering}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "-ml-1 flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md px-1 py-0.5 font-bold tracking-tight text-text-primary",
              theme.title
            )}
          >
            {section.title}
            <span className="text-[11px] font-medium tracking-normal text-muted-foreground">
              {sectionCaption(section)}
            </span>
          </p>
        </div>
      </div>

      {expanded && (
        <div
          className={cn(
            "mt-2.5 flex flex-col gap-5 pb-1 duration-200 animate-in fade-in slide-in-from-top-1",
            theme.rail,
            theme.railOffset
          )}
        >
          {section.questions.length > 0 && (
            <DepthQuestionList
              questions={section.questions}
              tierBands={tierBands}
              revealDelay={contentDelay}
            />
          )}
          {section.children.length > 0 && (
            <DepthSubsectionOutline
              sections={section.children}
              depth={depth + 1}
              tierBands={tierBands}
              baseDelay={contentDelay}
            />
          )}
        </div>
      )}
    </motion.li>
  );
}

/* ----------------------------------------------------------------- pregunta */

/**
 * The depth questions under one section/subsection row, cascading in the
 * same way `QuestionTable`'s rows do — each block settles in turn, and its
 * own band verbatim-answer lists (see `DepthBandRow`) are free to start
 * revealing right after.
 */
function DepthQuestionList({
  questions,
  tierBands,
  revealDelay = 0,
}: {
  questions: readonly NpsDepthQuestion[];
  tierBands?: ReadonlySet<string>;
  /** Delay before this list's rows start cascading in — set by the parent
   * so questions only start once the row above them is done. */
  revealDelay?: number;
}) {
  return (
    <motion.ul
      className="flex flex-col gap-5"
      initial="hidden"
      animate="show"
      custom={revealDelay}
      variants={cascadeContainer}
    >
      {questions.map((question, index) => (
        <motion.li key={question.id} variants={cascadeItem}>
          <DepthQuestionBlock
            question={question}
            tierBands={tierBands}
            answersRevealDelay={cascadeItemSettleTime(revealDelay, index) + CASCADE_CONTENT_GAP}
          />
        </motion.li>
      ))}
    </motion.ul>
  );
}

function DepthQuestionBlock({
  question,
  tierBands,
  answersRevealDelay = 0,
}: {
  question: NpsDepthQuestion;
  tierBands?: ReadonlySet<string>;
  /** Delay before this question's own band verbatim-answer lists start
   * cascading in when expanded — set by `DepthQuestionList` so they wait
   * for this question's row to settle first. */
  answersRevealDelay?: number;
}) {
  const answered = question.bands.reduce((sum, band) => sum + band.answered, 0);

  return (
    <div className="flex flex-col gap-2">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
        <h4 className="text-[14px] font-bold leading-snug text-text-primary">
          {question.statement}
        </h4>
        <span className="text-[12px] font-medium text-muted-foreground">
          {question.formatLabel} · {formatCount(question.n)} respuestas a la escala
        </span>
        <Badge
          variant="neutral"
          className="ml-auto h-5 shrink-0 gap-1 px-1.5 text-[11px] font-semibold tabular-nums"
        >
          <MessageSquareQuote className="h-3 w-3" />
          {formatCount(answered)}
        </Badge>
      </header>

      {/* Columns, the same shape the Preguntas tab reads its own numbers in:
          a header row of right-aligned labels, then every band's figures
          lined up under them instead of running together as one sentence. */}
      <div className="flex items-end gap-4 border-b border-border/60 px-1 pb-1.5">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pregunta de profundidad
        </span>
        <span className="w-[76px] shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Personas
        </span>
        <span className="w-[86px] shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Respondieron
        </span>
        <span className="w-[64px] shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Cobertura
        </span>
        {/* Matches the band chip + chevron width on each row below, so the
            three number columns line up with their header regardless. */}
        <span className="w-[108px] shrink-0" aria-hidden />
      </div>

      {/* Hairlines only, no boxed rows: the question already sits inside the
          section card, and a bordered tile per band on top of it stacked into
          the same look "comentarios de preguntas" moved away from. */}
      <ul className="flex flex-col divide-y divide-border/40">
        {question.bands.map((band) => (
          <DepthBandRow
            key={band.band}
            band={band}
            tierBands={tierBands}
            revealDelay={answersRevealDelay}
          />
        ))}
      </ul>
    </div>
  );
}

function DepthBandRow({
  band,
  tierBands,
  revealDelay = 0,
}: {
  band: NpsDepthBand;
  tierBands?: ReadonlySet<string>;
  /** Delay before this band's verbatim-answer cards start cascading in when
   * expanded — set by the depth question above so the list starts right as
   * that row settles, regardless of how deep it's nested. */
  revealDelay?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const palette = BAND_PALETTE[band.band];
  const wording = band.question.trim();
  const hasAnswers = band.answers.length > 0;
  const visible = band.answers.slice(0, VISIBLE_ANSWERS);
  const remaining = band.answers.length - visible.length;
  const rowDimmed = tierBands !== undefined && tierBands.size > 0 && !tierBands.has(band.band);

  return (
    <li className={cn(rowDimmed && "opacity-55 grayscale")}>
      <div
        onClick={() => hasAnswers && setExpanded((value) => !value)}
        role={hasAnswers ? "button" : undefined}
        tabIndex={hasAnswers ? 0 : undefined}
        onKeyDown={(event) => {
          if (!hasAnswers) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((value) => !value);
          }
        }}
        aria-expanded={hasAnswers ? expanded : undefined}
        className={cn(
          "group flex items-center gap-4 px-1 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          hasAnswers ? "cursor-pointer hover:bg-muted/30" : "cursor-default"
        )}
      >
        <div className="min-w-0 flex-1">
          {wording.length > 0 ? (
            <p className="text-[13px] font-semibold leading-snug text-text-primary">
              {wording}
            </p>
          ) : (
            <p className="text-[13px] font-medium leading-snug text-muted-foreground">
              Sin pregunta configurada para esta banda
            </p>
          )}
        </div>

        <span className="w-[76px] shrink-0 text-right text-[12px] font-semibold tabular-nums text-text-primary">
          {formatCount(band.people)}
        </span>
        <span className="w-[86px] shrink-0 text-right text-[12px] font-semibold tabular-nums text-text-primary">
          {formatCount(band.answered)}
        </span>
        <span className="w-[64px] shrink-0 text-right text-[12px] font-semibold tabular-nums text-text-primary">
          {band.coverage}%
        </span>

        {/* Band label and expand affordance on the right, same as the score
            chip at the end of every other row in this tab. */}
        <div className="flex w-[108px] shrink-0 items-center justify-end gap-2">
          <span
            aria-hidden
            className="rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ background: palette.background, color: palette.foreground }}
          >
            {NPS_BAND_LABELS[band.band]}
          </span>
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 group-hover:text-text-primary",
              !hasAnswers && "opacity-0",
              expanded && "rotate-90"
            )}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {expanded && hasAnswers && (
        <div className="duration-200 animate-in fade-in slide-in-from-top-1">
          <motion.ul
            className="flex flex-col gap-2 px-1 pb-3 pt-1"
            initial="hidden"
            animate="show"
            custom={revealDelay}
            variants={cascadeContainer}
          >
            {visible.map((answer) => (
              <motion.li
                key={answer.id}
                variants={cascadeItem}
                className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-2"
              >
                <p className="text-[13px] leading-relaxed text-text-primary">“{answer.text}”</p>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {answer.segment}
                </span>
              </motion.li>
            ))}
            {remaining > 0 && (
              // Never a silent trim: the row says what it is not drawing and
              // where the rest of it lives.
              <motion.li
                variants={cascadeItem}
                className="px-1 pt-0.5 text-[12px] font-medium text-muted-foreground"
              >
                y {formatCount(remaining)} respuestas más — las {formatCount(band.answers.length)}{" "}
                completas viajan en el reporte descargable
              </motion.li>
            )}
          </motion.ul>
        </div>
      )}
    </li>
  );
}
