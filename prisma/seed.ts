import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { PrismaClient, type EnrolmentStatus } from '../src/generated/prisma/client';
import { academicSession } from '../src/lib/academic-session';
import { nextStudentCode } from '../src/lib/student-id';

/**
 * Reference data, plus the students whose fees have genuinely fallen due.
 *
 * Overdue cannot be seeded as a flag — it is `outstanding > 0 && dueDate < now`, computed
 * on read. The only way to produce one is to backdate `createdAt` far enough that the
 * programme's `feeDueDays` window has already elapsed, which is what `createdDaysAgo`
 * below does. A seed that creates students "today" leaves the dashboard empty and the
 * whole arrears workflow invisible to a reviewer.
 *
 * Submissions and results are seeded in Phase 7.
 *
 * Idempotent: reference data upserts by natural key, students match on email and have
 * their dates rolled forward so the demo stays the same age however long after the last
 * run it is opened.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const PROGRAMMES = [
  { code: 'CSE', name: 'Computer Science', feeMinor: 10_000, feeDueDays: 30 },
  { code: 'BBA', name: 'Business Administration', feeMinor: 5_000, feeDueDays: 30 },
];

const MODULES = [
  { code: 'CSE-101', name: 'Programming Fundamentals', programmes: ['CSE'] },
  { code: 'CSE-201', name: 'Data Structures', programmes: ['CSE'] },
  { code: 'BBA-110', name: 'Principles of Management', programmes: ['BBA'] },
  // Shared across both programmes — the reason Module has a many-to-many relation.
  { code: 'GEN-100', name: 'Academic Writing', programmes: ['CSE', 'BBA'] },
];

type SeedStudent = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  programmeCode: string;
  academicYear: number;
  status: EnrolmentStatus;
  /** Enrolment backdated by this many days. The fee falls due `feeDueDays` after it. */
  createdDaysAgo: number;
  /** Bursary or scholarship, deducted before the balance is worked out. */
  waivedMinor?: number;
  payments?: { amountMinor: number; reference: string; paidDaysAgo: number }[];
  statusReason?: string;
};

/**
 * Four arrears cases, chosen to exercise the parts of the rule that a single unpaid
 * student would not: a partial payment, a waiver, a non-enrolled status, and a spread of
 * ages so the dashboard's "worst debt first" ordering has something to order.
 */
const STUDENTS: SeedStudent[] = [
  {
    // Worst debt on the board, and deferred — deferral does not clear what is owed.
    fullName: 'Shakil Mahmud',
    email: 'shakil.mahmud@example.edu',
    dateOfBirth: '2003-02-11',
    programmeCode: 'BBA',
    academicYear: 2,
    status: 'DEFERRED',
    statusReason: 'Deferred for one session on medical grounds.',
    createdDaysAgo: 90, // 60 days overdue
    waivedMinor: 1_000, // $10 bursary: owes $40 of $50
  },
  {
    // Nothing paid at all, and the largest single balance.
    fullName: 'Nusrat Jahan',
    email: 'nusrat.jahan@example.edu',
    dateOfBirth: '2004-07-30',
    programmeCode: 'CSE',
    academicYear: 1,
    status: 'ENROLLED',
    createdDaysAgo: 75, // 45 days overdue
  },
  {
    // Part-paid: proves outstanding is the balance, not the invoice.
    fullName: 'Tanvir Ahmed',
    email: 'tanvir.ahmed@example.edu',
    dateOfBirth: '2003-11-05',
    programmeCode: 'CSE',
    academicYear: 2,
    status: 'ENROLLED',
    createdDaysAgo: 42, // 12 days overdue, $70 of $100 left
    payments: [
      { amountMinor: 3_000, reference: 'SEED-BNK-100241', paidDaysAgo: 20 },
    ],
  },
  {
    // Only just overdue — the low end of the range, so the ordering is visibly by age.
    fullName: 'Farhana Akter',
    email: 'farhana.akter@example.edu',
    dateOfBirth: '2005-01-19',
    programmeCode: 'BBA',
    academicYear: 1,
    status: 'ENROLLED',
    createdDaysAgo: 33, // 3 days overdue
  },
];

const FIRST_NAMES = [
  'Arif', 'Bushra', 'Choyon', 'Dipa', 'Emon',
  'Fahim', 'Gulshan', 'Habiba', 'Ishrat', 'Jamil',
];
const LAST_NAMES = [
  'Chowdhury', 'Hossain', 'Karim', 'Molla', 'Nahar',
  'Osman', 'Parvez', 'Rashid', 'Siddique', 'Talukder',
];

const FEE_BY_PROGRAMME = new Map(PROGRAMMES.map((p) => [p.code, p.feeMinor]));

/**
 * The rest of the registry.
 *
 * A list screen with ten rows cannot show whether pagination works, and a reviewer
 * cannot tell whether search and filters still hold across pages. Fifty more students
 * make the list behave like a real one.
 *
 * Generated rather than written out, but **deterministically** — index arithmetic, no
 * randomness. Re-running the seed has to produce the same registry, or the demo guide in
 * the README stops describing the app it ships with.
 */
function cohort(): SeedStudent[] {
  return Array.from({ length: 50 }, (_, index): SeedStudent => {
    const fullName = `${FIRST_NAMES[index % 10]} ${LAST_NAMES[Math.floor(index / 10) % 10]}`;
    const programmeCode = index % 3 === 0 ? 'BBA' : 'CSE';
    const feeMinor = FEE_BY_PROGRAMME.get(programmeCode) ?? 0;

    // 5 to 79 days old. Anything past the 30-day window is due; whether it is *overdue*
    // then depends on what has been paid, which is the point of the split below.
    const createdDaysAgo = 5 + ((index * 7) % 75);

    // Capped below the hand-written cases above, so those stay the headline arrears and
    // the README's demo guide keeps naming the same students.
    const status: EnrolmentStatus =
      index % 17 === 3 ? 'WITHDRAWN' : index % 13 === 5 ? 'COMPLETED' : index % 11 === 7 ? 'DEFERRED' : 'ENROLLED';

    // Five payment states in rotation: paid, unpaid, part-paid, unpaid, paid.
    const paid = index % 5;
    const payments =
      paid === 0 || paid === 4
        ? [
            {
              amountMinor: feeMinor,
              reference: `SEED-BNK-${String(200 + index).padStart(6, '0')}`,
              paidDaysAgo: Math.max(1, createdDaysAgo - 10),
            },
          ]
        : paid === 2
          ? [
              {
                amountMinor: Math.round(feeMinor / 2),
                reference: `SEED-BNK-${String(200 + index).padStart(6, '0')}`,
                paidDaysAgo: Math.max(1, createdDaysAgo - 5),
              },
            ]
          : [];

    return {
      fullName,
      email: `${fullName.toLowerCase().replace(' ', '.')}.${index}@example.edu`,
      // Spread across a few birth years; the exact date does not matter to any rule.
      dateOfBirth: `${2002 + (index % 4)}-${String((index % 12) + 1).padStart(2, '0')}-14`,
      programmeCode,
      academicYear: (index % 3) + 1,
      status,
      statusReason: status === 'ENROLLED' ? undefined : 'Recorded during registry import.',
      createdDaysAgo,
      payments,
    };
  });
}

const DAY_MS = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

async function seedStudent(spec: SeedStudent): Promise<void> {
  const programme = await prisma.programme.findUniqueOrThrow({
    where: { code: spec.programmeCode },
    select: { id: true, feeMinor: true, feeDueDays: true },
  });

  const createdAt = daysAgo(spec.createdDaysAgo);
  const dueDate = addDays(createdAt, programme.feeDueDays);
  const existing = await prisma.student.findUnique({
    where: { email: spec.email },
    select: { id: true, fees: { select: { id: true }, take: 1 } },
  });

  // Re-run: roll the dates forward so the record is the same age as on the first run,
  // and leave the code and payment history alone.
  if (existing) {
    await prisma.student.update({
      where: { id: existing.id },
      data: { createdAt },
    });
    if (existing.fees[0]) {
      await prisma.feeAssignment.update({
        where: { id: existing.fees[0].id },
        data: { dueDate, waivedMinor: spec.waivedMinor ?? 0 },
      });
    }
    return;
  }

  await prisma.$transaction(async (tx) => {
    const intakeYear = createdAt.getUTCFullYear();
    const studentCode = await nextStudentCode(tx, intakeYear);

    const student = await tx.student.create({
      data: {
        studentCode,
        fullName: spec.fullName,
        email: spec.email,
        dateOfBirth: new Date(spec.dateOfBirth),
        programmeId: programme.id,
        academicYear: spec.academicYear,
        intakeYear,
        status: spec.status,
        createdAt,
      },
      select: { id: true },
    });

    const fee = await tx.feeAssignment.create({
      data: {
        studentId: student.id,
        description: `Tuition ${academicSession(createdAt)}`,
        // Snapshot of the programme fee, exactly as the create-student service takes it.
        amountMinor: programme.feeMinor,
        waivedMinor: spec.waivedMinor ?? 0,
        dueDate,
      },
      select: { id: true },
    });

    for (const payment of spec.payments ?? []) {
      await tx.payment.create({
        data: {
          feeId: fee.id,
          amountMinor: payment.amountMinor,
          reference: payment.reference,
          paidAt: daysAgo(payment.paidDaysAgo),
        },
      });
    }

    // A seeded status is still a status change. Registry records carry their history.
    if (spec.status !== 'ENROLLED') {
      await tx.statusChange.create({
        data: {
          studentId: student.id,
          fromStatus: 'ENROLLED',
          toStatus: spec.status,
          reason: spec.statusReason,
          changedAt: addDays(createdAt, 7),
        },
      });
    }
  });
}

async function main() {
  for (const programme of PROGRAMMES) {
    await prisma.programme.upsert({
      where: { code: programme.code },
      create: programme,
      update: { name: programme.name, feeDueDays: programme.feeDueDays },
      // Note: feeMinor is intentionally not updated on re-seed. Existing students hold a
      // snapshot of it, and rewriting the source would make the two disagree silently.
    });
  }

  for (const entry of MODULES) {
    const programmes = entry.programmes.map((code) => ({ code }));
    await prisma.module.upsert({
      where: { code: entry.code },
      create: {
        code: entry.code,
        name: entry.name,
        programmes: { connect: programmes },
      },
      update: {
        name: entry.name,
        programmes: { set: programmes },
      },
    });
  }

  for (const student of [...STUDENTS, ...cohort()]) {
    await seedStudent(student);
  }

  const [programmeCount, moduleCount, studentCount] = await Promise.all([
    prisma.programme.count(),
    prisma.module.count(),
    prisma.student.count(),
  ]);

  process.stdout.write(
    `Seeded ${programmeCount} programmes, ${moduleCount} modules, ` +
      `${studentCount} students.\n`,
  );
}

main()
  .catch((error) => {
    process.exitCode = 1;
    console.error(error);
  })
  .finally(() => prisma.$disconnect());
