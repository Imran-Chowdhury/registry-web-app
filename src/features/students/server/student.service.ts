import 'server-only';

import { programmeService } from '@/features/programmes';
import { daysOverdue } from '@/lib/dates';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { nextStudentCode } from '@/lib/student-id';
import type { Viewer } from '@/lib/viewer';

import type {
  ChangeStatusInput,
  CreateStudentInput,
  StudentFilters,
  UpdateStudentInput,
} from '../schema';
import { createStudentSchema, updateStudentSchema, changeStatusSchema } from '../schema';
import type {
  FeeSummary,
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
  async list(viewer: Viewer, filters: StudentFilters): Promise<StudentListResult> {
    requireStaff(viewer);

    const rows = await studentRepo.findMany(filters);
    const students = rows.map(toListItem);

    return {
      students,
      total: students.length,
      overdueCount: students.filter((student) => student.fee?.isOverdue).length,
    };
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
 * Outstanding is computed on every read rather than kept in a column. A stored balance
 * drifts the moment a payment is reversed or a waiver is applied, and reconciling it is
 * exactly the kind of silent error a registry cannot afford.
 */
function toFeeSummary(fee: StudentListRow['fees'][number]): FeeSummary {
  const paidMinor = fee.payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const outstandingMinor = fee.amountMinor - fee.waivedMinor - paidMinor;
  const overdueDays = daysOverdue(fee.dueDate);

  return {
    feeId: fee.id,
    description: fee.description,
    amountMinor: fee.amountMinor,
    waivedMinor: fee.waivedMinor,
    paidMinor,
    outstandingMinor,
    dueDate: fee.dueDate.toISOString(),
    isOverdue: outstandingMinor > 0 && overdueDays > 0,
    daysOverdue: outstandingMinor > 0 ? overdueDays : 0,
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
    fee: fee ? toFeeSummary(fee) : null,
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

/** "2026/27" — the session a fee belongs to, from the enrolment date. */
function academicSession(date: Date): string {
  const year = date.getUTCFullYear();
  // Sessions run September to August, so an enrolment before September belongs to the
  // session that started the previous calendar year.
  const startYear = date.getUTCMonth() >= 8 ? year : year - 1;
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`;
}
