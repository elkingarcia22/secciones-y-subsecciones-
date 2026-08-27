import * as React from "react";
import { ChevronUp, CornerDownRight, Layers, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineDeleteConfirm } from "./InlineDeleteConfirm";
import { SubsectionAccordion, type SubsectionAccordionHandlers } from "./SubsectionAccordion";
import { SectionQuestions } from "./SectionQuestions";
import { ANCHOR_ATTRIBUTE } from "@/hooks/useAnchorOffset";
import { SECTION_HEADER_DIVIDER, SIBLING_DIVIDER } from "./depthTheme";
import { childEntries, type SectionTreeEntry } from "./sectionTree";
import { depthLabel, canHaveQuestions } from "./surveyBuilderTypes";

interface SectionEditorProps extends SubsectionAccordionHandlers {
  readOnly?: boolean;
  /** Always a level-1 section: the card is the root of one branch. */
  entry: SectionTreeEntry;
  /** Controlled by the parent: only one root card is expanded at a time. */
  isCollapsed: boolean;
  onToggleCardCollapse: () => void;
  canDelete: boolean;
  /**
   * Level 1's other empty-state option: creates the subsection a question
   * needs and opens that question straight away, in one click.
   */
  onAddSubsectionWithQuestion: (parentId: string) => void;
}

/**
 * A root section card. Level 1 holds no questions of its own — it is a
 * container whose body is the nested accordion of its subsections.
 */
export function SectionEditor({
  readOnly,
  entry,
  isCollapsed,
  onToggleCardCollapse,
  canDelete,
  onAddSubsectionWithQuestion,
  ...handlers
}: SectionEditorProps) {
  const { section, depth, numbering } = entry;
  const {
    selectedId,
    onSelect,
    onTitleChange,
    onDescriptionChange,
    onDelete,
    onAddSubsection,
    pendingDeleteId,
    pendingDeleteMessage,
    onConfirmDeleteSection,
    onCancelDeleteSection,
  } = handlers;

  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const children = childEntries(entry);
  const isSelected = selectedId === section.id;
  const isPendingDelete = pendingDeleteId === section.id;

  // Grow the description to fit its content so it never shows an inner scrollbar.
  React.useLayoutEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [section.description]);

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-surface shadow-card",
        isCollapsed ? "shrink-0" : "flex-1",
        isSelected ? "border-primary/40" : "border-border/60"
      )}
    >
      {/* Card header: same white as the body, split off by a divider rather
          than a fill. Generous inset — a rounded card needs room or the
          content hugs the curve. Anchors the rail when this section is active. */}
      <div
        {...(isSelected && handlers.editingQuestionId === null ? { [ANCHOR_ATTRIBUTE]: true } : {})}
        // Anywhere on the header makes this the active section — see the same
        // handler on a subsection's header row. Not while the delete banner is
        // up: it should only ever answer that.
        onClick={() => !isPendingDelete && onSelect(section.id)}
        className={cn("flex items-start gap-3 border-b px-6 py-5", SECTION_HEADER_DIVIDER)}
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
                onToggleCardCollapse();
              }}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? "Expandir sección" : "Contraer sección"}
              className="mt-1 shrink-0 rounded-lg p-1 text-muted-foreground/60 transition-all hover:bg-border/30 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ChevronUp
                className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")}
                strokeWidth={2.5}
              />
            </button>

            {/* Solid badge — the heaviest marker in the tree, reserved for level 1. */}
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold tabular-nums text-primary-foreground shadow-card"
            >
              {numbering}
            </span>

            <div className="min-w-0 flex-1">
              <p className="px-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/70">
                {depthLabel(depth)}
              </p>
              <input
                value={section.title}
                readOnly={readOnly}
                onChange={(event) => onTitleChange(section.id, event.target.value)}
                onFocus={() => onSelect(section.id)}
                placeholder={`${depthLabel(depth)} ${numbering}`}
                aria-label="Título de la sección"
                className="w-full cursor-text rounded-lg bg-transparent px-1.5 py-0.5 text-[14px] font-bold tracking-tight text-text-primary outline-none transition-colors hover:bg-border/30 focus:bg-border/40 placeholder:text-muted-foreground/70 disabled:opacity-70 disabled:cursor-default"
              />
              <textarea
                ref={descriptionRef}
                value={section.description}
                readOnly={readOnly}
                onChange={(event) => onDescriptionChange(section.id, event.target.value)}
                onFocus={() => onSelect(section.id)}
                placeholder="Descripción (opcional)"
                aria-label="Descripción de la sección"
                rows={1}
                className="mt-0.5 w-full resize-none overflow-hidden rounded-lg bg-transparent px-1.5 py-0.5 text-[13px] font-medium leading-relaxed text-muted-foreground/90 outline-none transition-colors hover:bg-border/30 focus:bg-border/40 placeholder:text-muted-foreground/50 disabled:opacity-70 disabled:cursor-default"
              />
            </div>

            <div className="flex shrink-0 items-start gap-1 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onDelete(section.id)}
                    disabled={readOnly || !canDelete}
                    aria-label="Eliminar sección"
                    className="rounded-lg border border-border/60 p-1.5 text-muted-foreground/70 transition-all hover:border-status-negative/30 hover:bg-status-negative/5 hover:text-status-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/70"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {canDelete ? "Eliminar sección" : "La encuesta debe tener al menos una sección"}
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex min-h-0 flex-col gap-4 px-6 py-5 animate-in fade-in slide-in-from-top-1 duration-300">
          {children.length === 0 && section.questions.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Esta sección está vacía"
              description="Las secciones pueden contener preguntas o subsecciones. Crea una subsección para organizar el contenido, o crea directamente una pregunta."
              className="p-8"
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    onClick={() => onAddSubsection(section.id)}
                    variant="secondary"
                    size="sm"
                    className="gap-2 rounded-xl"
                  >
                    <CornerDownRight className="h-4 w-4" strokeWidth={2.5} />
                    Crear subsección
                  </Button>
                  <Button
                    onClick={() => onAddSubsectionWithQuestion(section.id)}
                    variant="secondary"
                    size="sm"
                    className="gap-2 rounded-xl"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Crear pregunta
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              {canHaveQuestions(depth) && section.questions.length > 0 && (
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
            </>
          )}
        </div>
      )}
    </section>
  );
}
