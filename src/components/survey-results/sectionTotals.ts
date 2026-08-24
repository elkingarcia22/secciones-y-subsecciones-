import { flattenResultSections, type Distribution, type SectionResult } from "@/mocks/surveyResults";

/** Totals over a section tree, shared by every view that walks one. */

/** A section counts when it has questions of its own or a descendant that does. */
export function sectionHasContent(section: SectionResult): boolean {
  return section.questions.length > 0 || section.children.some(sectionHasContent);
}

/** Questions of a section and of everything below it. */
export function countSectionQuestions(section: SectionResult): number {
  return (
    section.questions.length +
    section.children.reduce((sum, child) => sum + countSectionQuestions(child), 0)
  );
}

/**
 * Answers a section collected, across every question format.
 *
 * `SectionResult.n` only counts the scale answers, because that is what its
 * favorability is built from. A branch holding only an NPS question or open
 * text therefore reports zero there — true of its score, and badly wrong as a
 * "respuestas" count next to a question that plainly has 450.
 */
export function countSectionAnswers(section: SectionResult): number {
  return (
    section.questions.reduce((sum, question) => sum + question.n + question.nsnr, 0) +
    section.children.reduce((sum, child) => sum + countSectionAnswers(child), 0)
  );
}

/**
 * Every scored answer under a section, pooled into one five-box distribution.
 *
 * `SectionResult` carries the score and the totals but not the shape they came
 * from, and both the favorability tooltip and the breakdown beside it need the
 * boxes. Walking the branch here keeps the two from disagreeing.
 */
export function pooledDistribution(section: SectionResult): Distribution {
  const totals: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  for (const node of flattenResultSections([section])) {
    for (const question of node.questions) {
      if (!question.distribution) continue;
      question.distribution.forEach((count, index) => {
        totals[index] += count;
      });
    }
  }

  return totals;
}
