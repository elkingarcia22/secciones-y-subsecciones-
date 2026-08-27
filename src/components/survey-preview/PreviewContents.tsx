import * as React from "react";
import { Check, ChevronRight, Flag, Home, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLOSING_PAGE_ID,
  DEMOGRAPHICS_PAGE_ID,
  WELCOME_PAGE_ID,
  groupOutline,
  type PreviewOutlineRow,
  type PreviewPage,
} from "./previewModel";

/**
 * Table of contents.
 *
 * One component, two jobs: it is the map on the welcome page — what this survey
 * is made of, before answering anything — and the jump list behind the
 * "Contenido" button in the header, for the rest of the run. Same rows, same
 * numbering as the builder's own outline, so the survey is described the same
 * way wherever it is read.
 */

interface PreviewContentsProps {
  pages: readonly PreviewPage[];
  outline: readonly PreviewOutlineRow[];
  /** Page currently on screen. Null on the welcome page's own copy, where
   * nothing should look like it is "where you are". */
  activePageId?: string | null;
  /** Answered vs. asked per page, for the completion ticks. */
  progressByPage?: Readonly<Record<string, { answered: number; total: number }>>;
  onJumpTo: (pageId: string) => void;
  /** Denser rows and no fixed-page entries — the header popover variant. */
  compact?: boolean;
}

export function PreviewContents({
  pages,
  outline,
  activePageId = null,
  progressByPage = {},
  onJumpTo,
  compact = false,
}: PreviewContentsProps) {
  const groups = React.useMemo(() => groupOutline(outline), [outline]);
  const pageIds = React.useMemo(() => new Set(pages.map((page) => page.id)), [pages]);

  // How many questions the demographics block asks. Taken from the page rather
  // than from `progressByPage`, which the welcome page does not supply — the
  // count is a fact about the survey, not about this run.
  const demographicsPage = pages.find((page) => page.kind === "demographics");
  const demographicsCount =
    demographicsPage?.kind === "demographics" ? demographicsPage.fields.length : undefined;

  const isComplete = (pageId: string): boolean => {
    const progress = progressByPage[pageId];
    return Boolean(progress && progress.total > 0 && progress.answered === progress.total);
  };

  return (
    <ol className={cn("flex flex-col", compact ? "gap-0.5" : "gap-3")}>
      {compact && pageIds.has(WELCOME_PAGE_ID) && (
        <li>
          <ContentsRow
            icon={Home}
            label="Bienvenida"
            isActive={activePageId === WELCOME_PAGE_ID}
            compact
            onClick={() => onJumpTo(WELCOME_PAGE_ID)}
          />
        </li>
      )}

      {pageIds.has(DEMOGRAPHICS_PAGE_ID) && (
        <li>
          <ContentsRow
            icon={UsersRound}
            label="Datos demográficos"
            count={demographicsCount}
            isActive={activePageId === DEMOGRAPHICS_PAGE_ID}
            isComplete={isComplete(DEMOGRAPHICS_PAGE_ID)}
            compact={compact}
            onClick={() => onJumpTo(DEMOGRAPHICS_PAGE_ID)}
          />
        </li>
      )}

      {groups.map((group) => (
        <li key={group.root.sectionId} className="flex flex-col gap-0.5">
          <ContentsRow
            numbering={group.root.numbering}
            label={group.root.label}
            count={group.root.questionCount || undefined}
            isActive={activePageId === group.root.sectionId}
            isComplete={group.root.pageId ? isComplete(group.root.sectionId) : false}
            compact={compact}
            onClick={group.root.pageId ? () => onJumpTo(group.root.sectionId) : undefined}
          />

          {group.children.length > 0 && (
            <ul className="ml-3 flex flex-col gap-0.5 border-l border-border/60 pl-2.5">
              {group.children.map((child) => (
                <li key={child.sectionId}>
                  <ContentsRow
                    numbering={child.numbering}
                    label={child.label}
                    count={child.questionCount || undefined}
                    depth={child.depth}
                    isActive={activePageId === child.sectionId}
                    isComplete={child.pageId ? isComplete(child.sectionId) : false}
                    compact={compact}
                    onClick={child.pageId ? () => onJumpTo(child.sectionId) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}

      {compact && pageIds.has(CLOSING_PAGE_ID) && (
        <li>
          <ContentsRow
            icon={Flag}
            label="Cierre"
            isActive={activePageId === CLOSING_PAGE_ID}
            compact
            onClick={() => onJumpTo(CLOSING_PAGE_ID)}
          />
        </li>
      )}
    </ol>
  );
}

interface ContentsRowProps {
  label: string;
  numbering?: string;
  icon?: LucideIcon;
  depth?: number;
  count?: number;
  isActive?: boolean;
  isComplete?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

function ContentsRow({
  label,
  numbering,
  icon: Icon,
  depth = 1,
  count,
  isActive = false,
  isComplete = false,
  compact = false,
  onClick,
}: ContentsRowProps) {
  const Element = onClick ? "button" : "div";

  return (
    <Element
      {...(onClick ? { type: "button" as const, onClick } : {})}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors duration-150",
        compact ? "py-1.5" : "py-2",
        depth > 2 && "pl-4",
        isActive
          ? "bg-primary/10 text-primary"
          : onClick
            ? "cursor-pointer hover:bg-surface-muted"
            : "cursor-default"
      )}
    >
      {Icon ? (
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-text-secondary")}
          strokeWidth={2}
        />
      ) : (
        numbering && (
          <span
            className={cn(
              "shrink-0 tabular-nums",
              depth > 1 ? "text-[11px] font-semibold" : "text-[12px] font-bold",
              isActive ? "text-primary" : depth > 1 ? "text-text-muted" : "text-primary"
            )}
          >
            {numbering}
          </span>
        )
      )}

      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          depth > 1
            ? "text-[13px] font-medium text-text-secondary"
            : "text-[13px] font-semibold text-text-primary",
          isActive && "text-primary"
        )}
      >
        {label}
      </span>

      {isComplete ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-status-positive-bg text-status-positive">
          <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      ) : (
        count !== undefined && (
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-text-muted">
            {count}
          </span>
        )
      )}

      {onClick && !compact && (
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-transparent transition-colors group-hover:text-primary"
          strokeWidth={2}
        />
      )}
    </Element>
  );
}
