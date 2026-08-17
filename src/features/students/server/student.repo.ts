import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

import type { EnrolmentStatusValue, StudentFilters } from '../schema';

/**
 * Prisma calls only. No business rules, no authorisation, no derived values — those
 * belong to the service. Transactions are a database mechanic and so live here, but what
 * goes inside one is decided above.
 */

const listSelect = {
  id: true,
  studentCode: true,
  fullName: true,
  email: true,
  academicYear: true,
  status: true,
  programme: { select: { code: true, name: true } },
  fees: {
    select: {
      id: true,
      description: true,
      amountMinor: true,
      waivedMinor: true,
      dueDate: true,
      payments: {
        where: { status: 'COMPLETED' as const },
        select: { amountMinor: true },
      },
    },
    orderBy: { dueDate: 'asc' as const },
  },
} satisfies Prisma.StudentSelect;

const detailSelect = {
  ...listSelect,
  dateOfBirth: true,
  intakeYear: true,
  programmeId: true,
  createdAt: true,
  statusHistory: {
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      changedAt: true,
    },
    orderBy: { changedAt: 'desc' as const },
  },
} satisfies Prisma.StudentSelect;

/**
 * Fee fields only, for counting arrears across a filtered set without paying for the
 * names, emails, and programme joins the list rows carry. Overdue is not a column and
 * cannot be — it depends on `computeFeeSummary`, which is the only definition of a
 * balance — so the rows have to be read. They may as well be small.
 */
const feeOnlySelect = {
  fees: {
    select: {
      amountMinor: true,
      waivedMinor: true,
      dueDate: true,
      payments: {
        where: { status: 'COMPLETED' as const },
        select: { amountMinor: true },
      },
    },
    orderBy: { dueDate: 'asc' as const },
  },
} satisfies Prisma.StudentSelect;

export type StudentListRow = Prisma.StudentGetPayload<{ select: typeof listSelect }>;
export type StudentDetailRow = Prisma.StudentGetPayload<{ select: typeof detailSelect }>;
export type StudentFeeRow = Prisma.StudentGetPayload<{ select: typeof feeOnlySelect }>;

function whereFrom(filters: StudentFilters): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.programmeId) where.programmeId = filters.programmeId;

  // Only the date half of "overdue" is pushed down here. It is a plain column comparison
  // with no arithmetic in it, so it duplicates nothing — while a SQL predicate for the
  // money half would be a second definition of the balance, and the first time one
  // changed the list would start disagreeing with the fee panel about the same student.
  // The service applies the money half with `computeFeeSummary`.
  if (filters.overdue) {
    where.fees = { some: { dueDate: { lt: new Date() } } };
  }

  // Search covers the three identifiers an admin actually has to hand: a name they were
  // told, a code on a form, or an email from a message.
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { studentCode: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export const studentRepo = {
  /**
   * Every match, unpaginated. For the dashboard, which ranks and totals the whole
   * registry — a page of it would produce plausible-looking wrong numbers.
   */
  async findMany(filters: StudentFilters): Promise<StudentListRow[]> {
    return db.student.findMany({
      where: whereFrom(filters),
      select: listSelect,
      orderBy: { studentCode: 'asc' },
    });
  },

  /**
   * One page, its total, and the fee rows behind the arrears count — in a single
   * transaction so the three cannot disagree about which students exist.
   *
   * Ordered by `studentCode`, which is sequential and unique. Ordering a paginated query
   * by anything non-unique lets a row appear on two pages or on none.
   */
  async findPage(
    filters: StudentFilters,
    page: { take: number; skip: number },
  ): Promise<{ rows: StudentListRow[]; total: number; feeRows: StudentFeeRow[] }> {
    const where = whereFrom(filters);

    const [rows, total, feeRows] = await db.$transaction([
      db.student.findMany({
        where,
        select: listSelect,
        orderBy: { studentCode: 'asc' },
        take: page.take,
        skip: page.skip,
      }),
      db.student.count({ where }),
      db.student.findMany({ where, select: feeOnlySelect }),
    ]);

    return { rows, total, feeRows };
  },

  findById(id: string): Promise<StudentDetailRow | null> {
    return db.student.findUnique({ where: { id }, select: detailSelect });
  },

  findByEmail(email: string) {
    return db.student.findUnique({ where: { email }, select: { id: true } });
  },

  /**
   * Creates the student, their code, and their fee assignment as one unit. A student
   * must never exist without a fee row, and the code counter must not be readable
   * between the increment and the insert.
   */
  createWithFee(input: {
    // The code and intake year are generated inside the transaction, not supplied.
    student: Omit<
      Prisma.StudentCreateInput,
      'programme' | 'studentCode' | 'intakeYear'
    > & { programmeId: string };
    intakeYear: number;
    /** Values the service computed: the fee snapshot and its due date. */
    fee: { description: string; amountMinor: number; dueDate: Date };
    nextCode: (tx: Prisma.TransactionClient, year: number) => Promise<string>;
  }): Promise<StudentDetailRow> {
    const { student, intakeYear, fee, nextCode } = input;

    return db.$transaction(async (tx) => {
      const studentCode = await nextCode(tx, intakeYear);

      const created = await tx.student.create({
        data: { ...student, studentCode, intakeYear },
        select: { id: true },
      });

      await tx.feeAssignment.create({
        data: { ...fee, studentId: created.id },
      });

      await tx.statusChange.create({
        data: {
          studentId: created.id,
          fromStatus: null,
          toStatus: student.status ?? 'ENROLLED',
          reason: 'Student record created.',
        },
      });

      return tx.student.findUniqueOrThrow({
        where: { id: created.id },
        select: detailSelect,
      });
    });
  },

  update(id: string, data: Prisma.StudentUpdateInput): Promise<StudentDetailRow> {
    return db.student.update({ where: { id }, data, select: detailSelect });
  },

  /** Status and its audit entry move together or not at all. */
  updateStatus(input: {
    id: string;
    fromStatus: EnrolmentStatusValue;
    toStatus: EnrolmentStatusValue;
    reason?: string;
  }): Promise<StudentDetailRow> {
    const { id, fromStatus, toStatus, reason } = input;

    return db.$transaction(async (tx) => {
      await tx.statusChange.create({
        data: { studentId: id, fromStatus, toStatus, reason: reason ?? null },
      });

      return tx.student.update({
        where: { id },
        data: { status: toStatus },
        select: detailSelect,
      });
    });
  },

  findPickerOptions() {
    return db.student.findMany({
      select: {
        id: true,
        fullName: true,
        studentCode: true,
        programme: { select: { code: true } },
      },
      orderBy: [{ programme: { code: 'asc' } }, { studentCode: 'asc' }],
    });
  },
};
