import * as React from "react";
import { Check, Download, History, Info, Loader2, RotateCcw, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter } from "@/components/ui/sheet";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import type { NpsBand, SegmentDefinition, SurveyResults } from "@/mocks/surveyResults";
import {
  PDF_BLOCKS,
  REPORT_TYPES,
  reportTypeFor,
  type DownloadEntry,
  type PdfBlockId,
  type ReportKind,
  type ReportRequest,
} from "./downloadTypes";

interface DownloadReportsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: SurveyResults;
  entries: readonly DownloadEntry[];
  onStart: (request: ReportRequest) => void;
  /** Retry path only — a finished report has already reached the browser. */
  onDeliver: (id: string) => void;
  onShare: (id: string) => void;
}

const NO_FILTER = "all";

/**
 * The download drawer: pick a report, tune what goes into it, follow its
 * preparation.
 *
 * Two tabs on purpose. "Reportes" is configuration — choosing and shaping the
 * next file. "Descargas" is state — what has been asked for and how far along
 * it is. Mixing them puts a progress bar inside a form; splitting them lets
 * "Minimizar y continuar" close the form while the state keeps living in the
 * floating widget.
 */
export function DownloadReportsDrawer({
  open,
  onOpenChange,
  results,
  entries,
  onStart,
  onDeliver,
  onShare,
}: DownloadReportsDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<"reports" | "downloads">("reports");

  const segments = React.useMemo(
    () => results.segments.filter((segment) => !segment.perPerson),
    [results.segments]
  );
  const hasSegments = segments.length > 0;
  const hasNps = results.nps !== null;

  // --- Configuration state ------------------------------------------------
  const [kind, setKind] = React.useState<ReportKind>("pdf");

  const defaultBlocks = React.useMemo(
    () =>
      PDF_BLOCKS.filter(
        (block) => (!block.needsSegments || hasSegments) && (!block.needsNps || hasNps)
      ).map((block) => block.id),
    [hasSegments, hasNps]
  );
  const [pdfBlocks, setPdfBlocks] = React.useState<ReadonlySet<PdfBlockId>>(
    () => new Set(defaultBlocks)
  );
  const [pdfSegmentKey, setPdfSegmentKey] = React.useState<string>(
    () => segments.find((segment) => segment.key === "area")?.key ?? segments[0]?.key ?? ""
  );

  const [includeParticipation, setIncludeParticipation] = React.useState(true);
  const [includeHeatmaps, setIncludeHeatmaps] = React.useState(true);
  const [participationKeys, setParticipationKeys] = React.useState<ReadonlySet<string>>(
    () => new Set(segments.map((segment) => segment.key))
  );
  const [heatmapKeys, setHeatmapKeys] = React.useState<ReadonlySet<string>>(
    () => new Set(segments.map((segment) => segment.key))
  );

  const [filterKey, setFilterKey] = React.useState<string>(NO_FILTER);
  const [filterOptionId, setFilterOptionId] = React.useState<string>("");
  const filterSegment = segments.find((segment) => segment.key === filterKey);

  const [commentSentiments, setCommentSentiments] = React.useState<ReadonlySet<NpsBand>>(
    () => new Set<NpsBand>(["promoter", "passive", "detractor"])
  );

  const activeType = reportTypeFor(kind);
  const preparingCount = entries.filter((entry) => entry.status === "preparing").length;

  const toggleIn = <T,>(set: ReadonlySet<T>, value: T): ReadonlySet<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const handleDownload = () => {
    onStart({
      kind,
      participationSegments: includeParticipation ? [...participationKeys] : [],
      heatmapSegments: includeHeatmaps ? [...heatmapKeys] : [],
      pdfBlocks: PDF_BLOCKS.map((block) => block.id).filter((id) => pdfBlocks.has(id)),
      pdfSegmentKey: pdfSegmentKey || null,
      commentSentiments: [...commentSentiments],
      filter:
        filterKey !== NO_FILTER && filterOptionId
          ? { key: filterKey, optionId: filterOptionId }
          : null,
    });
    setActiveTab("downloads");
  };

  const canDownload =
    (kind !== "pdf" || pdfBlocks.size > 0) &&
    (kind !== "comments" || commentSentiments.size > 0);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Reportes de resultados"
      description="Configura y descarga los reportes de esta medición"
      size="md"
      // 30% of the viewport, floored at the `md` width it used to have: below a
      // ~1500px screen 30vw is *narrower* than that, and the config cards start
      // wrapping. So it widens on a big monitor and never shrinks on a laptop.
      className="!w-[30vw] !max-w-[30vw] !min-w-[28rem]"
      disablePadding
      footer={
        <SheetFooter className="border-t bg-background px-5 py-4">
          {activeTab === "reports" ? (
            <Button
              className="w-full gap-2"
              onClick={handleDownload}
              disabled={!canDownload}
            >
              <Download className="h-4 w-4" />
              Descargar {activeType.format}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Minimizar y continuar
            </Button>
          )}
        </SheetFooter>
      }
    >
      <div className="flex h-full flex-col">
        <DrawerTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          downloadsBadge={preparingCount}
        />

        {activeTab === "reports" ? (
          <div className="flex flex-col gap-6 px-5 py-5">
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-1 text-[13px] font-bold text-text-primary">
                Tipo de reporte
              </legend>
              {REPORT_TYPES.map((type) => (
                <ReportTypeCard
                  key={type.kind}
                  type={type}
                  selected={kind === type.kind}
                  onSelect={() => setKind(type.kind)}
                />
              ))}
            </fieldset>

            <div className="flex flex-col gap-4">
              <h3 className="text-[13px] font-bold text-text-primary">
                Personalización del reporte
              </h3>

              {kind === "pdf" && (
                <>
                  <ConfigCard title="Contenido del reporte">
                    <div className="flex flex-col gap-1">
                      {PDF_BLOCKS.map((block) => {
                        const unavailable =
                          (block.needsSegments && !hasSegments) || (block.needsNps && !hasNps);
                        return (
                          <label
                            key={block.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60",
                              unavailable && "cursor-not-allowed opacity-45 hover:bg-transparent"
                            )}
                          >
                            <Checkbox
                              checked={pdfBlocks.has(block.id)}
                              disabled={unavailable}
                              onCheckedChange={() => setPdfBlocks(toggleIn(pdfBlocks, block.id))}
                              className="mt-0.5"
                            />
                            <span className="flex flex-col">
                              <span className="text-[13px] font-semibold leading-tight text-text-primary">
                                {block.label}
                              </span>
                              <span className="text-[12px] leading-snug text-muted-foreground">
                                {unavailable && block.needsNps
                                  ? "Esta medición no incluyó pregunta eNPS"
                                  : block.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </ConfigCard>

                  {hasSegments && (
                    <ConfigCard
                      title="Desglose demográfico"
                      hint="Demográfico que usan los bloques de participación y heatmap"
                    >
                      <Select value={pdfSegmentKey} onValueChange={setPdfSegmentKey}>
                        <SelectTrigger className="h-10 w-full bg-background">
                          <SelectValue placeholder="Selecciona un demográfico" />
                        </SelectTrigger>
                        <SelectContent>
                          {segments.map((segment) => (
                            <SelectItem key={segment.key} value={segment.key}>
                              {segment.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </ConfigCard>
                  )}
                </>
              )}

              {kind === "xlsx" && (
                <>
                  <SegmentTogglesCard
                    title="Participación por demográficos"
                    hint="Una hoja de participación por cada demográfico elegido"
                    enabled={includeParticipation}
                    onEnabledChange={setIncludeParticipation}
                    segments={segments}
                    selected={participationKeys}
                    onToggle={(key) => setParticipationKeys(toggleIn(participationKeys, key))}
                  />
                  <SegmentTogglesCard
                    title="Heatmaps por demográficos"
                    hint="Una hoja de heatmap por cada demográfico elegido"
                    enabled={includeHeatmaps}
                    onEnabledChange={setIncludeHeatmaps}
                    segments={segments}
                    selected={heatmapKeys}
                    onToggle={(key) => setHeatmapKeys(toggleIn(heatmapKeys, key))}
                  />
                </>
              )}

              {kind === "comments" && (
                <ConfigCard
                  title="Sentimiento de los comentarios"
                  hint="Elige qué comentarios entran al archivo. Todos activos = reporte completo"
                >
                  <SentimentChips
                    selected={commentSentiments}
                    onToggle={(band) =>
                      setCommentSentiments(toggleIn(commentSentiments, band))
                    }
                  />
                  {commentSentiments.size === 0 && (
                    <span className="text-[12px] font-medium text-status-negative">
                      Selecciona al menos un sentimiento para poder descargar.
                    </span>
                  )}
                </ConfigCard>
              )}

              {(kind === "questions-csv" || kind === "answers-csv") && (
                <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-[12.5px] leading-snug text-muted-foreground">
                    {kind === "questions-csv" &&
                      "Una hoja con una fila por pregunta: respuestas, puntaje, favorabilidad y la distribución completa 1 a 5, con la misma escala de colores del reporte."}
                    {kind === "answers-csv" &&
                      "Una hoja con una fila por respuesta individual y sus demográficos, coloreada por la escala 1 a 5. Las identidades nunca se incluyen: la encuesta es anónima."}
                  </p>
                </div>
              )}

              {hasSegments && (
                <ConfigCard
                  title="Filtrar población"
                  hint="Genera el reporte solo para un grupo demográfico"
                >
                  <div className="flex flex-col gap-2.5">
                    <Select
                      value={filterKey}
                      onValueChange={(value) => {
                        setFilterKey(value);
                        setFilterOptionId("");
                      }}
                    >
                      <SelectTrigger className="h-10 w-full bg-background">
                        <SelectValue placeholder="Toda la empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_FILTER}>Toda la empresa</SelectItem>
                        {segments.map((segment) => (
                          <SelectItem key={segment.key} value={segment.key}>
                            {segment.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filterSegment && (
                      <Select value={filterOptionId} onValueChange={setFilterOptionId}>
                        <SelectTrigger className="h-10 w-full bg-background">
                          <SelectValue placeholder={`Selecciona ${filterSegment.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filterSegment.options.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </ConfigCard>
              )}

            </div>
          </div>
        ) : (
          <DownloadsList entries={entries} onDeliver={onDeliver} onShare={onShare} />
        )}
      </div>
    </DrawerShell>
  );
}

// --- Pieces -----------------------------------------------------------------------

function DrawerTabs({
  activeTab,
  onTabChange,
  downloadsBadge,
}: {
  activeTab: "reports" | "downloads";
  onTabChange: (tab: "reports" | "downloads") => void;
  downloadsBadge: number;
}) {
  const tab = (id: "reports" | "downloads", label: string, badge?: number) => (
    <button
      type="button"
      onClick={() => onTabChange(id)}
      className={cn(
        "relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-[13.5px] font-semibold transition-colors",
        activeTab === id
          ? "border-brand text-brand"
          : "border-transparent text-muted-foreground hover:text-text-primary"
      )}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10.5px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex shrink-0 items-center gap-6 border-b border-border/70 px-5 pt-3">
      {tab("reports", "Reportes")}
      {tab("downloads", "Descargas", downloadsBadge)}
    </div>
  );
}

function ReportTypeCard({
  type,
  selected,
  onSelect,
}: {
  type: (typeof REPORT_TYPES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        // A fixed min-height keeps every card the same size — "Respuestas
        // (XLSX)" has a shorter description than its siblings, so without
        // this it wraps to one line and reads as a card that shrank.
        // `transition-colors` only — `transition-all` used to animate the
        // selected ring's box-shadow spread from 0 to 1px, which read as the
        // card briefly shrinking before it snapped to its resting size.
        // `outline-none` + our own focus-visible ring: without it, whichever
        // card the browser still has focus on (the one just clicked) gets the
        // native focus outline stacked on top of the selected ring — heavy
        // and glowing in Safari — so that one card alone looked bigger/bolder
        // than its siblings.
        "flex min-h-[78px] w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-brand bg-brand/[0.04] shadow-[0_0_0_1px_theme(colors.brand.DEFAULT)]"
          : "border-border/80 bg-card hover:border-border hover:bg-muted/40"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-bold leading-tight text-text-primary">{type.title}</span>
        <span className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          {type.description}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-brand" : "border-border"
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
      </span>
    </button>
  );
}

function ConfigCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-primary">
          {title}
        </span>
        {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SegmentTogglesCard({
  title,
  hint,
  enabled,
  onEnabledChange,
  segments,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  segments: readonly SegmentDefinition[];
  selected: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-primary">
            {title}
          </span>
          <span className="text-[12px] text-muted-foreground">{hint}</span>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      {enabled && (
        <div className="flex flex-wrap gap-1.5">
          {segments.map((segment) => {
            const isOn = selected.has(segment.key);
            return (
              <button
                key={segment.key}
                type="button"
                onClick={() => onToggle(segment.key)}
                aria-pressed={isOn}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                  isOn
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-background text-muted-foreground hover:border-border hover:text-text-primary"
                )}
              >
                {segment.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SENTIMENT_OPTIONS: readonly {
  band: NpsBand;
  label: string;
  /** Chip colors when active — the same trio the comments view speaks. */
  activeClass: string;
  dotClass: string;
}[] = [
  {
    band: "promoter",
    label: "Positivos",
    activeClass: "border-status-positive/60 bg-status-positive/10 text-status-positive",
    dotClass: "bg-status-positive",
  },
  {
    band: "passive",
    label: "Neutrales",
    activeClass: "border-status-warning/60 bg-status-warning/10 text-status-warning",
    dotClass: "bg-status-warning",
  },
  {
    band: "detractor",
    label: "Negativos",
    activeClass: "border-status-negative/60 bg-status-negative/10 text-status-negative",
    dotClass: "bg-status-negative",
  },
];

function SentimentChips({
  selected,
  onToggle,
}: {
  selected: ReadonlySet<NpsBand>;
  onToggle: (band: NpsBand) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SENTIMENT_OPTIONS.map((option) => {
        const isOn = selected.has(option.band);
        return (
          <button
            key={option.band}
            type="button"
            onClick={() => onToggle(option.band)}
            aria-pressed={isOn}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
              isOn
                ? option.activeClass
                : "border-border bg-background text-muted-foreground hover:text-text-primary"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", isOn ? option.dotClass : "bg-border")} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function DownloadsList({
  entries,
  onDeliver,
  onShare,
}: {
  entries: readonly DownloadEntry[];
  onDeliver: (id: string) => void;
  onShare: (id: string) => void;
}) {
  // The check marks *this* download, not the history: entries arrive
  // newest-first, so the first finished one is the file that just landed and
  // every older row goes back to its plain format icon.
  const latestDeliveredId = entries.find(
    (entry) => entry.status === "ready" && entry.delivered
  )?.id;

  return (
    <div className="flex flex-1 flex-col px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-bold text-text-primary">Lista de descargas</span>
        <span className="text-[11.5px] font-semibold text-muted-foreground">
          Últimos 7 días
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <History className="h-6 w-6" strokeWidth={2} />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-bold text-text-primary">Sin descargas recientes</span>
            <span className="max-w-[260px] text-[12.5px] leading-snug text-muted-foreground">
              Tus reportes generados aparecerán aquí para acceso rápido.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((entry) => (
            <DownloadRow
              key={entry.id}
              entry={entry}
              isLatest={entry.id === latestDeliveredId}
              onDeliver={onDeliver}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadRow({
  entry,
  isLatest,
  onDeliver,
  onShare,
}: {
  entry: DownloadEntry;
  isLatest: boolean;
  onDeliver: (id: string) => void;
  onShare: (id: string) => void;
}) {
  const Icon = reportTypeFor(entry.kind).icon;
  const isPreparing = entry.status === "preparing";
  const needsRetry = !isPreparing && !entry.delivered;
  const showsCheck = !isPreparing && !needsRetry && isLatest;

  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          needsRetry
            ? "bg-status-warning/10 text-status-warning"
            : showsCheck
              ? "bg-status-positive/10 text-status-positive"
              : "bg-muted text-muted-foreground"
        )}
      >
        {showsCheck ? (
          <Check className="h-[18px] w-[18px]" strokeWidth={3} />
        ) : (
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[12.5px] font-semibold text-text-primary" title={entry.fileName}>
          {entry.fileName}
        </span>
        {isPreparing ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
                style={{ width: `${entry.progress}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11.5px] font-bold tabular-nums text-brand">
              {Math.round(entry.progress)}%
            </span>
          </div>
        ) : (
          <span
            className={cn(
              "text-[11.5px]",
              needsRetry ? "font-semibold text-status-warning" : "text-muted-foreground"
            )}
          >
            {needsRetry
              ? "La descarga quedó bloqueada por el navegador"
              : entry.format === "PDF"
                ? "Descargado — se abrió para imprimir o guardar"
                : "Descargado"}
          </span>
        )}
      </div>
      {isPreparing ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Preparando reporte" />
      ) : needsRetry ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 gap-1.5 rounded-full px-3 text-[11.5px] font-bold text-brand hover:bg-brand/10 hover:text-brand"
          onClick={() => onDeliver(entry.id)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 gap-1.5 rounded-full px-3 text-[11.5px] font-bold text-brand hover:bg-brand/10 hover:text-brand"
          onClick={() => onShare(entry.id)}
        >
          <Share2 className="h-3.5 w-3.5" />
          Compartir
        </Button>
      )}
    </div>
  );
}
