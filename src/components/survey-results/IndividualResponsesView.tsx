import * as React from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import { useResetOnChange } from "@/lib/useResetOnChange";
import {
  buildRespondentAnswers,
  respondentsForTally,
  type AnswerMatrix,
  type OpenComment,
  type QuestionBreakdown,
  type Respondent,
  type Sentiment,
} from "@/mocks/questionResponses";
import type { SectionResult } from "@/mocks/surveyResults";
import { RespondentRoster } from "./RespondentRoster";
import { RespondentSheet } from "./RespondentSheet";

/** A jump from an answer tally: "the 128 people who answered 4 here". */
export interface AnswerDrillDown {
  questionId: string;
  tallyId: string;
}

interface IndividualResponsesViewProps {
  sections: readonly SectionResult[];
  respondents: readonly Respondent[];
  breakdowns: ReadonlyMap<string, QuestionBreakdown>;
  /** Who answered what, allocated once above so both directions agree. */
  matrix: AnswerMatrix;
  comments: readonly OpenComment[];
  sentimentOverrides: ReadonlyMap<string, Sentiment>;
  drill: AnswerDrillDown | null;
  onClearDrill: () => void;
  anonymous: boolean;
  highlightBands?: ReadonlySet<string>;
  hasHiddenBands?: boolean;
}

/**
 * One person's responses, picked from the roster beside them.
 *
 * Two panes rather than a drawer over a table: choosing who to read and reading
 * what they said are the same task, and a drawer would hide the list the reader
 * is working through. The roster keeps its own search so a name can be found in
 * 450 without leaving the sheet on screen.
 *
 * Arriving from an answer tally pre-filters the roster to exactly the people
 * behind that count — the drill-down chip says which, and clearing it puts the
 * whole roster back.
 */
export function IndividualResponsesView({
  sections,
  respondents,
  breakdowns,
  matrix,
  comments,
  sentimentOverrides,
  drill,
  onClearDrill,
  anonymous,
  highlightBands,
  hasHiddenBands,
}: IndividualResponsesViewProps) {
  const drillIds = React.useMemo(() => {
    if (!drill) return null;
    return new Set(respondentsForTally(matrix, drill.questionId, drill.tallyId));
  }, [drill, matrix]);

  const drillLabel = React.useMemo(() => {
    if (!drill || !drillIds) return null;
    const breakdown = breakdowns.get(drill.questionId);
    const tally = breakdown?.tallies.find((candidate) => candidate.id === drill.tallyId);
    if (!breakdown || !tally) return null;
    return `${drillIds.size} personas respondieron “${tally.label}” en «${breakdown.statement}»`;
  }, [drill, drillIds, breakdowns]);

  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => respondents[0]?.id ?? null
  );

  // Landing from a drill-down should land *on* somebody in that set, not on
  // whoever happened to be selected before.
  useResetOnChange(drill ? `${drill.questionId}|${drill.tallyId}` : "", () => {
    if (!drillIds) return;
    setSelectedId((current) =>
      current && drillIds.has(current)
        ? current
        : (respondents.find((person) => drillIds.has(person.id))?.id ?? null)
    );
  });

  const selected = respondents.find((person) => person.id === selectedId) ?? null;

  const answers = React.useMemo(
    () =>
      selected ? buildRespondentAnswers(selected, breakdowns, comments, matrix) : new Map(),
    [selected, breakdowns, comments, matrix]
  );

  if (respondents.length === 0) {
    return (
      <EmptyState
        icon={UserRound}
        title="Todavía no hay respuestas individuales"
        description="Cuando alguien complete la encuesta, sus respuestas se podrán abrir una por una desde aquí."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {anonymous && (
        <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/5 px-4 py-3 dark:border-info/40 dark:bg-info/10">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" strokeWidth={2.3} />
          <p className="text-[11.5px] font-medium leading-relaxed text-info">
            <strong className="font-bold">Encuesta anónima:</strong> puedes ver las respuestas, pero no las identidades ni los datos demográficos.
          </p>
        </div>
      )}

      <div className="grid min-h-0 grid-cols-1 gap-5 lg:items-start lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="sticky top-32 flex max-h-[calc(100vh-9rem)] min-h-0 flex-col rounded-xl border border-border/60 bg-muted/20 p-4">
          <RespondentRoster
            respondents={respondents}
            selectedId={selectedId}
            onSelect={setSelectedId}
            drillIds={drillIds}
            drillLabel={drillLabel}
            onClearDrill={onClearDrill}
          />
        </aside>

        <div className="min-w-0">
          {selected ? (
            <RespondentSheet
              respondent={selected}
              sections={sections}
              answers={answers}
              breakdowns={breakdowns}
              comments={comments}
              sentimentOverrides={sentimentOverrides}
              highlightBands={highlightBands}
              hasHiddenBands={hasHiddenBands}
            />
          ) : (
            <EmptyState
              icon={UserRound}
              title="Selecciona una persona"
              description="Elige a alguien de la lista para ver todo lo que respondió."
            />
          )}
        </div>
      </div>
    </div>
  );
}
