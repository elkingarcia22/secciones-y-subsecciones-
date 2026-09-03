import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronUp, Gauge, Lock, LayoutGrid, List, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback";
import type {
 NpsBand, NpsSectionDetail, NpsSegmentCell, NpsSegmentData, NpsSegmentRow,
 SegmentDefinition, SegmentFilter, SurveyResults,
} from "@/mocks/surveyResults";
import { npsBySection, npsBySegmentData } from "@/mocks/surveyResults";
import { npsDepthBySection, npsDepthTotals } from "@/mocks/npsDepth";
import type { SurveyDraft } from "@/components/survey-builder";
import { NpsDepthView } from "./NpsDepthView";
import { depthTheme, SECTION_HEADER_DIVIDER, SIBLING_DIVIDER } from "@/components/survey-builder/depthTheme";
import { deriveTrendSeries } from "./deriveTrend";
import { MetricReadingBadge, MetricSummaryCard } from "./MetricSummaryCard";
import { Sparkline } from "@/components/survey-analytics/pulseCharts";
import { NPS_SCORE_LEGEND, NPS_SCORE_BANDS, npsBandForScore, toneForNps, ACCENT_CLASS_BY_TONE, POSITIVE, YELLOW, NEGATIVE, type MetricTone } from "./favorabilityScale";
import { type ResultLevel } from "./resultLevels";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import { ResultsFilterChips, ResultsFilterControls, type HighlightScale } from "./ResultsFilterToolbar";
import { useResultsFilters } from "./useResultsFilters";
import { cascadeContainer, cascadeItem, cascadeItemSettleTime, CASCADE_CONTENT_GAP } from "@/lib/cascadeAnimation";

/** Stable identity: the hook keys its reset on this list. */
const NPS_BAND_IDS = NPS_SCORE_BANDS.map((band) => band.id);

/** The plain-language reading beside the big eNPS score. */
const NPS_READING: Readonly<Record<MetricTone, string>> = {
 positive: "Bueno",
 warning: "Neutro",
 negative: "Crítico",
};

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

type NpsView = "dimensions" | "segment" | "depth";

function npsScoreColor(score: number): { bg: string; text: string; border: string } {
 const band = npsBandForScore(score);
 return { bg: band.background, text: band.foreground, border: band.border };
}

function NpsScoreValue({ score, n, className, dimmed, labeled }: { score: number; n?: number; className?: string; dimmed?: boolean; labeled?: boolean }) {
 const color = npsScoreColor(score);
 
 const content = (
 <motion.span layout="position" className={cn("flex items-center gap-1.5", dimmed && "opacity-45 grayscale", className)}>
 {labeled && (
 <span className="text-[11px] font-semibold text-muted-foreground">
 eNPS:
 </span>
 )}
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className={cn(
 "inline-flex items-center justify-center min-w-[2.5rem] rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums shrink-0",
 n !== undefined && "cursor-default"
 )}
 style={{ backgroundColor: color.bg, color: color.text }}
 >
 {score > 0 ? "+" : ""}{String(Math.round(score))}
 </motion.div>
 </motion.span>
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

function NpsScoreWithTooltip({ score, promoters, passives, detractors, n, dimmed, labeled, expandable, compact, className, activeTiers }: { score: number; promoters: number; passives: number; detractors: number; n: number; dimmed?: boolean; labeled?: boolean; expandable?: boolean; compact?: boolean; className?: string; activeTiers?: ReadonlySet<string>; }) {
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
 "mr-3 flex h-6 items-center rounded-md border border-border/60 bg-secondary/50 px-2.5 text-[10px] font-medium text-secondary-foreground transition-all hover:bg-secondary",
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
 "flex items-center py-[3px] text-[12px] font-medium tabular-nums text-text-primary shrink-0 cursor-default",
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

function isNpsTierDimmed(score: number | null, tierBands: ReadonlySet<string>): boolean {
  if (score === null || tierBands.size === 0) return false;
  const bandId = npsBandForScore(score).id;
  const cardId = bandId === "promotores" ? "promoter" : bandId === "neutros" ? "passive" : "detractor";
  return !tierBands.has(cardId);
}

/** A muted dash where a level's number would be — the row and its nesting stay,
 * the value doesn't, same as a hidden level in Favorabilidad and el heatmap. */
function NpsHiddenLevelValue() {
 return (
 <span
 className="inline-flex h-5 items-center px-1.5 text-[12px] font-medium leading-none text-muted-foreground/40"
 title="Total oculto: este nivel está desmarcado en Personalizar"
 >
 —
 </span>
 );
}

function NpsQuestionTable({
 questions,
 visibleLevels,
 highlightBands,
 tierBands,
 revealDelay = 0,
}: {
 questions: readonly NpsSectionDetail["questions"][number][];
 visibleLevels: ReadonlySet<ResultLevel>;
 highlightBands: ReadonlySet<string>;
tierBands: ReadonlySet<string>;
 /** Delay before this table's rows start cascading in — set by the parent
  * so questions only start once the subsection rows above them are done. */
 revealDelay?: number;
}) {
 const levelHidden = !visibleLevels.has("question");

 return (
 <div className="w-full">
 <div className="flex items-end justify-between px-2 pb-1.5 border-b border-border/60">
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
 <motion.ul
 className="flex flex-col"
 initial="hidden"
 animate="show"
 custom={revealDelay}
 variants={cascadeContainer}
 >
 {questions.map((q) => {
  const rowDimmed = isNpsTierDimmed(q.n > 0 ? q.score : null, tierBands);
  return (
  <motion.li key={q.id} variants={cascadeItem} className="group flex items-center justify-between gap-6 py-2 px-2 border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
  <span className={cn("text-[13px] text-text-secondary max-w-[500px] leading-relaxed", rowDimmed && "opacity-55")}>{q.text}</span>
  <div className={cn("flex items-center gap-6 shrink-0", rowDimmed && "opacity-55 grayscale")}>
  {levelHidden ? <NpsHiddenLevelValue /> : <NpsScoreWithTooltip score={q.score} promoters={q.promoters} passives={q.passives} detractors={q.detractors} n={q.n} dimmed={isBandDimmed(q.score, highlightBands) || rowDimmed} activeTiers={tierBands} />}
  </div>
  </motion.li>
  );
 })}
 </motion.ul>
 </div>
 );
}

function countQuestions(section: NpsSectionDetail): number {
 return (
 section.questions.length +
 section.children.reduce((sum, child) => sum + countQuestions(child), 0)
 );
}

function NpsSubsectionRow({ section, depth, visibleLevels, highlightBands, defaultOpen, tierBands, contentDelay = 0 }: { section: NpsSectionDetail; depth: number; visibleLevels: ReadonlySet<ResultLevel>; highlightBands: ReadonlySet<string>; defaultOpen?: boolean; tierBands?: ReadonlySet<string>; /** Delay before this subsection's own questions/nested subsections start cascading in — set by the sibling list so they wait their turn. */ contentDelay?: number; }) {
 const [expanded, setExpanded] = React.useState(defaultOpen ?? false);
 const theme = depthTheme(depth);
 const questionCount = countQuestions(section);

 const levelId = depth === 2 ? "subsection2" : "subsection3";
 const levelHidden = !visibleLevels.has(levelId);
 const rowDimmed = tierBands ? isNpsTierDimmed(section.n > 0 ? section.score : null, tierBands) : false;

 return (
 <>
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
 <div className={cn("min-w-0 flex-1", rowDimmed && "opacity-55")}>
 <p className={cn("-ml-1 px-1 py-0.5 w-full rounded-md font-bold tracking-tight text-text-primary flex flex-wrap items-baseline gap-x-2 gap-y-1", theme.title)}>
 {section.title}
 <span className="text-[11px] font-medium text-muted-foreground tracking-normal">
 {questionCount} preguntas
 {section.children.length > 0 ? ` · ${section.children.length} subsecciones` : ""}
 </span>
 </p>
 </div>
 <div
 className={cn("mt-0.5 flex shrink-0 items-center gap-2.5", rowDimmed && "opacity-55 grayscale")}
 onClick={(e) => e.stopPropagation()}
 onKeyDown={(e) => e.stopPropagation()}
 >
 {!levelHidden && <NpsScoreWithTooltip score={section.score} promoters={section.promoters} passives={section.passives} detractors={section.detractors} n={section.n} labeled expandable={true} compact={true} dimmed={isBandDimmed(section.score, highlightBands) || rowDimmed} activeTiers={tierBands} />}
 </div>
 </div>
 {expanded && (
 <div className={cn("mt-2.5 flex flex-col gap-3 pb-1 animate-in fade-in slide-in-from-top-1 duration-200", theme.rail, theme.railOffset)}>
 {section.questions.length > 0 && <NpsQuestionTable questions={section.questions} visibleLevels={visibleLevels} highlightBands={highlightBands} tierBands={tierBands || new Set()} revealDelay={contentDelay} />}
 {section.children.length > 0 && <NpsSubsectionOutline sections={section.children} depth={depth + 1} visibleLevels={visibleLevels} highlightBands={highlightBands} tierBands={tierBands} baseDelay={contentDelay} />}
 </div>
 )}
 </>
 );
}

function NpsSubsectionOutline({ sections, depth, visibleLevels, highlightBands, tierBands, baseDelay = 0 }: { sections: readonly NpsSectionDetail[]; depth: number; visibleLevels: ReadonlySet<ResultLevel>; highlightBands: ReadonlySet<string>; tierBands?: ReadonlySet<string>; /** When this list itself sits inside another cascade, how long to wait before its own rows start staggering in. */ baseDelay?: number; }) {
 return (
 <motion.ul
 className={cn("flex flex-col", SIBLING_DIVIDER)}
 initial="hidden"
 animate="show"
 custom={baseDelay}
 variants={cascadeContainer}
 >
 {sections.map((sec, index) => (
 <motion.li key={sec.id} variants={cascadeItem}>
 <NpsSubsectionRow
 section={sec}
 depth={depth}
 visibleLevels={visibleLevels}
 highlightBands={highlightBands}
 defaultOpen={index === 0}
 tierBands={tierBands}
 // This row's own content starts right as the row itself settles
 // in, not after every sibling row has.
 contentDelay={cascadeItemSettleTime(baseDelay, index) + CASCADE_CONTENT_GAP}
 />
 </motion.li>
 ))}
 </motion.ul>
 );
}

function NpsSectionRoot({ section, isOpen, onToggle, visibleLevels, highlightBands, tierBands }: { section: NpsSectionDetail; isOpen: boolean; onToggle: () => void; visibleLevels: ReadonlySet<ResultLevel>; highlightBands: ReadonlySet<string>; tierBands?: ReadonlySet<string>; }) {
 const questionCount = countQuestions(section);
 const levelHidden = !visibleLevels.has("section");
 const rowDimmed = tierBands ? isNpsTierDimmed(section.n > 0 ? section.score : null, tierBands) : false;

 return (
 <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface">
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
 className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-muted/60 border border-border/60 px-1 text-[10px] font-bold tabular-nums text-muted-foreground"
 >
 {section.numbering}
 </span>
 <div className={cn("min-w-0 flex-1", rowDimmed && "opacity-55")}>
 <p className="px-1 py-0.5 w-full rounded-md font-bold tracking-tight text-text-primary flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px]">
 {section.title}
 <span className="text-[12px] font-medium text-muted-foreground tracking-normal">
 {questionCount} preguntas
 {section.children.length > 0 ? ` · ${section.children.length} subsecciones` : ""}
 </span>
 </p>
 </div>
 <div
 className={cn("shrink-0 pt-0.5 flex items-center gap-1.5", rowDimmed && "opacity-55 grayscale")}
 onClick={(e) => e.stopPropagation()}
 onKeyDown={(e) => e.stopPropagation()}
 >
 {!levelHidden && <NpsScoreWithTooltip score={section.score} promoters={section.promoters} passives={section.passives} detractors={section.detractors} n={section.n} labeled expandable={true} compact={true} dimmed={isBandDimmed(section.score, highlightBands) || rowDimmed} activeTiers={tierBands} />}
 </div>
 </div>
 
 {isOpen && (
 <div className="flex min-h-0 flex-col gap-4 px-6 py-5 animate-in fade-in slide-in-from-top-1 duration-300">
 {section.questions.length > 0 && <NpsQuestionTable questions={section.questions} visibleLevels={visibleLevels} highlightBands={highlightBands} tierBands={tierBands || new Set()} />}
 {section.children.length > 0 && <NpsSubsectionOutline sections={section.children} depth={2} visibleLevels={visibleLevels} highlightBands={highlightBands} tierBands={tierBands} />}
 </div>
 )}
 </section>
 );
}

function DimensionsView({ results, filters, visibleLevels, highlightBands, tierBands }: {
 results: SurveyResults;
 filters: readonly SegmentFilter[];
 visibleLevels: ReadonlySet<ResultLevel>;
 highlightBands: ReadonlySet<string>;
tierBands: ReadonlySet<string>;
}) {
 const sections = React.useMemo(() => npsBySection(results, filters), [results, filters]);

 const [openSection, setOpenSection] = React.useState<string | undefined>(sections[0]?.id);

 if (sections.length === 0) {
 return <EmptyState icon={LayoutGrid} title="No hay datos" description="Prueba cambiando los filtros" />;
 }

 return (
 <div className="flex flex-col gap-4 mt-4">
 {sections.map((section) => (
 <NpsSectionRoot 
 key={section.id} 
 section={section} 
 isOpen={openSection === section.id} 
 onToggle={() => setOpenSection(curr => curr === section.id ? undefined : section.id)}
 visibleLevels={visibleLevels}
 highlightBands={highlightBands}
 tierBands={tierBands}
 />
 ))}
 </div>
 );
}

// ─── View 2: Segment Cards ───────────────────────────────────────────────────

function SegmentCardRowRecursive({ row, columnIndex, visibleLevels, highlightBands, tierBands, depth = 1 }: { row: NpsSegmentRow, columnIndex: number, visibleLevels: ReadonlySet<ResultLevel>, highlightBands: ReadonlySet<string>, tierBands?: ReadonlySet<string>, depth?: number }) {
 const levelId = depth === 1 ? "section" : depth === 2 ? "subsection2" : depth === 3 ? "subsection3" : "question";
 const levelHidden = !visibleLevels.has(levelId);
 const cell = row.cells[columnIndex];
 const rowDimmed = tierBands && cell ? isNpsTierDimmed(cell.score, tierBands) : false;

 return (
 <React.Fragment>
 <div 
 className={cn(
 "flex items-center justify-between gap-3",
 depth === 1 ? "mt-2 first:mt-0" : "mt-0.5",
 rowDimmed && "opacity-55"
 )}
 >
 <div className="flex items-center min-w-0 flex-1" style={{ paddingLeft: `${(depth - 1) * 14}px` }}>
 {depth > 1 && (
 <div className="mr-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/30" />
 )}
 <span className={cn(
 "truncate",
 depth === 1 ? "text-[13px] font-bold text-text-primary" : "text-[12px] text-text-secondary"
 )}>
 {row.title}
 </span>
 </div>
 
 <div className={cn("shrink-0 flex items-center justify-end", rowDimmed && "grayscale")}>
 {levelHidden ? (
 <NpsHiddenLevelValue />
 ) : cell && !cell.belowThreshold ? (
 <NpsScoreValue score={cell.score} n={cell.n} className="w-10 justify-center" dimmed={isBandDimmed(cell.score, highlightBands) || rowDimmed} />
 ) : (
 <span className="text-[10px] text-muted-foreground">—</span>
 )}
 </div>
 </div>
 {row.children?.map((child) => (
 <SegmentCardRowRecursive key={child.id} row={child} columnIndex={columnIndex} visibleLevels={visibleLevels} highlightBands={highlightBands} tierBands={tierBands} depth={depth + 1} />
 ))}
 </React.Fragment>
 );
}

function SegmentCard({ column, totalCell, sectionRows, visibleLevels, highlightBands, tierBands }: { column: any, totalCell: NpsSegmentCell | null, sectionRows: readonly NpsSegmentRow[], visibleLevels: ReadonlySet<ResultLevel>, highlightBands: ReadonlySet<string>, tierBands?: ReadonlySet<string>; }) {
 if (!totalCell || totalCell.belowThreshold) {
 return (
 <div className="rounded-xl border border-border/60 bg-surface shadow-card overflow-hidden flex flex-col opacity-60">
 <div className="p-4 border-b border-border/60 bg-muted/30 flex items-center justify-between">
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
 <div className="rounded-xl border border-border/60 bg-surface shadow-card overflow-hidden flex flex-col">
 <div className="p-4 border-b border-border/60 bg-muted/30">
 <div className="flex items-center justify-between gap-3">
 <h4 className="font-bold text-text-primary text-[14px] truncate" title={column.label}>{column.label}</h4>
 <NpsScoreWithTooltip score={totalCell.score} promoters={totalCell.promoters} passives={totalCell.passives} detractors={totalCell.detractors} n={totalCell.n} compact dimmed={isBandDimmed(totalCell.score, highlightBands)} activeTiers={tierBands} />
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
 <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
 <span>Sección / Subsección</span>
 <span className="w-10 text-center">eNPS</span>
 </div>
 
 <div className="mt-3 flex flex-col">
 {sectionRows.map(row => (
 <SegmentCardRowRecursive key={row.id} row={row} columnIndex={column.index} visibleLevels={visibleLevels} highlightBands={highlightBands} tierBands={tierBands} />
 ))}
 </div>
 </div>
 </div>
 );
}

function SegmentView({ results, activeSegment, filters, visibleLevels, highlightBands, tierBands }: {
 results: SurveyResults;
 activeSegment: SegmentDefinition;
 filters: readonly SegmentFilter[];
 visibleLevels: ReadonlySet<ResultLevel>;
 highlightBands: ReadonlySet<string>;
tierBands: ReadonlySet<string>;
}) {
 const data: NpsSegmentData = React.useMemo(
 () => npsBySegmentData(results, activeSegment, filters),
 [results, activeSegment, filters]
 );

 return (
 <div className="mt-4">
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
 {data.columns.map((col, index) => (
 <SegmentCard 
 key={col.id} 
 column={{...col, index}} 
 totalCell={data.totalRow.cells[index]} 
 sectionRows={data.sectionRows} 
 visibleLevels={visibleLevels}
 highlightBands={highlightBands}
 tierBands={tierBands}
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
 <TabsList>
 <TabsTrigger value="dimensions">
 <List className="h-3.5 w-3.5" />
 Secciones
 </TabsTrigger>
 <TabsTrigger value="segment">
 <LayoutGrid className="h-3.5 w-3.5" />
 Por segmento
 </TabsTrigger>
 <TabsTrigger value="depth">
 <MessagesSquare className="h-3.5 w-3.5" />
 Profundidad
 </TabsTrigger>
 </TabsList>
 </Tabs>
 );
}

// ─── NpsTab ──────────────────────────────────────────────────────────────────

interface NpsTabProps {
 /** The survey itself: the depth view reads the author's own outline. */
 draft: SurveyDraft;
 results: SurveyResults;
}

export function NpsTab({ draft, results }: NpsTabProps) {
 const segments = results.segments;
 const gridSegments = segments.filter((s) => !s.perPerson);

 const [view, setView] = React.useState<NpsView>("dimensions");
 const [segmentKey, setSegmentKey] = React.useState<string>(gridSegments[0]?.key ?? "");
 const activeSegment = gridSegments.find((s) => s.key === segmentKey) ?? gridSegments[0];

 // The same state Favorabilidad runs on — "Filtros", "Niveles" y "Resaltar" —
 // reading the eNPS score bands instead of the 1–5 ones.
  const [tierBands, setTierBands] = React.useState<ReadonlySet<string>>(new Set());
  const toggleTierBand = (id: string) => {
    setTierBands(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
 const npsTone = toneForNps(nps.score);

 // No real measurement-over-measurement eNPS record exists, so the trend is
 // deterministically derived around today's score — same quarters the other
 // tabs' trends use.
 const trendLabels = results.trend.map((point) => point.label);
 const npsTrend = deriveTrendSeries(trendLabels, `${draft.name}:nps`, nps.score, 8, [-100, 100]);

 const dimensionsData = React.useMemo(() => npsBySection(results, filtersState.filters), [results, filtersState.filters]);
 const totalQuestions = React.useMemo(() => {
 const count = (list: readonly NpsSectionDetail[]): number =>
 list.reduce((sum, s) => sum + s.questions.length + count(s.children), 0);
 return count(dimensionsData);
 }, [dimensionsData]);

 const depthTotals = React.useMemo(
 () => npsDepthTotals(npsDepthBySection(draft, results, filtersState.filters)),
 [draft, results, filtersState.filters]
 );

 const segmentData = React.useMemo(
 () => activeSegment ? npsBySegmentData(results, activeSegment, filtersState.filters) : null,
 [results, activeSegment, filtersState.filters]
 );
 const totalSegments = segmentData?.columns.length ?? 0;

 // "Top 3 áreas más detractoras" reads real organizational areas — the same
 // "Área" demographic Participación ranks by — not eNPS's own content
 // dimensions, so it always ranks off "Área" regardless of whatever segment
 // "Por segmento" below happens to be showing.
 const areaSegment = gridSegments.find((s) => s.key === "area") ?? gridSegments[0];
 const areaSegmentData = React.useMemo(
 () => areaSegment ? npsBySegmentData(results, areaSegment, filtersState.filters) : null,
 [results, areaSegment, filtersState.filters]
 );
 const topDetractorAreas = areaSegmentData
 ? areaSegmentData.columns
 .map((column, index) => ({ column, cell: areaSegmentData.totalRow.cells[index] }))
 .filter((entry): entry is { column: typeof entry.column; cell: NpsSegmentCell } =>
 entry.cell !== null && !entry.cell.belowThreshold && entry.cell.n > 0
 )
 .sort((a, b) => a.cell.score - b.cell.score)
 .slice(0, 3)
 : [];

 return (
 // `pb-6` and `gap-6` are the frame Participación sets and every
 // other tab repeats. Horizontal padding stays with the screen so every
 // tab's content lines up with the tab strip above it.
 <div className="flex flex-col gap-6 pb-6">
 {/* Bare on the page, like the KPI row of every other tab: boxing it in a
 second card was what set eNPS apart, and what pushed the detail below
 it further down than anywhere else. */}
 <MetricSummaryCard
  accentColor={ACCENT_CLASS_BY_TONE[npsTone]}
  title="Puntaje eNPS"
  hint={
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
  }
  bigValue={`${nps.score > 0 ? "+" : ""}${nps.score}`}
  bigValueBadge={<MetricReadingBadge tone={npsTone} label={NPS_READING[npsTone]} />}
  caption={`${formatCount(nps.n)} respuestas · escala de -100 a +100`}
  ringsLabel="Distribución de respuestas"
  ringsTotal={`${formatCount(nps.n)} en total`}
  rings={[
    {
      id: "promoter",
      label: "Promotores",
      percentage: Math.round((counts.promoter / nps.n) * 100),
      color: POSITIVE,
      count: formatCount(counts.promoter),
      active: tierBands.has("promoter"),
      onToggle: () => toggleTierBand("promoter"),
    },
    {
      id: "passive",
      label: "Neutros",
      percentage: Math.round((counts.passive / nps.n) * 100),
      color: YELLOW,
      count: formatCount(counts.passive),
      active: tierBands.has("passive"),
      onToggle: () => toggleTierBand("passive"),
    },
    {
      id: "detractor",
      label: "Detractores",
      percentage: Math.round((counts.detractor / nps.n) * 100),
      color: NEGATIVE,
      count: formatCount(counts.detractor),
      active: tierBands.has("detractor"),
      onToggle: () => toggleTierBand("detractor"),
    },
  ]}
  topAreasTitle="Top 3 áreas más detractoras"
  topAreas={
    topDetractorAreas.map(({ column, cell }) => ({
      id: column.id,
      label: column.label,
      value: Math.max(0, 100 + cell.score),
      displayValue: `${cell.score > 0 ? "+" : ""}${cell.score}`,
    }))
  }
  chartTitle="Tendencia por medición"
  chart={
    <Sparkline
      points={trendLabels.map((label, index) => ({ id: label, name: label, value: npsTrend[index] }))}
      format={(value) => `${value > 0 ? "+" : ""}${Math.round(value)}`}
      ariaLabel={`Puntaje eNPS de las últimas ${trendLabels.length} mediciones`}
      height={56}
      showPoints
      fitTarget={false}
    />
  }
/>

 <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
 <div className="sticky top-3 z-30 -mt-4 pt-4 pb-2 bg-surface">
 <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
 <div className="flex items-center gap-2">
 <h3 className="text-[13px] font-bold text-text-primary">
 {view === "dimensions"
 ? "Detalle por secciones eNPS"
 : view === "segment"
 ? "eNPS por segmento demografico"
 : "Preguntas de profundidad"}
 </h3>
 <Badge variant="neutral" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
 {view === "dimensions"
 ? totalQuestions
 : view === "segment"
 ? totalSegments
 : depthTotals.questions}
 </Badge>
 {view === "depth" && depthTotals.people > 0 && (
 // The coverage belongs next to the count: a list of answers
 // without the share of people who wrote them is an anecdote.
 <span className="text-[12px] font-medium text-muted-foreground">
 {depthTotals.answered.toLocaleString("es-CO")} respuestas de{" "}
 {depthTotals.people.toLocaleString("es-CO")} personas ·{" "}
 {depthTotals.coverage}% de cobertura
 </span>
 )}
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
 // Profundidad draws no scores, so "Personalizar" — levels and
 // highlight bands — would be a popover with nothing in it.
 showCustomize={view !== "depth"}
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
 tierBands={tierBands}
 />
 ) : view === "depth" ? (
 <NpsDepthView draft={draft} results={results} filters={filtersState.filters} tierBands={tierBands} />
 ) : activeSegment ? (
 <SegmentView
 results={results}
 activeSegment={activeSegment}
 filters={filtersState.filters}
 visibleLevels={filtersState.visibleLevels}
 highlightBands={filtersState.highlightBands}
 tierBands={tierBands}
 />
 ) : null}
 </div>
 </div>
 );
}
