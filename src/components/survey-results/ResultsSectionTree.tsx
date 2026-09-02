import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_HEADER_DIVIDER, SIBLING_DIVIDER, depthTheme } from "@/components/survey-builder/depthTheme";
import { useResetOnChange } from "@/lib/useResetOnChange";
import type { SectionResult } from "@/mocks/surveyResults";
import { countSectionQuestions, sectionHasContent } from "./sectionTotals";
import {
  cascadeContainer,
  cascadeItem,
  cascadeItemSettleTime,
  CASCADE_CONTENT_GAP,
} from "@/lib/cascadeAnimation";

/**
 * The section → subsección → sub-subsección outline, as chrome.
 *
 * The report has three tree-shaped views now — favorability per question, the
 * answer tally per question, and one person's full sheet — and the hierarchy
 * has to look identical in all three or the reader stops trusting that they are
 * the same survey. So the chrome lives here once: root sections as cards with a
 * number badge, subsections as outline rows hanging off a rail, siblings
 * separated by a hairline. Each view supplies only its own body and its own
 * right-hand metric.
 */

interface ResultsSectionTreeProps {
  sections: readonly SectionResult[];
  /** The body a section's own questions render as. `revealDelay` is when this
   * section's row itself settles in — the body's own cascade should start
   * there, not before and not only once every sibling row is done. */
  renderQuestions: (section: SectionResult, revealDelay: number) => React.ReactNode;
  /** What sits at the right end of a section's header row. */
  renderMetric?: (section: SectionResult) => React.ReactNode;
  /** Extra wording after the title, replacing the default question count. */
  renderSubtitle?: (section: SectionResult) => React.ReactNode;
  /**
   * Every branch starts open. For a person's sheet, where the reader wants to
   * scroll through the answers rather than hunt for them.
   */
  expandAll?: boolean;
}

export function ResultsSectionTree({
  sections,
  renderQuestions,
  renderMetric,
  renderSubtitle,
  expandAll = false,
}: ResultsSectionTreeProps) {
  // One root open at a time: a section is one screen, not a column. Unless the
  // caller asked for everything open, in which case the state starts full.
  const [openIds, setOpenIds] = React.useState<ReadonlySet<string>>(() =>
    expandAll ? new Set(sections.map((section) => section.id)) : new Set([sections[0]?.id ?? ""])
  );

  // A new survey — or a new person's sheet — resets what is open.
  useResetOnChange(sections.map((section) => section.id).join("|"), () =>
    setOpenIds(
      expandAll ? new Set(sections.map((s) => s.id)) : new Set([sections[0]?.id ?? ""])
    )
  );

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(expandAll ? current : []);
      if (current.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <RootSection
          key={section.id}
          section={section}
          isOpen={openIds.has(section.id)}
          onToggle={() => toggle(section.id)}
          renderQuestions={renderQuestions}
          renderMetric={renderMetric}
          renderSubtitle={renderSubtitle}
          expandAll={expandAll}
        />
      ))}
    </div>
  );
}

type BodyProps = Pick<
  ResultsSectionTreeProps,
  "renderQuestions" | "renderMetric" | "renderSubtitle" | "expandAll"
>;

function RootSection({
  section,
  isOpen,
  onToggle,
  ...body
}: BodyProps & { section: SectionResult; isOpen: boolean; onToggle: () => void }) {
  const subSections = section.children.filter(sectionHasContent);

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Contraer ${section.title}` : `Expandir ${section.title}`}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          "group flex items-start gap-3.5 bg-muted/40 px-6 py-5 transition-colors hover:bg-muted/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
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
          className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/60 px-1 text-[10px] font-bold tabular-nums text-muted-foreground"
        >
          {section.numbering}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-1 py-0.5 text-[14px] font-bold tracking-tight text-text-primary">
            {section.title}
            <span className="text-[12px] font-medium tracking-normal text-muted-foreground">
              {body.renderSubtitle?.(section) ?? (
                <>
                  {countSectionQuestions(section)} preguntas
                  {subSections.length > 0 ? ` · ${subSections.length} subsecciones` : ""}
                </>
              )}
            </span>
          </p>
        </div>

        <div
          className="flex shrink-0 items-center gap-1.5 pt-0.5"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {body.renderMetric?.(section)}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex min-h-0 flex-col gap-4 px-6 py-5">
              {section.questions.length > 0 && body.renderQuestions(section, 0)}
              {subSections.length > 0 && <SubsectionOutline sections={subSections} {...body} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SubsectionOutline({
  sections,
  baseDelay = 0,
  ...body
}: BodyProps & {
  sections: readonly SectionResult[];
  /** When this list itself sits inside another cascade, how long to wait
   * before its own rows start staggering in. */
  baseDelay?: number;
}) {
  return (
    <motion.ul
      className={cn("flex flex-col", SIBLING_DIVIDER)}
      initial="hidden"
      animate="show"
      custom={baseDelay}
      variants={cascadeContainer}
    >
      {sections.map((section, index) => (
        <SubsectionRow
          key={section.id}
          section={section}
          defaultOpen={body.expandAll || index === 0}
          // This row's own content starts right as the row itself settles in,
          // not after every sibling row has — no dead air waiting on rows
          // that have nothing to do with this one's questions.
          contentDelay={cascadeItemSettleTime(baseDelay, index) + CASCADE_CONTENT_GAP}
          {...body}
        />
      ))}
    </motion.ul>
  );
}

function SubsectionRow({
  section,
  defaultOpen,
  contentDelay = 0,
  ...body
}: BodyProps & {
  section: SectionResult;
  defaultOpen: boolean;
  /** Delay before this row's own questions/nested subsections start
   * cascading in — set by the sibling list so they wait their turn. */
  contentDelay?: number;
}) {
  const [expanded, setExpanded] = React.useState(defaultOpen);
  const subSections = section.children.filter(sectionHasContent);
  const theme = depthTheme(section.depth);

  return (
    <motion.li variants={cascadeItem}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? `Contraer ${section.title}` : `Expandir ${section.title}`}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
        className="group -mx-2 flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-muted/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors group-hover:bg-border/40 group-hover:text-text-primary">
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-90")}
            strokeWidth={2.5}
          />
        </div>

        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums transition-colors group-hover:border-border",
            theme.chip
          )}
        >
          {section.numbering}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "-ml-1 flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md px-1 py-0.5 font-bold tracking-tight text-text-primary",
              theme.title
            )}
          >
            {section.title}
            <span className="text-[11px] font-medium tracking-normal text-muted-foreground">
              {body.renderSubtitle?.(section) ?? (
                <>
                  {section.questions.length} preguntas
                  {subSections.length > 0 ? ` · ${subSections.length} subsecciones` : ""}
                </>
              )}
            </span>
          </p>
        </div>

        <div
          className="mt-0.5 flex shrink-0 items-center gap-2.5"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {body.renderMetric?.(section)}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "mt-2.5 flex flex-col gap-3 pb-1",
                theme.rail,
                theme.railOffset
              )}
            >
              {section.questions.length > 0 && body.renderQuestions(section, contentDelay)}
              {subSections.length > 0 && (
                <SubsectionOutline sections={subSections} baseDelay={contentDelay} {...body} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
