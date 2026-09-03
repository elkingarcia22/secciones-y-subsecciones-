import * as React from "react";
import { ArrowLeft, Users, PieChart, MessageSquare, ListChecks, Target, Sparkles, Tag, ShieldCheck, Lock, CalendarRange, Info, type LucideIcon } from "lucide-react";
import { type SurveyDraft, SURVEY_KIND_LABELS } from "@/components/survey-builder";
import { toneChip, type Tone } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { UbitsTabs, type TabItem } from "@/components/navigation";
import {
  AiAnalysisTab,
  DownloadReportsDrawer,
  DownloadsWidget,
  FavorabilityTab,
  NpsTab,
  ParticipationTab,
  QuestionDetailTab,
  ResultsActionRail,
  useDownloadCenter,
} from "@/components/survey-results";
import { EmptyState } from "@/components/feedback";
import { buildSurveyResults, participationBySegment } from "@/mocks/surveyResults";
import type { SurveyListItem } from "@/mocks/types";
import { SurveyPreviewDrawer, formatPreviewDate } from "@/components/survey-preview";

interface SurveyResultsProps {
  draft: SurveyDraft;
  item: SurveyListItem;
  /** Earlier measurements of the same type, newest first. Drives the trend. */
  history?: readonly SurveyListItem[];
  /** Back to the home list — the breadcrumb already does this, but a button
   *  right on the screen is the one a reader actually reaches for. */
  onBack: () => void;
}

type TabId = "participation" | "favorability" | "questions" | "nps" | "ai";

const TABS: readonly TabItem[] = [
  { id: "participation", label: "Participación", icon: <PieChart className="h-4 w-4" /> },
  { id: "favorability", label: "Favorabilidad", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "questions", label: "Preguntas", icon: <ListChecks className="h-4 w-4" /> },
  { id: "nps", label: "eNPS", icon: <Target className="h-4 w-4" /> },
  { id: "ai", label: "Análisis con IA", icon: <Sparkles className="h-4 w-4 text-ai-gradient" /> },
];

/**
 * Results of a finished measurement.
 *
 * Five views over one aggregate. Análisis con IA is where the reading closes:
 * the AI's own claims first, then the evidence they rest on — priorities,
 * strengths, gaps and voice — as one continuous document.
 *
 * The chosen demographic is screen state, not tab state — going from
 * "participación por área" to "heatmap por área" is one thought, and having to
 * re-pick the segment on arrival breaks it.
 */
export function SurveyResults({ draft, item, history = [], onBack }: SurveyResultsProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("participation");

  const results = React.useMemo(
    () => buildSurveyResults({ draft, item, history }),
    [draft, item, history]
  );

  const [segmentKey, setSegmentKey] = React.useState(() => {
    const perPersonSegment = results.segments.find((s) => s.perPerson);
    return perPersonSegment ? perPersonSegment.key : (results.segments[0]?.key ?? "");
  });
  const segment =
    results.segments.find((candidate) => candidate.key === segmentKey) ?? results.segments[0];

  const [selectedGroupIds, setSelectedGroupIds] = React.useState<ReadonlySet<string>>(new Set());

  // How many people the rail's "Enviar recordatorio" actually reaches — a
  // reminder is only for whoever hasn't finished, so it counts each row's own
  // "faltan" (invited minus completed minus in progress), the same number the
  // table itself reports, rather than the row's full headcount. With nothing
  // ticked it falls back to the survey's own faltan total.
  const participationRows = React.useMemo(
    () => (segment ? participationBySegment(results, segment) : []),
    [results, segment]
  );
  const missingOf = (row: { invited: number; completed: number; inProgress: number }) =>
    Math.max(0, row.invited - row.completed - row.inProgress);
  const reminderParticipants =
    selectedGroupIds.size === 0
      ? missingOf(results.participation)
      : participationRows
          .filter((row) => selectedGroupIds.has(row.id))
          .reduce((sum, row) => sum + missingOf(row), 0);

  // The download center outlives the drawer: closing it must not kill a report
  // mid-preparation, and the floating widget reads the same list.
  const downloads = useDownloadCenter({ draft, results });
  const [downloadsOpen, setDownloadsOpen] = React.useState(false);
  const [widgetDismissed, setWidgetDismissed] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const openDownloads = React.useCallback(() => {
    setDownloadsOpen(true);
    setWidgetDismissed(false);
  }, []);

  const start = formatPreviewDate(draft.startDate);
  const end = formatPreviewDate(draft.endDate);
  const isAnonymous = draft.visibility === "anonymous";

return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between gap-3 bg-background px-4 pt-6 pb-6 border-b border-transparent">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Volver al inicio"
            className="h-9 w-9 shrink-0 bg-surface shadow-card hover:bg-surface-muted"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </Button>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Resultados de la encuesta
          </h1>
        </div>

        {/* The facts used to sit as a row of cards next to the title, but that
            row and the tabs row right below it never share a natural width —
            one always reads as leftover space next to the other. Tucking them
            behind a single "Detalles" trigger keeps the header itself short,
            so there is nothing left to balance against the tabs. */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="shrink-0 gap-2 bg-surface shadow-card hover:bg-surface-muted"
            >
              <Info className="h-4 w-4" strokeWidth={2} />
              Detalles
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <PopoverTitle>Detalles de la encuesta</PopoverTitle>
            <div className="flex flex-col gap-1 pt-1">
              {draft.kind && (
                <DetailRow tone="brand" icon={Tag} label="Tipo" value={SURVEY_KIND_LABELS[draft.kind]} />
              )}
              <DetailRow
                tone="neutral"
                icon={isAnonymous ? ShieldCheck : Users}
                label="Visibilidad"
                value={isAnonymous ? "Anónima" : "Pública"}
              />
              {isAnonymous && (
                <DetailRow tone="warning" icon={Lock} label="Mínimo de respuestas" value={`${results.threshold} respuestas`} />
              )}
              <DetailRow
                tone="positive"
                icon={Users}
                label="Invitados"
                value={results.participation.invited.toLocaleString("es-CO")}
              />
              <DetailRow tone="brand" icon={CalendarRange} label="Período" value={`${start ?? "—"} al ${end ?? "—"}`} />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex shrink-0 px-4 pb-2">
        <UbitsTabs
          tabs={[...TABS]}
          activeTabId={activeTab}
          onTabChange={(id) => {
            setActiveTab(id as TabId);
            // The selection (and its "Enviar a seleccionados" rail action) only
            // makes sense on Participación's own table — it doesn't carry a
            // meaning on the other tabs, so it doesn't carry over to them.
            if (id !== "participation") setSelectedGroupIds(new Set());
          }}
          className="mb-0"
          variant="page"
          fitContent
        />
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {/*
          A persistent breathing room below the nav tabs, present no matter which
          tab is active or how far its content has scrolled. Every tab's own
          sticky controls (the heatmap's filters, the favorability scale toggle)
          stick right below this spacer rather than flush against the tabs —
          "top-3" on those matches this spacer's own height, so the two sit
          back-to-back with no overlap and no uncovered sliver between them.
        */}
        <div aria-hidden className="sticky top-0 z-40 h-4 bg-background" />
        {/* Keyed on the active tab so switching tabs remounts this wrapper and
            replays the entrance cascade — same language as the survey preview
            and the builder steps. `contents` keeps it a layout passthrough. */}
        <div key={activeTab} className="contents cascade-enter">
          {activeTab === "participation" &&
            (segment ? (
              <ParticipationTab
                results={results}
                segment={segment}
                onSegmentChange={setSegmentKey}
                selectedIds={selectedGroupIds}
                onSelectionChange={setSelectedGroupIds}
              />
            ) : (
              <NoSegments />
            ))}

          {activeTab === "favorability" &&
            (segment ? (
              <FavorabilityTab
                results={results}
                segment={segment}
                onSegmentChange={setSegmentKey}
              />
            ) : (
              <NoSegments />
            ))}

          {activeTab === "questions" &&
            (segment ? (
              <QuestionDetailTab
                draft={draft}
                results={results}
                segment={segment}
                onSegmentChange={setSegmentKey}
              />
            ) : (
              <NoSegments />
            ))}

          {activeTab === "nps" && <NpsTab draft={draft} results={results} />}
          {activeTab === "ai" && (
            <AiAnalysisTab
              draft={draft}
              results={results}
              onNavigate={(target) => setActiveTab(target as TabId)}
            />
          )}
        </div>
      </main>

      <ResultsActionRail
        draft={draft}
        results={results}
        segment={segment}
        selectedCount={selectedGroupIds.size}
        reminderParticipants={reminderParticipants}
        onClearSelection={() => setSelectedGroupIds(new Set())}
        onDownload={openDownloads}
        onSendReminders={() => {}}
        onPreview={() => setPreviewOpen(true)}
      />

      <SurveyPreviewDrawer
        draft={draft}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <DownloadReportsDrawer
        open={downloadsOpen}
        onOpenChange={setDownloadsOpen}
        draft={draft}
        results={results}
        entries={downloads.entries}
        onStart={(request) => {
          downloads.start(request);
          setWidgetDismissed(false);
        }}
        onDeliver={downloads.deliver}
        onShare={downloads.share}
      />

      {!downloadsOpen && !widgetDismissed && (
        <DownloadsWidget
          entries={downloads.entries}
          onDeliver={downloads.deliver}
          onShare={downloads.share}
          onOpenDrawer={openDownloads}
          onDismiss={() => setWidgetDismissed(true)}
        />
      )}
    </div>
  );
}

/** One fact about the measurement, as a row inside the "Detalles" popover. */
function DetailRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone: Tone;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={toneChip(tone)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="flex-1 truncate text-[13px] text-text-muted">{label}</span>
      <span className="truncate text-[13px] font-semibold text-text-primary">{value}</span>
    </div>
  );
}

/** Without demographics there is nothing to break the results down by. */
function NoSegments() {
  return (
    <EmptyState
      icon={Users}
      title="Esta encuesta no recogió datos demográficos"
      description="Sin ellos los resultados solo se pueden leer en total. Activa datos demográficos en la próxima medición para poder compararlos por área, sede o antigüedad."
    />
  );
}
