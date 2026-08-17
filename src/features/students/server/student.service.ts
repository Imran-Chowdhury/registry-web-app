import 'server-only';

import { computeFeeSummary, isFeeOverdue } from '@/features/fees';
import { programmeService } from '@/features/programmes/server';
import { academicSession } from '@/lib/academic-session';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { nextStudentCode } from '@/lib/student-id';
import type { Viewer } from '@/lib/viewer';

import type {
  ChangeStatusInput,
  CreateStudentInput,
  StudentFilters,
  StudentQuery,
  UpdateStudentInput,
} from '../schema';
import { createStudentSchema, updateStudentSchema, changeStatusSchema } from '../schema';
import type {
  StudentDetail,
  StudentListItem,
  StudentListResult,
  StudentPickerOption,
} from '../types';
import {
  studentRepo,
  type StudentDetailRow,
  type StudentListRow,
} from './student.repo';

/**
 * Business rules and authorisation. Every method takes the viewer first and enforces its
 * own access rules — a service is never trusted to have been called from a guarded
 * route.
 */
export const studentService = {
  /**
   * Staff only. A student has no legitimate reason to enumerate the registry, and
   * returning a filtered list instead of refusing would leave the door open to counting
   * other records.
   */
  async list(viewer: Viewer, query: StudentQuery): Promise<StudentListResult> {
    requireStaff(viewer);

    const { page, pageSize, ...filters } = query;

    if (filters.overdue) return listOverdue(filters, page, pageSize);

    // Clamp rather than 404. Filtering down to three results while sitting on page six
    // is an ordinary thing to do, and the honest answer is the last page, not an error.
    const first = await studentRepo.findPage(filters, {
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const totalPages = Math.max(1, Math.ceil(first.total / pageSize));
    const safePage = Math.min(page, totalPages);

    const { rows, total, feeRows } =
      safePage === page
        ? first
        : await studentRepo.findPage(filters, {
            take: pageSize,
            skip: (safePage - 1) * pageSize,
          });

    return {
      students: rows.map(toListItem),
      total,
      // Across every match, not this page — see `StudentListResult`.
      overdueCount: feeRows.filter((row) => {
        const fee = row.fees[0];
        return fee ? isFeeOverdue(fee) : false;
      }).length,
      page: safePage,
      pageSize,
      totalPages,
    };
  },

  /**
   * Every match, unpaginated. Staff only, same as `list`.
   *
   * The dashboard's tiles total the registry and its panel ranks the largest balances,
   * and neither survives being handed a page: "the three biggest debts among the first
   * twenty-five student codes" is a number that looks right and is not. Separate method
   * rather than a flag, so the choice is visible at the call site.
   */
  async listAll(viewer: Viewer, filters: StudentFilters): Promise<StudentListItem[]> {
    requireStaff(viewer);

    const rows = await studentRepo.findMany(filters);
    return rows.map(toListItem);
  },

  async getById(viewer: Viewer, id: string): Promise<StudentDetail> {
    // The id is compared against the cookie-derived viewer, never used to widen access.
    if (viewer.role === 'STUDENT' && viewer.studentId !== id) {
      throw new ForbiddenError('You can only view your own record.');
    }

    const row = await studentRepo.findById(id);
    if (!row) throw new NotFoundError('Student');

    return toDetail(row);
  },

  /** The signed-in student's own record, resolved without trusting any client input. */
  async getSelf(viewer: Viewer): Promise<StudentDetail> {
    if (viewer.role !== 'STUDENT') {
      throw new ForbiddenError('No student is selected.');
    }
    return studentService.getById(viewer, viewer.studentId);
  },

  async create(viewer: Viewer, input: CreateStudentInput): Promise<StudentDetail> {
    requireStaff(viewer);
    const data = createStudentSchema.parse(input);

    // Checked before writing so the conflict reads as "that email is taken" rather than
    // as a unique-constraint violation. The database constraint is still the guarantee.
    const existing = await studentRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('A student with that email address already exists.');
    }

    const programme = await programmeService.getById(viewer, data.programmeId);

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setUTCDate(dueDate.getUTCDate() + programme.feeDueDays);

    const row = await studentRepo.createWithFee({
      student: {
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        academicYear: data.academicYear,
        status: data.status,
        programmeId: data.programmeId,
      },
      intakeYear: now.getUTCFullYear(),
      fee: {
        description: `Tuition ${academicSession(now)}`,
        // A snapshot, not a reference. Raising a programme's fee later must not rewrite
        // what a student already owes.
        amountMinor: programme.feeMinor,
        dueDate,
      },
      nextCode: nextStudentCode,
    });

    return toDetail(row);
  },

  async update(
    viewer: Viewer,
    id: string,
    input: UpdateStudentInput,
  ): Promise<StudentDetail> {
    requireStaff(viewer);
    const data = updateStudentSchema.parse(input);

    const current = await studentRepo.findById(id);
    if (!current) throw new NotFoundError('Student');

    if (data.email && data.email !== current.email) {
      const existing = await studentRepo.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('A student with that email address already exists.');
      }
    }

    const row = await studentRepo.update(id, {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.dateOfBirth !== undefined ? { dateOfBirth: data.dateOfBirth } : {}),
      ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
      ...(data.programmeId !== undefined
        ? { programme: { connect: { id: data.programmeId } } }
        : {}),
    });

    return toDetail(row);
  },

  /**
   * Deleting a student is a status change, not a row deletion. Registry records persist
   * — a withdrawn student keeps their fee history and stays visible in the list.
   */
  async changeStatus(
    viewer: Viewer,
    id: string,
    input: ChangeStatusInput,
  ): Promise<StudentDetail> {
    requireStaff(viewer);
    const data = changeStatusSchema.parse(input);

    const current = await studentRepo.findById(id);
    if (!current) throw new NotFoundError('Student');

    if (current.status === data.status) {
      throw new ConflictError(`That student is already ${data.status.toLowerCase()}.`);
    }

    const row = await studentRepo.updateStatus({
      id,
      fromStatus: current.status,
      toStatus: data.status,
      reason: data.reason,
    });

    return toDetail(row);
  },

  /**
   * The demo switcher's options. Every viewer may see this list — it is the stand-in for
   * a login screen, and it exposes nothing a class list would not.
   */
  async listPickerOptions(_viewer: Viewer): Promise<StudentPickerOption[]> {
    const rows = await studentRepo.findPickerOptions();
    return rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      studentCode: row.studentCode,
      programmeCode: row.programme.code,
    }));
  },
};

function requireStaff(viewer: Viewer): void {
  if (viewer.role !== 'STAFF') {
    throw new ForbiddenError('That view is for registry staff.');
  }
}

/**
 * The arrears list, paged in memory rather than in SQL.
 *
 * Deliberate, and the one place in the app where pagination is not pushed to the
 * database. Overdue depends on `computeFeeSummary`, and expressing that as a `WHERE`
 * would be a second definition of the balance — the exact drift CLAUDE.md §16 rules out.
 * So the repository narrows on the date, which is a plain column and costs nothing, and
 * the money half is applied here.
 *
 * The candidate set is students whose fee window has already elapsed, not the whole
 * registry, and it shrinks rather than grows as fees are collected. If it ever stopped
 * being small the answer is a materialised balance with its own invalidation, not a
 * duplicated formula.
 */
async function listOverdue(
  filters: StudentFilters,
  page: number,
  pageSize: number,
): Promise<StudentListResult> {
  const rows = await studentRepo.findMany(filters);
  const overdue = rows.map(toListItem).filter((student) => student.fee?.isOverdue);

  const total = overdue.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    students: overdue.slice(start, start + pageSize),
    total,
    // Every row here is overdue by definition, so the two counts are the same number.
    overdueCount: total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function toListItem(row: StudentListRow): StudentListItem {
  // One fee assignment per student today. `fees` is a list because a programme change
  // will add a second in Phase 3; the earliest is the one a balance column refers to.
  const [fee] = row.fees;

  return {
    id: row.id,
    studentCode: row.studentCode,
    fullName: row.fullName,
    email: row.email,
    programmeCode: row.programme.code,
    programmeName: row.programme.name,
    academicYear: row.academicYear,
    status: row.status,
    fee: fee ? computeFeeSummary(withCompletedPaymentsOnly(fee)) : null,
  };
}

function toDetail(row: StudentDetailRow): StudentDetail {
  return {
    ...toListItem(row),
    dateOfBirth: row.dateOfBirth.toISOString(),
    intakeYear: row.intakeYear,
    programmeId: row.programmeId,
    createdAt: row.createdAt.toISOString(),
    statusHistory: row.statusHistory.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      reason: entry.reason,
      changedAt: entry.changedAt.toISOString(),
    })),
  };
}

/**
 * The repository already filters to COMPLETED payments; naming that here keeps the
 * contract with `computeFeeSummary` explicit rather than assumed.
 */
function withCompletedPaymentsOnly(fee: StudentListRow['fees'][number]) {
  return {
    id: fee.id,
    description: fee.description,
    amountMinor: fee.amountMinor,
    waivedMinor: fee.waivedMinor,
    dueDate: fee.dueDate,
    payments: fee.payments,
  };
}
