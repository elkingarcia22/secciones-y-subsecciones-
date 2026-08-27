import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { countQuestions } from "@/components/survey-builder/sectionTree";
import { questionTypeLabel, scaleTypeLabel } from "@/components/survey-builder/questionCatalog";
import type { SurveyQuestion, SurveySection } from "@/components/survey-builder/surveyBuilderTypes";

/**
 * A template's structure, as a collapsible outline: how many sections, how they
 * nest, and — inside each one — the questions it actually asks.
 *
 * The question wording used to be left out on purpose, on the grounds that this
 * panel was a size summary and the wording belonged to the survey once the
 * template was in use. That reasoning had a hole: the templates come in two
 * shapes. NOM 035 nests ("Categoría" → "Dominio" → "Dimensión") and only the
 * deepest level carries questions, so an outline of subsections said something.
 * Cultura, Clima, eNPS and IA are FLAT — questions hang straight off the level-1
 * section and `children` is empty — so the body rendered nothing at all: the
 * trigger promised "2 preguntas" and expanding it opened an empty box.
 *
 * So the questions are listed. Choosing a template is choosing what will be
 * asked, and that is not a decision anyone can make from a count.
 */

/** "3 subsecciones · 12 preguntas", omitting whichever half is zero. */
function contentsSummary(section: SurveySection): string {
  const subsections = section.children.length;
  const questions = countQuestions([section]);

  const parts: string[] = [];
  if (subsections > 0) {
    parts.push(`${subsections} ${subsections === 1 ? "subsección" : "subsecciones"}`);
  }
  if (questions > 0) {
    parts.push(`${questions} ${questions === 1 ? "pregunta" : "preguntas"}`);
  }
  return parts.join(" · ");
}

/**
 * How the question identifies itself, in the author's terms. A scale question is
 * named by its scale rather than by the generic "Escala de valoración" — the
 * same choice `QuestionCard` makes in the builder, so a template reads the way
 * it will read once it is one.
 */
function questionTypeCaption(question: SurveyQuestion): string {
  return question.type === "scale" && question.scale.kind
    ? scaleTypeLabel(question.scale.kind)
    : questionTypeLabel(question.type);
}

/** Statements are authored in a rich-text field, so tags never reach the eye. */
function plainStatement(statement: string): string {
  return statement.replace(/<[^>]*>?/gm, "").trim();
}

interface TemplateSectionsAccordionProps {
  sections: readonly SurveySection[];
}

export function TemplateSectionsAccordion({ sections }: TemplateSectionsAccordionProps) {
  return (
    <Accordion
      // Keyed by the first section so switching templates remounts the
      // accordion and re-opens its first section — otherwise Radix keeps
      // whichever ids were expanded before, which belong to the old template.
      key={sections[0]?.id ?? "empty"}
      type="multiple"
      defaultValue={sections.length > 0 ? [sections[0].id] : []}
      className="flex flex-col gap-2.5"
    >
      {sections.map((section, index) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className="overflow-hidden rounded-2xl border border-border/60 bg-surface px-5 shadow-card not-last:border-b"
        >
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex min-w-0 flex-1 items-start gap-3 pr-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold tabular-nums text-primary-foreground shadow-card">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold tracking-tight text-text-primary">{section.title}</p>
                {section.description && (
                  <p className="mt-0.5 truncate text-[12px] font-normal text-text-secondary">
                    {section.description}
                  </p>
                )}
              </div>
              <span className="mt-1 shrink-0 text-[11px] font-semibold tabular-nums text-text-muted">
                {contentsSummary(section)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <SectionContents section={section} numbering={`${index + 1}`} depth={1} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

interface SectionContentsProps {
  section: SurveySection;
  /** Absolute position of `section` itself, e.g. "1.2". */
  numbering: string;
  depth: number;
}

/**
 * What one section holds: its own questions first, then its subsections.
 *
 * Both halves are optional and either can be empty, which is why the "nothing
 * here" case is stated instead of rendering a blank body — a section that asks
 * nothing is a fact about the template, and a silent gap reads as a bug.
 */
function SectionContents({ section, numbering, depth }: SectionContentsProps) {
  const hasQuestions = section.questions.length > 0;
  const hasChildren = section.children.length > 0;

  if (!hasQuestions && !hasChildren) {
    return (
      <p className={cn("text-[12px] italic text-text-muted", depth === 1 ? "px-2.5 pb-3 pt-1" : "px-2.5 py-1.5")}>
        Esta sección todavía no tiene preguntas.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col", depth === 1 ? "gap-1 pb-2 pt-1" : "gap-0.5")}>
      {hasQuestions && <QuestionList questions={section.questions} />}
      {hasChildren && <SubsectionList section={section} numberingPrefix={numbering} depth={depth} />}
    </div>
  );
}

interface QuestionListProps {
  questions: readonly SurveyQuestion[];
}

/**
 * The questions themselves. A question is an item in a list, not a nested
 * block, so it gets a plain ordinal in a narrow gutter rather than the dotted
 * numbering that belongs to sections — the same split the builder uses, and the
 * reason "1.1" can never mean both a subsection and a question.
 */
function QuestionList({ questions }: QuestionListProps) {
  return (
    <ol className="flex flex-col">
      {questions.map((question, index) => {
        const statement = plainStatement(question.statement);

        return (
          <li
            key={question.id}
            className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-muted/50"
          >
            <span
              aria-hidden
              className="mt-px w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-text-muted"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[13px] font-medium leading-snug",
                  statement ? "text-text-primary" : "italic text-text-muted"
                )}
              >
                {statement || "Sin enunciado"}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-text-muted">
                {questionTypeCaption(question)}
                {!question.required && <span className="font-normal"> · Opcional</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

interface SubsectionListProps {
  section: SurveySection;
  /** Absolute position of `section` itself, e.g. "1.2" — its children extend it. */
  numberingPrefix: string;
  depth: number;
}

/** The section's own subsections, nested, each one expanded into its contents. */
function SubsectionList({ section, numberingPrefix, depth }: SubsectionListProps) {
  if (section.children.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-0.5", depth === 1 ? "pt-1" : "mt-0.5")}>
      {section.children.map((child, index) => {
        const numbering = `${numberingPrefix}.${index + 1}`;
        const questionCount = countQuestions([child]);

        return (
          <li key={child.id} className={depth > 1 ? "ml-3.5 border-l border-border/60 pl-3" : undefined}>
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-muted/50">
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-text-muted">
                {numbering}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text-secondary">
                {child.title}
              </span>
              {questionCount > 0 && (
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-text-muted">
                  {questionCount}
                </span>
              )}
            </div>
            {/* Indented under its own heading, so a "Dimensión" row and the
                questions it asks read as one unit at every depth. */}
            <div className="ml-3.5 border-l border-border/60 pl-3">
              <SectionContents section={child} numbering={numbering} depth={depth + 1} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
