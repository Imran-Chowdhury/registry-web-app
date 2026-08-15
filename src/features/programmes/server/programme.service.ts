import 'server-only';

import { NotFoundError } from '@/lib/errors';
import type { Viewer } from '@/lib/viewer';

import type { ProgrammeOption, ProgrammeSummary } from '../types';
import { programmeRepo } from './programme.repo';

/**
 * Programmes are reference data — codes, names, and fee amounts. Both viewer roles may
 * read them: a student needs their own programme's name and fee to make sense of their
 * record, and none of it is another student's data.
 */
export const programmeService = {
  async list(_viewer: Viewer): Promise<ProgrammeOption[]> {
    return programmeRepo.findAll();
  },

  async listWithCounts(viewer: Viewer): Promise<ProgrammeSummary[]> {
    if (viewer.role !== 'STAFF') {
      // Enrolment totals across the registry are not a student's business.
      return [];
    }

    const programmes = await programmeRepo.findAllWithCounts();
    return programmes.map(({ _count, ...programme }) => ({
      ...programme,
      moduleCount: _count.modules,
      studentCount: _count.students,
    }));
  },

  async getById(_viewer: Viewer, id: string): Promise<ProgrammeOption> {
    const programme = await programmeRepo.findById(id);
    if (!programme) throw new NotFoundError('Programme');
    return programme;
  },
};
