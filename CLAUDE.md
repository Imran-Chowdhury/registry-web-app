# CLAUDE.md — Student Management System (Registry Module)

> Read this file fully before writing any code. It is the single source of truth for
> architecture, conventions, and domain rules on this project. If a request conflicts
> with this file, say so before proceeding.
>
> **Companion files — read these too:**
> - `docs/PLAN.md` — phased execution plan and checklist. Work through it in order.
> - `docs/DESIGN.md` — design tokens and screen-by-screen specifications.
> - `design/` — reference mockups from Claude Design. When building any screen, open the
>   matching file in this folder first and match its layout, spacing, and visual style.
>   Treat these as the visual source of truth; `docs/DESIGN.md` is the written spec
>   behind them. Rebuild the markup using this project's own components in
>   `components/ui/` and Tailwind classes — do not copy code out of `design/` verbatim,
>   since it wasn't generated against this project's setup.

---

## 1. Context

Recruitment technical assessment for **PEN Global (PEN Group)**. Build the **Registry
module** of a Student Management System — four workflows a Registry Administrator uses
daily. Allowed: 7 working days. **Self-imposed target: 2–3 days.** Deliverable: GitHub
repo + README + seed script.

Because the timeline is compressed, scope discipline is stricter than usual: build
nothing outside the four workflows, and cut polish before cutting the domain rules in
§12 — those carry the score.

### How this is graded — optimise for this, not for feature count

| Dimension | Weight | What it means in practice |
|---|---|---|
| Stakeholder understanding | **30%** | Does the data model and UI reflect how a real registry team works? |
| Feature intuition | **30%** | Were edge cases handled *without being asked* — overdue fees, late submissions, withheld results? |
| Technical quality | 25% | Clean schema, working API routes, real error handling |
| AI usage | 15% | Documented in the README: what was used, how, and what was reviewed |

**Consequence:** a small, deeply-considered app beats a large, shallow one. Do not add
features outside the four workflows. Spend the surplus effort on edge cases, data
modelling, and the README.

---

## 2. Stack — fixed, do not substitute

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Required by brief. TypeScript, `src/` directory |
| Database | **PostgreSQL** | Required |
| ORM | **Prisma 6** | Required. `schema.prisma` must be committed |
| Styling | **Tailwind CSS only** | The brief allows "Tailwind or any component library". No component library for now — see §13 |
| Server state | **TanStack Query v5** | All API data |
| Client state | **Zustand** | UI state only |
| Validation | **Zod** | Shared between client forms and server handlers |
| Forms | react-hook-form + `@hookform/resolvers/zod` | |
| Tables | TanStack Table | Only if a plain table becomes unmanageable |
| Dates | `date-fns` | |

**Do not** add: an Express/Nest/Fastify backend (explicitly forbidden), Redux, tRPC,
GraphQL, a state library beyond Zustand, or an auth provider (see §7).

---

## 3. Open questions & working assumptions

Questions have been sent to the recruiters. **Until they reply, build against the
assumption in the right-hand column.** Each assumption is the more sophisticated of the
plausible readings, so an answer either confirms it or lets us simplify — never forces a
rebuild.

| # | Question asked | Assume until answered |
|---|---|---|
| 1 | Is the fee due date per student, per programme, or global? | **Settled — build this now.** Fee *amount* is a property of the **programme** (e.g. CSE $100, BBA $50). On student creation, a `FeeAssignment` is generated from the student's programme with `dueDate = createdAt + 30 days`. A per-student `waivedMinor` field remains for bursaries. If they later ask for a per-student due date, only the assignment step changes |
| 2 | Can an assessment belong to multiple programmes? | Assessment belongs to a **Module**; a Module belongs to one or more **Programmes**. Students see assessments for modules on their programme |
| 3 | Is a student-selector dropdown acceptable instead of auth? | **Yes.** Confirmed direction — see §7 |
| 4 | Is publishing per student *per assessment*, or whole-marksheet? | **Per student per assessment**, with a bulk "publish all for this assessment" action in the staff UI. Covers both readings |

When an answer arrives, update this table, adjust, and note the change in the README.

---

## 4. Folder structure

Feature-first vertical slices. `app/` is routing only — no business logic ever lives there.

```
prisma/
├── schema.prisma
├── migrations/
└── seed.ts

src/
├── app/                              # ROUTING ONLY
│   ├── (staff)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx        # overdue flags, at-a-glance registry state
│   │   ├── students/
│   │   │   ├── page.tsx              # list + search + filters
│   │   │   ├── new/page.tsx
│   │   │   └── [studentId]/page.tsx  # record, fees, submissions, results
│   │   ├── assessments/
│   │   │   ├── page.tsx
│   │   │   └── [assessmentId]/page.tsx   # submissions + grade entry + publish
│   │   └── programmes/page.tsx
│   ├── (student)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # my overview: fees due, open assessments
│   │   ├── assessments/page.tsx      # submit / resubmit
│   │   └── marksheet/page.tsx        # published results only
│   ├── api/
│   │   ├── students/route.ts
│   │   ├── students/[id]/route.ts
│   │   ├── payments/route.ts
│   │   ├── assessments/route.ts
│   │   ├── submissions/route.ts
│   │   └── results/route.ts
│   ├── layout.tsx
│   ├── providers.tsx                 # QueryClientProvider, Toaster
│   └── globals.css
│
├── features/                         # ← most code lives here
│   ├── students/
│   │   ├── components/               # StudentTable, StudentForm, StatusBadge
│   │   ├── hooks/                    # useStudents, useCreateStudent
│   │   ├── api/
│   │   │   ├── keys.ts               # query key factory
│   │   │   └── client.ts             # fetch calls
│   │   ├── server/
│   │   │   ├── student.repo.ts       # Prisma. Only here.
│   │   │   ├── student.service.ts    # business rules + authorisation
│   │   │   └── student.actions.ts    # "use server"
│   │   ├── schema.ts                 # Zod
│   │   ├── types.ts                  # DTOs sent to the client
│   │   └── index.ts                  # public surface of the feature
│   ├── fees/
│   ├── assessments/
│   ├── submissions/
│   └── results/
│
├── components/
│   ├── ui/                           # hand-built primitives: Button, Input, Dialog…
│   └── shared/                       # DemoBanner, DataTable, EmptyState, Money
├── lib/
│   ├── db.ts                         # Prisma singleton
│   ├── viewer.ts                     # identity resolution (§7)
│   ├── query-client.ts
│   ├── http.ts                       # fetch wrapper + error normalisation
│   ├── api-response.ts               # ok() / fail() helpers for route handlers
│   ├── errors.ts                     # AppError types
│   ├── money.ts                      # minor-unit helpers (§6)
│   ├── student-id.ts                 # SMS-YYYY-NNNN generation
│   └── env.ts                        # Zod-validated process.env
├── stores/                           # global Zustand only (viewer UI, sidebar)
└── types/
```

### Import direction — one way only

```
app/  →  features/  →  lib/
```

- `app/` may import from `features/*/index.ts` and `components/`. Never from
  `features/*/server/` directly except to call a service in a Server Component.
- Features **must not** import each other's internals. Cross-feature use goes through
  `features/x/index.ts`.
- If two features need the same thing, promote it to `lib/` or `components/shared/`.
- Never create `features/common/`. It becomes a junk drawer within a week.

---

## 5. Layering rules

**Route handler / Server Action → Service → Repository → Prisma.** Four layers, each
with one job.

```ts
// app/api/students/route.ts — TRANSPORT ONLY, ~12 lines
export async function POST(req: Request) {
  try {
    const viewer = await getViewer();
    const body = createStudentSchema.parse(await req.json());
    const student = await studentService.create(viewer, body);
    return ok(student, 201);
  } catch (e) {
    return fail(e);
  }
}
```

- **Repository** (`*.repo.ts`): Prisma calls only. No business rules, no auth checks.
- **Service** (`*.service.ts`): authorisation, business rules, transactions, DTO mapping.
  Takes `viewer` as its first argument, always.
- **Route handler / Action**: parse → call service → shape response. Nothing else.

Every file under `features/*/server/` and `lib/db.ts`, `lib/viewer.ts` starts with:

```ts
import 'server-only';
```

This turns an accidental client-side Prisma import into a build error. Non-negotiable.

---

## 6. Database & Prisma

### Money — integer minor units, never floats

Currency is **USD**. Store every monetary amount as an **integer number of cents** (`Int`)
— a $100 programme fee is `10000`.

- Floats corrupt currency arithmetic.
- Prisma `Decimal` does not serialise cleanly across the Next.js server/client boundary
  and will produce runtime errors in Server Components.
- Format at the edge only, via `lib/money.ts` (`toMinor`, `fromMinor`, `formatMoney`).
- Name fields explicitly: `amountMinor`, `feeAmountMinor`.

### Dates

Store UTC `DateTime`. Format for display with a single fixed locale/timezone constant in
`lib/` — do not use the browser's local timezone for deadline comparison. Deadline
lateness is always computed **server-side**.

### Schema sketch

```prisma
enum EnrolmentStatus { ENROLLED DEFERRED WITHDRAWN COMPLETED }
enum ResultStatus    { DRAFT PUBLISHED WITHHELD }
enum PaymentStatus   { COMPLETED REVERSED }

model Programme {
  id          String    @id @default(cuid())
  code        String    @unique          // "CSE", "BBA"
  name        String
  feeMinor    Int                        // source of truth: CSE 10000, BBA 5000
  feeDueDays  Int       @default(30)     // days from student creation
  modules     Module[]
  students    Student[]
}

model Module {
  id          String       @id @default(cuid())
  code        String       @unique
  name        String
  programmes  Programme[]
  assessments Assessment[]
}

model Student {
  id             String          @id @default(cuid())
  studentCode    String          @unique          // SMS-2025-0001
  fullName       String
  email          String          @unique
  dateOfBirth    DateTime
  programmeId    String
  academicYear   Int                              // e.g. 1, 2, 3
  intakeYear     Int                              // e.g. 2025 — drives studentCode
  status         EnrolmentStatus @default(ENROLLED)
  programme      Programme       @relation(fields: [programmeId], references: [id])
  fees           FeeAssignment[]
  submissions    Submission[]
  results        Result[]
  statusHistory  StatusChange[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  @@index([status, programmeId])
}

model StatusChange {          // registry teams need an audit trail
  id         String          @id @default(cuid())
  studentId  String
  fromStatus EnrolmentStatus?
  toStatus   EnrolmentStatus
  reason     String?
  changedAt  DateTime        @default(now())
  student    Student         @relation(fields: [studentId], references: [id])
}

model FeeAssignment {
  id          String    @id @default(cuid())
  studentId   String
  description String                        // "Tuition 2025/26"
  amountMinor Int                           // snapshot of Programme.feeMinor at creation
  dueDate     DateTime                      // student.createdAt + Programme.feeDueDays
  waivedMinor Int       @default(0)         // bursary / scholarship
  student     Student   @relation(fields: [studentId], references: [id])
  payments    Payment[]
  @@index([studentId, dueDate])
}

model Payment {
  id          String        @id @default(cuid())
  feeId       String
  amountMinor Int
  paidAt      DateTime
  reference   String        @unique
  status      PaymentStatus @default(COMPLETED)
  reversalOf  String?                        // never delete money rows
  fee         FeeAssignment @relation(fields: [feeId], references: [id])
}

model Assessment {
  id          String       @id @default(cuid())
  title       String
  moduleId    String
  deadline    DateTime
  maxAttempts Int          @default(0)       // 0 = unlimited before deadline
  module      Module       @relation(fields: [moduleId], references: [id])
  submissions Submission[]
  results     Result[]
}

model Submission {
  id           String     @id @default(cuid())
  studentId    String
  assessmentId String
  attempt      Int                            // versioned, not overwritten
  fileName     String
  filePath     String
  fileSize     Int
  mimeType     String
  submittedAt  DateTime   @default(now())
  student      Student    @relation(fields: [studentId], references: [id])
  assessment   Assessment @relation(fields: [assessmentId], references: [id])
  @@unique([studentId, assessmentId, attempt])
}

model Result {
  id             String       @id @default(cuid())
  studentId      String
  assessmentId   String
  grade          Int?                          // 0–100, null until marked
  status         ResultStatus @default(DRAFT)
  withheldReason String?
  publishedAt    DateTime?
  markedBy       String?
  updatedAt      DateTime     @updatedAt
  student        Student      @relation(fields: [studentId], references: [id])
  assessment     Assessment   @relation(fields: [assessmentId], references: [id])
  @@unique([studentId, assessmentId])
}

model StudentCodeCounter {          // safe SMS-YYYY-NNNN generation
  year      Int @id
  lastValue Int @default(0)
}
```

### Prisma rules

- Prisma is imported **only** in `*.repo.ts` and `prisma/seed.ts`.
- Singleton client in `lib/db.ts` with the `globalThis` guard (dev hot-reload).
- Never return a Prisma model to the client. Services map to DTOs in `types.ts`. Use
  explicit `select` — never `include` everything.
- Multi-write operations use `prisma.$transaction`.
- Student code generation runs **inside a transaction** against `StudentCodeCounter`, so
  two concurrent creates cannot collide. Do not use `count() + 1`.
- Every migration is committed. Never edit an applied migration.

---

## 7. Identity (no auth) — the `Viewer` pattern

Auth is deliberately out of scope. A demo switcher replaces it, but **identity is still
resolved server-side** so authorisation rules are real.

```ts
// src/lib/viewer.ts
import 'server-only';
import { cookies } from 'next/headers';

export type Viewer =
  | { role: 'STAFF' }
  | { role: 'STUDENT'; studentId: string };

export async function getViewer(): Promise<Viewer> {
  const c = await cookies();
  const role = c.get('viewer_role')?.value;
  const studentId = c.get('viewer_student_id')?.value;
  if (role === 'STUDENT' && studentId) return { role: 'STUDENT', studentId };
  return { role: 'STAFF' };
}
```

- The switcher is a **Server Action** that writes `httpOnly` cookies, then
  `revalidatePath('/')`.
- **Never** accept `studentId` from the client to decide what data to return. The server
  reads it from the cookie. Passing it as a query param is the single most likely way to
  lose marks on this build.
- Every service method takes `viewer` first and enforces its own rules. A `STUDENT`
  viewer requesting another student's data throws `ForbiddenError`.
- Render a persistent **DEMO MODE** banner containing the toggle, in an obviously
  non-production colour. It signals a deliberate stub and gives the reviewer a one-click
  way to test published/withheld behaviour.
- README line: *"Identity is stubbed at the cookie layer; swapping in Auth.js replaces
  `getViewer()` and touches nothing else."*

---

## 8. TanStack Query

- Wrap the app once in `app/providers.tsx`. Default options in `lib/query-client.ts`:
  `staleTime: 60_000`, `refetchOnWindowFocus: false`, `retry: 1`.
- **Query key factory per feature.** No string literals anywhere else.

```ts
// features/students/api/keys.ts
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (f: StudentFilters) => [...studentKeys.lists(), f] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
};
```

- Mutations invalidate by the narrowest key that is still correct
  (`invalidateQueries({ queryKey: studentKeys.lists() })`).
- **Include the viewer in keys** for anything viewer-scoped, and call
  `queryClient.clear()` when the switcher changes identity — otherwise the previous
  student's marksheet flashes on screen and looks like a data leak.
- Server Components prefetch with `prefetchQuery` + `<HydrationBoundary>` for the first
  paint. Do not prefetch everything — only the primary list on each page.
- Optimistic updates: use them for payment recording and grade entry. Always implement
  `onError` rollback.

**Do not** copy query results into `useState` or into a Zustand store.

---

## 9. Zustand

Client/UI state only. If the data came from Postgres, it belongs to TanStack Query.

Legitimate stores on this project:
- `useViewerUIStore` — switcher open/closed, last selected student for the dropdown UI
- `useStudentFilterStore` — search text, status filter, programme filter, page
- `useUIStore` — sidebar, active modal, table density

Rules:
- One store per feature, colocated at `features/x/store.ts`. Global UI only in `stores/`.
- Export selectors, not the whole store: `useStudentFilterStore(s => s.status)`.
- No async logic and no `fetch` inside a store.
- `persist` middleware only for genuine preferences. Never persist student data.
- If you write `setStudents(response.data)` — stop. That is a TanStack Query hook.

---

## 10. Server Actions vs Route Handlers

The rubric says *"working API routes"*. Provide both, with a clear split:

- **Route handlers** (`app/api/**/route.ts`) for all core CRUD. These are what a reviewer
  will inspect and curl. Consistent JSON envelope via `lib/api-response.ts`.
- **Server Actions** for form submissions (`useActionState`), the viewer switcher, and
  file upload — where progressive enhancement and `revalidatePath` are the natural fit.

Both are thin. Both call the same service. No logic is duplicated between them.

**Response envelope:**

```ts
// success
{ data: T }
// error
{ error: { code: 'VALIDATION_ERROR', message: string, fields?: Record<string,string[]> } }
```

Status codes: 200/201 success, 400 validation, 403 forbidden, 404 not found, 409 conflict
(duplicate email, duplicate payment reference), 500 unexpected. Never return 200 with an
error body.

---

## 11. File uploads

- Accept PDF and DOCX only. Validate **MIME type and magic bytes**, not just the
  extension. Cap at 10 MB.
- Store outside the repo: `./uploads/{assessmentId}/{studentId}/{attempt}-{filename}`,
  path recorded in the DB. `uploads/` goes in `.gitignore`.
- Never store file bytes in Postgres.
- Sanitise filenames. Generate the stored name; keep the original in `fileName` for display.
- Serve downloads through a route handler that checks `viewer` — a student may download
  only their own submission. Do not expose the uploads directory statically.
- README notes local disk is a deliberate assessment-scope choice and that swapping to S3
  or Vercel Blob is a single adapter in `lib/storage.ts`.

---

## 12. Domain rules — implement these without being asked

These are the 30% "feature intuition" score. Each one is a deliberate decision; each one
gets a line in the README explaining the reasoning.

### Fees
- The fee **amount comes from the programme** (CSE $100, BBA $50). Creating a student
  generates its `FeeAssignment` in the **same transaction** as the student record — a
  student never exists without a fee row.
- `amountMinor` is a **snapshot** of `Programme.feeMinor` at creation time. Changing a
  programme's fee must not silently rewrite what existing students owe. Say this in the
  README — it is exactly the kind of thing a registry team cares about.
- `dueDate = student.createdAt + Programme.feeDueDays` (30 by default). Changing a
  student's programme after creation recalculates the outstanding fee and records the
  change; it does not delete payment history.
- **Outstanding** = `amountMinor − waivedMinor − sum(COMPLETED payments)`. Computed on
  read. Do not denormalise a balance column.
- **Overdue** = outstanding > 0 **and** `dueDate < now`. Surface days overdue, not just a
  boolean.
- Reject payments exceeding the outstanding balance, or handle overpayment explicitly —
  do not silently allow a negative balance.
- Payments are never deleted. Corrections create a `REVERSED` counter-entry.
- `reference` is unique — a duplicate returns 409, which is the real-world double-entry guard.
- Dashboard shows: total outstanding, count of overdue students, and the overdue list
  sorted by days overdue.

### Enrolment
- Status changes are recorded in `StatusChange` with a timestamp and optional reason.
- `WITHDRAWN` students cannot submit work or be graded; they remain visible in the
  registry and retain their fee history.
- `DEFERRED` students remain visible and retain fees; flag them distinctly in lists.
- Deleting a student is a **status change**, not a row deletion. Registry records persist.
- Search covers name, student code, and email. Filters for programme and status combine.

### Submissions
- Store `submittedAt`; compute `isLate` by comparing to `deadline` **at read time**, so
  moving a deadline recomputes correctly. Never persist a `isLate` boolean.
- Resubmission before the deadline creates a new `attempt` row. The latest attempt is
  active; earlier ones stay for audit.
- After the deadline: a first submission is accepted and flagged late. Resubmission after
  the deadline is blocked (brief says resubmit *before* the deadline).
- Late submissions are visually flagged in both the staff queue and the student view,
  with the delay shown ("2 days 4 hours late").
- Show students a countdown to deadline and a clear "not yet submitted" state.

### Results
- Grade is `0–100`, validated. Classification is **computed, never stored**:
  `>=70 Distinction, >=60 Merit, >=40 Pass, <40 Fail`. The brief omits Fail — add it.
- A `DRAFT` result is invisible to students. Only `PUBLISHED` appears on the marksheet.
- `WITHHELD` is distinct from `DRAFT`: the student sees that a result exists but is
  withheld, with the reason. That distinction is the point of the requirement.
- Staff can grade a non-submitting student (absent = 0 with a note).
- Editing a published grade re-flags it for review — record `updatedAt` and show it.
- **On the publish screen, warn if the student has an overdue balance.** Real registries
  withhold results for fee arrears. Implementing this link is the strongest single signal
  of stakeholder understanding on this project.
- Student marksheet shows: assessment, module, grade, classification, published date, and
  an overall average with classification across published results only.

---

## 13. UI conventions

- **Tailwind only.** Build a small primitive set in `components/ui/` first and reuse it
  everywhere: `Button`, `Input`, `Select`, `Badge`, `Card`, `Dialog`, `Table`, `Toast`,
  `Skeleton`. Build these once, before any feature work — inconsistent one-off styling
  across pages is what makes a hand-rolled UI look unfinished.
- Use `clsx` + `tailwind-merge` (a `cn()` helper) for variant composition. Define variants
  as objects, not string concatenation inside JSX.
- Headless behaviour (dialog focus trap, dropdown keyboard nav) is the one place worth a
  dependency if time runs short — `@radix-ui/react-dialog` and
  `@radix-ui/react-dropdown-menu` are unstyled and Tailwind-friendly. Prefer hand-built,
  but do not spend half a day on a focus trap.
- Keep the palette to Tailwind defaults plus one accent. Do not design a theme system.
- Every list has three explicit states: loading (skeleton, not a spinner), empty (with a
  useful action), error (with retry). No silent blank screens.
- Every destructive or financial action gets a confirmation dialog.
- Toast on every mutation, success and failure.
- Status uses colour **and** text — never colour alone. Consistent palette:
  Enrolled/green, Deferred/amber, Withdrawn/grey, Completed/blue; Overdue and Late/red.
- Money always via `<Money minor={...} />`. Never inline division by 100.
- Forms: react-hook-form + Zod resolver, inline field errors, disabled submit while pending.
- Tables show total counts and use server-side pagination once past 25 rows.

---

## 14. Seed script

Must exceed the brief's minimum — the seed is what the reviewer actually sees.

- 2+ programmes at different fee levels (CSE $100, BBA $50), 4+ modules, 6+ assessments
  across varied deadlines (past, imminent, future)
- 8+ students covering **every** enrolment status, split across both programmes
- Backdate some `createdAt` values so the 30-day window has genuinely elapsed — otherwise
  nothing is overdue on a fresh seed and the dashboard looks empty
- Fee assignments producing: fully paid, partially paid, unpaid-not-yet-due, and
  **overdue** students
- Payments including one reversal
- Submissions covering: on time, late, resubmitted (multiple attempts), and missing
- Results covering: unmarked, draft, published, and withheld-with-reason
- One student who is both overdue **and** awaiting publication — the demo case for §12
- Idempotent (`upsert` or truncate-first) and runnable via `npm run db:seed`

---

## 15. README requirements

Ordered by what the reviewer scores:

1. **What this is** — one paragraph, plus a screenshot or two
2. **Setup** — prerequisites, `.env` variables, `npm install`, `prisma migrate dev`,
   `db:seed`, `dev`. Must work from a clean clone
3. **Demo guide** — "log in as staff, switch to student X to see a withheld result" —
   walk the reviewer to the interesting cases
4. **Product decisions** — the §12 rules, each with the reasoning. This section is where
   the 30% stakeholder score is won or lost
5. **Assumptions & questions raised** — reproduce the four questions sent to the recruiters
   and the assumption made pending each reply. This demonstrates judgement, not indecision
6. **Architecture** — folder structure, the four layers, why identity is stubbed, and one
   line on why the UI is hand-built Tailwind rather than a component library
7. **AI usage** — 15% of the score. Be specific: which tools, for which parts, what was
   accepted, what was rejected and why, what was manually reviewed. Vague answers score
   nothing here
8. **What I'd do next** — auth, S3 storage, tests, audit log, bulk import. Shows you know
   what production means

Also commit: `.env.example` (never `.env`), a sensible `.gitignore`, and meaningful commit
messages in small commits — the history is part of the submission.

---

## 16. Do's and Don'ts

**Do**
- Put `import 'server-only'` at the top of every server file
- Pass `viewer` as the first argument to every service method
- Compute derived values (balance, lateness, classification) at read time
- Validate with Zod at every boundary, client and server
- Use transactions for multi-write operations
- Return DTOs, never Prisma models
- Handle loading, empty, and error states everywhere
- Commit early and often, with real messages
- Read every secret, key, and connection string from `process.env` via `lib/env.ts` —
  never hardcode one anywhere, including in scratch scripts, seed data, or comments

**Don't**
- Trust a `studentId` sent from the client to scope data
- Store money as float or Prisma `Decimal`
- Store computed values (`balance`, `isLate`, `classification`) in the database
- Put Prisma calls in a component, a route handler, or a service
- Put server data in Zustand or `useState`
- Hard-delete a student, a payment, or a submission
- Use `any`, or `@ts-ignore` to silence a real type error
- Commit `.env`, `uploads/`, or `node_modules`
- Hardcode a database URL, API key, or any credential in source — if a value looks
  sensitive, it belongs in `.env`, referenced only through `lib/env.ts`
- Add features beyond the four workflows
- Leave `console.log` in committed code

---

## 17. Build order — 2–3 day plan

**Day 1 — foundations and the vertical slice**
1. Prisma schema + migration + seed skeleton
2. `lib/` foundations: db, viewer, money, errors, api-response, env
3. UI primitives in `components/ui/` (§13) — once, up front
4. Students end to end: repo → service → route handlers → hooks → UI. This proves the
   whole stack; every later feature is a copy of this shape

**Day 2 — the three remaining workflows**
5. Fees & payments: programme-sourced fee, overdue logic, dashboard flags
6. Assessments & submissions: upload, versioned attempts, late flagging
7. Results: grade entry, publish/withhold, student marksheet

**Day 3 (or the back half of day 2) — what actually scores**
8. Full seed data covering every edge case in §14
9. Empty / loading / error states across all lists
10. README — allow a **half-day, non-negotiable**. Between product decisions and AI usage
    it carries 45% of the score, and it is the only part a reviewer definitely reads

### If time runs short, cut in this order

Cut first: server-side pagination, optimistic updates, TanStack Table, status-change
reasons, payment reversals, bulk publish, animations.

Cut last, i.e. never: the `viewer` cookie pattern (§7), overdue detection, late flagging,
withheld-vs-draft distinction, the overdue warning on the publish screen, and the README.
These are the rubric.

Ship steps 1–7 before polishing anything. A plain-looking app with correct domain rules
and a strong README beats a beautiful half-finished one — the scoring weights say so
explicitly.
