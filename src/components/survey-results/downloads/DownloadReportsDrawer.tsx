import * as React from "react";
import {
  Check,
  ChevronDown,
  Download,
  FileDown,
  FileText,
  Filter,
  History,
  Info,
  LayoutList,
  Loader2,
  Lock,
  MessageSquareText,
  Share2,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toneChip, toneSelected } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { DrawerSection } from "@/components/overlays/DrawerSection";
import type { SurveyDraft } from "@/components/survey-builder";
import { hasNpsDepthQuestions } from "@/mocks/npsDepth";
import {
  buildOpenComments,
  buildRespondents,
  type OpenComment,
  type Sentiment,
} from "@/mocks/questionResponses";
import type { SegmentDefinition, SurveyResults } from "@/mocks/surveyResults";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "../sentimentScale";
import {
  blockedReason,
  populationFilterApplies,
  populationScope,
  type PopulationScope,
} from "./anonymityGuard";
import {
  PDF_SECTIONS,
  REPORT_TYPES,
  XLSX_SHEETS,
  reportDescriptionFor,
  reportDetailFor,
  reportTypeFor,
  reportableSegments,
  type DownloadEntry,
  type PdfSectionId,
  type PdfSegmentSlot,
  type ReportKind,
  type ReportRequest,
  type XlsxSegmentSlot,
  type XlsxSheetId,
} from "./downloadTypes";

/**
 * Área primero, o el primer demográfico que haya.
 *
 * Es el corte con el que arrancan todos los bloques configurables: la unidad
 * por la que una organización asigna presupuestos, líderes y planes, y por eso
 * la que casi siempre se quiere ver desglosada.
 */
const areaFirst = <T extends { key: string }>(items: readonly T[]): ReadonlySet<string> => {
  const area = items.find((item) => (item.key.split("-dem-").pop() ?? item.key) === "area");
  const chosen = area ?? items[0];
  return new Set(chosen ? [chosen.key] : []);
};

interface DownloadReportsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The survey itself: whether it asks depth questions is a fact of the draft. */
  draft: SurveyDraft;
  results: SurveyResults;
  entries: readonly DownloadEntry[];
  onStart: (request: ReportRequest) => void;
  /** Retry path only — a finished report has already reached the browser. */
  onDeliver: (id: string) => void;
  onShare: (id: string) => void;
}

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
  draft,
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
  const segmentItems = React.useMemo(
    () => segments.map((segment) => ({ id: segment.key, label: segment.label })),
    [segments]
  );
  const hasNps = results.nps !== null;
  // Anonymity travels with the measurement, so every promise the drawer makes
  // about identities is read off the draft instead of written into the copy.
  const isAnonymous = draft.visibility === "anonymous";
  const hasDepth = React.useMemo(() => hasNpsDepthQuestions(draft), [draft]);

  // --- Configuration state ------------------------------------------------
  const [kind, setKind] = React.useState<ReportKind>("pdf");

  // Las secciones del ejecutivo arrancan todas encendidas — el documento
  // completo es el estándar — y se pueden apagar una a una para un comité que
  // no quiere el heatmap o un área que no necesita el anexo.
  const availableSections = React.useMemo(
    () =>
      PDF_SECTIONS.filter(
        (section) =>
          (!section.needsSegments || hasSegments) && (!section.needsNps || hasNps)
      ).map((section) => section.id),
    [hasSegments, hasNps]
  );
  const [pdfSections, setPdfSections] = React.useState<ReadonlySet<PdfSectionId>>(
    () => new Set(availableSections)
  );

  // Cada bloque configurable elige sus propios demográficos, igual que las
  // hojas del XLSX.
  const depthSegments = React.useMemo(() => reportableSegments(segments), [segments]);
  const depthSegmentItems = React.useMemo(
    () => depthSegments.map((segment) => ({ id: segment.key, label: segment.label })),
    [depthSegments]
  );

  /**
   * El corte con el que arranca cada bloque configurable: área, y nada más.
   *
   * Precargar todos los demográficos parece generoso y no lo es — cuatro
   * bloques por cinco demográficos son veinte grillas que nadie pidió, y el
   * lector descubre el tamaño del archivo después de generarlo. Área es la
   * unidad por la que se asignan presupuestos, líderes y planes, así que es la
   * que casi siempre se quiere; las demás están a un clic.
   */
  const defaultSegmentKeys = React.useMemo(
    () => areaFirst(depthSegments),
    [depthSegments]
  );
  const defaultXlsxSegmentKeys = React.useMemo(() => areaFirst(segments), [segments]);

  const [pdfSegmentSlots, setPdfSegmentSlots] = React.useState<
    Readonly<Record<PdfSegmentSlot, ReadonlySet<string>>>
  >(() => ({
    participation: defaultSegmentKeys,
    heatmap: defaultSegmentKeys,
    nps: defaultSegmentKeys,
    gaps: defaultSegmentKeys,
  }));
  const setSlot = (slot: PdfSegmentSlot, next: ReadonlySet<string>) =>
    setPdfSegmentSlots((current) => ({ ...current, [slot]: next }));

  // Las secciones cuyo detalle de preguntas se imprime. Todas por defecto.
  const questionSectionItems = React.useMemo(
    () =>
      results.sections.map((section) => ({
        id: section.id,
        label: `${section.numbering}. ${section.title}`,
      })),
    [results.sections]
  );
  const [pdfQuestionSections, setPdfQuestionSections] = React.useState<ReadonlySet<string>>(
    () => new Set(results.sections.map((section) => section.id))
  );

  const availableSheets = React.useMemo(
    () =>
      XLSX_SHEETS.filter(
        (sheet) =>
          (!sheet.needsNps || hasNps) &&
          (!sheet.needsSegments || hasSegments) &&
          (!sheet.needsDepth || hasDepth)
      ).map((sheet) => sheet.id),
    [hasNps, hasSegments, hasDepth]
  );
  const [xlsxSheets, setXlsxSheets] = React.useState<ReadonlySet<XlsxSheetId>>(
    () => new Set(availableSheets)
  );

  // Las tres tandas del libro se configuran como las secciones del PDF: el
  // interruptor de la hoja las enciende, y su propio selector decide el corte.
  const [xlsxSegmentSlots, setXlsxSegmentSlots] = React.useState<
    Readonly<Record<XlsxSegmentSlot, ReadonlySet<string>>>
  >(() => ({
    participation: defaultXlsxSegmentKeys,
    heatmap: defaultXlsxSegmentKeys,
    nps: defaultXlsxSegmentKeys,
  }));
  const setXlsxSlot = (slot: XlsxSegmentSlot, next: ReadonlySet<string>) =>
    setXlsxSegmentSlots((current) => ({ ...current, [slot]: next }));

  /** Los demográficos de una tanda, vacíos si su hoja está apagada. */
  const xlsxSlotKeys = (slot: XlsxSegmentSlot, sheet: XlsxSheetId): readonly string[] =>
    xlsxSheets.has(sheet) ? [...xlsxSegmentSlots[slot]] : [];

  const [filterEnabled, setFilterEnabled] = React.useState(false);
  const [filterKey, setFilterKey] = React.useState<string>(() => segments[0]?.key ?? "");
  const [filterOptionIds, setFilterOptionIds] = React.useState<ReadonlySet<string>>(
    () => new Set()
  );

  // The open comments themselves, so the configuration can be about *this*
  // measurement: how many comments each reading holds and which themes the
  // model actually tagged, rather than three generic labels.
  const openComments = React.useMemo(
    () => buildOpenComments(draft, results, buildRespondents(draft, results)),
    [draft, results]
  );
  const sentimentCounts = React.useMemo(() => {
    const counts: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
    for (const comment of openComments) counts[comment.aiSentiment] += 1;
    return counts;
  }, [openComments]);
  const topicRows = React.useMemo(() => topicTotals(openComments), [openComments]);

  // Same shape as the segment toggles in "Resultados generales": off means no
  // filter (todos entran), on reveals a multi-select to narrow the pick. Comes
  // on by default — with every option pre-checked below — so the multi-select
  // is visible right away instead of hidden behind an extra click.
  const [sentimentFilterEnabled, setSentimentFilterEnabled] = React.useState(true);
  const [selectedSentiments, setSelectedSentiments] = React.useState<ReadonlySet<string>>(
    () => new Set<string>(SENTIMENT_ORDER)
  );
  const sentimentItems = React.useMemo(
    () =>
      SENTIMENT_ORDER.map((id) => ({
        id,
        label: `${SENTIMENT_STYLES[id].label} (${countFormat(sentimentCounts[id])})`,
      })),
    [sentimentCounts]
  );

  const [topicFilterEnabled, setTopicFilterEnabled] = React.useState(true);
  const [selectedTopics, setSelectedTopics] = React.useState<ReadonlySet<string>>(
    () => new Set(topicRows.map((row) => row.topic))
  );
  const topicItems = React.useMemo(
    () =>
      topicRows.map((row) => ({
        id: row.topic,
        label: `${row.topic} (${countFormat(row.total)})`,
      })),
    [topicRows]
  );

  const activeType = reportTypeFor(kind);
  const preparingCount = entries.filter((entry) => entry.status === "preparing").length;

  // The filter only reaches the request when it can actually narrow the file —
  // see `populationFilterApplies` — so a report that hides the card never
  // carries a leftover selection from the report the reader looked at before.
  const filterApplies = populationFilterApplies(kind, isAnonymous);
  const activeFilters = React.useMemo(
    () =>
      filterApplies && filterEnabled && filterOptionIds.size > 0
        ? [...filterOptionIds].map((optionId) => ({ key: filterKey, optionId }))
        : [],
    [filterApplies, filterEnabled, filterOptionIds, filterKey]
  );
  const scope = React.useMemo(
    () => populationScope(draft, results, activeFilters),
    [draft, results, activeFilters]
  );
  const blocked = blockedReason(scope);

  const toggleIn = <T,>(set: ReadonlySet<T>, value: T): ReadonlySet<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const handleDownload = () => {
    onStart({
      kind,
      participationSegments: xlsxSlotKeys("participation", "participation-by"),
      heatmapSegments: xlsxSlotKeys("heatmap", "heatmap-by"),
      npsSegments: hasNps ? xlsxSlotKeys("nps", "nps-by") : [],
      xlsxSheets: XLSX_SHEETS.map((sheet) => sheet.id).filter((id) => xlsxSheets.has(id)),
      pdfSections: PDF_SECTIONS.map((section) => section.id).filter(
        (id) => availableSections.includes(id) && pdfSections.has(id)
      ),
      pdfSegments: {
        participation: [...pdfSegmentSlots.participation],
        heatmap: [...pdfSegmentSlots.heatmap],
        nps: [...pdfSegmentSlots.nps],
        gaps: [...pdfSegmentSlots.gaps],
      },
      pdfQuestionSections: [...pdfQuestionSections],
      commentSentiments: sentimentFilterEnabled
        ? ([...selectedSentiments] as Sentiment[])
        : [...SENTIMENT_ORDER],
      commentTopics:
        topicFilterEnabled && selectedTopics.size < topicRows.length ? [...selectedTopics] : [],
      filters: activeFilters,
    });
    setActiveTab("downloads");
  };

  /**
   * Un libro sin hojas no es un reporte.
   *
   * Encender una tanda por demográfico y dejar su selector vacío no cuenta: esa
   * hoja no llega a existir, así que un libro que solo tuviera eso saldría en
   * blanco.
   */
  const xlsxHasContent = availableSheets.some((id) => {
    if (!xlsxSheets.has(id)) return false;
    const slot = XLSX_SHEETS.find((sheet) => sheet.id === id)?.segmentSlot;
    return slot ? xlsxSegmentSlots[slot].size > 0 : true;
  });

  // Un PDF sin secciones no es un reporte.
  const pdfHasContent = availableSections.some((id) => pdfSections.has(id));

  /** Cuántas secciones se imprimen — el contador de la tarjeta del PDF. */
  const pdfSectionCount = availableSections.filter((id) => pdfSections.has(id)).length;
  /**
   * Cuántas pestañas trae el libro. No es cuántas hojas están encendidas: una
   * tanda por demográfico produce una pestaña por cada demográfico elegido, así
   * que el contador cuenta pestañas reales del archivo.
   */
  const xlsxTabCount = availableSheets.reduce((total, id) => {
    if (!xlsxSheets.has(id)) return total;
    const slot = XLSX_SHEETS.find((sheet) => sheet.id === id)?.segmentSlot;
    return total + (slot ? xlsxSegmentSlots[slot].size : 1);
  }, 0);

  const canDownload =
    blocked === null &&
    (kind !== "pdf" || pdfHasContent) &&
    (kind !== "xlsx" || xlsxHasContent) &&
    (kind !== "comments" ||
      ((!sentimentFilterEnabled || selectedSentiments.size > 0) &&
        (!topicFilterEnabled || selectedTopics.size > 0)));

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
        <SheetFooter className="border-t border-border/60 bg-surface px-4 py-3">
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
          /* Cada parte de la configuración —qué formato, qué lleva dentro, para
             quién— en su propia tarjeta sobre el fondo del drawer, con la misma
             anatomía que los drawers de demográficos: chip del icono, título,
             la línea que explica para qué sirve y, bajo una divisoria, sus
             controles. */
          <div className="flex flex-1 flex-col gap-3 bg-background px-4 py-3">
            <DrawerSection
              icon={FileDown}
              tone="brand"
              title="Tipo de reporte"
              hint="Cada formato trae su propia personalización debajo."
            >
              {/*
                * Una sola lista dentro del marco en vez de cinco tarjetas
                * sueltas: las filas comparten fondo y solo la seleccionada
                * despliega su descripción. Cinco descripciones permanentes
                * eran ~200px de texto que el lector ya decidió no leer; la del
                * formato elegido es la única que informa la descarga que viene.
                */}
              <fieldset className="rounded-xl border border-border/60 bg-background p-2">
                <legend className="sr-only">Tipo de reporte</legend>
                <div className="flex flex-col gap-2">
                  {REPORT_TYPES.map((type) => (
                    <ReportTypeRow
                      key={type.kind}
                      type={type}
                      description={reportDescriptionFor(type.kind, isAnonymous)}
                      selected={kind === type.kind}
                      onSelect={() => setKind(type.kind)}
                    />
                  ))}
                </div>
              </fieldset>
            </DrawerSection>

            {/*
              * Cada bloque del documento es una fila con su interruptor y,
              * debajo, su propia personalización. La descripción larga vive en
              * el `title` de la fila —un hover la trae de vuelta— salvo cuando
              * explica por qué la fila está apagada, y el corte del heatmap
              * sigue viviendo dentro del heatmap.
              */}
            {kind === "pdf" && (
              <DrawerSection
                icon={LayoutList}
                tone="brand"
                title="Secciones del reporte"
                hint="Se imprimen en el orden de la lista y el número es su posición en el PDF."
                badge={`${pdfSectionCount}`}
              >
                <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-2">
                  {PDF_SECTIONS.map((section) => {
                    const unavailable = !availableSections.includes(section.id);
                    const enabled = !unavailable && pdfSections.has(section.id);
                    // El número que se imprime no es la posición en el
                    // catálogo sino la que queda tras apagar secciones: el
                    // panel muestra el índice real del documento.
                    const printedIndex = PDF_SECTIONS.filter(
                      (candidate) =>
                        availableSections.includes(candidate.id) &&
                        pdfSections.has(candidate.id)
                    ).findIndex((candidate) => candidate.id === section.id);

                    const slot = section.segmentSlot;
                    const picker =
                      slot && depthSegmentItems.length > 0
                        ? {
                            items: depthSegmentItems,
                            selected: pdfSegmentSlots[slot],
                            onChange: (next: ReadonlySet<string>) => setSlot(slot, next),
                            placeholder: "Selecciona demográficos",
                          }
                        : section.picksSections && questionSectionItems.length > 0
                          ? {
                              items: questionSectionItems,
                              selected: pdfQuestionSections,
                              onChange: setPdfQuestionSections,
                              placeholder: "Selecciona secciones",
                            }
                          : null;

                    return (
                      <ConfigSectionRow
                        key={section.id}
                        index={printedIndex >= 0 ? `${printedIndex + 1}` : null}
                        label={section.label}
                        description={section.description}
                        unavailableReason={
                          unavailable
                            ? section.needsNps
                              ? "Esta medición no incluyó pregunta eNPS"
                              : "Esta encuesta no recogió demográficos"
                            : null
                        }
                        enabled={enabled}
                        disabled={unavailable}
                        onEnabledChange={() =>
                          setPdfSections(toggleIn(pdfSections, section.id))
                        }
                        pickerLabel={section.pickerLabel}
                        pickerEmptyHint={section.pickerEmptyHint}
                        picker={picker}
                      />
                    );
                  })}
                </div>
                {!pdfHasContent && (
                  <span className="mt-2 block text-[12px] font-medium text-status-negative">
                    Enciende al menos una sección para poder descargar.
                  </span>
                )}
              </DrawerSection>
            )}

            {/*
              * El libro se configura igual que el PDF: una hoja por fila, con
              * su interruptor y su propio selector. El número es la posición de
              * la pestaña en el archivo, así que las tandas por demográfico
              * muestran un rango — "7–9" para tres demográficos — y no un solo
              * número que mentiría sobre cuántas hojas produce.
              */}
            {kind === "xlsx" && (
              <DrawerSection
                icon={Table2}
                tone="brand"
                title="Hojas del libro"
                hint="Cada hoja encendida es una pestaña; las tandas por demográfico producen una por cada uno."
                badge={`${xlsxTabCount}`}
              >
                <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-2">
                  {XLSX_SHEETS.map((sheet) => {
                    const unavailable = !availableSheets.includes(sheet.id);
                    const enabled = !unavailable && xlsxSheets.has(sheet.id);
                    const slot = sheet.segmentSlot;

                    // Cuántas pestañas produce cada hoja encendida antes de
                    // esta: una tanda cuenta tantas como demográficos tenga.
                    const tabsBefore = XLSX_SHEETS.filter(
                      (candidate) =>
                        availableSheets.includes(candidate.id) &&
                        xlsxSheets.has(candidate.id) &&
                        XLSX_SHEETS.indexOf(candidate) < XLSX_SHEETS.indexOf(sheet)
                    ).reduce(
                      (total, candidate) =>
                        total +
                        (candidate.segmentSlot
                          ? xlsxSegmentSlots[candidate.segmentSlot].size
                          : 1),
                      0
                    );
                    const own = slot ? xlsxSegmentSlots[slot].size : 1;

                    return (
                      <ConfigSectionRow
                        key={sheet.id}
                        index={
                          !enabled || own === 0
                            ? null
                            : own === 1
                              ? `${tabsBefore + 1}`
                              : `${tabsBefore + 1}–${tabsBefore + own}`
                        }
                        label={sheet.label}
                        description={sheet.description}
                        unavailableReason={
                          !unavailable
                            ? null
                            : sheet.needsNps
                              ? "Esta medición no incluyó pregunta eNPS"
                              : sheet.needsDepth
                                ? "Ninguna pregunta activó preguntas de profundidad"
                                : "Esta encuesta no recogió demográficos"
                        }
                        enabled={enabled}
                        disabled={unavailable}
                        onEnabledChange={() => setXlsxSheets(toggleIn(xlsxSheets, sheet.id))}
                        pickerLabel={sheet.pickerLabel}
                        pickerEmptyHint={sheet.pickerEmptyHint}
                        picker={
                          slot && segmentItems.length > 0
                            ? {
                                items: segmentItems,
                                selected: xlsxSegmentSlots[slot],
                                onChange: (next) => setXlsxSlot(slot, next),
                                placeholder: "Selecciona demográficos",
                              }
                            : null
                        }
                      />
                    );
                  })}
                </div>
                {!xlsxHasContent && (
                  <span className="mt-2 block text-[12px] font-medium text-status-negative">
                    Enciende al menos una hoja para poder descargar.
                  </span>
                )}
              </DrawerSection>
            )}

            {kind === "comments" && (
              <DrawerSection
                icon={MessageSquareText}
                tone="brand"
                title="Comentarios que entran"
                hint="Con los filtros apagados entran todos los comentarios abiertos de la medición."
              >
                <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-2">
                  <ToggleMultiSelectRow
                    title="Sentimiento de los comentarios"
                    hint="Sin filtrar, el reporte incluye los tres sentimientos"
                    enabled={sentimentFilterEnabled}
                    onEnabledChange={setSentimentFilterEnabled}
                    items={sentimentItems}
                    selected={selectedSentiments}
                    onChange={setSelectedSentiments}
                    placeholder="Selecciona sentimientos"
                    emptyWarning="Selecciona al menos un sentimiento para poder descargar."
                  />
                  {topicRows.length > 0 && (
                    <ToggleMultiSelectRow
                      title="Temas de los comentarios"
                      hint="Sin filtrar, el reporte incluye todos los temas etiquetados por la IA"
                      enabled={topicFilterEnabled}
                      onEnabledChange={setTopicFilterEnabled}
                      items={topicItems}
                      selected={selectedTopics}
                      onChange={setSelectedTopics}
                      placeholder="Selecciona temas"
                      emptyWarning="Selecciona al menos un tema para poder descargar."
                    />
                  )}
                </div>
              </DrawerSection>
            )}

            {/* Los dos formatos planos no tienen nada que configurar, así que
                su tarjeta es la explicación de lo que van a traer. */}
            {(kind === "questions-csv" || kind === "answers-csv") && (
              <DrawerSection
                icon={Info}
                tone="brand"
                title="Contenido del archivo"
                hint="Este formato sale completo: no tiene bloques que encender ni apagar."
              >
                <p className="rounded-xl border border-border/60 bg-background px-3 py-2.5 text-[13px] leading-relaxed text-text-secondary">
                  {reportDetailFor(kind, isAnonymous)}
                </p>
              </DrawerSection>
            )}

            {hasSegments && filterApplies && (
              <PopulationFilterCard
                segments={segments}
                scope={scope}
                blocked={blocked}
                enabled={filterEnabled}
                onEnabledChange={setFilterEnabled}
                filterKey={filterKey}
                onFilterKeyChange={(key) => {
                  setFilterKey(key);
                  setFilterOptionIds(new Set());
                }}
                selectedOptionIds={filterOptionIds}
                onSelectedOptionIdsChange={setFilterOptionIds}
              />
            )}
          </div>
        ) : (
          <DownloadsList entries={entries} results={results} onDeliver={onDeliver} onShare={onShare} />
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
  const tab = (id: "reports" | "downloads", label: string, Icon: LucideIcon, badge?: number) => {
    const selected = activeTab === id;
    return (
      <button
        type="button"
        onClick={() => onTabChange(id)}
        aria-pressed={selected}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors",
          selected
            ? "bg-surface text-primary shadow-sm"
            : "text-muted-foreground hover:text-text-primary"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex shrink-0 items-center bg-background px-4 py-3">
      <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
        {tab("reports", "Reportes", FileText)}
        {tab("downloads", "Descargas", Download, downloadsBadge)}
      </div>
    </div>
  );
}

/**
 * Una fila del selector de formato: icono, título, radio, y — solo en la
 * seleccionada — su descripción.
 *
 * Las cinco descripciones a la vez eran una pantalla de texto que se leía una
 * sola vez; la fila elegida es la única cuya letra pequeña describe el archivo
 * que el botón de abajo va a producir. El anillo de foco va por dentro
 * (`ring-inset`) porque las filas comparten un contenedor recortado con
 * `overflow-hidden`: un anillo exterior se cercena contra los vecinos.
 */
function ReportTypeRow({
  type,
  description,
  selected,
  onSelect,
}: {
  type: (typeof REPORT_TYPES)[number];
  /** Read off the survey — see `reportDescriptionFor`. */
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      // Misma receta de "esta es la elegida" que las tarjetas de tipo del
      // editor de demográficos: borde y fondo teñidos en el tono, y la
      // etiqueta en el acento. En reposo, gris sobre la superficie.
      style={selected ? toneSelected("brand") : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30",
        selected ? "shadow-sm" : "border-border/60 bg-surface hover:bg-muted/40"
      )}
    >
      <span
        style={selected ? toneChip("brand") : undefined}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          !selected && "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-[13px] font-semibold leading-tight",
            !selected && "text-text-primary"
          )}
        >
          {type.title}
        </span>
        {selected && (
          <span className="text-[12px] leading-snug text-text-muted">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary" : "border-border"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
    </button>
  );
}

/**
 * Un bloque de contenido — una sección del PDF o una hoja del XLSX — como fila
 * de la lista agrupada: número, título, interruptor y, si el bloque se
 * despliega, el selector que decide cómo, en una sola línea con su rótulo.
 *
 * La descripción larga vive en el `title` de la fila — un hover la trae de
 * vuelta — salvo cuando explica por qué la fila está apagada: esa razón sí se
 * imprime, porque un interruptor deshabilitado sin explicación parece un bug.
 * El selector aparece solo con el interruptor encendido: configurar el corte
 * de algo que no se va a generar es trabajo que se descarta solo.
 */
function ConfigSectionRow({
  index,
  label,
  description,
  unavailableReason,
  enabled,
  disabled,
  onEnabledChange,
  pickerLabel,
  pickerEmptyHint,
  picker,
}: {
  /**
   * Posición en el archivo, o null cuando el bloque no sale. Es texto y no
   * número porque una tanda de hojas ocupa un rango ("7–9"), no un lugar.
   */
  index: string | null;
  label: string;
  description: string;
  /** Por qué esta medición no puede producir el bloque, o null si puede. */
  unavailableReason: string | null;
  enabled: boolean;
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  pickerLabel?: string;
  pickerEmptyHint?: string;
  picker: {
    items: readonly { id: string; label: string }[];
    selected: ReadonlySet<string>;
    onChange: (next: ReadonlySet<string>) => void;
    placeholder: string;
  } | null;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-border/60 bg-surface px-3 py-2.5 transition-colors",
        disabled && "opacity-45"
      )}
      title={unavailableReason ?? description}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-text-primary">
            {index !== null && (
              <span className="inline-flex h-[17px] shrink-0 items-center justify-center rounded-xs bg-primary/10 px-[5px] text-[11px] font-bold tabular-nums text-primary">
                {index}
              </span>
            )}
            <span className="truncate">{label}</span>
          </span>
          {unavailableReason && (
            <span className="text-[12px] leading-snug text-muted-foreground">
              {unavailableReason}
            </span>
          )}
        </div>
        <Switch
          checked={enabled}
          disabled={disabled}
          onCheckedChange={onEnabledChange}
          className="shrink-0"
        />
      </div>
      {enabled && picker && (
        <div className="flex flex-col gap-1.5">
          {/*
            * Rótulo a la izquierda y selector en una columna de ancho fijo a la
            * derecha, alineado con el interruptor de arriba.
            *
            * Dejar que el selector ocupara el resto de la línea lo hacía
            * arrancar en una `x` distinta en cada fila — "Desglosar por" y
            * "Desglosar además por" no miden lo mismo — y la lista bajaba en
            * escalera. Con la columna fija, los selectores comparten borde
            * izquierdo y derecho, y la lista lee como una tabla de dos
            * columnas.
            */}
          <div className="flex items-center justify-between gap-3">
            {pickerLabel && (
              <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-muted-foreground">
                {pickerLabel}
              </span>
            )}
            <div className="w-[184px] shrink-0">
              <MultiSelectDropdown
                compact
                items={picker.items}
                selected={picker.selected}
                onToggle={(id) => {
                  const next = new Set(picker.selected);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  picker.onChange(next);
                }}
                onSelectAll={(checked) =>
                  picker.onChange(checked ? new Set(picker.items.map((item) => item.id)) : new Set())
                }
                placeholder={picker.placeholder}
              />
            </div>
          </div>
          {picker.selected.size === 0 && pickerEmptyHint && (
            <span className="text-[12px] leading-snug text-muted-foreground">
              {pickerEmptyHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A row that either includes everything (switch off) or narrows to a pick
 * (switch on, revealing a multi-select). Same on/off-plus-multi-select shape
 * as the "por demográfico" breakdowns, in the grouped-list body the whole
 * drawer now uses — the hint stays visible because here it *is* the promise
 * ("sin filtrar entra todo"), not a description of content.
 */
function ToggleMultiSelectRow({
  title,
  hint,
  enabled,
  onEnabledChange,
  items,
  selected,
  onChange,
  placeholder = "Selecciona",
  emptyWarning,
}: {
  title: string;
  hint: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  items: readonly { id: string; label: string }[];
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
  placeholder?: string;
  /** Shown under the dropdown when the toggle is on but nothing is picked. */
  emptyWarning?: string;
}) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  const selectAll = (checked: boolean) => {
    onChange(checked ? new Set(items.map((item) => item.id)) : new Set());
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border/60 bg-surface px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] font-semibold leading-tight text-text-primary">
            {title}
          </span>
          <span className="text-[12px] leading-snug text-muted-foreground">{hint}</span>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} className="shrink-0" />
      </div>
      {enabled && (
        <>
          {/* Misma columna de 184px que los bloques del PDF y del XLSX: el
              selector cae bajo el interruptor que lo encendió. */}
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-muted-foreground">
              Incluir
            </span>
            <div className="w-[184px] shrink-0">
              <MultiSelectDropdown
                compact
                items={items}
                selected={selected}
                onToggle={toggle}
                onSelectAll={selectAll}
                placeholder={placeholder}
              />
            </div>
          </div>
          {emptyWarning && selected.size === 0 && (
            <span className="text-[12px] font-medium text-status-negative">{emptyWarning}</span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * A `Select`-style trigger that opens onto a checklist instead of a
 * single-pick list — closed, it reads like any other dropdown; open, a
 * master "Todos" row (indeterminate when only some items are checked) sits
 * above the individual options so picking everything or exactly a few both
 * take one click.
 */
function MultiSelectDropdown({
  items,
  selected,
  onToggle,
  onSelectAll,
  placeholder = "Selecciona",
  allLabel = "Todos",
  compact = false,
}: {
  items: readonly { id: string; label: string }[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  placeholder?: string;
  allLabel?: string;
  /** The one-line variant the grouped-list rows embed next to their label. */
  compact?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [width, setWidth] = React.useState<number>();
  // Radix's Sheet locks background scroll while open, exempting only its own
  // content element. A popover portals to `document.body` by default — a
  // sibling of that content, outside the exemption — so its own scrollable
  // list gets the lock treatment too and the mouse wheel does nothing over
  // it. Mounting the portal inside the sheet's content element instead makes
  // the list a real descendant of the exempted node, so its scroll passes.
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useLayoutEffect(() => {
    if (open && triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth);
      setContainer(triggerRef.current.closest<HTMLElement>('[data-slot="sheet-content"]'));
    }
  }, [open]);

  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const someSelected = items.some((item) => selected.has(item.id));
  const summary = allSelected
    ? allLabel
    : someSelected
      ? items
          .filter((item) => selected.has(item.id))
          .map((item) => item.label)
          .join(", ")
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            compact ? "h-8 px-2.5 text-[13px]" : "h-10 px-3 text-[13px]"
          )}
        >
          {/* The trigger is a fixed 184px column, so a multi-pick summary
              truncates by design — `title` is how the full list stays
              reachable without widening every row to its longest selection. */}
          <span
            title={summary}
            className={cn(
              "truncate",
              someSelected || allSelected ? "text-text-primary" : "text-muted-foreground"
            )}
          >
            {summary}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        container={container ?? undefined}
        style={width ? { width } : undefined}
        className="flex max-h-[280px] flex-col gap-0 overflow-hidden p-0"
      >
        <label className="flex cursor-pointer items-center gap-3 border-b border-border/70 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/40">
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => onSelectAll(checked === true)}
          />
          <span className="text-[13px] font-semibold text-text-primary">{allLabel}</span>
        </label>
        {/* `min-h-0` is load-bearing: without it a flex child never shrinks
            below its content height, so it grows past the parent's
            `max-h-[280px]` instead of scrolling — the parent's
            `overflow-hidden` then just clips the extra rows and the mouse
            wheel has nothing to scroll. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40"
            >
              <Checkbox checked={selected.has(item.id)} onCheckedChange={() => onToggle(item.id)} />
              <span className="text-[13px] text-text-primary">{item.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PopulationFilterCard({
  segments,
  scope,
  blocked,
  enabled,
  onEnabledChange,
  filterKey,
  onFilterKeyChange,
  selectedOptionIds,
  onSelectedOptionIdsChange,
}: {
  segments: readonly SegmentDefinition[];
  /** What the current selection holds — see `populationScope`. */
  scope: PopulationScope;
  /** Why this population cannot be reported, or null when it can. */
  blocked: string | null;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  filterKey: string;
  onFilterKeyChange: (key: string) => void;
  selectedOptionIds: ReadonlySet<string>;
  onSelectedOptionIdsChange: (next: ReadonlySet<string>) => void;
}) {
  const segment = segments.find((candidate) => candidate.key === filterKey);

  const toggle = (id: string) => {
    const next = new Set(selectedOptionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedOptionIdsChange(next);
  };
  const selectAll = (checked: boolean) => {
    onSelectedOptionIdsChange(
      checked && segment ? new Set(segment.options.map((option) => option.id)) : new Set()
    );
  };

  return (
    // El interruptor manda sobre la tarjeta entera —no hay filtro que
    // configurar mientras esté apagado—, así que vive en la cabecera junto al
    // título y no dentro del cuerpo.
    <DrawerSection
      icon={Filter}
      tone="brand"
      title="Filtrar población"
      hint="Genera el reporte solo para los grupos que elijas."
      action={<Switch checked={enabled} onCheckedChange={onEnabledChange} />}
    >
      {enabled ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-2.5">
          {/* Rótulo y control por línea, en la misma columna de 184px que los
              bloques de arriba: dos selectores lado a lado en un ancho de
              drawer quedaban de ~90px y truncaban el nombre del grupo. */}
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-muted-foreground">
              Demográfico
            </span>
            <Select value={filterKey} onValueChange={onFilterKeyChange}>
              <SelectTrigger className="!h-8 w-[184px] shrink-0 bg-background text-[13px]">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {segments.map((candidate) => (
                  <SelectItem key={candidate.key} value={candidate.key}>
                    {candidate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {segment && (
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-muted-foreground">
                Grupos
              </span>
              <div className="w-[184px] shrink-0">
                <MultiSelectDropdown
                  compact
                  items={segment.options}
                  selected={selectedOptionIds}
                  onToggle={toggle}
                  onSelectAll={selectAll}
                  placeholder={`Selecciona ${segment.label.toLowerCase()}`}
                />
              </div>
            </div>
          )}
          {/* The count travels with the selection, not only with the refusal:
              a reader who sees "42 respuestas" before downloading understands
              the rule the one time it does stop them. */}
          {selectedOptionIds.size > 0 &&
            (blocked ? (
              <div className="flex items-start gap-2 rounded-lg bg-status-negative/10 px-3 py-2.5">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-negative" />
                <span className="text-[12px] font-medium leading-snug text-status-negative">
                  {blocked}
                </span>
              </div>
            ) : (
              <span className="text-[12px] leading-snug text-muted-foreground">
                {countFormat(scope.completed)}
                {scope.completed === 1 ? " respuesta" : " respuestas"} en la selección
                {scope.anonymous ? ` · mínimo por grupo: ${scope.threshold}` : ""}
              </span>
            ))}
        </div>
      ) : null}
    </DrawerSection>
  );
}

/** One theme as the configuration lists it: its name and how many comments carry it. */
interface TopicTotal {
  topic: string;
  total: number;
}

/**
 * The themes the model tagged, biggest first.
 *
 * Ordered by volume rather than alphabetically: the configuration is a place to
 * decide what is worth exporting, and the theme two hundred people wrote about
 * should not sit below one three people mentioned because of its initial.
 */
const topicTotals = (comments: readonly OpenComment[]): readonly TopicTotal[] => {
  const totals = new Map<string, number>();
  for (const comment of comments) {
    totals.set(comment.topic, (totals.get(comment.topic) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([topic, total]) => ({ topic, total }))
    .sort((a, b) => b.total - a.total || a.topic.localeCompare(b.topic, "es"));
};

const countFormat = (value: number) => new Intl.NumberFormat("es-CO").format(value);

function DownloadsList({
  entries,
  results,
  onDeliver,
  onShare,
}: {
  entries: readonly DownloadEntry[];
  results: SurveyResults;
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
    <div className="flex flex-1 flex-col gap-3 bg-background px-4 py-3">
      <DrawerSection
        icon={History}
        tone="brand"
        title="Lista de descargas"
        hint="Los reportes que pediste en los últimos 7 días, con la configuración de cada uno."
        badge={entries.length > 0 ? `${entries.length}` : undefined}
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <History className="h-6 w-6" strokeWidth={2} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[13.5px] font-semibold text-text-primary">
                Sin descargas recientes
              </span>
              <span className="max-w-[260px] text-[12px] leading-relaxed text-text-muted">
                Tus reportes generados aparecerán aquí para acceso rápido.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-2">
            {entries.map((entry) => (
              <DownloadRow
                key={entry.id}
                entry={entry}
                results={results}
                isLatest={entry.id === latestDeliveredId}
                onDeliver={onDeliver}
                onShare={onShare}
              />
            ))}
          </div>
        )}
      </DrawerSection>
    </div>
  );
}

function DownloadRow({
  entry,
  results,
  isLatest,
  onDeliver,
  onShare,
}: {
  entry: DownloadEntry;
  results: SurveyResults;
  isLatest: boolean;
  onDeliver: (id: string) => void;
  onShare: (id: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const Icon = reportTypeFor(entry.kind).icon;
  const isPreparing = entry.status === "preparing";
  const needsRetry = !isPreparing && !entry.delivered;
  const showsCheck = !isPreparing && !needsRetry && isLatest;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-surface transition-colors",
        detailsOpen ? "border-border/80" : "border-border/60"
      )}
    >
      {/* ── Fila principal ── */}
      <div className="flex items-center gap-3 px-3 py-2.5">
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
            <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
          ) : (
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[13px] font-semibold text-text-primary" title={entry.fileName}>
            {entry.fileName}
          </span>
          {isPreparing ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                  style={{ width: `${entry.progress}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-[12px] font-bold tabular-nums text-primary">
                {Math.round(entry.progress)}%
              </span>
            </div>
          ) : (
            <span
              className={cn(
                "text-[12px]",
                needsRetry ? "font-semibold text-status-warning" : "text-muted-foreground"
              )}
            >
              {needsRetry
                ? "La descarga quedó bloqueada por el navegador"
                : (() => {
                    const date = new Date(entry.startedAt);
                    const day = date.getDate();
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
                  })()}
            </span>
          )}
        </div>

        {isPreparing ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Preparando reporte" />
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
              onClick={() => onShare(entry.id)}
              title="Compartir"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="sr-only">Compartir</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
              onClick={() => onDeliver(entry.id)}
              title="Descargar"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only">Descargar</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 w-7 p-0 rounded-full transition-colors hover:bg-primary/10 hover:text-primary",
                detailsOpen ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
              onClick={() => setDetailsOpen(!detailsOpen)}
              title="Ver detalle"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-200", detailsOpen && "rotate-180")}
              />
              <span className="sr-only">Ver detalle</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── Panel de detalle ── */}
      {detailsOpen && entry.request && (
        <ReportDetailPanel entry={entry} results={results} />
      )}
    </div>
  );
}

/**
 * Panel de detalle que se despliega bajo cada descarga. Muestra toda la
 * configuración con la que se generó el reporte en una lista compacta
 * de filas etiqueta → valor, con líneas divisoras entre ellas.
 */
function ReportDetailPanel({
  entry,
  results,
}: {
  entry: DownloadEntry;
  results: SurveyResults;
}) {
  const req = entry.request;
  const kind = entry.kind;

  /** Una fila: etiqueta a la izquierda, chips a la derecha. */
  const DetailRow = ({ label, values }: { label: string; values: readonly string[] }) => (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="shrink-0 text-[12px] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap justify-end gap-1">
        {values.length === 0 ? (
          <span className="text-[12px] italic text-muted-foreground">—</span>
        ) : (
          values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );

  // ── PDF ──────────────────────────────────────────────────────────────────
  const pdfRows = kind === "pdf" ? (() => {
    const rows: { key: string; label: string; values: string[] }[] = [];

    const sectionLabels = PDF_SECTIONS.filter(s => req.pdfSections.includes(s.id)).map(s => s.label);
    rows.push({ key: "pdf-sections", label: "Secciones", values: sectionLabels });

    const slotDefs: { slot: PdfSegmentSlot; label: string }[] = [
      { slot: "participation", label: "Participación por" },
      { slot: "heatmap",       label: "Heatmap por" },
      { slot: "nps",           label: "eNPS por" },
      { slot: "gaps",          label: "Brechas por" },
    ];
    for (const { slot, label } of slotDefs) {
      const keys = req.pdfSegments[slot];
      if (keys.length === 0 && !req.pdfSections.includes(
        slot === "participation" ? "participation" :
        slot === "heatmap"       ? "heatmap"       :
        slot === "nps"           ? "nps"           : "gaps"
      )) continue;
      const segLabels = keys.map(key => results.segments.find(s => s.key === key)?.label ?? key);
      rows.push({ key: `pdf-slot-${slot}`, label, values: segLabels });
    }

    if (req.pdfSections.includes("questions")) {
      const qLabels = results.sections
        .filter(s => req.pdfQuestionSections.includes(s.id))
        .map(s => `${s.numbering}. ${s.title}`);
      rows.push({ key: "pdf-qsections", label: "Secciones de preguntas", values: qLabels });
    }

    return rows;
  })() : [];

  // ── XLSX ─────────────────────────────────────────────────────────────────
  const xlsxRows = kind === "xlsx" ? (() => {
    const rows: { key: string; label: string; values: string[] }[] = [];

    const sheetLabels = XLSX_SHEETS.filter(s => req.xlsxSheets.includes(s.id)).map(s => s.label);
    rows.push({ key: "xlsx-sheets", label: "Hojas incluidas", values: sheetLabels });

    const xlsxSlotDefs: { key: "participationSegments" | "heatmapSegments" | "npsSegments"; label: string }[] = [
      { key: "participationSegments", label: "Participación por" },
      { key: "heatmapSegments",       label: "Heatmap por" },
      { key: "npsSegments",           label: "eNPS por" },
    ];
    for (const { key, label } of xlsxSlotDefs) {
      const keys = req[key];
      if (keys.length === 0) continue;
      const segLabels = keys.map(k => results.segments.find(s => s.key === k)?.label ?? k);
      rows.push({ key: `xlsx-${key}`, label, values: segLabels });
    }

    return rows;
  })() : [];

  // ── Comentarios ───────────────────────────────────────────────────────────
  const commentRows = kind === "comments" ? (() => {
    const rows: { key: string; label: string; values: string[] }[] = [];

    const sentLabels = (req.commentSentiments as string[]).map(id =>
      id === "positive" ? "Positivo" : id === "neutral" ? "Neutro" : "Negativo"
    );
    rows.push({ key: "comment-sentiment", label: "Sentimientos", values: sentLabels });

    if (req.commentTopics.length > 0) {
      rows.push({ key: "comment-topics", label: "Temas", values: [...req.commentTopics] });
    }

    return rows;
  })() : [];

  // ── Filtro de población ───────────────────────────────────────────────────
  const filterRows = req.filters && req.filters.length > 0 ? (() => {
    const byKey = new Map<string, string[]>();
    for (const f of req.filters) {
      if (!byKey.has(f.key)) byKey.set(f.key, []);
      const segment = results.segments.find(s => s.key === f.key);
      const option  = segment?.options.find(o => o.id === f.optionId);
      byKey.get(f.key)!.push(option?.label ?? f.optionId);
    }
    return [...byKey.entries()].map(([key, vals]) => {
      const seg = results.segments.find(s => s.key === key);
      return { key: `filter-${key}`, label: `Población · ${seg?.label ?? key}`, values: vals };
    });
  })() : [];

  const allRows = [...pdfRows, ...xlsxRows, ...commentRows, ...filterRows];

  return (
    <div className="divide-y divide-border/40 border-t border-border/40 bg-background px-3">
      {allRows.length === 0 ? (
        <p className="py-3 text-[12px] text-muted-foreground">Sin configuración adicional.</p>
      ) : (
        allRows.map(row => <DetailRow key={row.key} label={row.label} values={row.values} />)
      )}
    </div>
  );
}
