import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookPlus, ChevronUp, CornerDownRight, Layers, Library, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusOnCreate } from "@/hooks/useFocusOnCreate";
import { toneBar, toneBorder, toneSolid, toneText, type Tone } from "@/lib/tone";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback/EmptyState";
import { EmptyStateActionButton } from "@/components/feedback/EmptyStateActionButton";
import { AiGeneratedBadge } from "@/components/ai-interaction";
import { AiCreateChip } from "./AiCreateChip";
import { InlineDeleteConfirm } from "./InlineDeleteConfirm";
import { SubsectionAccordion, type SubsectionAccordionHandlers } from "./SubsectionAccordion";
import { SectionQuestions } from "./SectionQuestions";
import { ANCHOR_ATTRIBUTE } from "@/hooks/useAnchorOffset";
import { SECTION_HEADER_DIVIDER, SIBLING_DIVIDER } from "./depthTheme";
import { childEntries, type SectionTreeEntry } from "./sectionTree";
import { depthLabel, canHaveQuestions } from "./surveyBuilderTypes";
import {
  cascadeContainer,
  cascadeItemSettleTime,
  CASCADE_CONTENT_GAP,
} from "@/lib/cascadeAnimation";

interface SectionEditorProps extends SubsectionAccordionHandlers {
  readOnly?: boolean;
  /** Always a level-1 section: the card is the root of one branch. */
  entry: SectionTreeEntry;
  /**
   * The accent this branch is drawn in — its edge, its numbering badge and
   * the chips of everything nested under it. Every section shares the same
   * brand blue: a per-section palette read as arbitrary categorization
   * rather than as depth, so the whole tree stays one color and hierarchy is
   * carried by outline and indentation instead.
   */
  tone?: Tone;
  /** Controlled by the parent: only one root card is expanded at a time. */
  isCollapsed: boolean;
  onToggleCardCollapse: () => void;
  canDelete: boolean;
  /**
   * Level 1's other empty-state option: creates the subsection a question
   * needs and opens that question straight away, in one click.
   */
  onAddSubsectionWithQuestion: (parentId: string) => void;
  /**
   * Level 1's empty-state bank option: opens the question bank drawer with
   * this section as the insert target.
   */
  onOpenQuestionBank: (sectionId: string) => void;
  /**
   * Level 1's third empty-state option: hands the section over to the AI
   * drawer, which proposes the subsections and questions to fill it with.
   */
  onGenerateWithAi: (sectionId: string) => void;
  /**
   * The inline AI composer, when it was opened from THIS section. It replaces
   * the empty state in place — the panel never leaves, and the proposal is
   * built where it will land.
   */
  aiComposer?: React.ReactNode;
}

/**
 * A root section card. Level 1 holds no questions of its own — it is a
 * container whose body is the nested accordion of its subsections.
 */
export function SectionEditor({
  readOnly,
  entry,
  tone = "brand",
  isCollapsed,
  onToggleCardCollapse,
  canDelete,
  onAddSubsectionWithQuestion,
  onOpenQuestionBank,
  onGenerateWithAi,
  aiComposer,
  ...handlers
}: SectionEditorProps) {
  const { section, depth, numbering } = entry;
  const {
    selectedId,
    onSelect,
    onTitleChange,
    onDescriptionChange,
    onDelete,
    onSaveSectionToBank,
    onAddSubsection,
    pendingDeleteId,
    pendingDeleteMessage,
    onConfirmDeleteSection,
    onCancelDeleteSection,
    isRowLocked,
    renamingId,
    onRenamingHandled,
  } = handlers;

  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const shouldAutoFocusTitle = renamingId === section.id;
  useFocusOnCreate(titleRef, shouldAutoFocusTitle);
  const children = childEntries(entry);
  const isSelected = selectedId === section.id;
  const isPendingDelete = pendingDeleteId === section.id;
  // A row elsewhere is mid delete-confirm or mid-edit: this card's own
  // controls go inert too, same as `readOnly` — but the tree underneath
  // (SectionQuestions, SubsectionAccordion) still gets the *original*
  // `readOnly`, not this, so the active row itself, however deep, still
  // works.
  const chromeLocked = readOnly || isRowLocked;

  // Grow the description to fit its content so it never shows an inner scrollbar.
  React.useLayoutEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [section.description]);

  const isDragging = handlers.draggingSectionId === section.id;
  const draggingParentId = handlers.draggingSectionId ? handlers.sections.find((s: any) => s.id === handlers.draggingSectionId)?.parentId : null;
  const isValidTarget = handlers.draggingSectionId !== null && handlers.draggingSectionId !== section.id && entry.parentId === draggingParentId;
  const isDropTarget = handlers.overSectionId === section.id && isValidTarget;

  return (
    <section
      {...handlers.getSectionDropTargetProps(section.id)}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-surface shadow-card transition-all relative",
        isCollapsed ? "shrink-0" : "flex-1",
        !isSelected && "border-border/60",
        isDragging && "opacity-40",
        isDropTarget && "ring-2 ring-primary ring-offset-2"
      )}
      style={isSelected ? toneBorder(tone, 45) : undefined}
    >
      {/* The branch's accent, held to the card's left edge. The header keeps
          its own white — a fill there would break the "one surface" rule the
          outline is built on — so the color lives on the edge instead, the
          way the home's alert row carries its mood. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={toneBar(tone)} />
      {/* Card header: same white as the body, split off by a divider rather
          than a fill. Generous inset — a rounded card needs room or the
          content hugs the curve. Anchors the rail when this section is active. */}
      <div
        {...(isSelected && handlers.editingQuestionId === null ? { [ANCHOR_ATTRIBUTE]: true } : {})}
        // Anywhere on the header makes this the active section — see the same
        // handler on a subsection's header row. Not while the delete banner is
        // up, or while some other row is locked: it should only ever answer
        // that.
        onClick={() => !isPendingDelete && !chromeLocked && onSelect(section.id)}
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
            <div className="flex flex-col items-center mt-1">
              {!chromeLocked && (
                <span
                  {...handlers.getSectionHandleProps(section.id)}
                  aria-label={`Reordenar ${section.title}`}
                  className="cursor-grab text-muted-foreground/30 hover:text-text-primary active:cursor-grabbing mb-1"
                >
                  <GripVertical className="h-4 w-4" strokeWidth={2.5} />
                </span>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (chromeLocked) return;
                  onToggleCardCollapse();
                }}
                disabled={chromeLocked}
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? "Expandir sección" : "Contraer sección"}
                className="shrink-0 rounded-lg p-1 text-muted-foreground/60 transition-all hover:bg-border/30 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronUp
                  className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")}
                  strokeWidth={2.5}
                />
              </button>
            </div>

            {/* Solid badge — the heaviest marker in the tree, reserved for level 1. */}
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums shadow-card"
              style={toneSolid(tone)}
            >
              {numbering}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 px-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={toneText(tone)}>
                  {depthLabel(depth)}
                </p>
                {section.isAiGenerated && <AiGeneratedBadge />}
              </div>
              <input
                ref={titleRef}
                value={section.title}
                readOnly={chromeLocked}
                onChange={(event) => onTitleChange(section.id, event.target.value)}
                onFocus={() => onSelect(section.id)}
                onBlur={() => shouldAutoFocusTitle && onRenamingHandled()}
                placeholder={`${depthLabel(depth)} ${numbering}`}
                aria-label="Título de la sección"
                className="w-full cursor-text rounded-lg bg-transparent px-1.5 py-0.5 text-[14px] font-bold tracking-tight text-text-primary outline-none transition-colors hover:bg-border/30 focus:bg-border/40 placeholder:text-muted-foreground/70 disabled:opacity-70 disabled:cursor-default"
              />
              <textarea
                ref={descriptionRef}
                value={section.description}
                readOnly={chromeLocked}
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
                    onClick={() => onSaveSectionToBank(section.id)}
                    disabled={chromeLocked}
                    aria-label="Guardar sección en el banco de preguntas"
                    className="rounded-lg border border-border/70 p-1.5 text-muted-foreground/70 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <BookPlus className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Guardar en el banco de preguntas</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onDelete(section.id)}
                    disabled={chromeLocked || !canDelete}
                    aria-label="Eliminar sección"
                    className="rounded-lg border border-status-negative/30 bg-status-negative/5 p-1.5 text-status-negative transition-all hover:border-status-negative/40 hover:bg-status-negative/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30 disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-transparent disabled:text-muted-foreground/70 disabled:opacity-40"
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

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            variants={{
              collapsed: { height: 0, opacity: 0 },
              expanded: {
                height: "auto",
                opacity: 1,
                transition: {
                  height: { duration: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.3, ease: "easeInOut" },
                }
              }
            }}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="flex min-h-0 flex-col gap-4 px-6 py-5 overflow-hidden"
          >
          {aiComposer ? (
            aiComposer
          ) : children.length === 0 && section.questions.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Esta sección está vacía"
              description="Las secciones pueden contener preguntas o subsecciones. Créalas tú mismo, o cuéntale a la IA de qué trata la encuesta y deja que proponga la estructura completa."
              className="p-8"
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <EmptyStateActionButton
                    onClick={() => onAddSubsection(section.id)}
                    disabled={chromeLocked}
                    icon={<CornerDownRight className="size-4" strokeWidth={2.5} />}
                  >
                    Crear subsección
                  </EmptyStateActionButton>
                  <EmptyStateActionButton
                    onClick={() => onAddSubsectionWithQuestion(section.id)}
                    disabled={chromeLocked}
                    icon={<Plus className="size-4" strokeWidth={2.5} />}
                  >
                    Crear pregunta
                  </EmptyStateActionButton>
                  {!chromeLocked && (
                    <EmptyStateActionButton
                      onClick={() => onOpenQuestionBank(section.id)}
                      icon={<Library className="size-4" strokeWidth={2.5} />}
                    >
                      Elegir una del banco
                    </EmptyStateActionButton>
                  )}
                  {!chromeLocked && (
                    <AiCreateChip
                      onClick={() => onGenerateWithAi(section.id)}
                      className="h-11 rounded-xl px-4"
                    />
                  )}
                </div>
              }
            />
          ) : (
            <>
              {canHaveQuestions(depth) && section.questions.length > 0 && (
                <SectionQuestions
                  readOnly={readOnly}
                  tone={tone}
                  sectionId={section.id}
                  questions={section.questions}
                  editingQuestionId={handlers.editingQuestionId}
                  isRowLocked={isRowLocked}
                  showQuestionValidation={handlers.showQuestionValidation}
                  onOpenQuestion={handlers.onOpenQuestion}
                  onQuestionChange={handlers.onQuestionChange}
                  onCloseQuestion={handlers.onCloseQuestion}
                  onAddQuestion={handlers.onAddQuestion}
                  onDuplicateQuestion={handlers.onDuplicateQuestion}
                  onRemoveQuestion={handlers.onRemoveQuestion}
                  onSaveQuestionToBank={handlers.onSaveQuestionToBank}
                  onReorderQuestions={handlers.onReorderQuestions}
                  sections={handlers.sections}
                  onMoveQuestion={handlers.onMoveQuestion}
                  aiStartQuestionId={handlers.aiStartQuestionId}
                />
              )}
              {children.length > 0 && (
                <motion.ul
                  className={cn("flex flex-col", SIBLING_DIVIDER)}
                  initial="hidden"
                  animate="show"
                  variants={cascadeContainer}
                >
                  {children.map((child, index) => (
                    <SubsectionAccordion
                      key={child.section.id}
                      entry={child}
                      tone={tone}
                      readOnly={readOnly}
                      index={index}
                      // This row's own content starts right as the row itself
                      // settles in, not after every sibling row has.
                      contentDelay={cascadeItemSettleTime(0, index) + CASCADE_CONTENT_GAP}
                      {...handlers}
                    />
                  ))}
                </motion.ul>
              )}
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </section>
  );
}
