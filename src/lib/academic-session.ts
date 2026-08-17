/**
 * The session label a fee assignment is described by — "2025/26".
 *
 * Lives in `lib/` rather than inside the students service because the seed needs it too,
 * and the seed cannot import a `server-only` module. One definition, so a seeded student
 * and a created one describe their fee the same way.
 */
export function academicSession(date: Date): string {
  const year = date.getUTCFullYear();
  // Sessions run September to August, so an enrolment before September belongs to the
  // session that started the previous calendar year.
  const startYear = date.getUTCMonth() >= 8 ? year : year - 1;
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`;
}
