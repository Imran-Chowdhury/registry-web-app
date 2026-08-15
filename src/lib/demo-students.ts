import 'server-only';

/** The shape the demo switcher needs — name, code, and a programme to group by. */
export type DemoStudent = {
  id: string;
  fullName: string;
  studentCode: string;
  programmeCode: string;
};

/**
 * Phase 1 placeholder list, resolved server-side like the real thing will be.
 *
 * The database has no students until the seed lands, so querying it here would leave
 * the switcher permanently stuck on Staff and untestable. Phase 2 replaces this
 * function body with a student repository call; the return shape is already the DTO the
 * banner consumes, so no caller changes.
 */
export async function listDemoStudents(): Promise<DemoStudent[]> {
  return [
    { id: 'demo-1', fullName: 'Aisha Rahman', studentCode: 'SMS-2025-0001', programmeCode: 'CSE' },
    { id: 'demo-2', fullName: 'Rafi Hasan', studentCode: 'SMS-2025-0004', programmeCode: 'CSE' },
    { id: 'demo-3', fullName: 'Sadia Islam', studentCode: 'SMS-2025-0009', programmeCode: 'BBA' },
  ];
}
