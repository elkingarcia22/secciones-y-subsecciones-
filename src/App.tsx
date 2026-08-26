import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UbitsToaster } from "@/components/feedback";
import { AdminShell } from "@/components/app-shell";
import { UbitsTabs } from "@/components/navigation";
import { HomeMetricsBar } from "@/components/home";
import {
  NO_FILTERS,
  type SurveyListFilters,
} from "@/components/survey-list/surveyListFilters";
import { EncuestasDashboard } from "@/screens/EncuestasDashboard";
import { DatosDemograficosDashboard } from "@/screens/DatosDemograficosDashboard";
import { SurveyBuilder } from "@/screens/SurveyBuilder";
import { SurveyResults } from "@/screens/SurveyResults";
import { COMPARATIVE_SURVEYS_LIST } from "@/mocks/comparativeMocks";
import { createPublishedSurveyDraft } from "@/mocks/surveyPreviewMocks";
import { formatSurveyDate } from "@/components/survey-list/surveyListDates";
import type { SurveyDraft, FixedBlockId } from "@/components/survey-builder";
import type { SurveyListItem } from "@/mocks/types";
import type { ShellBreadcrumb } from "@/components/app-shell";

type AppView = "list" | "builder" | "results";
type HomeTab = "encuestas" | "datos_demograficos";

/**
 * How far above the viewport bottom toasts sit, per view — enough to clear
 * that view's own floating action bar. The list clears more than the other
 * two because it also sits above the legal footer; results and the builder
 * have no footer under their bar, so a shorter clearance already suffices.
 */
const TOAST_BOTTOM_OFFSET_PX: Readonly<Record<AppView, number>> = {
  list: 144,
  results: 104,
  builder: 100,
};

/** How many earlier measurements the results trend reaches back over. */
const TREND_DEPTH = 5;

function App() {
  const [view, setView] = React.useState<AppView>("list");
  const [homeTab, setHomeTab] = React.useState<HomeTab>("encuestas");
  const [surveys, setSurveys] = React.useState(COMPARATIVE_SURVEYS_LIST);
  const [editingDraft, setEditingDraft] = React.useState<SurveyDraft | undefined>();
  // Which step the builder should land on. "Editar participantes" is the same
  // editor as "Editar", opened at the one panel the person asked for.
  const [builderInitialStep, setBuilderInitialStep] = React.useState<FixedBlockId>("general");
  const [resultsSurveyId, setResultsSurveyId] = React.useState<string | null>(null);
  // Owned here rather than inside the table: the metric cards that set these
  // live above the tabs, outside the table's subtree.
  const [listFilters, setListFilters] = React.useState<SurveyListFilters>(NO_FILTERS);

  const resultsSurvey = surveys.find((survey) => survey.id === resultsSurveyId) ?? null;

  // Earlier measurements of the same type, newest first. The list is already in
  // that order, so "older" is simply "further down".
  const resultsHistory = React.useMemo<readonly SurveyListItem[]>(() => {
    if (!resultsSurvey) return [];
    const index = surveys.findIndex((survey) => survey.id === resultsSurvey.id);
    return surveys
      .slice(index + 1)
      .filter((survey) => survey.type === resultsSurvey.type)
      .slice(0, TREND_DEPTH);
  }, [surveys, resultsSurvey]);

  // The builder's live draft, mirrored here so leaving through the breadcrumb
  // commits it the same way finishing the wizard does. A ref rather than state:
  // nothing re-renders on a keystroke, it is only read on the way out.
  const builderDraftRef = React.useRef<SurveyDraft | undefined>(undefined);

  const goHome = () => {
    setResultsSurveyId(null);
    setView("list");
  };

  const handleBuilderExit = (savedDraft?: SurveyDraft) => {
    if (savedDraft) {
      const surveyId = savedDraft.id || editingDraft?.id || `survey-${Date.now()}`;
      savedDraft.id = surveyId;

      const newSurvey = {
        id: surveyId,
        name: savedDraft.name || "Encuesta sin título",
        type: savedDraft.general?.type || "Clima",
        status: "Borrador",
        statusVariant: "default",
        startDate: savedDraft.general?.startDate || "-",
        endDate: savedDraft.general?.endDate || "-",
        participants: 0,
        progress: 0,
        draft: savedDraft,
      };

      setSurveys((prev) => {
        const index = prev.findIndex((s) => s.id === newSurvey.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...newSurvey };
          return updated;
        }
        return [newSurvey, ...prev];
      });
    }
    setView("list");
  };

  const handleDraftChange = React.useCallback((draft: SurveyDraft) => {
    builderDraftRef.current = draft;
  }, []);

  /** Replaces one survey in the list, leaving the rest untouched. */
  const patchSurvey = (id: string, patch: Partial<SurveyListItem>) =>
    setSurveys((prev) =>
      prev.map((survey) => (survey.id === id ? { ...survey, ...patch } : survey))
    );

  /** A copy sits next to its original as a fresh draft, never as a live survey. */
  const duplicateSurvey = (id: string) =>
    setSurveys((prev) => {
      const index = prev.findIndex((survey) => survey.id === id);
      if (index === -1) return prev;
      const original = prev[index];
      const copy: SurveyListItem = {
        ...original,
        id: `${original.id}-copia-${prev.length}`,
        name: `${original.name} (copia)`,
        status: "Borrador",
        statusVariant: "neutral",
        // A copy has collected nothing yet, whatever the original had.
        participants: "0",
        progress: 0,
      };
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });

  /** Back to the survey list from wherever we are, keeping a draft in progress. */
  const leaveToList = () => {
    if (view === "builder") {
      handleBuilderExit(builderDraftRef.current);
      return;
    }
    goHome();
  };

  const breadcrumb: ShellBreadcrumb =
    view === "builder"
      ? // The builder renders its own crumb (editable name, status, autosave)
        // into the header slot, since that identity changes as the author types.
        // Leaving through the crumb keeps the draft, the way the old "Salir"
        // button did — navigating out is not the same as discarding the work.
        {
          parent: "Encuestas",
          onParentClick: leaveToList,
        }
      : view === "results" && resultsSurvey
        ? {
            parent: "Encuestas",
            label: resultsSurvey.name,
            // Read off the row rather than assumed: results now open for
            // measurements still in the field, and a hardcoded "Finalizada"
            // would tell the reader the collection is over when it is not.
            badge:
              resultsSurvey.status === "Finalizado"
                ? { label: "Finalizada", tone: "positive" }
                : { label: resultsSurvey.status, tone: "warning" },
            onParentClick: goHome,
          }
        : { parent: "Desempeño", label: "Encuestas" };

  return (
    <TooltipProvider>
      <UbitsToaster bottomOffset={TOAST_BOTTOM_OFFSET_PX[view]} />
      <AdminShell
        breadcrumb={breadcrumb}
        scrollContent={view === "list"}
        onNavigateHome={leaveToList}
      >
        {view === "builder" ? (
          <SurveyBuilder
            initialDraft={editingDraft}
            initialStep={builderInitialStep}
            onExit={handleBuilderExit}
            onDraftChange={handleDraftChange}
          />
        ) : view === "results" && resultsSurvey ? (
          <SurveyResults
            draft={(resultsSurvey as any).draft || createPublishedSurveyDraft(resultsSurvey)}
            item={resultsSurvey}
            history={resultsHistory}
          />
        ) : (
          <div className="pt-2">
            {/* Above the sticky bar on purpose: the headline numbers are an
                orientation you read once and then scroll past, while the tabs
                have to stay reachable the whole way down. */}
            <HomeMetricsBar
              surveys={surveys}
              filters={listFilters}
              onFiltersChange={(next) => {
                setListFilters(next);
                // A narrowing of the survey list is meaningless on the other
                // tab, so asking for one also switches back to it.
                setHomeTab("encuestas");
              }}
              onOpenDemographics={() => setHomeTab("datos_demograficos")}
              className="mb-4"
            />

            {/* Pinned to the top of the scroll area — Encuestas can hold far
                more rows than fit on screen, and losing the way to switch to
                Datos Demográficos every time you scroll down defeats the tab. */}
            <div className="sticky top-0 z-20 bg-background pb-4 pt-2">
              <UbitsTabs
                tabs={[
                  { id: "encuestas", label: "Encuestas" },
                  { id: "datos_demograficos", label: "Datos Demográficos" },
                ]}
                activeTabId={homeTab}
                onTabChange={(id) => setHomeTab(id as HomeTab)}
                variant="results"
                fitContent
                className="mb-0"
              />
            </div>
            {homeTab === "encuestas" ? (
              <EncuestasDashboard
                surveys={surveys}
                onCreateBlank={() => {
                  setEditingDraft(undefined);
                  setBuilderInitialStep("general");
                  setView("builder");
                }}
                onEdit={(id) => {
                  const survey = surveys.find((s) => s.id === id);
                  if (survey) {
                    setEditingDraft((survey as any).draft || createPublishedSurveyDraft(survey));
                    setBuilderInitialStep("general");
                    setView("builder");
                  }
                }}
                onEditParticipants={(id) => {
                  const survey = surveys.find((s) => s.id === id);
                  if (!survey) return;
                  setEditingDraft((survey as any).draft || createPublishedSurveyDraft(survey));
                  setBuilderInitialStep("participants");
                  setView("builder");
                }}
                onViewResults={(id) => {
                  setResultsSurveyId(id);
                  setView("results");
                }}
                onDuplicate={duplicateSurvey}
                onDelete={(ids) => {
                  const doomed = new Set(ids);
                  setSurveys((prev) => prev.filter((survey) => !doomed.has(survey.id)));
                }}
                onFinish={(id) =>
                  patchSurvey(id, {
                    status: "Finalizado",
                    statusVariant: "positive",
                    // Collection stopped today, so that is when it closed —
                    // leaving a future date would claim it is still running.
                    endDate: formatSurveyDate(new Date()),
                    progress: 100,
                  })
                }
                onReopen={(id, endDate) =>
                  patchSurvey(id, {
                    status: "En curso",
                    statusVariant: "info",
                    endDate: formatSurveyDate(endDate),
                  })
                }
                onChangeEndDate={(id, endDate) =>
                  patchSurvey(id, { endDate: formatSurveyDate(endDate) })
                }
                listFilters={listFilters}
                onListFiltersChange={setListFilters}
              />
            ) : (
              <DatosDemograficosDashboard />
            )}
          </div>
        )}
      </AdminShell>
    </TooltipProvider>
  );
}

export default App;
