import * as React from "react";
import { ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { SurveyInsight } from "@/mocks/surveyInsights";
import {
  AI_RANK_CELL,
  AI_ROW,
  AI_TBODY,
  AI_THEAD,
  AI_THEAD_ROW,
  AI_TABLE,
  AI_TITLE_CELL,
  AiSectionCard,
  AiSectionMeta,
  type AiMetaDot,
} from "./AiSectionCard";
import { CONFIDENCE_STYLES, type InsightConfidence } from "./insightConfidence";

/**
 * The AI's claims, read down the same outline every other tab is read down.
 *
 * Before this they were a three-column card grid, which is the one shape the
 * report never uses: Participación, Favorabilidad, Preguntas and eNPS all put
 * their content in a collapsible block with a table inside it, and a wall of
 * side-by-side cards made the AI reading look like a different product bolted
 * onto the end of the tabs. So a group of claims is now a section card, and a
 * claim is a row that opens to show what it rests on — the same interaction the
 * comment rows use one tab over.
 */

export interface InsightGroup {
  id: string;
  /** "Hallazgos", "Riesgos", "Qué hacer". */
  heading: string;
  /** One line under the heading saying what the group answers. */
  question: string;
  items: readonly SurveyInsight[];
}

interface InsightGroupListProps {
  groups: readonly InsightGroup[];
  isAnalyzing?: boolean;
  /** Where this list starts in the tab's stack of numbered blocks. */
  startNumbering?: number;
}

export function InsightGroupList({
  groups,
  isAnalyzing = false,
  startNumbering = 1,
}: InsightGroupListProps) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, index) => (
        <AiSectionCard
          key={group.id}
          numbering={startNumbering + index}
          heading={group.heading}
          question={group.question}
          meta={<ConfidenceMix items={group.items} />}
        >
          {/* Opening the group deploys what is inside it, the way opening a
              section in the other tabs deploys its subsections: the reader
              asked for this branch, not for a list of nine more headlines to
              click through. Each claim can still be folded back on its own. */}
          <InsightTable items={group.items} isAnalyzing={isAnalyzing} />
        </AiSectionCard>
      ))}
    </div>
  );
}

/**
 * A group's claims counted by how sure the model is about them.
 *
 * The slot the other tabs put a score in: Favorabilidad a percentage,
 * Comentarios a comment count. Here the only number a group has is how much of
 * it can be trusted, so that is what sits on the right of the header.
 */
function ConfidenceMix({ items }: { items: readonly SurveyInsight[] }) {
  const dots = React.useMemo<readonly AiMetaDot[]>(() => {
    const tally = { high: 0, medium: 0, low: 0 } as Record<InsightConfidence, number>;
    for (const item of items) tally[item.confidence] += 1;
    return (["high", "medium", "low"] as const).map((id) => ({
      id,
      color: CONFIDENCE_STYLES[id].color,
      count: tally[id],
      title: `${tally[id]} de confiabilidad ${CONFIDENCE_STYLES[id].label.toLowerCase()}`,
    }));
  }, [items]);

  return (
    <AiSectionMeta count={items.length} unit="lectura" unitPlural="lecturas" dots={dots} />
  );
}

/** The claims of one group, in the table shape the question lists use. */
function InsightTable({
  items,
  isAnalyzing,
}: {
  items: readonly SurveyInsight[];
  isAnalyzing: boolean;
}) {
  return (
    <table className={AI_TABLE}>
      <thead className={AI_THEAD}>
        <tr className={AI_THEAD_ROW}>
          <th className="w-10 px-4 py-2.5 text-center">#</th>
          <th className="py-2.5">Lectura de la IA</th>
          <th className="w-[150px] py-2.5 pr-4 text-right">Confiabilidad</th>
          <th className="w-10 py-2.5 pr-4" aria-label="Detalle" />
        </tr>
      </thead>
      <tbody className={AI_TBODY}>
        {items.map((insight, index) => (
          <InsightRows
            key={insight.id}
            index={index + 1}
            insight={insight}
            isAnalyzing={isAnalyzing}
          />
        ))}
      </tbody>
    </table>
  );
}

/** One claim: its headline row, and what it rests on when it is open. */
function InsightRows({
  index,
  insight,
  isAnalyzing,
}: {
  index: number;
  insight: SurveyInsight;
  isAnalyzing: boolean;
}) {
  // The row is mounted only while its group is open, so it starts deployed:
  // collapsing the group and opening it again brings its claims back with it.
  const [open, setOpen] = React.useState(true);
  const toggle = () => setOpen((current) => !current);

  if (isAnalyzing) {
    return (
      <tr>
        <td className="px-4 py-3.5 text-center">
          <Skeleton className="mx-auto h-3 w-3" />
        </td>
        <td className="py-3.5 pr-4">
          <Skeleton className="h-3.5 w-[62%]" />
        </td>
        <td className="py-3.5 pr-4">
          <Skeleton className="ml-auto h-4 w-20 rounded-full" />
        </td>
        <td className="py-3.5 pr-4" />
      </tr>
    );
  }

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        className={cn(AI_ROW, open && "bg-primary/[0.03]")}
      >
        <td className={AI_RANK_CELL}>{index}</td>

        <td className={AI_TITLE_CELL}>{insight.title}</td>

        <td className="py-3 pr-4 text-right">
          <ConfidenceChip level={insight.confidence} />
        </td>

        <td className="py-3 pr-4 text-right">
          <ChevronRight
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:text-text-primary",
              open && "rotate-90"
            )}
            strokeWidth={2.4}
          />
        </td>
      </tr>

      {open && (
        <tr className="bg-muted/10">
          <td colSpan={4} className="px-4 py-4">
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="max-w-4xl text-[12.5px] leading-relaxed text-text-primary">
                {insight.body}
              </p>
              {/* The figure the claim rests on, quoted so the reader can go and
                  check it in the tab it came from. */}
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-text-secondary">
                <Quote className="mt-px h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={2.4} />
                <span>
                  <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Evidencia
                  </span>{" "}
                  <span className="font-medium tabular-nums">{insight.evidence}</span>
                </span>
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** The confidence level as the report's own band chip. */
function ConfidenceChip({ level }: { level: InsightConfidence }) {
  const style = CONFIDENCE_STYLES[level];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none"
      style={{
        backgroundColor: style.background,
        borderColor: style.border,
        color: style.foreground,
      }}
      title={style.meaning}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.color }} />
      {style.label}
    </span>
  );
}
