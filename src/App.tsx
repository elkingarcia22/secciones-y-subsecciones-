import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UbitsToaster } from "@/components/feedback";
import { PlaygroundShellDemo } from "@/screens/PlaygroundShellDemo";
import { EncuestasDashboard } from "@/screens/EncuestasDashboard";
import { SurveyBuilder } from "@/screens/SurveyBuilder";
import { COMPARATIVE_SURVEYS_LIST } from "@/mocks/comparativeMocks";
import { createPublishedSurveyDraft } from "@/mocks/surveyPreviewMocks";
import type { SurveyDraft } from "@/components/survey-builder";

type AppView = "list" | "builder";

function App() {
  const [view, setView] = React.useState<AppView>("list");
  const [surveys, setSurveys] = React.useState(COMPARATIVE_SURVEYS_LIST);
  const [editingDraft, setEditingDraft] = React.useState<SurveyDraft | undefined>();
  const [blankSurveysCreated, setBlankSurveysCreated] = React.useState(0);

  return (
    <TooltipProvider>
      {view === "builder" ? (
        <SurveyBuilder 
          initialDraft={editingDraft}
          menuOrientation={(!editingDraft && blankSurveysCreated === 1) ? "right" : "bottom"}
          onExit={(savedDraft) => {
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
                draft: savedDraft
              };
              
              setSurveys(prev => {
                const index = prev.findIndex(s => s.id === newSurvey.id);
                if (index !== -1) {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], ...newSurvey };
                  return updated;
                }
                return [newSurvey, ...prev];
              });
            }
            setView("list");
          }} 
        />
      ) : (
        <PlaygroundShellDemo>
          <UbitsToaster />
          <EncuestasDashboard 
            surveys={surveys} 
            onCreateBlank={() => {
              setBlankSurveysCreated(prev => prev + 1);
              setEditingDraft(undefined);
              setView("builder");
            }}
            onEdit={(id) => {
              const survey = surveys.find(s => s.id === id);
              if (survey) {
                setEditingDraft((survey as any).draft || createPublishedSurveyDraft(survey));
                setView("builder");
              }
            }}
          />
        </PlaygroundShellDemo>
      )}
    </TooltipProvider>
  );
}

export default App;
