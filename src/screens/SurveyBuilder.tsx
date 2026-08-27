import * as React from "react";
import { toast } from "sonner";
import { moveItemById } from "@/lib/reorder";
import { useAutosave } from "@/hooks/useAutosave";
import { ANCHOR_ATTRIBUTE } from "@/hooks/useAnchorOffset";

import { createBlankSurveyDraft } from "@/mocks/surveyBuilderMocks";
import { ShellHeaderSlot } from "@/components/app-shell";
import type { TableSelectionActions } from "@/components/action-rail";
import {
  BuilderIdentity,
  DemographicsEditor,
  GeneralDataEditor,
  PagesEditor,
  ParticipantsEditor,
  SectionsPanel,
  BuilderSideRail,
  MINUTES_PER_QUESTION,
  REQUIRED_STEPS,
  STEPPER_ORDER,
  SectionEditor,
  appendChild,
  buildCustomDemographic,
  buildQuestion,
  canHaveQuestions,
  countDescendants,
  countQuestions,
  depthLabel,
  duplicateQuestion,
  findQuestionOwner,
  findSection,
  flattenSections,
  insertAfterSibling,
  isBranch,
  isQuestionComplete,
  isStepComplete,
  isStepReachable,
  moveQuestionTo,
  moveSectionTo,
  questionBlockedReason,
  nextSelectionAfterRemoval,
  participantCount,
  pathIds,
  patchSection,
  removeSection,
  reorderSiblings,
  stepFromSelection,
  stepNumber as stepNumberOf,
  subsectionBlockedReason,
  type BuilderSelection,
  type DemographicSectionId,
  type FixedBlockId,
  type SectionImportSummary,
  type StepperStatusInput,
  type StepperStepId,
  type SurveyDraft,
  type SurveyQuestion,
  type SurveySection,
} from "@/components/survey-builder";
import { SurveyPreviewDrawer, canPreview } from "@/components/survey-preview";
import { QuestionBankDrawer } from "@/components/survey-builder/QuestionBankDrawer";

interface SurveyBuilderProps {
  initialDraft?: SurveyDraft;
  /**
   * Which panel the builder opens on. Defaults to the first step; the list's
   * "Editar participantes" uses it to land straight on that one instead of
   * making the person walk there.
   */
  initialStep?: FixedBlockId;
  initialSelection?: BuilderSelection;
  onExit: (draft?: SurveyDraft) => void;
  /**
   * Publishes the draft as it changes. Leaving the builder is the shell
   * breadcrumb's job now, and that click happens outside this component — so
   * the caller needs the current draft on hand to commit it, exactly as
   * finishing the wizard would.
   */
  onDraftChange?: (draft: SurveyDraft) => void;
}

/** Fixed blocks that can be switched on and off. */
type ToggleableBlockId = "welcome" | "closing";

const buildEmptySection = (title: string): SurveySection => ({
  id: `section-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
  title,
  description: "",
  questions: [],
  children: [],
});

/**
 * SurveyBuilder
 *
 * Step of the creation wizard where the author lays out the survey structure:
 * fixed blocks plus a tree of sections whose leaves hold the questions.
 */
export function SurveyBuilder({
  initialDraft,
  initialStep = "general",
  initialSelection,
  onExit,
  onDraftChange,
}: SurveyBuilderProps) {
  const _initialDraft = React.useMemo(() => initialDraft || createBlankSurveyDraft(), [initialDraft]);
  const [draft, setDraft] = React.useState<SurveyDraft>(_initialDraft);

  React.useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);
  const [selection, setSelection] = React.useState<BuilderSelection>(
    initialSelection || {
      kind: "fixed",
      id: initialStep,
    }
  );
  const [isSectionsPanelCollapsed, setIsSectionsPanelCollapsed] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsSectionsPanelCollapsed(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);
  // Steps the author has passed through. Visit-based steps (welcome,
  // demographics, closing) count as done the first time they are reached.
  const [visitedSteps, setVisitedSteps] = React.useState<ReadonlySet<StepperStepId>>(
    () => new Set(["general"])
  );
  // Flips on once the author has tried to leave the general step with a
  // required field still empty, so the name/date inputs only turn red in
  // response to that attempt rather than greeting a blank form with errors.
  const [generalValidationTouched, setGeneralValidationTouched] = React.useState(false);
  // Same intent for the optional welcome/closing pages: an enabled page with
  // no content isn't a page anyone finished, so "Continuar"/"Finalizar" flags
  // the missing content inline rather than silently passing an empty page.
  const [fixedValidationTouched, setFixedValidationTouched] = React.useState(false);
  // The same "only after an attempt" intent for the steps whose completeness is
  // judged purely by content: participants (someone selected?). The sections
  // step is judged the same way. (Demographics is judged on its own content,
  // but its empty-state message is always visible, so it needs no flag.)
  const [participantsValidationTouched, setParticipantsValidationTouched] = React.useState(false);
  const [sectionsValidationTouched, setSectionsValidationTouched] = React.useState(false);
  // The steps flagged red in the left rail. Empty while both required and
  // optional steps are complete; after a failed finalize it holds every step
  // still failing, so the whole picture is visible at once rather than one
  // error at a time. Reactive: any step that recovers drops out on the next
  // render even while the set still holds it.
  const [finalizeErrorSteps, setFinalizeErrorSteps] = React.useState<ReadonlySet<StepperStepId>>(
    () => new Set()
  );
  /**
   * The one branch that is open, shared by the navigation tree and the main
   * panel — root cards included. Two separate sets let the two sides disagree
   * about what was open; one set makes them the same interaction seen twice.
   *
   * Exactly one row stays open per level, so this is always a single path from
   * a root down to the row being worked on. That is what stops the panel from
   * growing into an endless column.
   */
  const [expandedCardIds, setExpandedCardIds] = React.useState<ReadonlySet<string>>(() => {
    // Open the first root section always, and down to its first subsection
    // when it has one: enough to show what a section holds, short enough to
    // fit without scrolling. A root with no subsections (questions sitting
    // directly on it) must still open, or its questions render hidden.
    const root = _initialDraft.sections[0];
    if (!root) return new Set();
    const firstChild = root.children[0];
    return new Set(firstChild ? [root.id, firstChild.id] : [root.id]);
  });
  // At most one question form is open across the whole survey, matching the
  // one-open-row rule the section outline follows. The form edits the survey
  // directly, so there is no draft to save or discard — opening another row
  // just moves the form onto it.
  const [editingQuestionId, setEditingQuestionId] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  // The preview reads the same draft the builder is editing, so there is
  // nothing to hand over when it opens — only whether it is on screen.
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = React.useState(false);

  // The participants step's table owns its own ticks; the rail only needs the
  // count and the two ways to act on it (see `TableSelectionActions`).
  const [participantsSelectionCount, setParticipantsSelectionCount] = React.useState(0);
  const [clearParticipantsSelection, setClearParticipantsSelection] = React.useState<(() => void) | null>(null);
  const [deleteParticipantsSelection, setDeleteParticipantsSelection] = React.useState<(() => void) | null>(null);

  const handleParticipantsSelectionChange = React.useCallback(
    (count: number, actions: TableSelectionActions) => {
      setParticipantsSelectionCount(count);
      setClearParticipantsSelection(() => actions.clear);
      setDeleteParticipantsSelection(actions.remove ? () => actions.remove! : null);
    },
    []
  );

  // Mirrors the question-editing state above, one level up: lifted here so
  // the side rail's "Crear dato demográfico" button can open a fresh field
  // the same way clicking the accordion's own button does.
  const [editingDemographicId, setEditingDemographicId] = React.useState<string | null>(null);
  const [openDemographicSections, setOpenDemographicSections] = React.useState<
    ReadonlySet<DemographicSectionId>
  >(() => new Set(["library"]));
  const handleToggleDemographicSection = (id: DemographicSectionId) => {
    setOpenDemographicSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // The whole draft is the unit of persistence, so any edit — a title, a
  // question, a toggle — moves the indicator.
  const autosave = useAutosave(draft);

  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);

  // Bumped whenever validation opens a question the author didn't click on
  // themselves, so the workspace scrolls it into view instead of leaving it
  // open somewhere off-screen.
  const [scrollToAnchorTick, setScrollToAnchorTick] = React.useState(0);
  React.useEffect(() => {
    if (scrollToAnchorTick === 0) return;
    const anchor = workspaceRef.current?.querySelector<HTMLElement>(`[${ANCHOR_ATTRIBUTE}]`);
    anchor?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [scrollToAnchorTick]);

  const questionCount = React.useMemo(() => countQuestions(draft.sections), [draft.sections]);
  // No questions yet genuinely means no time to estimate — the floor only
  // matters once there's at least one question to round up from zero.
  const estimatedMinutes =
    questionCount === 0 ? 0 : Math.max(1, Math.round(questionCount * MINUTES_PER_QUESTION));
  const participantsTotal = participantCount(draft.participants);

  const hasSectionWithQuestion = React.useMemo(
    () => draft.sections.length > 0 && countQuestions(draft.sections) > 0,
    [draft.sections]
  );

  // Mirrors the "Esta sección está vacía" empty state in SectionEditor: a
  // section is empty only when it has neither its own questions nor
  // subsections. A container section with no direct questions is fine as
  // long as every subsection underneath it carries content.
  const allSectionsHaveQuestions = React.useMemo(() => {
    const isSectionFilled = (section: (typeof draft.sections)[number]): boolean => {
      if (section.questions.length === 0 && section.children.length === 0) {
        return false;
      }
      return section.children.every(isSectionFilled);
    };
    return draft.sections.every(isSectionFilled);
  }, [draft.sections]);

  // A section "with a question" only counts once every question in the whole
  // tree is actually answerable — blank wording, an unset scale, or empty
  // options don't make a question anyone could take.
  const allQuestionsComplete = React.useMemo(
    () =>
      flattenSections(draft.sections).every((entry) =>
        entry.section.questions.every(isQuestionComplete)
      ),
    [draft.sections]
  );

  const stepInput: StepperStatusInput = React.useMemo(
    () => ({ draft, visitedSteps, hasSectionWithQuestion, allSectionsHaveQuestions, allQuestionsComplete }),
    [draft, visitedSteps, hasSectionWithQuestion, allSectionsHaveQuestions, allQuestionsComplete]
  );

  /**
   * Moves the active selection and records a visit. Every path — menu, tree
   * click, rail action, delete fallback — lands here, so visit-based steps
   * (welcome, demographics, closing) are done the first time they appear.
   */
  const commitSelection = (next: BuilderSelection) => {
    const step = stepFromSelection(next);
    setVisitedSteps((current) =>
      current.has(step) ? current : new Set(current).add(step)
    );
    setSelection(next);
  };

  const selectedEntry =
    selection.kind === "section" ? findSection(draft.sections, selection.id) : null;
  const selectedSection = selectedEntry?.section ?? null;

  /**
   * Makes a subsection reachable in the main panel by opening the branch down
   * to it. A row that is already on the open branch is left alone, so clicking
   * an ancestor never collapses the row being edited underneath it.
   */
  const revealCard = (id: string) => {
    setExpandedCardIds((current) =>
      current.has(id) ? current : new Set(pathIds(draft.sections, id))
    );
  };

  const applySelectSection = (id: string) => {
    commitSelection({ kind: "section", id });
    revealCard(id);
  };

  /**
   * Selects any section and makes sure it is visible: `revealCard` opens the
   * branch down to it — root card included — and closes every other one.
   *
   * Opening a section shows its questions at rest — carrying an open form over
   * would greet the author with an editor they did not ask for, and leave every
   * other row inert.
   */
  const selectSection = (id: string) => {
    applySelectSection(id);
  };

  const selectFixed = (id: FixedBlockId) => {
    commitSelection({ kind: "fixed", id });
  };

  /**
   * Selects and opens the first question anywhere in the tree that is
   * missing a required field, and asks the workspace to scroll it into view.
   * Returns whether one was found, so callers can fall back to a different
   * message when every question already qualifies.
   */
  const focusFirstIncompleteQuestion = (): boolean => {
    for (const entry of flattenSections(draft.sections)) {
      const question = entry.section.questions.find((item) => !isQuestionComplete(item));
      if (question) {
        selectSection(entry.section.id);
        setEditingQuestionId(question.id);
        setScrollToAnchorTick((tick) => tick + 1);
        return true;
      }
    }
    return false;
  };

  /**
   * Surfaces why a locked step or action stayed locked. When the earliest
   * incomplete required step is "general", the blocker is a specific empty
   * field rather than an unvisited page — so this also flips on the inline
   * highlighting in GeneralDataEditor instead of leaving the author to guess
   * which field the toast means.
   */
  const announceStepBlocked = () => {
    const blockingStep = REQUIRED_STEPS.find((step) => !isStepComplete(step, stepInput));
    if (blockingStep === "general") {
      setGeneralValidationTouched(true);
      toast.error("Completa el nombre, el tipo y las fechas de la encuesta para continuar.");
      return;
    }
    if (blockingStep === "participants") {
      toast.error("Selecciona al menos un participante para continuar.");
      return;
    }
    if (blockingStep === "demographics") {
      const isNom035 = draft.name.toLowerCase().includes("nom 035");
      if (isNom035) {
        toast.error(
          "Para la encuesta NOM 035, debes mantener activado al menos un dato demográfico."
        );
      } else {
        toast.error(
          "Abre la pestaña de Datos demográficos para revisar o configurar los filtros."
        );
      }
      return;
    }
    if (blockingStep === "sections") {
      setSectionsValidationTouched(true);
      const sectionsHasIncompleteQuestion =
        hasSectionWithQuestion && focusFirstIncompleteQuestion();

      if (sectionsHasIncompleteQuestion) {
        toast.error("Completa los campos obligatorios de la pregunta señalada para continuar.");
      } else if (hasSectionWithQuestion && !allSectionsHaveQuestions) {
        toast.error("Todas las secciones deben tener al menos una pregunta para continuar.");
      } else {
        toast.error("Añade al menos una sección con preguntas para continuar.");
      }
      return;
    }
    toast.error("Completa los pasos anteriores para desbloquear este paso.");
  };

  /**
   * Stepper navigation. A step only opens once every previous step is done —
   * locked steps are real, not cosmetic. Marking a step visited on the way in
   * feeds the visit-based completion rules (welcome, demographics, closing).
   */
  const handleSelectStep = (step: StepperStepId) => {
    if (!isStepReachable(step, stepInput)) {
      announceStepBlocked();
      return;
    }

    if (step === "sections") {
      // Land on the first root section so the tree has something to show. A
      // brand-new survey has none yet — without creating one here, this step
      // would be a dead end: nothing to select, and the rail's own "add
      // section" button only appears once a section is already active.
      const first = draft.sections[0];
      if (first) {
        selectSection(first.id);
      } else {
        handleAddRootSection();
      }
      return;
    }
    selectFixed(step);
  };

  /** Applies an immutable patch to a section anywhere in the tree. */
  const updateSection = React.useCallback(
    (sectionId: string, patch: Partial<Omit<SurveySection, "id">>) => {
      setDraft((current) => ({
        ...current,
        sections: patchSection(current.sections, sectionId, patch),
      }));
    },
    []
  );

  const handleAddRootSection = () => {
    // The stepper's real blocking guards every path into the tree step: the
    // rail's add-section would otherwise sidestep the locks.
    if (!isStepReachable("sections", stepInput)) {
      announceStepBlocked();
      return;
    }

    const section = buildEmptySection(`Sección ${draft.sections.length + 1}`);
    setDraft({ ...draft, sections: [...draft.sections, section] });
    commitSelection({ kind: "section", id: section.id });
    // It's a brand-new root, so its branch is just itself.
    setExpandedCardIds(new Set([section.id]));
    setEditingQuestionId(null);
    setRenamingId(section.id);
  };

  /**
   * Applies the tree parsed from an imported file. The sections are appended
   * without touching what is already there, and the first imported root gets
   * selected so the panel shows the new content instead of staying on the old
   * one. The step's completeness re-derives from the draft, so a file that
   * brings questions also clears the red finalize markers for this step.
   */
  const handleImportSections = (sections: SurveySection[], summary: SectionImportSummary) => {
    setDraft((current) => ({
      ...current,
      sections: [...current.sections, ...sections],
    }));
    const first = sections[0];
    if (first) {
      commitSelection({ kind: "section", id: first.id });
      revealCard(first.id);
    }
    setEditingQuestionId(null);
    toast.success(
      `Se importaron ${summary.sections} ${
        summary.sections === 1 ? "sección" : "secciones"
      } y ${summary.questions} ${summary.questions === 1 ? "pregunta" : "preguntas"}.`
    );
  };

  const handleAddSubsection = (parentId: string) => {
    const parent = findSection(draft.sections, parentId);
    if (!parent) return;

    if (!isStepReachable("sections", stepInput)) {
      announceStepBlocked();
      return;
    }

    const blocked = subsectionBlockedReason(parent);
    if (blocked) {
      toast.info(blocked);
      return;
    }

    // The parent keeps its own questions: from level 2 down, questions and
    // subsections coexist.
    const child = buildEmptySection(
      `${depthLabel(parent.depth + 1)} ${parent.numbering}.${parent.section.children.length + 1}`
    );

    setDraft({ ...draft, sections: appendChild(draft.sections, parentId, child) });
    commitSelection({ kind: "section", id: child.id });
    // The child isn't in `draft.sections` yet, so its branch is the parent's
    // path plus the new id.
    setExpandedCardIds(new Set([...pathIds(draft.sections, parentId), child.id]));
    setEditingQuestionId(null);
    setRenamingId(child.id);
  };

  /**
   * Rail's "crear un hermano" choice while standing on a level-2/3 subsección:
   * inserts a new subsección as a sibling right below `siblingId` — same
   * parent, placed directly under it. The rail passes the selected item itself
   * for a same-level sibling, or the level-2 parent while standing on a
   * level-3 sub-sección (its "subsección nivel 2" choice).
   */
  const handleAddSiblingSubsection = (siblingId: string) => {
    const sibling = findSection(draft.sections, siblingId);
    if (!sibling || sibling.parentId === null) return;

    const parent = findSection(draft.sections, sibling.parentId);
    if (!parent) return;

    if (!isStepReachable("sections", stepInput)) {
      announceStepBlocked();
      return;
    }

    const blocked = subsectionBlockedReason(parent);
    if (blocked) {
      toast.info(blocked);
      return;
    }

    const child = buildEmptySection(
      `${depthLabel(parent.depth + 1)} ${parent.numbering}.${sibling.index + 2}`
    );

    setDraft({ ...draft, sections: insertAfterSibling(draft.sections, siblingId, child) });
    commitSelection({ kind: "section", id: child.id });
    // The child isn't in `draft.sections` yet, so its branch is the parent's
    // path plus the new id.
    setExpandedCardIds(new Set([...pathIds(draft.sections, parent.section.id), child.id]));
    setEditingQuestionId(null);
    setRenamingId(child.id);
  };

  /**
   * Level 1's other empty-state option: a root section can't hold a question
   * directly, so this creates the subsection it needs and drops the author
   * straight into the new question's form — one click instead of two.
   */
  const handleAddSubsectionWithQuestion = (parentId: string) => {
    const parent = findSection(draft.sections, parentId);
    if (!parent) return;

    if (!isStepReachable("sections", stepInput)) {
      announceStepBlocked();
      return;
    }

    const blocked = subsectionBlockedReason(parent);
    if (blocked) {
      toast.info(blocked);
      return;
    }

    const question = buildQuestion();
    const child: SurveySection = {
      ...buildEmptySection(
        `${depthLabel(parent.depth + 1)} ${parent.numbering}.${parent.section.children.length + 1}`
      ),
      questions: [question],
    };

    setDraft({ ...draft, sections: appendChild(draft.sections, parentId, child) });
    commitSelection({ kind: "section", id: child.id });
    setExpandedCardIds(new Set([...pathIds(draft.sections, parentId), child.id]));
    setEditingQuestionId(question.id);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;

    const entry = findSection(draft.sections, pendingDeleteId);
    const nextSelectedId = nextSelectionAfterRemoval(draft.sections, pendingDeleteId);
    const sections = removeSection(draft.sections, pendingDeleteId);

    setDraft({ ...draft, sections });
    // Both branches read the pre-removal `draft`, which still has this id.
    if (nextSelectedId) {
      selectSection(nextSelectedId);
    } else {
      selectFixed("welcome");
    }
    setPendingDeleteId(null);
    toast.success(`${depthLabel(entry?.depth ?? 1)} eliminada`);
  };

  const handleDeleteRequest = (id: string) => {
    const entry = findSection(draft.sections, id);
    if (!entry) return;

    const isEmpty = entry.section.questions.length === 0 && !isBranch(entry.section);
    if (isEmpty) {
      const nextSelectedId = nextSelectionAfterRemoval(draft.sections, id);
      setDraft({ ...draft, sections: removeSection(draft.sections, id) });
      if (nextSelectedId) {
        selectSection(nextSelectedId);
      } else {
        selectFixed("welcome");
      }
      return;
    }

    // Anything holding questions or subsections gets a confirmation step.
    setPendingDeleteId(id);
  };

  const handleReorderSections = React.useCallback((fromId: string, toId: string) => {
    setDraft((current) => ({
      ...current,
      sections: reorderSiblings(current.sections, fromId, toId),
    }));
  }, []);

  /**
   * Moves a subsection (level 2/3) to sit just below another section, as its
   * sibling — the moved section adopts the destination's depth. The
   * destination comes from the row's "Mover a…" picker, so it is already
   * validated for depth and cycles. Lands the author on the destination so the
   * move is visible, and closes any open question form.
   */
  const handleMoveSection = (id: string, targetId: string) => {
    setDraft((current) => ({
      ...current,
      sections: moveSectionTo(current.sections, id, targetId),
    }));
    selectSection(targetId);
    setEditingQuestionId(null);
    toast.success("Subsección movida");
  };

  /**
   * Opens one row, or closes it if it was already open. Opening replaces the
   * whole open branch, so no two rows at the same level are ever expanded
   * together — in the tree and in the main panel alike, since both read this
   * same set.
   */
  const handleToggleCardExpanded = (id: string) => {
    const chain = pathIds(draft.sections, id);
    setExpandedCardIds((current) =>
      current.has(id) ? new Set(chain.slice(0, -1)) : new Set(chain)
    );
    // Touching a row makes it the active one. Selection is what the tree
    // highlights and what the action rail lines up with, so without this the
    // right panel could move while both of them stayed behind.
    commitSelection({ kind: "section", id });
  };

  /**
   * Adds a question to an explicit section and opens it for editing — a new
   * question has nothing to show collapsed, so the form is the useful state.
   * Level 1 never takes questions.
   */
  const handleAddQuestionTo = (sectionId: string) => {
    const target = findSection(draft.sections, sectionId);
    if (!target) return;

    const blocked = questionBlockedReason(target);
    if (blocked) {
      toast.info(blocked);
      return;
    }

    const question = buildQuestion();
    updateSection(sectionId, {
      questions: [...target.section.questions, question],
    });
    setEditingQuestionId(question.id);
  };

  /**
   * Opens a question from its collapsed row. Whatever another open form had
   * already reached the survey — edits write through — so the switch is just
   * pointing the editor at the new row.
   */
  const handleOpenQuestion = (questionId: string) => {
    setEditingQuestionId(questionId);
  };

  /** Writes one question's edits straight into its section's list. */
  const handleQuestionChange = (sectionId: string, question: SurveyQuestion) => {
    setDraft((current) => {
      const owner = findSection(current.sections, sectionId);
      if (!owner) return current;
      return {
        ...current,
        sections: patchSection(current.sections, sectionId, {
          questions: owner.section.questions.map((item) =>
            item.id === question.id ? question : item
          ),
        }),
      };
    });
  };

  const handleAddQuestion = () => {
    if (!selectedSection || !selectedEntry) {
      toast.info("Selecciona una sección para añadir preguntas.");
      return;
    }
    // Level 1 is a container only: "crear pregunta" there creates the
    // subsection the question needs and opens it — one click, same as the
    // section card's empty state.
    if (!canHaveQuestions(selectedEntry.depth)) {
      handleAddSubsectionWithQuestion(selectedSection.id);
      return;
    }
    handleAddQuestionTo(selectedSection.id);
  };

  const handleAddBankQuestions = (texts: string[]) => {
    if (!selectedSection || !selectedEntry) {
      toast.info("Selecciona una sección para añadir preguntas.");
      return;
    }
    
    const target = findSection(draft.sections, selectedSection.id);
    if (!target) return;

    const newQuestions = texts.map(text => {
      const q = buildQuestion();
      return { ...q, statement: `<p>${text}</p>`, isBankQuestion: true };
    });

    updateSection(selectedSection.id, {
      questions: [...target.section.questions, ...newQuestions],
    });
    toast.success(`Se añadieron ${texts.length} preguntas.`);
  };

  /**
   * Rail shortcut for "Datos creados solo para esta encuesta" — the only one
   * of the three demographic accordions with a real create action. Reveals
   * the accordion if it was collapsed and opens the new field for editing,
   * same as clicking the accordion's own button would.
   */
  const handleAddCustomDemographic = () => {
    const field = buildCustomDemographic();
    setDraft((current) => ({
      ...current,
      demographics: { ...current.demographics, fields: [...current.demographics.fields, field] },
    }));
    setOpenDemographicSections((current) => (current.has("custom") ? current : new Set(current).add("custom")));
    setEditingDemographicId(field.id);
  };

  /**
   * A survey with no questions has nothing to preview — every other block is
   * framing around them, so that single condition is the whole gate.
   */
  const handlePreview = () => {
    if (!canPreview(draft)) {
      toast.info("Añade al menos una pregunta para ver la vista previa.");
      return;
    }
    setIsPreviewOpen(true);
  };

  // Questions shown on a branch belong to its descendants, so the owner is
  // resolved by question id rather than assumed to be the selected section.
  const handleRemoveQuestion = (questionId: string) => {
    const owner = findQuestionOwner(draft.sections, questionId);
    if (!owner) return;

    updateSection(owner.section.id, {
      questions: owner.section.questions.filter((question) => question.id !== questionId),
    });
    // The question is going away, so there is nothing left to edit — closing
    // outright is the honest outcome.
    if (questionId === editingQuestionId) setEditingQuestionId(null);
  };

  /**
   * Inserts a copy right after the original and moves editing onto it. The
   * source is the stored question — edits already wrote through on each
   * keystroke, so the copy is always what the author is looking at.
   */
  const handleDuplicateQuestion = (questionId: string) => {
    const owner = findQuestionOwner(draft.sections, questionId);
    if (!owner) return;

    const source = owner.section.questions.find((question) => question.id === questionId);
    if (!source) return;

    const copy = duplicateQuestion(source);
    const questions = owner.section.questions.flatMap((question) =>
      question.id === questionId ? [source, copy] : [question]
    );

    updateSection(owner.section.id, { questions });
    setEditingQuestionId(copy.id);
  };

  const handleReorderQuestions = (fromId: string, toId: string) => {
    const owner = findQuestionOwner(draft.sections, fromId);
    const target = findQuestionOwner(draft.sections, toId);

    // Questions only reorder inside their own section.
    if (!owner || !target || owner.section.id !== target.section.id) return;

    updateSection(owner.section.id, {
      questions: moveItemById(owner.section.questions, fromId, toId),
    });
  };

  /**
   * Moves a question into another section's question list (appended last).
   * The destination comes from the row's "Mover a…" picker, so it is already
   * restricted to sections that can hold questions. Closes the editor if the
   * moved question was the one being edited — the form is bound to its old
   * section and would otherwise point at a row that no longer lives there.
   */
  const handleMoveQuestion = (questionId: string, targetSectionId: string) => {
    setDraft((current) => ({
      ...current,
      sections: moveQuestionTo(current.sections, questionId, targetSectionId),
    }));
    selectSection(targetSectionId);
    if (questionId === editingQuestionId) setEditingQuestionId(null);
    toast.success("Pregunta movida");
  };



  const handleFixedBlockContentChange = React.useCallback((id: ToggleableBlockId, content: string) => {
    setDraft((current) =>
      id === "welcome"
        ? { ...current, welcomeDescription: content, welcomeEnabled: content.trim() !== "" }
        : { ...current, closingDescription: content, closingEnabled: content.trim() !== "" }
    );
  }, []);

  /** Shared callbacks every section card and nested accordion needs. */
  const accordionHandlers = {
    expandedIds: expandedCardIds,
    selectedId: selection.kind === "section" ? selection.id : null,
    onToggleExpanded: handleToggleCardExpanded,
    onSelect: selectSection,
    onTitleChange: (id: string, title: string) => updateSection(id, { title }),
    onDescriptionChange: (id: string, description: string) =>
      updateSection(id, { description }),
    onDelete: handleDeleteRequest,
    onAddSubsection: handleAddSubsection,
    sections: draft.sections,
    onMoveSection: handleMoveSection,
    pendingDeleteId,
    pendingDeleteMessage: buildDeleteDescription(
      pendingDeleteId ? findSection(draft.sections, pendingDeleteId) : null
    ),
    onConfirmDeleteSection: confirmDelete,
    onCancelDeleteSection: () => setPendingDeleteId(null),
    editingQuestionId,
    showQuestionValidation: sectionsValidationTouched,
    onOpenQuestion: handleOpenQuestion,
    onQuestionChange: handleQuestionChange,
    onCloseQuestion: () => setEditingQuestionId(null),
    onAddQuestion: handleAddQuestionTo,
    onDuplicateQuestion: handleDuplicateQuestion,
    onRemoveQuestion: handleRemoveQuestion,
    onReorderQuestions: handleReorderQuestions,
    onMoveQuestion: handleMoveQuestion,
  };

  /**
   * Main panel content.
   *
   * Every root section is always rendered as a stacked card. Only one card is
   * expanded at a time; its body is the nested accordion of subsections, so the
   * whole hierarchy is visible without leaving the panel.
   */
  const renderMainPanel = () => {
    if (selection.kind === "fixed") {
      const blockId = selection.id;

      if (blockId === "general") {
        return (
          <GeneralDataEditor
            draft={draft}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
            showValidation={generalValidationTouched}
          />
        );
      }

      if (blockId === "participants") {
        return (
          <ParticipantsEditor
            participants={draft.participants}
            onChange={(patch) =>
              setDraft((current) => ({
                ...current,
                participants: { ...current.participants, ...patch },
              }))
            }
            showValidation={participantsValidationTouched}
            onSelectionChange={handleParticipantsSelectionChange}
          />
        );
      }

      if (blockId === "demographics") {
        return (
          <DemographicsEditor
            demographics={draft.demographics}
            onChange={(patch) =>
              setDraft((current) => ({
                ...current,
                demographics: { ...current.demographics, ...patch },
              }))
            }
            editingId={editingDemographicId}
            onEditingIdChange={setEditingDemographicId}
            openSections={openDemographicSections}
            onToggleSection={handleToggleDemographicSection}
            importedDemographics={draft.participants.importedDemographics}
            importedNewCount={draft.participants.importedNewCount}
          />
        );
      }

      if (blockId === "pages") {
        return (
          <PagesEditor
            welcomeContent={draft.welcomeDescription}
            closingContent={draft.closingDescription}
            onWelcomeChange={(content) => handleFixedBlockContentChange("welcome", content)}
            onClosingChange={(content) => handleFixedBlockContentChange("closing", content)}
          />
        );
      }
    }

    return (
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {draft.sections.map((rootSection, index) => (
          <SectionEditor
            readOnly={draft.isReadOnly}
            key={rootSection.id}
            entry={{
              section: rootSection,
              depth: 1,
              numbering: String(index + 1),
              parentId: null,
              index,
            }}
            isCollapsed={!expandedCardIds.has(rootSection.id)}
            onToggleCardCollapse={() => handleToggleCardExpanded(rootSection.id)}
            canDelete={draft.sections.length > 1}
            onAddSubsectionWithQuestion={handleAddSubsectionWithQuestion}
            {...accordionHandlers}
          />
        ))}
      </div>
    );
  };

  // The rail's creation buttons and the footer's progress label both key off
  // of which step is active, so it is resolved once here rather than
  // recomputed per consumer.
  const activeStep = stepFromSelection(selection);
  const isSectionsStepActive = activeStep === "sections";
  const isDemographicsStepActive = activeStep === "demographics";

  // Questions can always be created from the rail: on a subsection they land
  // in that section, on a level-1 section the button creates the subsection
  // that carries them. Only "add subsection" can be genuinely blocked (depth).
  const addQuestionBlockedReason = null;
  const addSubsectionBlockedReason = selectedEntry ? subsectionBlockedReason(selectedEntry) : null;
  // Always show the subsection button — on a level-3 sub-sección the rail menu
  // still offers the sibling (same level) even though a deeper level is capped.
  const showAddSubsection = true;
  // Creating one while the block is switched off would just add to a
  // configuration nobody is using — same shape of guard as the two above.
  const addDemographicBlockedReason = draft.demographics.enabled
    ? null
    : "Activa los datos demográficos para poder crear uno.";

  // "Continuar" walks the same combined order the menu renders — required
  // steps first, then the two optional pages — so it always lands on whatever
  // is next in that list, gated by the same reachability check as a direct
  // click on the menu.
  const nextStep = STEPPER_ORDER[STEPPER_ORDER.indexOf(activeStep) + 1] ?? null;

  const isPagesStep = activeStep === "pages";

  // On the pages step there is nowhere further to advance, but the button is
  // not a dead end — it finishes the survey.
  const canContinue = isPagesStep ? true : nextStep !== null;
  const continueLabel = isPagesStep ? "Finalizar" : "Continuar";
  const continueDisabledReason = undefined;

  const handleContinue = () => {
    if (!isPagesStep) {
      // Advancing out of a required step demands that it be complete — not
      // just that the next step happens to be reachable. Optional steps are
      // always "reachable", so without this the sections step could hand the
      // author straight to the welcome page while holding zero questions.
      if (!isStepComplete(activeStep, stepInput)) {
        announceStepBlocked();
        return;
      }
      if (nextStep) handleSelectStep(nextStep);
      return;
    }

    handleFinalize();
  };

  /**
   * "Finalizar" walks every step — required and optional alike — not just the
   * page under the cursor. One incomplete step keeps the survey un-submittable,
   * so anything still failing is worth knowing about. The first failure gets
   * the author dropped onto it; the rest stay listed in the rail, red.
   */
  const handleFinalize = () => {
    const failing = STEPPER_ORDER.filter((step) => !isStepComplete(step, stepInput));

    if (failing.length === 0) {
      setFinalizeErrorSteps(new Set());
      toast.success("Encuesta guardada");
      onExit({ ...draft, status: "scheduled" });
      return;
    }

    // Mark every still-incomplete step red, in the rail and in its editor.
    setFinalizeErrorSteps(new Set(failing));
    const hasFailing = (step: StepperStepId) => failing.includes(step);
    if (hasFailing("general")) setGeneralValidationTouched(true);
    if (hasFailing("participants")) setParticipantsValidationTouched(true);
    if (hasFailing("sections")) setSectionsValidationTouched(true);
    if (hasFailing("pages")) setFixedValidationTouched(true);

    // Drop the author on the first incomplete step in menu order so the
    // red marker lands right in front of them. Sections whose only problem is
    // an unanswerable question drop straight onto that question instead of
    // just the step's first section.
    const sectionsHasIncompleteQuestion =
      failing[0] === "sections" && hasSectionWithQuestion && focusFirstIncompleteQuestion();
    if (!sectionsHasIncompleteQuestion) {
      handleSelectStep(failing[0]);
    }

    const isNom035 = draft.name.toLowerCase().includes("nom 035");

    const label: Record<StepperStepId, string> = {
      general: "Completa el nombre, el tipo y las fechas de la encuesta",
      participants: "Selecciona al menos un participante para finalizar",
      demographics: isNom035
        ? "Mantén activado al menos un dato demográfico"
        : "Revisa la pestaña de Datos demográficos",
      sections: sectionsHasIncompleteQuestion
        ? "Completa los campos obligatorios de la pregunta señalada"
        : "Añade al menos una sección con preguntas",
      pages: "Escribe el contenido de las páginas de encuesta activas",
    };
    toast.error(
      failing.length === 1
        ? label[failing[0]] + "."
        : `${label[failing[0]]} y ${
            failing.length - 1
          } ${failing.length - 1 === 1 ? "paso más" : "pasos más"} por completar.`
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background font-sans">
      {/* The survey's name, status and autosave are the app shell's breadcrumb
          — leaving lives in the action bar, next to the other step actions. */}
      <ShellHeaderSlot>
        <BuilderIdentity
          name={draft.name}
          status={draft.status}
          autosave={autosave}
          onNameChange={(name) => setDraft((current) => ({ ...current, name }))}
        />
      </ShellHeaderSlot>

      {/* Only the middle column scrolls. The side panel sits outside that
          scroll region entirely — not merely stickied within it — so it never
          drifts even a pixel from the header, and the same p-3 governs its
          margin as everyone else's. */}
      <div className="flex min-h-0 flex-1 items-start gap-3 p-3">
        <SectionsPanel
          readOnly={draft.isReadOnly}
          sections={draft.sections}
          selection={selection}
          expandedIds={expandedCardIds}
          renamingId={renamingId}
          isCollapsed={isSectionsPanelCollapsed}
          errorSteps={finalizeErrorSteps}
          onToggleCollapsed={() => setIsSectionsPanelCollapsed((collapsed) => !collapsed)}
          stepInput={stepInput}
          onSelectStep={handleSelectStep}
          onSelect={(next) => (next.kind === "section" ? selectSection(next.id) : selectFixed(next.id))}
          onReorderSections={handleReorderSections}
          onToggleExpanded={handleToggleCardExpanded}
          onStartRename={setRenamingId}
          onRename={(id, title) => {
            updateSection(id, { title });
            setRenamingId(null);
          }}
          onCancelRename={() => setRenamingId(null)}
          onAddSubsection={handleAddSubsection}
          onDeleteSection={handleDeleteRequest}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col self-stretch">
          {/* Toasts come from the single app-level UbitsToaster in App.tsx —
              a second mount here would render every toast twice while this
              screen is up, since both instances read the same toast queue. */}
          <div
            ref={workspaceRef}
            className="flex flex-1 items-start gap-3 self-stretch overflow-y-auto"
          >
            {renderMainPanel()}
          </div>

          {/* The bottom action bar provides navigation and save actions on all steps,
              and contextual creation actions on specific steps. */}
          <BuilderSideRail
            readOnly={draft.isReadOnly}
            ref={railRef}
            offset={0}
            isScrolling={false}
            isSectionsStepActive={isSectionsStepActive}
            isDemographicsStepActive={isDemographicsStepActive}
            isPagesStepActive={activeStep === "pages"}
            onAddSection={handleAddRootSection}
            onAddSubsection={() => selectedSection && handleAddSubsection(selectedSection.id)}
            onAddSiblingSubsection={() =>
              selectedSection && handleAddSiblingSubsection(selectedSection.id)
            }
            onAddLevelTwoSubsection={() => {
              if (selectedEntry && selectedEntry.parentId) {
                handleAddSiblingSubsection(selectedEntry.parentId);
              }
            }}
            onAddQuestion={handleAddQuestion}
            onOpenAnswerBank={() =>
              toast.info("El banco de respuestas llega en el siguiente paso.")
            }
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
            onAddDemographic={handleAddCustomDemographic}
            onImportSections={handleImportSections}
            onPreview={handlePreview}
            previewBlockedReason={
              canPreview(draft) ? null : "Añade al menos una pregunta para ver la vista previa"
            }
            sectionCount={draft.sections.length}
            questionCount={questionCount}
            estimatedMinutes={estimatedMinutes}
            participantsCount={participantsTotal}
            demographicsCount={draft.demographics.fields.length}
            addQuestionBlockedReason={addQuestionBlockedReason}
            addSubsectionBlockedReason={addSubsectionBlockedReason}
            addDemographicBlockedReason={addDemographicBlockedReason}
            showAddSubsection={showAddSubsection}
            selectedDepth={selectedEntry ? selectedEntry.depth : null}
            onSave={() => toast.success("Encuesta guardada")}
            onContinue={handleContinue}
            canContinue={canContinue}
            continueLabel={continueLabel}
            continueDisabledReason={continueDisabledReason}
            activeStep={activeStep}
            participantsSelectionCount={participantsSelectionCount}
            onClearParticipantsSelection={clearParticipantsSelection}
            onDeleteParticipantsSelection={deleteParticipantsSelection}
          />
        </div>
      </div>

      <SurveyPreviewDrawer draft={draft} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
      <QuestionBankDrawer open={isQuestionBankOpen} onOpenChange={setIsQuestionBankOpen} onAddQuestions={handleAddBankQuestions} />
    </div>
  );
}

/** Spells out exactly what a delete will take with it. */
function buildDeleteDescription(entry: ReturnType<typeof findSection>): string {
  if (!entry) return "";

  const questions = countQuestions([entry.section]);
  const subsections = countDescendants(entry.section);
  const parts: string[] = [];

  if (subsections > 0) {
    parts.push(`${subsections} ${subsections === 1 ? "subsección" : "subsecciones"}`);
  }
  if (questions > 0) {
    parts.push(`${questions} ${questions === 1 ? "pregunta" : "preguntas"}`);
  }

  if (parts.length === 0) return "Esta acción no se puede deshacer.";
  return `Se eliminará junto con ${parts.join(" y ")}. Esta acción no se puede deshacer.`;
}
