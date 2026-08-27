import type * as React from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ANCHOR_ATTRIBUTE } from "@/hooks/useAnchorOffset";
import { InlineDeleteConfirm } from "./InlineDeleteConfirm";
import { MoveToPopover } from "./MoveToPopover";
import { SectionQuestions, type QuestionListHandlers } from "./SectionQuestions";
import { CHIP_SELECTED_RING, RAIL_SELECTED, SIBLING_DIVIDER, depthTheme } from "./depthTheme";
import { childEntries, countQuestions, moveDestinationsForSection, type SectionTreeEntry } from "./sectionTree";
import { canHaveQuestions, depthLabel, type SurveySection } from "./surveyBuilderTypes";

export interface SubsectionAccordionHandlers extends QuestionListHandlers {
  /** Rows currently open. At most one per level, so this is a single branch. */
  expandedIds: ReadonlySet<string>;
  selectedId: string | null;
  onToggleExpanded: (id: string) => void;
  onSelect: (id: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onDelete: (id: string) => void;
  onAddSubsection: (parentId: string) => void;
  /** Whole tree, so a subsection can compute everywhere it may be moved to. */
  sections: readonly SurveySection[];
  /** Moves a subsection (level 2/3) to sit just below `targetId` as its sibling. */
  onMoveSection: (id: string, targetId: string) => void;
  /**
   * The row whose delete is awaiting confirmation, and the inline banner's
   * copy and actions — shared globally since only one delete is ever in
   * flight, the same way only one question editor is ever open.
   */
  pendingDeleteId: string | null;
  pendingDeleteMessage: React.ReactNode;
  onConfirmDeleteSection: () => void;
  onCancelDeleteSection: () => void;
}

interface SubsectionAccordionProps extends SubsectionAccordionHandlers {
  readOnly?: boolean;
  entry: SectionTreeEntry;
}

/**
 * One subsection (level 2 or 3) as an outline entry: a header row, and — when
 * open — a vertical rail holding its questions and its nested subsections.
 *
 * No panel, no nested card: depth is read from the indentation of the rail, the
 * weight of the numbering chip and the size of the title. Siblings are divided
 * by a hairline so a level reads as one list.
 *
 * Only one row per level stays open, so the card never grows into a column the
 * author has to scroll through to find their place.
 */
export function SubsectionAccordion({ entry, readOnly, ...handlers }: SubsectionAccordionProps) {
  const {
    expandedIds,
    selectedId,
    onToggleExpanded,
    onSelect,
    onTitleChange,
    onDescriptionChange,
    onDelete,
    onMoveSection,
    pendingDeleteId,
    pendingDeleteMessage,
    onConfirmDeleteSection,
    onCancelDeleteSection,
  } = handlers;

  const { section, depth, numbering } = entry;
  const isExpanded = expandedIds.has(section.id);
  const isSelected = selectedId === section.id;
  const isPendingDelete = pendingDeleteId === section.id;
  const children = childEntries(entry);
  const theme = depthTheme(depth);
  // Collapsed hides the nested rows, so the badge reports the whole subtree.
  // Open, it reports only the questions this subsection carries directly.
  const questionCount = isExpanded ? section.questions.length : countQuestions([section]);
  // Everywhere this subsection could move to, shown by the row's "Mover a…"
  // picker. Pre-filtered here: depth and cycle-safe, so no empty destinations.
  const moveDestinations = moveDestinationsForSection(handlers.sections, entry);

  return (
    <li>
      {/* Header row. Doubles as the rail's anchor when this row is the one the
          author is working in — and never while a question editor is open,
          since the editor takes the anchor instead. */}
      <div
        {...(isSelected && handlers.editingQuestionId === null ? { [ANCHOR_ATTRIBUTE]: true } : {})}
        // Anywhere on the header makes this the active row, not just the title
        // field — otherwise clicking a description or the empty space beside it
        // moved nothing, and the tree and rail stayed on the previous row. Not
        // while the delete banner is up: it should only ever answer that.
        onClick={() => !isPendingDelete && onSelect(section.id)}
        className="flex items-start gap-2"
      >
        {isPendingDelete ? (
          <InlineDeleteConfirm
            ariaLabel={`Confirmar eliminación de ${section.title || `${depthLabel(depth)} ${numbering}`}`}
            message={pendingDeleteMessage}
            onCancel={onCancelDeleteSection}
            onConfirm={onConfirmDeleteSection}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpanded(section.id);
              }}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded ? `Contraer ${depthLabel(depth)} ${numbering}` : `Expandir ${depthLabel(depth)} ${numbering}`
              }
              className={cn(
                "mt-0.5 flex shrink-0 items-center justify-center rounded-lg p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isExpanded ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:bg-surface-muted",
                theme.chevronSize
              )}
            >
              <ChevronRight
                className={cn("transition-transform duration-200", isExpanded && "rotate-90", theme.chevronIcon)}
                strokeWidth={isExpanded ? 3 : 2.5}
              />
            </button>

            <div className="min-w-0 flex-1 pl-0.5 pt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[10px] uppercase tracking-wider",
                  theme.chip,
                  isSelected && CHIP_SELECTED_RING
                )}
              >
                <span className="tabular-nums">{numbering}</span>
                <span className="font-semibold opacity-70">{depthLabel(depth)}</span>
              </span>

              <input
                value={section.title}
                readOnly={readOnly}
                onChange={(event) => onTitleChange(section.id, event.target.value)}
                onFocus={() => onSelect(section.id)}
                placeholder={`${depthLabel(depth)} ${numbering}`}
                aria-label={`Título de ${depthLabel(depth)} ${numbering}`}
                className={cn(
                  "-ml-1 mt-1 w-full cursor-text rounded-md bg-transparent px-1 py-0.5 font-bold tracking-tight text-text-primary outline-none transition-colors hover:bg-border/30 focus:bg-border/40 placeholder:font-semibold placeholder:text-muted-foreground/70 disabled:opacity-70 disabled:cursor-default",
                  theme.title
                )}
              />

              <input
                value={section.description}
                readOnly={readOnly}
                onChange={(event) => onDescriptionChange(section.id, event.target.value)}
                placeholder="Añade una descripción."
                aria-label={`Descripción de ${depthLabel(depth)} ${numbering}`}
                className="-ml-1 w-full cursor-text rounded-md bg-transparent px-1 py-0.5 text-[12px] text-text-secondary outline-none transition-colors hover:bg-border/30 focus:bg-border/40 placeholder:text-muted-foreground/70 disabled:opacity-70 disabled:cursor-default"
              />
            </div>

            <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
              {questionCount > 0 && (
                <span
                  aria-label={`${questionCount} preguntas`}
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-inset ring-border/70"
                >
                  {questionCount}
                </span>
              )}

              {!readOnly && (
                <MoveToPopover
                  id={section.id}
                  sections={handlers.sections}
                  destinations={moveDestinationsForSection(handlers.sections, entry)}
                  onMove={onMoveSection}
                />
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => onDelete(section.id)}
                    aria-label={`Eliminar ${depthLabel(depth)} ${numbering}`}
                    className="rounded-lg p-1.5 text-muted-foreground/60 transition-all hover:bg-status-negative/10 hover:text-status-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Eliminar {depthLabel(depth).toLowerCase()}</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {isExpanded && (
        <div
          className={cn(
            "mt-2.5 flex flex-col gap-3 pb-1 animate-in fade-in slide-in-from-top-1 duration-200",
            theme.rail,
            theme.railOffset,
            isSelected && RAIL_SELECTED
          )}
        >
          {canHaveQuestions(depth) && (
            <SectionQuestions
              readOnly={readOnly}
              sectionId={section.id}
              questions={section.questions}
              editingQuestionId={handlers.editingQuestionId}
              showQuestionValidation={handlers.showQuestionValidation}
              onOpenQuestion={handlers.onOpenQuestion}
              onQuestionChange={handlers.onQuestionChange}
              onCloseQuestion={handlers.onCloseQuestion}
              onAddQuestion={handlers.onAddQuestion}
              onDuplicateQuestion={handlers.onDuplicateQuestion}
              onRemoveQuestion={handlers.onRemoveQuestion}
              onReorderQuestions={handlers.onReorderQuestions}
              sections={handlers.sections}
              onMoveQuestion={handlers.onMoveQuestion}
            />
          )}

          {children.length > 0 && (
            <ul className={cn("flex flex-col", SIBLING_DIVIDER)}>
              {children.map((child) => (
                <SubsectionAccordion key={child.section.id} entry={child} readOnly={readOnly} {...handlers} />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
