import * as React from "react";
import { Users, PieChart, MessageSquare, ListChecks, Target, Sparkles, LayoutDashboard } from "lucide-react";
import type { SurveyDraft } from "@/components/survey-builder";
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
  SCOPE_ALL,
  VIEW_GENERAL,
  SummaryTab,
  useDownloadCenter,
} from "@/components/survey-results";
import { EmptyState } from "@/components/feedback";
import { buildSurveyResults, participationBySegment } from "@/mocks/surveyResults";
import type { SegmentFilter } from "@/mocks/surveyResults";
import type { SurveyListItem } from "@/mocks/types";

interface SurveyResultsProps {
  draft: SurveyDraft;
  item: SurveyListItem;
  /** Earlier measurements of the same type, newest first. Drives the trend. */
  history?: readonly SurveyListItem[];
}

type TabId = "summary" | "participation" | "favorability" | "questions" | "nps" | "ai";

const TABS: readonly TabItem[] = [
  { id: "summary", label: "Resumen", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "participation", label: "Participación", icon: <PieChart className="h-4 w-4" /> },
  { id: "favorability", label: "Favorabilidad", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "questions", label: "Preguntas", icon: <ListChecks className="h-4 w-4" /> },
  { id: "nps", label: "eNPS", icon: <Target className="h-4 w-4" /> },
  { id: "ai", label: "Análisis con IA", icon: <Sparkles className="h-4 w-4 text-ai-gradient" /> },
];

/**
 * Results of a finished measurement.
 *
 * Five views over one aggregate, with the three headline numbers pinned above
 * them. The numbers stay put on purpose: every tab is a different way of cutting
 * the same result, and losing sight of the overall favorability while reading a
 * single area is how a report produces confident wrong conclusions.
 *
 * The chosen demographic is screen state, not tab state — going from
 * "participación por área" to "heatmap por área" is one thought, and having to
 * re-pick the segment on arrival breaks it.
 */
export function SurveyResults({ draft, item, history = [] }: SurveyResultsProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("summary");

  const results = React.useMemo(
    () => buildSurveyResults({ draft, item, history }),
    [draft, item, history]
  );

  const [segmentKey, setSegmentKey] = React.useState(() => {
    const hasArea = results.segments.some((s) => s.key === "area");
    return hasArea ? "area" : (results.segments[0]?.key ?? "");
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

  // The Resumen's scope lives here for the same reason the chosen demographic
  // does: narrowing to "2.1 Mi líder directo", stepping into Participación to
  // check a group and coming back should return the reader to where they were,
  // not to the whole survey.
  const [summaryScopeId, setSummaryScopeId] = React.useState<string>(SCOPE_ALL);
  const [summaryFilters, setSummaryFilters] = React.useState<readonly SegmentFilter[]>([]);

  /**
   * The Resumen's "Ver por". It opens on the whole measurement — a summary
   * answers "¿cómo nos fue?" before "¿a quién?" — which is a reading the other
   * tabs cannot hold, so it needs its own state rather than sharing
   * `segmentKey`. Naming a cut here still moves the rest of the report onto it:
   * "resumen por área" and "heatmap por área" is one thought.
   */
  const [summaryViewBy, setSummaryViewBy] = React.useState<string>(VIEW_GENERAL);
  const changeSummaryViewBy = React.useCallback((key: string) => {
    setSummaryViewBy(key);
    if (key !== VIEW_GENERAL) setSegmentKey(key);
  }, []);

  /**
   * Toggles one value of a demographic. A demographic holds as many values as
   * the reader picks — "Área: Producto y Tecnología" — so this adds and removes
   * rather than replacing: the whole Resumen then reads over that union.
   * An empty `optionId` clears the demographic entirely.
   */
  const applySummaryFilter = React.useCallback((key: string, optionId: string) => {
    setSummaryFilters((current) => {
      if (optionId === "") return current.filter((candidate) => candidate.key !== key);
      const isOn = current.some(
        (candidate) => candidate.key === key && candidate.optionId === optionId
      );
      return isOn
        ? current.filter(
            (candidate) => !(candidate.key === key && candidate.optionId === optionId)
          )
        : [...current, { key, optionId }];
    });
  }, []);

  // The download center outlives the drawer: closing it must not kill a report
  // mid-preparation, and the floating widget reads the same list.
  const downloads = useDownloadCenter({ draft, results });
  const [downloadsOpen, setDownloadsOpen] = React.useState(false);
  const [widgetDismissed, setWidgetDismissed] = React.useState(false);

  const openDownloads = React.useCallback(() => {
    setDownloadsOpen(true);
    setWidgetDismissed(false);
  }, []);

return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* The measurement's name, status and way back all live in the app shell's
          header now, so this screen starts straight at its tabs. */}
      <div className="flex shrink-0 flex-col bg-background px-6 pt-4 lg:px-10">
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
          variant="results"
        />
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 lg:px-10">
        {/*
          A persistent breathing room below the nav tabs, present no matter which
          tab is active or how far its content has scrolled. Every tab's own
          sticky controls (the heatmap's filters, the favorability scale toggle)
          stick right below this spacer rather than flush against the tabs —
          "top-4" on those matches this spacer's own height, so the two sit
          back-to-back with no overlap and no uncovered sliver between them.
        */}
        <div aria-hidden className="sticky top-0 z-40 h-4 bg-background" />
        {activeTab === "summary" && (
          <SummaryTab
            draft={draft}
            results={results}
            segment={segment ?? results.segments[0]}
            segments={results.segments.filter((candidate) => !candidate.perPerson)}
            onSegmentChange={setSegmentKey}
            viewBy={summaryViewBy}
            onViewByChange={changeSummaryViewBy}
            onNavigate={(target) => setActiveTab(target as TabId)}
            scopeId={summaryScopeId}
            onScopeChange={setSummaryScopeId}
            filters={summaryFilters}
            onApplyFilter={applySummaryFilter}
            onRemoveFilter={(key) => applySummaryFilter(key, "")}
            onClearFilters={() => setSummaryFilters([])}
          />
        )}

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

        {activeTab === "nps" && <NpsTab results={results} />}
        {activeTab === "ai" && <AiAnalysisTab results={results} />}
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
      />

      <DownloadReportsDrawer
        open={downloadsOpen}
        onOpenChange={setDownloadsOpen}
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
