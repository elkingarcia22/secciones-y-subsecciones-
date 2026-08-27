import * as React from "react";
import { ChevronRight, ChevronUp, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback";
import {
  sectionResultsForFilters,
  type QuestionResult,
  type SectionResult,
  type SegmentDefinition,
  type SurveyResults,
} from "@/mocks/surveyResults";
import {
  SECTION_HEADER_DIVIDER,
  SIBLING_DIVIDER,
  depthTheme,
} from "@/components/survey-builder/depthTheme";
import {
  FAVORABILITY_FLOOR,
  tierForScore,
  POSITIVE_TEXT,
  YELLOW_TEXT,
  NEGATIVE_TEXT,
  POSITIVE_BG,
  YELLOW_BG,
  NEGATIVE_BG,
  POSITIVE,
  YELLOW,
  NEGATIVE,
  FAVORABILITY_TARGET,
  NSNR,
  NSNR_BG,
  NSNR_BORDER,
  NSNR_TEXT,
  THREE_TIER_FAVORABILITY_LEGEND,
  formatPercent,
  
  FAVORABILITY_SCALE_LEGEND
} from "./favorabilityScale";
import {
  favorabilityGroups,
  FavorabilityBreakdownDots,
  FavorabilityBreakdownHeaders,
  FavorabilityWithBreakdown,
} from "./FavorabilityBreakdown";
import { pooledDistribution } from "./sectionTotals";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import {
  ResultsFilterChips,
  ResultsFilterControls,
  THREE_TIER_HIGHLIGHT,
} from "./ResultsFilterToolbar";
import { ResultsSubTabSwitch, type ResultsSubTab } from "./ResultsSubTabSwitch";
import type { ResultsFiltersState } from "./useResultsFilters";
import { levelForDepth, type ResultLevel } from "./resultLevels";
import { ResultsSortHeader } from "./ResultsSortHeader";

interface QuestionsTabProps {
  results: SurveyResults;
  segments: readonly SegmentDefinition[];
  activeSegment: SegmentDefinition;
  filtersState: ResultsFiltersState;
  onSubTabChange: (tab: ResultsSubTab) => void;
}

/** Everything a row needs to obey "Niveles" and "Resaltar" — threaded down
 * instead of each of the three controls travelling on its own. Preguntas has
 * no "Resaltar solo" trigger of its own, but a row can still arrive dimmed
 * when it was highlighted from the heatmap, since the two tabs share filter
 * state. */
interface RowHighlightProps {
  visibleLevels: ReadonlySet<ResultLevel>;
  /** Favorables / Neutrales / Desfavorables / NS/NR — the buckets this view
   * actually shows, not the heatmap's five 1–5 bands. */
  tierBands: ReadonlySet<string>;
  highlightedRows: ReadonlySet<string>;
}

/**
 * Every question, grouped as the survey was written.
 *
 * Styled as the heatmap's sibling: the same container, the same header rhythm
 * (icon title, inline metrics, one control on the right) and the same band
 * legend in the footer — the three tabs read as one screen instead of three
 * designs. A favorability bar is only meaningful for a scale: an open question
 * and a multiple-choice have no top-two boxes, so they say what they are and
 * how many people answered instead of borrowing a bar that means nothing. The
 * order — the survey's own is right for reading, but not for deciding — can be
 * flipped to worst-first.
 *
 * "Ver por", "Filtros", "Niveles" and "Resaltar" are the heatmap's own
 * controls, shared through `filtersState` so a reader who narrowed down in one
 * view is still narrowed down in the other. "Filtros" actually re-narrows the
 * population each question and section is built from; "Niveles" blanks a
 * level's numbers while keeping its row; "Resaltar" dims whatever falls
 * outside the chosen bands, or everything but one row when "Resaltar solo" is
 * active on it.
 *
 * The nesting borrows the builder's own "Secciones y preguntas" outline — a
 * root section is a card with a generous header, every subsection below it a
 * row with a level chip and a rail hanging off the chevron — so the report
 * reads the same hierarchy the author wrote.
 */
export function QuestionsTab({
  results,
  segments,
  activeSegment,
  filtersState,
  onSubTabChange,
}: QuestionsTabProps) {
  const [openSection, setOpenSection] = React.useState<string | undefined>(
    () => results.sections[0]?.id
  );

  const sections = React.useMemo(
    () => sectionResultsForFilters(results, filtersState.filters),
    [results, filtersState.filters]
  );

  const totalQuestions = React.useMemo(() => {
    const count = (list: readonly SectionResult[]): number =>
      list.reduce((sum, s) => sum + s.questions.length + count(s.children), 0);
    return count(sections);
  }, [sections]);

  const highlight: RowHighlightProps = {
    visibleLevels: filtersState.visibleLevels,
    tierBands: filtersState.tierBands,
    highlightedRows: filtersState.highlightedRows,
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card sm:p-8">
      <div className="sticky top-3 z-30 -mt-6 pt-6 pb-2 sm:-mt-8 sm:pt-8 bg-surface">
        <div className="flex flex-wrap items-center gap-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-text-primary">Detalle por secciones</h3>
            <Badge variant="neutral" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
              {totalQuestions}
            </Badge>
          </div>
          <div className="flex items-center justify-end gap-3 ml-auto">
            <ResultsFilterControls
              segments={segments}
              activeSegment={activeSegment}
              onSegmentChange={filtersState.handleSegmentChange}
              filterableSegments={segments}
              filters={filtersState.filters}
              onApplyFilter={filtersState.applyFilter}
              onClearFilters={filtersState.clearFilters}
              visibleLevels={filtersState.visibleLevels}
              hasHiddenLevels={filtersState.hasHiddenLevels}
              onToggleLevel={filtersState.toggleLevel}
              onResetLevels={filtersState.resetLevels}
              highlightBands={filtersState.tierBands}
              hasHiddenBands={filtersState.hasHiddenTierBands}
              onToggleBand={filtersState.toggleTierBand}
              onResetBands={filtersState.resetTierBands}
              highlightScale={THREE_TIER_HIGHLIGHT}
              showViewBy={false}
            />
            <ResultsSubTabSwitch value="questions" onChange={onSubTabChange} />
            <MeasurementScaleButton
              items={THREE_TIER_FAVORABILITY_LEGEND}
              title="Escala de favorabilidad"
              description="Cada respuesta en escala 1 a 5 cae en uno de estos tres bloques, y el porcentaje se calcula sobre el total de respuestas en escala de la pregunta. Los NS/NR quedan fuera de ese total y se cuentan aparte."
            />
          </div>
        </div>

        <ResultsFilterChips
          filters={filtersState.filters}
          segments={segments}
          onRemoveFilter={filtersState.removeFilter}
          onClearFilters={filtersState.clearFilters}
        />
      </div>

      <div className="flex flex-col gap-4">
        {sections.length === 0 ? (
          <div className="rounded-xl border border-border/60">
            <div className="p-8">
              <EmptyState
                icon={MessageSquareText}
                title="Sin secciones con resultados"
                description="Las secciones de esta encuesta no tienen resultados en la escala de 1 a 5."
                className="border-none bg-transparent shadow-none"
              />
            </div>
          </div>
        ) : (
          sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              isOpen={openSection === section.id}
              onToggle={() =>
                setOpenSection((current) =>
                  current === section.id ? undefined : section.id
                )
              }
              highlight={highlight}
            />
          ))
        )}
      </div>
    </div>
  );
}


/** A muted dash where a level's number would be — the row and its nesting
 * stay, the value doesn't, same as a hidden level's cell in the heatmap. */
function HiddenLevelValue() {
  return (
    <span
      className="inline-flex h-5 items-center px-1.5 text-[12px] font-medium leading-none text-muted-foreground/40"
      title="Total oculto: este nivel está desmarcado en Niveles"
    >
      —
    </span>
  );
}

/**
 * A root section as the builder's own card: solid number badge, depth label and
 * title in a generous header, and the subsection outline below. Only one root
 * card is open at a time, so a section is one screen, not a column.
 */
function SectionBlock({
  section,
  isOpen,
  onToggle,
  highlight,
}: {
  section: SectionResult;
  isOpen: boolean;
  onToggle: () => void;
  highlight: RowHighlightProps;
}) {
  const subSections = section.children.filter(hasContent);
  const questionCount = countQuestions(section);

  const levelHidden = !highlight.visibleLevels.has("section");
  const isHighlighted = highlight.highlightedRows.has(section.id);
  const rowDimmed = highlight.highlightedRows.size > 0 && !isHighlighted;
  const tier = section.n > 0 ? tierForScore(section.score) : null;
  const bandDimmed = tier !== null && !highlight.tierBands.has(tier.id);

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface",
      )}
    >
      {/* Card header: with contrast background since the parent card is white */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Contraer ${section.title}` : `Expandir ${section.title}`}
        className={cn(
          "group flex items-start gap-3.5 px-6 py-5 bg-muted/40 transition-colors hover:bg-muted/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          isOpen && ["border-b", SECTION_HEADER_DIVIDER]
        )}
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/50 transition-colors group-hover:text-text-primary group-hover:bg-border/40">
          <ChevronUp
            className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")}
            strokeWidth={2.5}
          />
        </div>

        {/* Same badge as the heatmap's root section number — same tab family, same mark. */}
        <span
          aria-hidden
          className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-muted/60 border border-border/60 px-1 text-[10px] font-bold tabular-nums text-muted-foreground"
        >
          {section.numbering}
        </span>

        <div className={cn("min-w-0 flex-1", rowDimmed && "opacity-55")}>
          <p className="px-1 py-0.5 text-[14px] font-bold tracking-tight text-text-primary flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {section.title}
            <span className="text-[12px] font-medium text-muted-foreground tracking-normal">
              {questionCount} preguntas
              {subSections.length > 0 ? ` · ${subSections.length} subsecciones` : ""}
            </span>
          </p>
        </div>

        <div
          className="shrink-0 pt-0.5 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {levelHidden ? (
            <HiddenLevelValue />
          ) : section.n > 0 ? (
            <SectionFavorability
              section={section}
              dimmed={rowDimmed || bandDimmed}
              activeGroups={highlight.tierBands}
            />
          ) : (
            <div className="pt-1">
              <NoScaleBadge />
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="flex min-h-0 flex-col gap-4 px-6 py-5 animate-in fade-in slide-in-from-top-1 duration-300">
          {section.questions.length > 0 && (
            <QuestionTable questions={section.questions} highlight={highlight} />
          )}
          {subSections.length > 0 && (
            <SubsectionOutline sections={subSections} highlight={highlight} />
          )}
        </div>
      )}
    </section>
  );
}



/** La favorabilidad de una sección con el color de su veredicto. */
function FavorabilityValue({
  value,
  labeled,
  dimmed,
}: {
  value: number;
  labeled?: boolean;
  dimmed?: boolean;
}) {
  const isPositive = value >= FAVORABILITY_TARGET;
  const isWarning = value >= FAVORABILITY_FLOOR && value < FAVORABILITY_TARGET;

  const bgColor = isPositive ? POSITIVE_BG : isWarning ? YELLOW_BG : NEGATIVE_BG;
  const textColor = isPositive ? POSITIVE_TEXT : isWarning ? YELLOW_TEXT : NEGATIVE_TEXT;
  const borderColor = isPositive ? POSITIVE : isWarning ? YELLOW : NEGATIVE;

  return (
    <span className={cn("flex items-center gap-1.5", dimmed && "opacity-45 grayscale")}>
      {labeled && (
        <span className="text-[11px] font-semibold text-muted-foreground">
          Favorabilidad:
        </span>
      )}
      <div
        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums border"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: borderColor
        }}
      >
        {formatPercent(value)}
      </div>
    </span>
  );
}

/**
 * A root section's favorability value plus the distribution tooltip that
 * explains what the percentage means.
 */
function SectionFavorability({
  section,
  dimmed,
  activeGroups,
}: {
  section: SectionResult;
  dimmed?: boolean;
  activeGroups?: ReadonlySet<string>;
}) {
  const groups = favorabilityGroups(pooledDistribution(section), section.nsnr);

  return (
    <FavorabilityWithBreakdown groups={groups} activeGroups={activeGroups}>
      <FavorabilityValue value={section.favorability} labeled dimmed={dimmed} />
    </FavorabilityWithBreakdown>
  );
}

/**
 * A question's favorability value plus the same distribution tooltip the
 * section headers use — the reader shouldn't have to guess what a single
 * percentage is built from at any level of the report.
 */
function QuestionFavorability({ question, dimmed }: { question: QuestionResult; dimmed?: boolean }) {
  return (
    <FavorabilityValue value={question.favorability ?? 0} dimmed={dimmed} />
  );
}

/**
 * Las subsecciones de una sección como el outline del builder: cada una una
 * fila con su chip de nivel y, al abrirse, un riel vertical que sostiene sus
 * preguntas y sus propias subsecciones. Sin cajas anidadas — la profundidad la
 * lee la sangría y el peso del chip.
 */
function SubsectionOutline({
  sections,
  highlight,
}: {
  sections: readonly SectionResult[];
  highlight: RowHighlightProps;
}) {
  return (
    <ul className={cn("flex flex-col", SIBLING_DIVIDER)}>
      {sections.map((section, index) => (
        <SubsectionBlock
          key={section.id}
          section={section}
          defaultOpen={index === 0}
          highlight={highlight}
        />
      ))}
    </ul>
  );
}

function SubsectionBlock({
  section,
  defaultOpen,
  highlight,
}: {
  section: SectionResult;
  defaultOpen?: boolean;
  highlight: RowHighlightProps;
}) {
  const [expanded, setExpanded] = React.useState(defaultOpen ?? false);
  const subSections = section.children.filter(hasContent);
  const theme = depthTheme(section.depth);

  const level = levelForDepth(section.depth);
  const levelHidden = !highlight.visibleLevels.has(level);
  const isHighlighted = highlight.highlightedRows.has(section.id);
  const rowDimmed = highlight.highlightedRows.size > 0 && !isHighlighted;
  const tier = section.n > 0 ? tierForScore(section.score) : null;
  const bandDimmed = tier !== null && !highlight.tierBands.has(tier.id);

  return (
    <li>
      {/* Header row: the same outline entry the builder draws — chevron, level
          chip, then the row's own questions and subsections under a rail. */}
      <div
        onClick={() => setExpanded((current) => !current)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((current) => !current);
          }
        }}
        aria-expanded={expanded}
        aria-label={expanded ? `Contraer ${section.title}` : `Expandir ${section.title}`}
        className="-mx-2 flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-muted/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 group"
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors group-hover:text-text-primary group-hover:bg-border/40">
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-90")}
            strokeWidth={2.5}
          />
        </div>

        {/* Numbering badge beside the name, colored by depth — same family as
            the root section's number mark, no "Subsección" label repeated. */}
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums transition-colors group-hover:border-border",
            theme.chip
          )}
        >
          {section.numbering}
        </span>

        <div className={cn("min-w-0 flex-1", rowDimmed && "opacity-55")}>
          <p
            className={cn(
              "-ml-1 px-1 py-0.5 w-full rounded-md font-bold tracking-tight text-text-primary flex flex-wrap items-baseline gap-x-2 gap-y-1",
              theme.title
            )}
          >
            {section.title}
            <span className="text-[11px] font-medium text-muted-foreground tracking-normal">
              {section.questions.length} preguntas
              {subSections.length > 0 ? ` · ${subSections.length} subsecciones` : ""}
            </span>
          </p>
        </div>

        <div
          className="mt-0.5 flex shrink-0 items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {levelHidden ? (
            <HiddenLevelValue />
          ) : section.n > 0 ? (
            <SectionFavorability
              section={section}
              dimmed={rowDimmed || bandDimmed}
              activeGroups={highlight.tierBands}
            />
          ) : (
            <NoScaleBadge />
          )}
        </div>
      </div>

      {/* Content, hanging off a rail that starts under the chevron. */}
      {expanded && (
        <div
          className={cn(
            "mt-2.5 flex flex-col gap-3 pb-1 animate-in fade-in slide-in-from-top-1 duration-200",
            theme.rail,
            theme.railOffset
          )}
        >
          {section.questions.length > 0 && (
            <QuestionTable questions={section.questions} highlight={highlight} />
          )}
          {subSections.length > 0 && (
            <SubsectionOutline sections={subSections} highlight={highlight} />
          )}
        </div>
      )}
    </li>
  );
}

/** Una sección cuenta si tiene preguntas propias o subsecciones con contenido. */
function hasContent(section: SectionResult): boolean {
  return section.questions.length > 0 || section.children.some(hasContent);
}

/** Preguntas propias y de toda su descendencia. */
function countQuestions(section: SectionResult): number {
  return (
    section.questions.length +
    section.children.reduce((sum, child) => sum + countQuestions(child), 0)
  );
}

type SortKey = "label" | "favorability";

/**
 * Las preguntas de una sección como tabla plana: sin caja propia para que no
 * parezca un contenedor dentro de otro; solo cabeceras y filas con divisor.
 */
function QuestionTable({
  questions,
  highlight,
}: {
  questions: readonly QuestionResult[];
  highlight: RowHighlightProps;
}) {
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
  const [ascending, setAscending] = React.useState(true);

  const sorted = React.useMemo(() => {
    if (!sortKey) return questions;
    const direction = ascending ? 1 : -1;
    return [...questions].sort((a, b) => {
      // Unscored questions sink to the bottom no matter the direction.
      const scoredDiff = (b.scored ? 1 : 0) - (a.scored ? 1 : 0);
      if (scoredDiff !== 0) return scoredDiff;
      if (sortKey === "label") return a.statement.localeCompare(b.statement) * direction;
      return ((a.favorability ?? -1) - (b.favorability ?? -1)) * direction;
    });
  }, [questions, sortKey, ascending]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAscending((current) => !current);
    else {
      setSortKey(key);
      // Ascending = worst first for the numbers, A–Z for the label.
      setAscending(true);
    }
  };

  const levelHidden = !highlight.visibleLevels.has("question");

  return (
    <table className="w-full border-collapse text-left">
      <thead className="bg-muted/30">
        <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          <th className="w-10 px-4 py-2.5 text-center">#</th>
          <th className="py-2.5">
            <ResultsSortHeader
              label="Pregunta"
              sortKey="label"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
          </th>
          <th className="hidden py-2.5 xl:table-cell">
            <FavorabilityBreakdownHeaders className="justify-end pr-6" />
          </th>
          <th className="w-[130px] py-2.5 pr-4 text-right">
            <ResultsSortHeader
              label="Favorabilidad"
              sortKey="favorability"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
              className="justify-end"
            />
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/25">
        {sorted.map((question, index) => {
          const isHighlighted = highlight.highlightedRows.has(question.id);
          const rowDimmed = highlight.highlightedRows.size > 0 && !isHighlighted;
          const tier =
            question.scored && question.score !== null ? tierForScore(question.score) : null;
          const bandDimmed = tier !== null && !highlight.tierBands.has(tier.id);

          return (
            <tr key={question.id} className="group transition-colors hover:bg-muted/30">
              <td className="px-4 py-3 text-center text-[11px] font-extrabold tabular-nums text-muted-foreground">
                {index + 1}
              </td>
              <td
                className={cn(
                  "py-3 pr-4 text-[13px] font-semibold leading-snug text-text-primary",
                  rowDimmed && "opacity-55"
                )}
              >
                {question.statement || "Pregunta sin enunciado"}
              </td>
              <td className="hidden py-3 xl:table-cell">
                {question.scored && question.distribution && !levelHidden ? (
                  <FavorabilityBreakdownDots
                    groups={favorabilityGroups(question.distribution, question.nsnr)}
                    activeGroups={highlight.tierBands}
                    className={cn(
                      "justify-end pr-6",
                      (rowDimmed || bandDimmed) && "opacity-45 grayscale"
                    )}
                  />
                ) : null}
              </td>
              <td className="py-3 pr-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {levelHidden ? (
                    <HiddenLevelValue />
                  ) : question.scored && question.favorability !== null ? (
                    <QuestionFavorability question={question} dimmed={rowDimmed || bandDimmed} />
                  ) : (
                    <NoScaleBadge />
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * A section or question with nothing on the 1–5 scale.
 *
 * "Recomendabilidad" holds only the NPS question and "Comentarios abiertos" only
 * open text. Showing them at 0% would read as the worst result in the survey
 * instead of as no result, so they say what they are.
 */
function NoScaleBadge() {
  return (
    <Badge variant="neutral" className="gap-1.5 whitespace-nowrap">
      <MessageSquareText className="h-3 w-3" strokeWidth={2} />
      Sin escala
    </Badge>
  );
}

