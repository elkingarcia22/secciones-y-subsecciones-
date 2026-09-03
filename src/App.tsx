import * as React from "react";
import { ClipboardList, Users } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UbitsToaster } from "@/components/feedback";
import { AdminShell } from "@/components/app-shell";
import { UbitsTabs } from "@/components/navigation";
import { HomePulseStrip, TemplatesStrip, AlertsRow } from "@/components/home";
import { TemplatesDrawer } from "@/components/survey-list/TemplatesDrawer";
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
import { activateAllCatalogDemographics } from "@/components/survey-builder/demographics";
import { getLibraryDemographics, buildLibraryDemographic } from "@/components/survey-builder/demographicsLibrary";
import type { SurveyListItem } from "@/mocks/types";
import type { ShellBreadcrumb } from "@/components/app-shell";

type AppView = "list" | "builder" | "results";
type HomeTab = "encuestas" | "datos_demograficos";

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
  const [builderInitialSelection, setBuilderInitialSelection] = React.useState<any | undefined>(undefined);
  const [resultsSurveyId, setResultsSurveyId] = React.useState<string | null>(null);
  // Owned here rather than inside the table: the metric cards that set these
  // live above the tabs, outside the table's subtree.
  const [listFilters, setListFilters] = React.useState<SurveyListFilters>(NO_FILTERS);
  // The home templates strip owns its own picker instance — it lives above the
  // tabs, outside the "Encuestas" tab's own subtree, so it can't reuse that
  // tab's local drawer state.
  const [isStripTemplateDrawerOpen, setIsStripTemplateDrawerOpen] = React.useState(false);
  const [stripInitialTemplateName, setStripInitialTemplateName] = React.useState<string | undefined>();

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
        status: savedDraft.status === "scheduled" ? "Por iniciar" : "Borrador",
        statusVariant: savedDraft.status === "scheduled" ? "neutral" : "default",
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

  /** Opens the builder on a fresh, empty draft — shared by the dashboard's own
   *  "Crear en blanco" action and the home templates strip's "En blanco" tile. */
  const handleCreateBlank = () => {
    setEditingDraft(undefined);
    setBuilderInitialStep("general");
    setBuilderInitialSelection(undefined);
    setView("builder");
  };

  /** Clones a template into the builder — shared by the dashboard's template
   *  picker and the one the home strip opens on its own. */
  const handleCreateFromTemplate = (template: SurveyDraft) => {
    const draftClone = JSON.parse(JSON.stringify(template));

    // Always activate library demographics for all templates
    draftClone.demographics.fields = activateAllCatalogDemographics(
      [],
      getLibraryDemographics(),
      buildLibraryDemographic
    );

    setEditingDraft(draftClone);
    setBuilderInitialSelection(undefined);
    setBuilderInitialStep("general");
    setView("builder");
  };

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
      <UbitsToaster />
      <AdminShell
        breadcrumb={breadcrumb}
        scrollContent={view === "list"}
        showFooter={view === "list"}
        onNavigateHome={leaveToList}
      >
        {view === "builder" ? (
          <SurveyBuilder
            key={editingDraft?.name || "blank"}
            initialDraft={editingDraft}
            initialStep={builderInitialStep}
            initialSelection={builderInitialSelection}
            onExit={handleBuilderExit}
            onDraftChange={handleDraftChange}
          />
        ) : view === "results" && resultsSurvey ? (
          <SurveyResults
            draft={(resultsSurvey as any).draft || createPublishedSurveyDraft(resultsSurvey)}
            item={resultsSurvey}
            history={resultsHistory}
            onBack={goHome}
          />
        ) : (
          <div className="px-1 pt-2 pb-6 flex-1 flex flex-col min-h-0">
            <h1 className="mb-4 shrink-0 text-2xl font-bold text-text-primary tracking-tight">Encuestas</h1>

            {/* "What can I start from" comes first, then "how are my surveys
                doing", then what needs a hand — each step narrower than the
                last. */}
            <TemplatesStrip
              className="mb-4 shrink-0"
              onSelectTemplate={(template) => {
                setHomeTab("encuestas");
                setStripInitialTemplateName(template.name);
                setIsStripTemplateDrawerOpen(true);
              }}
              onViewAll={() => {
                setHomeTab("encuestas");
                setStripInitialTemplateName(undefined);
                setIsStripTemplateDrawerOpen(true);
              }}
            />

            <HomePulseStrip className="mb-4 shrink-0" surveys={surveys} />

            {/* Alerts filter the Encuestas tab, so pressing one also brings
                that tab forward if the reader was on Datos Demográficos. */}
            <AlertsRow
              className="mb-4 shrink-0"
              surveys={surveys}
              filters={listFilters}
              onFiltersChange={(filters) => {
                setHomeTab("encuestas");
                setListFilters(filters);
              }}
            />

            <TemplatesDrawer
              open={isStripTemplateDrawerOpen}
              onOpenChange={setIsStripTemplateDrawerOpen}
              initialTemplateName={stripInitialTemplateName}
              onSelectTemplate={(template) => {
                setIsStripTemplateDrawerOpen(false);
                handleCreateFromTemplate(template);
              }}
            />

            {/* Pinned to the top of the scroll area — Encuestas can hold far
                more rows than fit on screen, and losing the way to switch to
                Datos Demográficos every time you scroll down defeats the tab. */}
            <div className="sticky top-0 z-20 bg-background pb-4 pt-2 shrink-0">
              <UbitsTabs
                tabs={[
                  { id: "encuestas", label: "Encuestas", icon: <ClipboardList className="mr-2 h-4 w-4" /> },
                  { id: "datos_demograficos", label: "Datos Demográficos", icon: <Users className="mr-2 h-4 w-4" /> },
                ]}
                activeTabId={homeTab}
                onTabChange={(id) => setHomeTab(id as HomeTab)}
                variant="page"
                fitContent
                className="mb-0 shrink-0"
              />
            </div>
            {/* Keyed on the active home tab so switching tabs remounts this
                wrapper and replays the entrance cascade — same language as
                the survey preview and the builder steps. `contents` keeps it
                a layout passthrough within the flex column above. */}
            <div key={homeTab} className="contents cascade-enter">
            {homeTab === "encuestas" ? (
              <EncuestasDashboard
                surveys={surveys}
                onCreateBlank={handleCreateBlank}
                onCreateFromTemplate={handleCreateFromTemplate}
                onEdit={(id) => {
                  const survey = surveys.find((s) => s.id === id);
                  if (survey) {
                    setEditingDraft((survey as any).draft || createPublishedSurveyDraft(survey));
                    setBuilderInitialStep("general");
                    setBuilderInitialSelection(undefined);
                    setView("builder");
                  }
                }}
                onEditParticipants={(id) => {
                  const survey = surveys.find((s) => s.id === id);
                  if (!survey) return;
                  setEditingDraft((survey as any).draft || createPublishedSurveyDraft(survey));
                  setBuilderInitialStep("participants");
                  setBuilderInitialSelection(undefined);
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
          </div>
        )}
      </AdminShell>
    </TooltipProvider>
  );
}

export default App;
