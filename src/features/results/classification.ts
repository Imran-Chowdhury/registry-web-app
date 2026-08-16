/**
 * Classification is computed on every read and never stored.
 *
 * A stored classification is a denormalised copy of a grade: correct the grade and the
 * two disagree, change the boundaries and every historical row lies. The thresholds are
 * the brief's, with `Fail` added — the brief lists three bands and stops, which leaves
 * anything under 40 unnamed.
 */

export type Classification = 'Distinction' | 'Merit' | 'Pass' | 'Fail';

export const CLASSIFICATION_BOUNDARIES = [
  { min: 70, label: 'Distinction' },
  { min: 60, label: 'Merit' },
  { min: 40, label: 'Pass' },
  { min: 0, label: 'Fail' },
] as const satisfies readonly { min: number; label: Classification }[];

/** Null in, null out: an unmarked result has no classification, not a `Fail`. */
export function classify(grade: number | null): Classification | null {
  if (grade === null || Number.isNaN(grade)) return null;

  const band = CLASSIFICATION_BOUNDARIES.find((boundary) => grade >= boundary.min);
  return band ? band.label : 'Fail';
}

/**
 * The mean of the grades given, to one decimal place, or null when there is nothing to
 * average. Callers pass published grades only — an average that quietly included
 * withheld or unmarked work would misrepresent the student's standing.
 */
export function averageGrade(grades: number[]): number | null {
  if (grades.length === 0) return null;

  const total = grades.reduce((sum, grade) => sum + grade, 0);
  return Math.round((total / grades.length) * 10) / 10;
}
