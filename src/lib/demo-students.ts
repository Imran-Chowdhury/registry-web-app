import 'server-only';

import { studentService } from '@/features/students/server';

import { getViewer } from './viewer';

/** The shape the demo switcher needs — name, code, and a programme to group by. */
export type DemoStudent = {
  id: string;
  fullName: string;
  studentCode: string;
  programmeCode: string;
};

/**
 * Options for the demo switcher, resolved server-side.
 *
 * Empty until students exist. The banner disables the Student role in that case rather
 * than offering a switch that would land on nothing.
 */
export async function listDemoStudents(): Promise<DemoStudent[]> {
  const viewer = await getViewer();
  return studentService.listPickerOptions(viewer);
}
