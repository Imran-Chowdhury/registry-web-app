import 'server-only';

import { db } from '@/lib/db';

/** Prisma lives here and nowhere else. No business rules, no authorisation. */
export const programmeRepo = {
  findAll() {
    return db.programme.findMany({
      select: { id: true, code: true, name: true, feeMinor: true, feeDueDays: true },
      orderBy: { code: 'asc' },
    });
  },

  findById(id: string) {
    return db.programme.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, feeMinor: true, feeDueDays: true },
    });
  },

  findAllWithCounts() {
    return db.programme.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        feeMinor: true,
        feeDueDays: true,
        _count: { select: { modules: true, students: true } },
      },
      orderBy: { code: 'asc' },
    });
  },
};
