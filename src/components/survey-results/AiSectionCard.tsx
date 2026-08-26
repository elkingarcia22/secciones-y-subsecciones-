import * as React from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_HEADER_DIVIDER } from "@/components/survey-builder/depthTheme";

/**
 * The block chrome the Análisis con IA tab is built out of.
 *
 * The tab is one surface holding a stack of numbered section cards, each with
 * the same header — chevron, numbering chip, title, the line saying what the
 * block answers, and one meta chip on the right stating the block's own count.
 * Extracted here because the blocks that moved in from Resumen have to *be*
 * that shape rather than merely resemble it: two headers that differ by two
 * pixels of padding are what make a page read as two pages stapled together.
 */

interface AiSectionCardProps {
  /** Its place in the tab's stack, as the header's chip. */
  numbering: number;
  heading: string;
  /** The one line under the heading saying what the block answers. */
  question: string;
  /** The block's own count, on the right of the header. */
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AiSectionCard({
  numbering,
  heading,
  question,
  meta,
  defaultOpen = true,
  children,
}: AiSectionCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const toggle = () => setIsOpen((current) => !current);

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Contraer ${heading}` : `Expandir ${heading}`}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        className={cn(
          "group flex cursor-pointer items-start gap-3.5 bg-muted/40 px-6 py-5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
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
            {heading}
            <span className="text-[12px] font-medium tracking-normal text-muted-foreground">
              {question}
            </span>
          </p>
        </div>

        {meta && <div className="flex shrink-0 items-center gap-1.5 pt-0.5">{meta}</div>}
      </div>

      {isOpen && (
        <div className="flex min-h-0 flex-col gap-4 px-6 py-5 duration-300 animate-in fade-in slide-in-from-top-1">
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * A block's count, with the mix it breaks down into.
 *
 * The slot the report's other outlines put a score in. Here every block's one
 * shared fact is *how many of these there are*, and the dots say what kind —
 * confidence bands for the AI's own readings, severity for the priorities,
 * sentiment for the voice block. Same chip either way, so the four headers of
 * the tab line up on the right edge instead of each inventing a summary.
 */
export interface AiMetaDot {
  id: string;
  color: string;
  count: number;
  title: string;
}

export function AiSectionMeta({
  count,
  unit,
  unitPlural,
  dots = [],
}: {
  count: number;
  unit: string;
  unitPlural: string;
  dots?: readonly AiMetaDot[];
}) {
  const visible = dots.filter((dot) => dot.count > 0);

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5">
      <span className="text-[12px] font-semibold tabular-nums text-text-primary">
        {count}
        <span className="ml-1 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
          {count === 1 ? unit : unitPlural}
        </span>
      </span>

      {visible.length > 0 && (
        <>
          <span aria-hidden className="h-3.5 w-px bg-border/70" />
          <span className="flex items-center gap-1.5">
            {visible.map((dot) => (
              <span key={dot.id} className="flex items-center gap-1" title={dot.title}>
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: dot.color }}
                />
                <span className="text-[11px] font-semibold tabular-nums text-text-secondary">
                  {dot.count}
                </span>
              </span>
            ))}
          </span>
        </>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- tablas */

/**
 * The tab's one table shape, as class names rather than a component.
 *
 * Every block's table carries different columns — a priority has a severity, a
 * gap has a spread — so a shared `<Table>` would end up a prop soup. What has
 * to be shared is the *rhythm*: the same head, the same row height, the same
 * dividers. These are that.
 */
export const AI_TABLE = "w-full border-collapse text-left";
export const AI_THEAD = "bg-muted/10";
export const AI_THEAD_ROW =
  "border-b border-border/30 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/80";
export const AI_TBODY = "divide-y divide-border/25";
export const AI_ROW =
  "group cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30";
export const AI_ROW_STATIC = "transition-colors hover:bg-muted/30";
export const AI_RANK_CELL =
  "px-4 py-3 text-center text-[11px] font-extrabold tabular-nums text-muted-foreground";
export const AI_TITLE_CELL =
  "py-3 pr-4 text-[12.5px] font-semibold leading-snug text-text-primary";

/**
 * The panel an expanded row's detail sits on — and the ground the tab's own
 * "Resumen general" strip uses, so a block's prose reads the same wherever it
 * appears in the tab.
 */
export const AI_DETAIL_PANEL = "rounded-xl border border-border/50 bg-muted/20 px-4 py-3.5";

/** The heading over a sub-block inside an expanded row. */
export function AiSubHeading({
  icon: Icon,
  children,
  trailing,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
        {children}
      </h4>
      {trailing}
    </div>
  );
}
