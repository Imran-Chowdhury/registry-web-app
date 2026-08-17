# Registry Module — Student Management System

The **Registry** module of a Student Management System: the four workflows a registry
administrator actually works through in a day — enrolling and maintaining student records,
assigning and collecting fees, taking in coursework, and marking and releasing results.
Built for the PEN Global technical assessment.

Two audiences share one codebase. **Staff** get dense, scannable, keyboard-friendly
screens where the exception — an account in arrears, a late submission, a result waiting
to be released — is visible without reading. **Students** get a single-column view that
answers one question and gets out of the way.

The design rule underneath every screen: **colour means state, never emphasis.** Primary
buttons are solid ink, links are underlined ink, and nothing is tinted to look important.
The only saturated colour on a page is a status — red for overdue and late, amber for
deferred, green for enrolled. On a list of forty students, every coloured pixel is
information.

![The registry dashboard: enrolled count, total outstanding, overdue students, and work awaiting marking, above the overdue accounts table sorted worst-first](screenshots/dashboard.png)

*The dashboard opens on the exceptions. Arrears are ranked by age rather than amount,
because a 90-day debt and a 3-day debt are different conversations.*

![The marking screen for Midterm Report, showing a late submission, a draft grade, and an overdue-balance warning on the same student row](screenshots/assignment.png)

*One marking queue row carries three facts at once: the submission was 2d 16h late, the
grade is still a draft the student has never seen, and the account is in arrears. The
arrears warning appears here — at the moment a result would be released — rather than on a
finance screen nobody has open.*

---

## Setup

### Prerequisites

- **Node.js 20.9+**
- **PostgreSQL 14+**, running locally
- npm

### From a clean clone

```bash
# 1. create the database
createdb registry            # or: psql -U postgres -c "CREATE DATABASE registry"

# 2. environment
cp .env.example .env         # then edit DATABASE_URL to match your Postgres

# 3. install — postinstall runs `prisma generate`
npm install

# 4. schema
npx prisma migrate dev

# 5. demo data
npm run db:seed

# 6. run
npm run dev                  # http://localhost:3000
```

### Environment

One variable, read through a Zod-validated `src/lib/env.ts`. Nothing is hardcoded
anywhere in the source.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/registry?schema=public` |

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Truncates and reseeds the demo registry |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

**The seed is destructive.** It empties every table and resets the student-code counter
before writing, so the demo is identical on every machine and the walkthrough below can
name students by code. Re-running it discards anything entered through the UI. It refuses
to run when `NODE_ENV=production`.

All of its dates are **relative to the moment it runs** — a student created "75 days ago"
is 45 days in arrears whenever you seed. A seed pinned to calendar dates stops
demonstrating anything the month it goes stale: nothing overdue, no imminent deadline, and
a dashboard that looks broken rather than empty.

---

## Demo guide

There is no login. A **DEMO MODE** banner sits at the top of every page with a role
switcher, and in student mode a second control picks which student you are. Identity is
still resolved server-side from an `httpOnly` cookie — see [Architecture](#architecture).

Start as **Staff**.

### 1. The dashboard answers "what needs me today"

`/dashboard` — 7 enrolled, **$280.00 outstanding**, **4 overdue**, 3 awaiting marking. The
overdue table is sorted worst-first: 90 days, 45, 32, 18. The overdue tile turns red only
when the count is above zero, so one glance says whether today is a chasing day.

### 2. The case the whole build is pointed at — Rafi Hasan

Click **SMS-2026-0001** in the overdue table. He has paid part of his $100 fee and still
owes **$70.00**, 45 days past
his due date.

Now go to **Assessments → Midterm Report**. His row shows three things at once:

- his submission was **2d 16h late**,
- his grade of **62** is still a **Draft**, so he has never seen it,
- **⚠ $70.00 overdue · 45 days**, in the row itself.

Press **Publish**. The confirmation repeats the arrears before releasing the mark.
Surfacing a fee balance at the moment a result is released — rather than on some other
screen — is the single decision in this build that reflects how a real registry works.

Or press **Publish all marked** instead: the dialog names every student in arrears and
offers to **withhold** them rather than skip them, because a skipped result stays `DRAFT`,
which tells the student nothing.

### 3. Draft versus withheld, from the student's side

Switch the banner to **Student**, then pick each of these:

| Student | `/me/marksheet` shows |
|---|---|
| **Sadia Islam** (SMS-2025-0002) | Nothing published, and a **Not yet available** section: *Result withheld — outstanding balance on your account.* She knows a result exists and why she cannot see it. |
| **Rafi Hasan** (SMS-2026-0001) | Nothing at all. His 62 is still a draft, and a draft is invisible — not greyed out, not "pending", simply absent. |
| **Aisha Rahman** (SMS-2025-0001) | Three published results and an average of **81 · Distinction**, with "across 3 published results" stated so the number cannot mislead. |
| **Farhana Akter** (SMS-2025-0004) | One published result — 76, Distinction — and the average that goes with it, pictured below. |

That contrast between Sadia and Rafi is the point of the withhold feature, and it is the
part most implementations blur.

![Sadia Islam's marksheet: no published results, and a Not yet available section stating the result is withheld for an outstanding balance](screenshots/withheld_marksheet.png)

![Farhana Akter's marksheet: a published result of 76 with a Distinction badge, the publication date, and an overall average](screenshots/published_marksheet.png)

*The same screen, two students. Sadia is told a result exists and why it is being held.
Farhana sees the mark, its classification, when it was released, and an average that names
how many results it covers.*

### 4. Coursework

As **Tanvir Ahmed** (SMS-2026-0003), open `/me/assessments`:

- **Final Project** — `Attempt 2 of 2`, a real `.docx` you can download. He replaced his
  first attempt before the deadline; attempt 1 is still on record.
- **Lab Exercise 2** — open, deadline in 9 days, upload zone stating PDF/DOCX and the 10MB
  cap up front. Replacing an existing submission asks for confirmation first and names the
  file being superseded.

As **Nusrat Jahan** (SMS-2026-0002), Case Study 1 reads *"Submitted 2 days 4 hours after
the deadline"* — the delay, not a bare "late" flag.

### 5. Money that cannot be edited away

`/payments` — the ledger. Find `BANK-2026-0214`: struck through and tagged **REVERSED**,
with its negative `-REV` counter-entry directly above it. The payment was recorded against
the wrong student and corrected. Nothing was deleted.

On any student record, **Record payment** shows a live "remaining after this payment"
line, refuses an amount above the outstanding balance, and rejects a duplicate reference
with a 409 — reported inline in the dialog, where it can actually be seen.

### 6. Registry records persist

`/students` — **Imtiaz Karim** is withdrawn: dimmed, still listed, still holding his fee
history. **Sadia Islam** is deferred and still owes money. Deleting a student is a status
change, never a row deletion, and every change is written to a history the record card
shows.

![The students list: search and filters above a table of ten students showing enrolled, deferred, withdrawn and completed records, with overdue rows marked in red and a not-yet-due balance shown with its due date](screenshots/student_list.png)

*Every enrolment status in one view. Arrears carry a red rail and the days overdue beside
the figure; a balance that is simply not due yet shows its date instead, because "owes
money" and "owes money late" are different states. The withdrawn record is dimmed rather
than hidden — registry records persist.*

---

## Product decisions

Each of these is a deliberate choice about how a registry works, not a feature from the
brief.

### Fees

| Decision | Reasoning |
|---|---|
| **The fee amount comes from the programme** (CSE $100, BBA $50), and the `FeeAssignment` is created in the **same transaction** as the student | A student never exists without a fee row, so no reconciliation job is ever needed to find the ones that slipped through |
| `amountMinor` is a **snapshot** of `Programme.feeMinor`, not a reference | Raising a programme's fee must not silently rewrite what existing students already owe. This is exactly the kind of thing a registry gets audited on |
| `dueDate = createdAt + Programme.feeDueDays` (30 by default) | Per-programme rather than global, so a change of policy for one programme does not move everyone's date |
| **Outstanding = amount − waived − completed payments**, computed on read | A stored balance column drifts the moment a payment is reversed or a waiver applied. There is one definition of the balance in the codebase (`fee-math.ts`) and both the list and the detail screen call it |
| **Overdue = outstanding > 0 AND dueDate < now**, surfaced as *days* overdue | A boolean cannot be sorted. "62 days" and "3 days" are different conversations, and the dashboard ranks by age so the oldest debt is the first call |
| A **bursary waiver settles the account** | Shafiq Rahman has paid $50 of a $100 fee and owes nothing, because $50 is waived. A naive "paid < amount" check reports him as in arrears |
| **Overpayment is refused**, with the figure named | Silently allowing a negative balance turns the ledger into fiction |
| **Payments are never deleted.** A correction marks the original `REVERSED` and writes a negative counter-entry | Double entry. Both sides stay visible, so an auditor can see what happened rather than what is left |
| `reference` is unique; a duplicate returns **409** | The real-world double-entry guard: the same bank reference cannot be booked twice |
| The ledger sorts by **entry order, not payment date** | Recorded payments carry a date-only `paidAt` from a date input while reversals carry a real timestamp; sorting on it floated every reversal above the same-day payment it reversed. `createdAt` is the order the registry actually did things |

### Enrolment

- **Deleting a student is a status change.** Registry records persist — a withdrawn
  student keeps their fee history, their submissions, and their results, and stays in the
  list at reduced opacity. Present, clearly inactive, never hidden.
- **`WITHDRAWN` students cannot submit or be graded**, and are excluded from the expected
  cohort on a marking screen. `DEFERRED` students remain fully active and are flagged
  distinctly, because a deferral does not clear a debt.
- **Every status change is written to `StatusChange`** with a timestamp and an optional
  reason, including the entry made when the record is created. The UI says so before you
  confirm: *"This change will be recorded in the student's history."*
- **Search covers name, student code, and email** — the three identifiers an admin
  actually has to hand — and combines with the programme and status filters.

### Submissions

- **`isLate` is computed at read time**, never stored. Moving a deadline re-flags every
  submission correctly instead of leaving a stale boolean behind.
- **Resubmission before the deadline creates a new attempt row.** The latest is active,
  earlier ones stay for audit — you can see that attempt 2 of 2 replaced something.
- **After the deadline, a first submission is still accepted and flagged late**; a
  *replacement* is refused. The registry needs the record more than it needs the rule.
- **Staff can close submissions** (`Assessment.submissionsClosedAt`), separately from the
  deadline. A passed deadline flags late work but never refuses it, so someone has to be
  able to say "that is everything" before marking can finish. The cutoff is deliberately
  not the deadline — closing does not change who was late — and reopening is allowed,
  because closing a day early is an easy mistake. Closing does **not** auto-mark
  non-submitters: a bulk zero would hit deferred students and unrecorded extensions.
- **A released mark closes the work.** Once a student has been shown a grade, no further
  submission is accepted, deadline or not — replacing the file afterwards would leave that
  grade describing a document nobody marked. Keyed on `publishedAt` rather than current
  status, so the work stays closed while staff take a result back to correct it.
- Lateness is shown as a **delay** — "2d 16h", or "2 days 4 hours" in the student's own
  view — in both the staff queue and the student card.

### Results

- **Classification is computed, never stored**: `≥70 Distinction, ≥60 Merit, ≥40 Pass,
  <40 Fail`. The brief omits Fail; a marking screen that cannot express one is not usable.
- **`DRAFT` is invisible to students. `WITHHELD` is not.** A withheld result tells the
  student that a mark exists and why it is being held. That distinction is the entire
  point of the requirement, and collapsing it into "not published" throws the feature away.
- **The publish screen warns about arrears**, in the row and again in the confirmation.
  Real registries withhold results for fee arrears, and this is the moment the information
  changes a decision.
- **Bulk publish withholds students in arrears rather than skipping them.** Skipping
  leaves them in `DRAFT`, which is silence. It also acts on `DRAFT` only — a withheld
  result is a decision someone already made, with a reason attached, and a bulk action
  does not overwrite it.
- **Grading a non-submitter is behind a deliberate action.** `Record as absent` captures
  the mark and a required note together, so a zero is never indistinguishable from a
  mistake a year later. Correcting that mark later does not re-ask for the reason.
- **A published grade is not editable in place.** Changing one requires withholding it
  first, so nobody silently rewrites a number a student is already acting on. There is no
  separate "unpublish": returning a result to `DRAFT` would make it vanish from the
  marksheet without explanation, which is the silence withholding exists to replace.
  `publishedAt` survives a withhold — it records that the student was once shown the mark
  — and an edited published result is flagged as such.
- **The withhold reason is optional to type and never absent from what the student reads.**
  The dialog opens on a neutral default suited to a correction; blank falls back to it
  server-side.
- **`Result.note` is staff-internal** and absent from every student-facing DTO. The
  student-facing channel is `withheldReason`.
- The marksheet shows an **average across published results only**, with the count stated.

---

## Assumptions and questions raised

Four questions went to the recruiters before building. Each assumption below is the more
sophisticated of the plausible readings, so an answer either confirms it or lets the build
be simplified — never rebuilt.

| # | Question | Assumption built against |
|---|---|---|
| 1 | Is the fee due date per student, per programme, or global? | **Per programme.** The fee amount is a property of the programme (CSE $100, BBA $50) and the due date is `createdAt + Programme.feeDueDays`. A per-student `waivedMinor` covers bursaries. A per-student due date would change only the assignment step |
| 2 | Can an assessment belong to multiple programmes? | An assessment belongs to a **module**; a module belongs to one or more **programmes**. Students see assessments for the modules on their programme. `GEN-100 Academic Writing` in the seed is shared by both programmes to prove the relation is real |
| 3 | Is a student-selector dropdown acceptable instead of auth? | **Yes** — confirmed. See the viewer pattern below |
| 4 | Is publishing per student per assessment, or whole-marksheet? | **Per student per assessment**, with a bulk "publish all marked" action. That covers both readings |

---

## Architecture

### Stack

Next.js 16 (App Router, TypeScript, `src/`) · PostgreSQL · Prisma 7.9 · Tailwind CSS v4 ·
TanStack Query v5 · Zustand · Zod · react-hook-form · date-fns.

No separate backend — the brief rules one out, and route handlers plus server actions
cover it.

### Four layers, each with one job

```
Route handler / Server Action  →  Service  →  Repository  →  Prisma
```

- **Repository** (`*.repo.ts`) — Prisma calls only. No business rules, no authorisation.
- **Service** (`*.service.ts`) — authorisation, business rules, transactions, DTO mapping.
  Takes `viewer` as its first argument, always, and enforces its own rules rather than
  trusting the caller to have been guarded.
- **Route handler / action** — parse, call the service, shape the response. Nothing else,
  usually about a dozen lines.

Every file under `features/*/server/` starts with `import 'server-only'`, which turns an
accidental client-side Prisma import into a build error rather than a runtime one.

Prisma models never reach the client; services map to DTOs with explicit `select`.
Multi-write operations run in `prisma.$transaction` — creating a student and its fee
assignment is one transaction, and the `SMS-YYYY-NNNN` code is drawn from a counter row
inside it so two concurrent creates cannot collide.

### Feature-first layout

```
src/
├── app/                     # routing only — no business logic ever
│   ├── (staff)/             # dashboard, students, assessments, payments
│   ├── (student)/me/        # overview, assessments, marksheet
│   └── api/                 # route handlers
├── features/                # most of the code lives here
│   ├── students/  fees/  assessments/  results/  programmes/  dashboard/
│   │   ├── components/  hooks/  api/{keys,client}  server/{repo,service,actions}
│   │   ├── schema.ts        # Zod, shared by the form and the handler
│   │   ├── types.ts         # DTOs sent to the client
│   │   ├── index.ts         # client-safe public surface
│   │   └── server.ts        # server-only public surface
├── components/{ui,shared}   # hand-built primitives, then shared pieces
├── lib/                     # db, viewer, money, dates, errors, storage, env…
└── stores/                  # global UI state only
```

Imports run one way — `app/ → features/ → lib/` — and features reach each other only
through their barrels, never into another feature's internals.

### Identity without auth — the viewer pattern

Auth is out of scope, but authorisation is not. `getViewer()` reads `httpOnly` cookies
**server-side** and returns `{ role: 'STAFF' }` or `{ role: 'STUDENT', studentId }`. The
demo switcher is a server action that writes those cookies.

A `studentId` is **never** accepted from the client to decide what data comes back. A
student requesting another student's record gets a `ForbiddenError`, and the download route
refuses a file that is not theirs — try it: as one student, request another's submission
and you get a 403, not a file.

> Identity is stubbed at the cookie layer; swapping in Auth.js replaces `getViewer()` and
> touches nothing else.

Switching viewer calls `queryClient.clear()`, so the previous student's marksheet cannot
flash on screen and look like a data leak.

### Data handling

- **Money is integer minor units** (`amountMinor`), never a float and never Prisma
  `Decimal` — which does not serialise cleanly across the server/client boundary. $100 is
  `10000`. Formatting happens only at the edge, through `<Money />`.
- **Dates are stored UTC** and formatted through one fixed locale and timezone. Lateness
  and arrears are always computed server-side: a deadline belongs to the institution, not
  to wherever the reader is sitting.
- **Derived values are never stored** — balance, lateness, and classification are computed
  on read.

### API

Route handlers are what a reviewer can curl. Consistent envelope: `{ data }` on success,
`{ error: { code, message, fields? } }` on failure. 200/201, 400 validation, 403 forbidden,
404 not found, 409 conflict, 500 unexpected — never a 200 with an error body.

| Method | Route |
|---|---|
| `GET` `POST` | `/api/students` |
| `GET` `PATCH` | `/api/students/[id]` |
| `GET` | `/api/students/[id]/fees` · `/api/students/[id]/results` |
| `POST` | `/api/students/[id]/status` |
| `GET` `POST` | `/api/payments` |
| `POST` | `/api/payments/[id]/reverse` |
| `GET` `POST` | `/api/assessments` |
| `GET` `PATCH` | `/api/assessments/[id]` |
| `GET` | `/api/assessments/[id]/submissions` |
| `GET` `POST` | `/api/submissions` |
| `GET` | `/api/submissions/[id]/file` |
| `GET` `POST` `PATCH` | `/api/results` |
| `POST` | `/api/results/publish` |

Server actions handle form submissions, the viewer switcher, and file upload, where
progressive enhancement and `revalidatePath` fit better. Both paths call the same service,
so no logic is duplicated.

### File uploads

PDF and DOCX only, validated by **magic bytes** rather than by extension or the
browser-supplied MIME type, capped at 10MB, with sanitised display names and generated
storage names. Files live outside the repo under `uploads/{assessmentId}/{studentId}/` and
are served only through a route handler that checks the viewer — the directory is never
exposed statically.

Local disk is a deliberate assessment-scope choice. Moving to S3 or Vercel Blob replaces
the two functions in `lib/storage.ts` and nothing else.

### Why the UI is hand-built Tailwind

A component library would have brought a visual language with it, and the whole design
rests on colour meaning state rather than emphasis — which is easier to hold to when the
primitives are yours. The set in `components/ui/` (Button, Input, Select, Badge, Card,
Table, Dialog, Toast, Skeleton, EmptyState) was built once, before any feature work, so no
screen invented its own button. Dialogs use the native `<dialog>` element, which already
provides the focus trap, Escape-to-close and top-layer stacking that would otherwise be
the expensive part.

Every list has three explicit states — skeleton, empty with a useful action, and error
with retry. Every mutation raises a toast whose verb matches the button that caused it.

---

## Scope decisions

- **Desktop-only layouts.** Designed at 1440px. Tailwind's defaults keep it usable
  narrower, but no breakpoint-specific work was done — this is an internal tool used at a
  desk, and the time went to domain rules instead.
- **No authentication**, by the brief. See the viewer pattern.
- **Local file storage**, as above.
- **No programmes management screen.** Programmes are seeded. A nav entry leading to a
  screen that only explains its own absence is worse than no entry — the fee-snapshot
  reasoning it would have carried is in this README instead.
- **No submissions tab on the student record.** Coursework is read per assessment on the
  marking screen, where the deadline and the rest of the cohort give it meaning.
- **Pagination is server-side at 25 rows.** The seed ships 10 students, so the pager stays
  quiet in the demo; it is exercised by `?page=` and by the students API directly. The one
  exception is the arrears list, which is narrowed in SQL on the date and filtered on the
  money in the service — expressing the balance as a `WHERE` clause would be a second
  definition of it.
- **The dashboard has no repository.** It composes the student and assessment services, so
  "overdue" and "unmarked" keep one definition each and the summary cannot contradict the
  screen it links to. It is rendered server-side in one pass: a read-only composite with
  nothing to mutate gains a loading state and a stale window from a client cache, and
  nothing else.

---

## AI usage

AI wrote most of the code in this repository. It did not decide what the code should do.
That split is the honest summary, and the rest of this section is the detail behind it.

**Tools.** Claude Code (Opus) as the primary agent, driven by three committed specs that
act as standing instructions rather than one-off prompts: `CLAUDE.md` (architecture,
conventions, and the domain rules), `docs/PLAN.md` (a phased execution plan with explicit
"done when" criteria), and `DESIGN.md` with the mockups in `design/`, produced with Claude
Design. Prisma's documentation skills are vendored (`skills-lock.json`) so ORM work could
be checked against current API docs rather than against recalled ones.

**Most of my time went into planning, not prompting.** The three spec files came first and
took the largest share of the effort. Everything after that was generated against them
phase by phase, each phase ending at a commit that runs — the git history follows
`docs/PLAN.md` step for step. Settling the architecture before generating any code is what
kept the layering consistent across five features: the model was not deciding where a
Prisma call belonged on each occasion, it was following a rule that had already been
agreed.

**The domain rules in §12 are mine.** Fee snapshotting, the arrears warning at the moment
of publishing, withheld-versus-draft, versioned attempts, no hard deletes — those are
judgement calls about how a registry works, and I made them and wrote them into `CLAUDE.md`
before any code existed. When generated code drifted from one, I sent it back. That is the
opposite of accepting whatever the model produced and describing it afterwards.

**Where AI genuinely improved the decisions.** When I was unsure, I asked for the
alternatives and the trade-offs rather than a recommendation, and then chose. Deciding
against a "publish everything and skip the students in arrears" bulk action — in favour of
withholding them, because a skipped result stays `DRAFT` and tells the student nothing —
came out of exactly that kind of exchange. The value was in having the options laid out
properly, not in being handed an answer.

**The design is AI-generated from my sketches.** I specified the layout — where the tabs
sat, which actions belonged in a row versus a dialog, what each section contained — and the
mockups in `design/` were produced from that, then rebuilt in this project's own components.
The one rule I held throughout is the one at the top of this README: colour marks state,
never emphasis.

**How I worked through generated code.** I read every phase's output and ran it before
moving on. Bugs I found mostly went back to the model to fix, since it had the context, but
I fixed some by hand, and where a proposed fix was weaker than it should have been I said
how to do it better instead of taking it.

Some of what I caught was a rule already written down being quietly skipped. The student
list first shipped with no pagination at all, though `CLAUDE.md` calls for server-side
pagination past 25 rows — the kind of omission that looks fine on ten seeded students and
falls over on a real cohort. I sent it back to be done properly through TanStack Query:
the page is part of the query key, so each page is its own cache entry rather than a
replacement, and `placeholderData: keepPreviousData` keeps the table on screen instead of
blanking between pages.

One case is worth naming because it is where the model ran out of road. Uploads above 1MB
failed with an unhandled runtime error, and the suggested fixes kept aiming at the
validator — which was not where the problem was. I went through the Next.js documentation,
found the real cause (Server Action bodies are capped at 1MB by the framework, enforced
before the action runs, so `useActionState` never sees the failure), and had it implemented
against that. The reasoning is recorded in `next.config.ts`: the limit is raised to 12MB for
multipart overhead, while the real 10MB cap stays server-side in the storage adapter, where
it produces a proper error.

**Verified rather than trusted.** Generated work was checked against the running app, not
read and waved through. Examples from the final phase:

- Seeded results initially rendered as *"edited after publishing"* on every row, because
  Prisma's `@updatedAt` stamps the seed run — caught by querying `updatedAt − publishedAt`
  directly and fixed by setting both explicitly.
- Late submissions were first expressed as offsets from "now", which produced delays like
  "1d 18h" that nobody had intended; rewritten to be expressed against each assessment's
  own deadline.
- Generated PDF and DOCX fixtures were validated as real files — xref offsets parsed,
  the DOCX opened with a ZIP reader and its CRCs tested — rather than assumed to work
  because the upload validator accepted their first four bytes.
- The download route was exercised as three different viewers to confirm a student cannot
  fetch another student's file (403, not a file).
- A clean-clone test was run end to end against a fresh database, which is what surfaced
  the missing `postinstall: prisma generate` — without it `npm install` alone left the
  generated client absent and the seed unable to start.

**What I would take from this.** Writing the constraints down first is what made the
generated code worth keeping — the specs are in the repository, so the instructions the
work was produced against can be read alongside it. The failure mode to guard against is
not bad code; it is plausible code that quietly answers a slightly different question than
the one the domain asked, which is why every phase was read and run rather than skimmed.

---

## What I would do next

1. **Real authentication.** Auth.js replacing `getViewer()`, with staff roles separated
   from student accounts. The rest of the authorisation layer already exists and would not
   move.
2. **Object storage.** S3 or Vercel Blob behind the existing `lib/storage.ts` adapter,
   with signed URLs replacing the streaming download route.
3. **Tests.** The service layer is the place to start — fee arithmetic, lateness, the
   publish and withhold transitions — because they are pure functions over a repository
   that is trivial to fake. Then a Playwright pass over the demo walkthrough above.
4. **A real audit log.** `StatusChange` proves the shape; grade changes, publications and
   payment reversals deserve the same treatment, written by the service layer rather than
   by triggers.
5. **Bulk import.** Registries onboard a cohort at a time, from a spreadsheet. Validation
   would reuse the same Zod schemas the form uses.
6. **Fee schedules.** Instalments and part-payment plans, which the current model is one
   table away from — `FeeAssignment` is already a list on the student.
7. **Operational polish.** Structured logging in place of the single `console.error` on the
   unhandled-error path, plus request IDs through the API envelope.
