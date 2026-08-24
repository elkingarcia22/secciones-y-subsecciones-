import * as React from "react";
import {
  ChevronRight,
  ChevronUp,
  Gauge,
  TrendingUp,
  Minus,
  TrendingDown,
  Lock,
  LayoutGrid,
  List,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback";
import type {
  NpsBand, NpsSectionDetail, NpsSegmentCell, NpsSegmentData, NpsSegmentRow,
  SegmentDefinition, SegmentFilter, SurveyResults,
} from "@/mocks/surveyResults";
import { npsBySection, npsBySegmentData } from "@/mocks/surveyResults";
import { depthTheme, SECTION_HEADER_DIVIDER, SIBLING_DIVIDER } from "@/components/survey-builder/depthTheme";
import { MiniMetricCard, AnimatedNumber } from "./MiniMetricCard";
import { FormulaBlock } from "./FormulaBlock";
import {
  POSITIVE_TEXT,
  YELLOW_TEXT,
  NEGATIVE_TEXT,
  NPS_SCORE_LEGEND,
  NPS_SCORE_BANDS,
  npsBandForScore,
} from "./favorabilityScale";
import { type ResultLevel } from "./resultLevels";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import {
  ResultsFilterChips,
  ResultsFilterControls,
  type HighlightScale,
} from "./ResultsFilterToolbar";
import { useResultsFilters } from "./useResultsFilters";

/** Stable identity: the hook keys its reset on this list. */
const NPS_BAND_IDS = NPS_SCORE_BANDS.map((band) => band.id);

const NPS_HIGHLIGHT: HighlightScale = {
  title: "Resaltar por eNPS",
  description:
    "Desmarca una banda para atenuar las secciones y preguntas cuyo eNPS cae en ella; lo marcado mantiene su color.",
  bands: NPS_SCORE_BANDS.map((band) => ({
    id: band.id,
    label: band.label,
    range: band.range,
    palette: {
      color: band.color,
      background: band.background,
      border: band.border,
      foreground: band.foreground,
    },
  })),
};

type NpsView = "dimensions" | "segment";

function npsScoreColor(score: number): { bg: string; text: string; border: string } {
  const band = npsBandForScore(score);
  return { bg: band.background, text: band.foreground, border: band.border };
}

function NpsScoreValue({ score, n, className, dimmed, labeled }: { score: number; n?: number; className?: string; dimmed?: boolean; labeled?: boolean }) {
  const color = npsScoreColor(score);
  
  const content = (
    <span className={cn("flex items-center gap-1.5", dimmed && "opacity-45 grayscale", className)}>
      {labeled && (
        <span className="text-[11px] font-semibold text-muted-foreground">
          eNPS:
        </span>
      )}
      <div
        className={cn(
          "inline-flex items-center justify-center min-w-[2.5rem] rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums border shrink-0",
          n !== undefined && "cursor-default"
        )}
        style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
      >
        {score > 0 ? "+" : ""}{String(Math.round(score))}
      </div>
    </span>
  );

  if (n !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px] font-medium px-2.5 py-1 z-[100]">
          Puntaje eNPS · {formatCount(n)} respuestas
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function formatCount(n: number) {
  return new Intl.NumberFormat("es-CO").format(Math.round(n));
}

function NpsScoreWithTooltip({ score, promoters, passives, detractors, n, dimmed, labeled, expandable, compact, className }: { score: number; promoters: number; passives: number; detractors: number; n: number; dimmed?: boolean; labeled?: boolean; expandable?: boolean; compact?: boolean; className?: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const segments = [
    { label: "Promotores", value: promoters, color: "#22c55e", border: "#bbf7d0" },
    { label: "Neutros", value: passives, color: "#facc15", border: "#fef08a" },
    { label: "Detractores", value: detractors, color: "#ef4444", border: "#fecaca" },
  ];

  return (
    <div className={cn("group/score flex shrink-0 items-center pt-1", className)}>
      {expandable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={cn(
            "mr-3 flex h-6 items-center rounded-md border border-border/50 bg-secondary/50 px-2.5 text-[10px] font-medium text-secondary-foreground transition-all hover:bg-secondary",
            expanded ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover/score:opacity-100"
          )}
        >
          {expanded ? "Ocultar" : "Detalles"}
        </button>
      )}

      <div
        className={cn(
          "flex items-center transition-all duration-300 ease-in-out",
          compact ? "gap-2 mr-4" : "gap-4 mr-8",
          expandable && !expanded ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
        )}
      >
        {segments.map((segment) => {
          const percentage = n > 0 ? Math.round((segment.value / n) * 100) : 0;
          return (
            <Tooltip key={segment.label}>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center py-[3px] text-[11.5px] font-medium tabular-nums text-text-primary shrink-0 cursor-default",
                  compact ? "gap-1.5" : "w-[84px] gap-2 justify-end"
                )}>
                  <div
                    className={cn("rounded-full shrink-0", compact ? "h-1.5 w-1.5" : "h-2 w-2")}
                    style={{ backgroundColor: segment.color }}
                  />
                  <span>{percentage}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px] font-medium px-2.5 py-1 z-[100]">
                {segment.label} · {formatCount(segment.value)} respuestas
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <NpsScoreValue score={score} n={n} labeled={labeled} dimmed={dimmed} />
    </div>
  );
}

// ─── View 1: Dimensions (section blocks similar to Favorability) ─────────────

/** True when a result's band is unchecked in "Resaltar": the row stays in
 * place, greyed, so whatever does match keeps its colour and stands out. */
function isBandDimmed(score: number, highlightBands: ReadonlySet<string>): boolean {
  return !highlightBands.has(npsBandForScore(score).id);
}

/** A muted dash where a level's number would be — the row and its nesting stay,
 * the value doesn't, same as a hidden level in Favorabilidad and el heatmap. */
function NpsHiddenLevelValue() {
  return (
    <span
      className="inline-flex h-5 items-center px-1.5 text-[12px] font-medium leading-none text-muted-foreground/40"
      title="Total oculto: este nivel está desmarcado en Vista"
    >
      —
    </span>
  );
}

function NpsQuestionTable({
  questions,
  visibleLevels,
  highlightBands,
}: {
  questions: readonly NpsSectionDetail["questions"][number][];
  visibleLevels: ReadonlySet<ResultLevel>;
  highlightBands: ReadonlySet<string>;
}) {
  const levelHidden = !visibleLevels.has("question");

  return (
    <div className="w-full">
      <div className="flex items-end justify-between px-2 pb-1.5 border-b border-border/40">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pregunta</span>
        <div className="flex items-center">
          <div className="flex items-center gap-4 mr-[32px]">
            <span className="w-[84px] text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Promotores</span>
            <span className="w-[84px] text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Neutros</span>
            <span className="w-[84px] text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detractores</span>
          </div>
          <span className="w-10 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">eNPS</span>
        </div>
      </div>
      <ul className="flex flex-col">
        {questions.map((q) => (
          <li key={q.id} className="group flex items-center justify-between gap-6 py-2 px-2 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
            <span className="text-[12.5px] text-text-secondary max-w-[500px] leading-relaxed">{q.text}</span>
            <div className="flex items-center gap-6 shrink-0">
              {levelHidden ? <NpsHiddenLevelValue /> : <NpsScoreWithTooltip score={q.score} promoters={q.promoters} passives={q.passives} detractors={q.detractors} n={q.n} dimmed={isBandDimmed(q.score, highlightBands)} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function countQuestions(section: NpsSectionDetail): number {
  return (
    section.questions.length +
    section.children.reduce((sum, child) => sum + countQuestions(child), 0)
  );
}

function NpsSubsectionRow({ section, depth, visibleLevels, highlightBands, defaultOpen }: { section: NpsSectionDetail; depth: number; visibleLevels: ReadonlySet<ResultLevel>; highlightBands: ReadonlySet<string>; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = React.useState(defaultOpen ?? false);
  const theme = depthTheme(depth);
  const questionCount = countQuestions(section);
  
  const levelId = depth === 2 ? "subsection2" : "subsection3";
  const levelHidden = !visibleLevels.has(levelId);

  return (
    <li>
      <div
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(v => !v);
          }
        }}
        aria-expanded={expanded}
        className="-mx-2 flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-muted/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 group"
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors group-hover:text-text-primary group-hover:bg-border/40">
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-90")}
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
          <p className={cn("-ml-1 px-1 py-0.5 w-full rounded-md font-bold tracking-tight text-text-primary flex flex-wrap items-baseline gap-x-2 gap-y-1", theme.title)}>
            {section.title}
            <span className="text-[11px] font-medium text-muted-foreground tracking-normal">
              {questionCount} preguntas
              {section.children.length > 0 ? ` · ${section.children.length} subsecciones` : ""}
            </span>
          </p>
        </div>
        <div
          className="mt-0.5 flex shrink-0 items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {!levelHidden && <NpsScoreWithTooltip score={section.score} promoters={section.promoters} passives={section.passives} detractors={section.detractors} n={section.n} labeled expandable={true} compact={true} dimmed={isBandDimmed(section.score, highlightBands)} />}
        </div>
      </div>
      {expanded && (
        <div className={cn("mt-2.5 flex flex-col gap-3 pb-1 animate-in fade-in slide-in-from-top-1 duration-200", theme.rail, theme.railOffset)}>
          {section.questions.length > 0 && <NpsQuestionTable questions={section.questions} visibleLevels={visibleLevels} highlightBands={highlightBands} />}
          {section.children.length > 0 && <NpsSubsectionOutline sections={section.children} depth={depth + 1} visibleLevels={visibleLevels} highlightBands={highlightBands} />}
        </div>
      )}
    </li>
  );
}

function NpsSubsectionOutline({ sections, depth, visibleLevels, highlightBands }: { sections: readonly NpsSectionDetail[]; depth: number; visibleLevels: ReadonlySet<ResultLevel>; highlightBands: ReadonlySet<string> }) {
  return (
    <ul className={cn("flex flex-col", SIBLING_DIVIDER)}>
      {sections.map((sec, index) => (
        <NpsSubsectionRow key={sec.id} section={sec} depth={depth} visibleLevels={visibleLevels} highlightBands={highlightBands} defaultOpen={index === 0} />
      ))}
    </ul>
  );
}

function NpsSectionRoot({ section, isOpen, onToggle, visibleLevels, highlightBands }: { section: NpsSectionDetail; isOpen: boolean; onToggle: () => void; visibleLevels: ReadonlySet<ResultLevel>; highlightBands: ReadonlySet<string> }) {
  const questionCount = countQuestions(section);
  const levelHidden = !visibleLevels.has("section");

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface">
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
        <span
          aria-hidden
          className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-muted/60 border border-border/50 px-1 text-[10px] font-bold tabular-nums text-muted-foreground"
        >
          {section.numbering}
        </span>
        <div className="min-w-0 flex-1">
          <p className="px-1 py-0.5 w-full rounded-md font-bold tracking-tight text-text-primary flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px]">
            {section.title}
            <span className="text-[12px] font-medium text-muted-foreground tracking-normal">
              {questionCount} preguntas
              {section.children.length > 0 ? ` · ${section.children.length} subsecciones` : ""}
            </span>
          </p>
        </div>
        <div
          className="shrink-0 pt-0.5 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {!levelHidden && <NpsScoreWithTooltip score={section.score} promoters={section.promoters} passives={section.passives} detractors={section.detractors} n={section.n} labeled expandable={true} compact={true} dimmed={isBandDimmed(section.score, highlightBands)} />}
        </div>
      </div>
      
      {isOpen && (
        <div className="flex min-h-0 flex-col gap-4 px-6 py-5 animate-in fade-in slide-in-from-top-1 duration-300">
          {section.questions.length > 0 && <NpsQuestionTable questions={section.questions} visibleLevels={visibleLevels} highlightBands={highlightBands} />}
          {section.children.length > 0 && <NpsSubsectionOutline sections={section.children} depth={2} visibleLevels={visibleLevels} highlightBands={highlightBands} />}
        </div>
      )}
    </section>
  );
}

function DimensionsView({ results, filters, visibleLevels, highlightBands }: {
  results: SurveyResults;
  filters: readonly SegmentFilter[];
  visibleLevels: ReadonlySet<ResultLevel>;
  highlightBands: ReadonlySet<string>;
}) {
  const sections = React.useMemo(() => npsBySection(results, filters), [results, filters]);

  const [openSection, setOpenSection] = React.useState<string | undefined>(sections[0]?.id);

  if (sections.length === 0) {
    return <EmptyState icon={LayoutGrid} title="No hay datos" description="Prueba cambiando los filtros" />;
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      {sections.map((section) => (
        <NpsSectionRoot 
          key={section.id} 
          section={section} 
          isOpen={openSection === section.id} 
          onToggle={() => setOpenSection(curr => curr === section.id ? undefined : section.id)}
          visibleLevels={visibleLevels}
          highlightBands={highlightBands}
        />
      ))}
    </div>
  );
}

// ─── View 2: Segment Cards ───────────────────────────────────────────────────

function SegmentCardRowRecursive({ row, columnIndex, visibleLevels, highlightBands, depth = 1 }: { row: NpsSegmentRow, columnIndex: number, visibleLevels: ReadonlySet<ResultLevel>, highlightBands: ReadonlySet<string>, depth?: number }) {
  const levelId = depth === 1 ? "section" : depth === 2 ? "subsection2" : depth === 3 ? "subsection3" : "question";
  const levelHidden = !visibleLevels.has(levelId);
  const cell = row.cells[columnIndex];

  return (
    <React.Fragment>
      <div 
        className={cn(
          "flex items-center justify-between gap-3",
          depth === 1 ? "mt-2 first:mt-0" : "mt-0.5"
        )}
      >
        <div className="flex items-center min-w-0 flex-1" style={{ paddingLeft: `${(depth - 1) * 14}px` }}>
          {depth > 1 && (
            <div className="mr-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/30" />
          )}
          <span className={cn(
            "truncate",
            depth === 1 ? "text-[12.5px] font-bold text-text-primary" : "text-[11.5px] text-text-secondary"
          )}>
            {row.title}
          </span>
        </div>
        
        <div className="shrink-0 flex items-center justify-end">
          {levelHidden ? (
            <NpsHiddenLevelValue />
          ) : cell && !cell.belowThreshold ? (
            <NpsScoreValue score={cell.score} n={cell.n} className="w-10 justify-center" dimmed={isBandDimmed(cell.score, highlightBands)} />
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
      </div>
      {row.children?.map((child) => (
        <SegmentCardRowRecursive key={child.id} row={child} columnIndex={columnIndex} visibleLevels={visibleLevels} highlightBands={highlightBands} depth={depth + 1} />
      ))}
    </React.Fragment>
  );
}

function SegmentCard({ column, totalCell, sectionRows, visibleLevels, highlightBands }: { column: any, totalCell: NpsSegmentCell | null, sectionRows: readonly NpsSegmentRow[], visibleLevels: ReadonlySet<ResultLevel>, highlightBands: ReadonlySet<string> }) {
  if (!totalCell || totalCell.belowThreshold) {
    return (
      <div className="rounded-xl border border-border/50 bg-surface shadow-sm overflow-hidden flex flex-col opacity-60">
        <div className="p-4 border-b border-border/40 bg-muted/10 flex items-center justify-between">
          <h4 className="font-bold text-text-primary text-[14px]">{column.label}</h4>
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-[12px] text-muted-foreground">Menos de 3 respuestas</p>
          <p className="text-[11px] text-muted-foreground/70">Datos ocultos por anonimato</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-surface shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold text-text-primary text-[14px] truncate" title={column.label}>{column.label}</h4>
          <NpsScoreWithTooltip score={totalCell.score} promoters={totalCell.promoters} passives={totalCell.passives} detractors={totalCell.detractors} n={totalCell.n} compact dimmed={isBandDimmed(totalCell.score, highlightBands)} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-wide">Desglose por sección</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] font-medium text-muted-foreground cursor-default">
                {formatCount(totalCell.n)} respuestas
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px] font-medium px-2.5 py-1 z-[100]">
              Número total de respuestas
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-col gap-2.5">
          {sectionRows.map((sec) => (
            <SegmentCardRowRecursive
              key={sec.id}
              row={sec}
              columnIndex={column.index}
              visibleLevels={visibleLevels}
              highlightBands={highlightBands}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentView({ results, activeSegment, filters, visibleLevels, highlightBands }: {
  results: SurveyResults;
  activeSegment: SegmentDefinition;
  filters: readonly SegmentFilter[];
  visibleLevels: ReadonlySet<ResultLevel>;
  highlightBands: ReadonlySet<string>;
}) {
  const data: NpsSegmentData = React.useMemo(
    () => npsBySegmentData(results, activeSegment, filters),
    [results, activeSegment, filters]
  );

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {data.columns.map((col, index) => (
          <SegmentCard 
            key={col.id} 
            column={{...col, index}} 
            totalCell={data.totalRow.cells[index]} 
            sectionRows={data.sectionRows} 
            visibleLevels={visibleLevels}
            highlightBands={highlightBands}
          />
        ))}
      </div>
    </div>
  );
}

// ─── View toggle ─────────────────────────────────────────────────────────────

function NpsViewSwitch({ value, onChange }: { value: NpsView; onChange: (v: NpsView) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as NpsView)} className="w-auto shrink-0">
      <TabsList className="h-9 bg-muted/60 p-1">
        <TabsTrigger value="dimensions"
          className="flex h-full items-center gap-2 rounded-md px-3 py-0 text-[13px] font-medium transition-all data-[state=active]:bg-surface data-[state=active]:text-brand data-[state=active]:shadow-sm text-muted-foreground hover:text-text-primary">
          <List className="h-3.5 w-3.5" />
          Secciones
        </TabsTrigger>
        <TabsTrigger value="segment"
          className="flex h-full items-center gap-2 rounded-md px-3 py-0 text-[13px] font-medium transition-all data-[state=active]:bg-surface data-[state=active]:text-brand data-[state=active]:shadow-sm text-muted-foreground hover:text-text-primary">
          <LayoutGrid className="h-3.5 w-3.5" />
          Por segmento
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

// ─── NpsTab ──────────────────────────────────────────────────────────────────

interface NpsTabProps {
  results: SurveyResults;
}

export function NpsTab({ results }: NpsTabProps) {
  const segments = results.segments;
  const gridSegments = segments.filter((s) => !s.perPerson);

  const [view, setView] = React.useState<NpsView>("dimensions");
  const [segmentKey, setSegmentKey] = React.useState<string>(gridSegments[0]?.key ?? "");
  const activeSegment = gridSegments.find((s) => s.key === segmentKey) ?? gridSegments[0];

  // The same state Favorabilidad runs on — "Filtros", "Niveles" y "Resaltar" —
  // reading the eNPS score bands instead of the 1–5 ones.
  const filtersState = useResultsFilters(activeSegment, gridSegments, setSegmentKey, NPS_BAND_IDS);

  // Con un desglose activo, filtrar por esa misma demográfica no dice nada: ya
  // son las columnas. Sin desglose, todas sirven.
  const filterableSegments =
    view === "segment" && activeSegment
      ? gridSegments.filter((s) => s.key !== activeSegment.key)
      : gridSegments;

  if (!results.nps) {
    return (
      <EmptyState icon={Gauge} title="Esta encuesta no midio recomendabilidad"
        description="El eNPS aparece cuando la encuesta incluye una pregunta de tipo NPS. Puedes aniadirla en la siguiente medicion." />
    );
  }

  const { nps } = results;
  const counts: Record<NpsBand, number> = { detractor: nps.detractors, passive: nps.passives, promoter: nps.promoters };

  const dimensionsData = React.useMemo(() => npsBySection(results, filtersState.filters), [results, filtersState.filters]);
  const totalQuestions = React.useMemo(() => {
    const count = (list: readonly NpsSectionDetail[]): number =>
      list.reduce((sum, s) => sum + s.questions.length + count(s.children), 0);
    return count(dimensionsData);
  }, [dimensionsData]);

  const segmentData = React.useMemo(
    () => activeSegment ? npsBySegmentData(results, activeSegment, filtersState.filters) : null,
    [results, activeSegment, filtersState.filters]
  );
  const totalSegments = segmentData?.columns.length ?? 0;

  return (
    // `p-6 sm:p-8` and `gap-6` are the frame Participación sets and every other
    // tab repeats. eNPS was the one running edge to edge on the screen's own
    // padding, which made its cards both wider and higher than the rest.
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      {/* Bare on the page, like the KPI row of every other tab: boxing it in a
          second card was what set eNPS apart, and what pushed the detail below
          it further down than anywhere else. */}
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniMetricCard 
          icon={Gauge} 
          label="Puntaje eNPS" 
          value={<AnimatedNumber value={nps.score} format={(v) => (v > 0 ? "+" : "") + Math.round(v).toString() + " eNPS"} />}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] p-4 bg-slate-900 text-slate-100 shadow-xl border-none">
                <div className="flex flex-col gap-3 items-start leading-relaxed">
                  <p className="text-[12px]"><strong>Puntaje eNPS:</strong><br/>La fórmula del eNPS resta el porcentaje de detractores al de promotores.</p>
                  <div className="flex w-full flex-col gap-1 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Fórmula</span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-[13px]">{Math.round((counts.promoter / nps.n) * 100)}% Promotores</span>
                      <span className="text-[13px] font-semibold opacity-80">−</span>
                      <span className="font-semibold text-[13px]">{Math.round((counts.detractor / nps.n) * 100)}% Detractores</span>
                      <span className="text-[13px] font-semibold opacity-80">=</span>
                      <span className="font-semibold text-[13px]">{nps.score > 0 ? "+" : ""}{nps.score} eNPS</span>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </MiniMetricCard>
        <MiniMetricCard icon={TrendingUp} label="Promotores" value={<AnimatedNumber value={nps.n > 0 ? (counts.promoter / nps.n) * 100 : 0} format={(v) => Math.round(v).toString() + "%"} />} color={POSITIVE_TEXT} />
        <MiniMetricCard icon={Minus} label="Neutros" value={<AnimatedNumber value={nps.n > 0 ? (counts.passive / nps.n) * 100 : 0} format={(v) => Math.round(v).toString() + "%"} />} color={YELLOW_TEXT} />
        <MiniMetricCard icon={TrendingDown} label="Detractores" value={<AnimatedNumber value={nps.n > 0 ? (counts.detractor / nps.n) * 100 : 0} format={(v) => Math.round(v).toString() + "%"} />} color={NEGATIVE_TEXT} />
      </div>

      <div className="rounded-2xl border border-border/50 bg-surface p-6 shadow-sm sm:p-8">
        <div className="sticky top-4 z-30 -mt-6 pt-6 pb-2 sm:-mt-8 sm:pt-8 bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-text-primary">
                {view === "dimensions" ? "Detalle por secciones eNPS" : "eNPS por segmento demografico"}
              </h3>
              <Badge variant="neutral" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
                {view === "dimensions" ? totalQuestions : totalSegments}
              </Badge>
            </div>
            
            <div className="flex items-center justify-end gap-3 ml-auto">
              {activeSegment && (
                <ResultsFilterControls
                  segments={gridSegments}
                  activeSegment={activeSegment}
                  onSegmentChange={filtersState.handleSegmentChange}
                  filterableSegments={filterableSegments}
                  filters={filtersState.filters}
                  onApplyFilter={filtersState.applyFilter}
                  onClearFilters={filtersState.clearFilters}
                  visibleLevels={filtersState.visibleLevels}
                  hasHiddenLevels={filtersState.hasHiddenLevels}
                  onToggleLevel={filtersState.toggleLevel}
                  onResetLevels={filtersState.resetLevels}
                  highlightBands={filtersState.highlightBands}
                  hasHiddenBands={filtersState.hasHiddenBands}
                  onToggleBand={filtersState.toggleBand}
                  onResetBands={filtersState.resetBands}
                  showViewBy={view === "segment"}
                  highlightScale={NPS_HIGHLIGHT}
                  hiddenLevelOptions={view === "segment" ? ["question"] : []}
                />
              )}
              <NpsViewSwitch value={view} onChange={setView} />
              <MeasurementScaleButton 
                items={NPS_SCORE_LEGEND} 
                description="El puntaje eNPS es un índice que va de -100 a +100. Un puntaje positivo indica que hay más promotores que detractores."
              />
            </div>
          </div>

          <ResultsFilterChips
            filters={filtersState.filters}
            segments={gridSegments}
            onRemoveFilter={filtersState.removeFilter}
            onClearFilters={filtersState.clearFilters}
          />
        </div>

        {view === "dimensions" ? (
          <DimensionsView
            results={results}
            filters={filtersState.filters}
            visibleLevels={filtersState.visibleLevels}
            highlightBands={filtersState.highlightBands}
          />
        ) : activeSegment ? (
          <SegmentView
            results={results}
            activeSegment={activeSegment}
            filters={filtersState.filters}
            visibleLevels={filtersState.visibleLevels}
            highlightBands={filtersState.highlightBands}
          />
        ) : null}
      </div>
    </div>
  );
}
