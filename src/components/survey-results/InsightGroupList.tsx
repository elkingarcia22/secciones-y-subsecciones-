import * as React from "react";
import { ChevronRight, ChevronUp, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_HEADER_DIVIDER } from "@/components/survey-builder/depthTheme";
import { Skeleton } from "@/components/ui/skeleton";
import type { SurveyInsight } from "@/mocks/surveyInsights";
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
}

export function InsightGroupList({ groups, isAnalyzing = false }: InsightGroupListProps) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, index) => (
        <InsightGroupCard
          key={group.id}
          group={group}
          numbering={index + 1}
          isAnalyzing={isAnalyzing}
        />
      ))}
    </div>
  );
}

/** One group of claims, in the section-card chrome the tree uses. */
function InsightGroupCard({
  group,
  numbering,
  isAnalyzing,
}: {
  group: InsightGroup;
  numbering: number;
  isAnalyzing: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(true);
  const toggle = () => setIsOpen((current) => !current);

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Contraer ${group.heading}` : `Expandir ${group.heading}`}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        className={cn(
          "group flex items-start gap-3.5 cursor-pointer bg-muted/40 px-6 py-5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          isOpen && ["border-b", SECTION_HEADER_DIVIDER]
        )}
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/50 transition-colors group-hover:bg-border/40 group-hover:text-text-primary">
          <ChevronUp
            className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")}
            strokeWidth={2.5}
          />
        </div>

        <span
          aria-hidden
          className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/60 px-1 text-[10px] font-bold tabular-nums text-muted-foreground"
        >
          {numbering}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-1 py-0.5 text-[15px] font-bold tracking-tight text-text-primary">
            {group.heading}
            <span className="text-[12px] font-medium tracking-normal text-muted-foreground">
              {group.question}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <ConfidenceMix items={group.items} />
        </div>
      </div>

      {isOpen && (
        <div className="flex min-h-0 flex-col gap-4 px-6 py-5 animate-in fade-in slide-in-from-top-1 duration-300">
          {/* Opening the group deploys what is inside it, the way opening a
              section in the other tabs deploys its subsections: the reader
              asked for this branch, not for a list of nine more headlines to
              click through. Each claim can still be folded back on its own. */}
          <InsightTable items={group.items} isAnalyzing={isAnalyzing} />
        </div>
      )}
    </section>
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
  const counts = React.useMemo(() => {
    const tally = { high: 0, medium: 0, low: 0 } as Record<InsightConfidence, number>;
    for (const item of items) tally[item.confidence] += 1;
    return tally;
  }, [items]);

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5">
      <span className="text-[12px] font-semibold tabular-nums text-text-primary">
        {items.length}
        <span className="ml-1 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
          {items.length === 1 ? "lectura" : "lecturas"}
        </span>
      </span>
      <span aria-hidden className="h-3.5 w-px bg-border/70" />
      <span className="flex items-center gap-1.5">
        {(["high", "medium", "low"] as const)
          .filter((id) => counts[id] > 0)
          .map((id) => (
            <span
              key={id}
              className="flex items-center gap-1"
              title={`${counts[id]} de confiabilidad ${CONFIDENCE_STYLES[id].label.toLowerCase()}`}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CONFIDENCE_STYLES[id].color }}
              />
              <span className="text-[11px] font-semibold tabular-nums text-text-secondary">
                {counts[id]}
              </span>
            </span>
          ))}
      </span>
    </span>
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
    <table className="w-full border-collapse text-left">
      <thead className="bg-muted/10">
        <tr className="border-b border-border/30 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          <th className="w-10 px-4 py-2.5 text-center">#</th>
          <th className="py-2.5">Lectura de la IA</th>
          <th className="w-[150px] py-2.5 pr-4 text-right">Confiabilidad</th>
          <th className="w-10 py-2.5 pr-4" aria-label="Detalle" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border/25">
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
        className={cn(
          "group cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          open && "bg-primary/[0.03]"
        )}
      >
        <td className="px-4 py-3 text-center text-[11px] font-extrabold tabular-nums text-muted-foreground">
          {index}
        </td>

        <td className="py-3 pr-4 text-[12.5px] font-semibold leading-snug text-text-primary">
          {insight.title}
        </td>

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
