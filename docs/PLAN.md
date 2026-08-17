# PLAN.md — Execution plan

Companion to `CLAUDE.md` (architecture + domain rules) and `DESIGN.md` (screens).
This file is the running order and the checklist.

---

## How this is structured, and why

Not staff-phase-then-student-phase. **Feature by feature, staff side first, student side
appended inside the same phase.**

Reason: the student view of any feature is 30–60 minutes once its service layer exists,
because it reuses the same repo, service, and DTOs with a different `viewer`. Deferring
all student screens to a second phase means reloading the whole domain context twice, and
means that if the clock runs out you have a half-app with no student view at all — which
fails a stated requirement. Building each feature complete means every phase boundary is
a legitimate stopping point.

**Phase boundaries are commit points and demo points.** At the end of every phase the app
runs, the seed loads, and you can walk a reviewer through what exists.

### Day mapping (2–3 day target)

| Day | Phases | Outcome |
|---|---|---|
| **Day 1** | 0 · 1 · 2 | Stack proven end to end; students CRUD works both views |
| **Day 2** | 3 · 4 · 5 | All four workflows functional |
| **Day 3** | 6 · 7 · 8 | Dashboard, seed, states, README, submit |

If Day 2 slips, Phase 6 is the first thing to compress — the dashboard is assembled from
patterns that already exist by then.

---

## Phase 0 — Foundations

**Goal:** an empty app that talks to Postgres, with the vocabulary in place.
**Budget:** 2–3 hours.

- [x] `create-next-app` — TypeScript, App Router, Tailwind, `src/`, ESLint
- [x] Postgres running locally; `DATABASE_URL` set
- [x] `prisma init`, write full `schema.prisma` per CLAUDE.md §6 — **all models at once**,
      not incrementally. Schema churn is the most expensive kind of rework here
- [x] `prisma migrate dev --name init`
- [x] `lib/db.ts` — singleton with globalThis guard
- [x] `lib/env.ts` — Zod-validated env
- [x] `lib/money.ts` — `toMinor`, `fromMinor`, `formatMoney` (USD cents)
- [x] `lib/errors.ts` — `AppError`, `NotFoundError`, `ForbiddenError`, `ConflictError`
- [x] `lib/api-response.ts` — `ok()` / `fail()` envelope
- [x] `lib/student-id.ts` — `SMS-YYYY-NNNN` via transaction on `StudentCodeCounter`
- [x] `lib/utils.ts` — `cn()` (clsx + tailwind-merge)
- [x] Tailwind theme: the token palette from DESIGN.md §2
- [x] Fonts via `next/font`: Inter, Inter Tight, IBM Plex Mono
- [x] UI primitives in `components/ui/`: `Button`, `Input`, `Select`, `Textarea`,
      `Badge`, `Card`, `Table`, `Dialog`, `Toast`, `Skeleton`, `EmptyState`
- [x] `.env.example` and `.gitignore` (`.env`, `uploads/`)
- [x] First commit

**Done when:** `npm run dev` serves a blank page, `prisma studio` shows the tables, and a
scratch page renders every primitive.

> **Do not skip the primitives.** Building them mid-feature is how a hand-rolled Tailwind
> UI ends up with four different button styles.

---

## Phase 1 — Shell and identity

**Goal:** you can switch between Staff and Student and the server knows who you are.
**Budget:** 1.5–2 hours.

- [x] `lib/viewer.ts` — `getViewer()` reading httpOnly cookies
- [x] `setViewer` Server Action — writes cookies, `revalidatePath('/')`
- [x] `DemoBanner` component per DESIGN.md §3 (role select + student select)
- [x] Route groups `(staff)` and `(student)` with their layouts and nav
- [x] `app/providers.tsx` — QueryClientProvider with defaults from
      `lib/query-client.ts` (`staleTime: 60_000`, `refetchOnWindowFocus: false`)
- [x] Toast provider mounted
- [x] `queryClient.clear()` fires on viewer change
- [x] Redirect: staff routes accessed as a student → student home, and vice versa

**Done when:** switching to a student and back changes the nav and layout, and
`getViewer()` returns the right identity server-side. The student dropdown can be
hardcoded for now — Phase 2 wires it to real data.

**Checkpoint:** this is the scaffolding everything else hangs on. Don't proceed until the
switch is solid; debugging it later while three features depend on it is miserable.

---

## Phase 2 — Students & enrolment

**Goal:** the vertical slice. Once this works, every other feature is the same shape.
**Budget:** 4–5 hours.

**Server**
- [x] `student.repo.ts` — `findMany` (search + filters), `findById`, `create`, `update`,
      `updateStatus`
- [x] `student.service.ts` — authorisation, DTO mapping, code generation, **fee assignment
      created in the same transaction**, status change written to `StatusChange`
- [x] `schema.ts` — Zod for create/update; shared with the form
- [x] `types.ts` — `StudentListItem`, `StudentDetail` DTOs
- [x] Route handlers: `GET/POST /api/students`, `GET/PATCH /api/students/[id]`

**Staff UI**
- [x] Students list — table, search, programme + status filters, result count
- [x] Overdue red left border and days-overdue line (balance comes from Phase 3; render
      the column now, populate it then)
- [x] Withdrawn rows at 60% opacity
- [x] Add student form — live programme fee preview, disabled code preview field
- [x] Edit student; status change confirm with optional reason
- [x] Student detail record card header + tab shell (tabs empty for now)

**Student UI**
- [x] Overview header: name, code, programme, year

**Client**
- [x] `api/keys.ts` factory, `useStudents`, `useStudent`, `useCreateStudent`,
      `useUpdateStudent`
- [x] Loading skeleton, empty state, error state on the list

**Done when:** you can create a student from the UI, it gets a code and a fee row, it
appears in the list, search and filters work, and the student dropdown in the demo banner
is populated from the database.

**Commit and demo.** This phase proves the entire architecture. If something about the
layering feels wrong, fix it here — not after three more features copy the mistake.

---

## Phase 3 — Fees & payments

**Goal:** the registry knows who owes what and how late.
**Budget:** 3–4 hours.

**Server**
- [x] `fee.repo.ts`, `payment.repo.ts`
- [x] `fee.service.ts` — outstanding calculation, overdue derivation (days overdue),
      programme-fee snapshot on assignment
- [x] `payment.service.ts` — record payment, reject over-payment, unique reference (409 on
      duplicate), reversal creates a counter-entry
- [x] `GET/POST /api/payments`, `GET /api/students/[id]/fees`

**Staff UI**
- [x] Student detail → Fees tab: fee line, payments ledger, running outstanding
- [x] Reversed payments struck through with a `REVERSED` tag
- [x] Record payment dialog with live "remaining after this payment"
- [x] Balance + overdue columns now live on the students list
- [x] Payments ledger screen *(cut candidate)*

**Student UI**
- [x] Overview fee panel: paid-of-total, progress bar
- [x] Persistent overdue alert block with amount, due date, days overdue, next action

**Done when:** recording a partial payment updates the balance everywhere, a duplicate
reference is rejected with a clear message, and a backdated student shows as overdue in
the list, the student view, and (later) the dashboard.

---

## Phase 4 — Assessments & submissions

**Goal:** work goes in, lateness is visible.
**Budget:** 4–5 hours. The riskiest phase — file upload is where time disappears.

**Server**
- [x] `lib/storage.ts` — local disk adapter, `uploads/{assessmentId}/{studentId}/`
- [x] MIME + magic-byte validation, 10MB cap, filename sanitisation
- [x] `assessment.repo.ts` / `service.ts` — CRUD, per-assessment counts
- [x] `submission.repo.ts` / `service.ts` — versioned attempts, block resubmit after
      deadline, block for `WITHDRAWN` students, `isLate` computed at read time
- [x] Upload Server Action; download route handler with `viewer` check
- [x] `GET/POST /api/assessments`, `GET/POST /api/submissions`

**Staff UI**
- [x] Assessments list with deadline + relative time and submitted/marked ratios
- [x] New assessment form
- [x] Assessment detail: submission table, counts strip, filter chips
      (All / Late / Missing / Unmarked)
- [x] Missing submissions rendered as rows
- [x] Late flag with delay shown; `att. 2` indicator on resubmissions

**Student UI**
- [x] Assessments list, four card states per DESIGN.md §5.2
- [x] Upload zone: accepted types and cap stated up front, progress, specific errors
- [x] `Replace submission` before deadline only, with the cutoff stated

**Done when:** a student uploads, replaces before the deadline, and a late submission is
flagged with the exact delay in both views. A withdrawn student cannot submit.

> **Timebox the upload.** If storage isn't working after 90 minutes, ship metadata-only
> (record filename, size, type; skip the bytes) and finish the rest of the phase. Come
> back if there's time. A missing file body costs far less than a missing marking screen.

---

## Phase 5 — Results

**Goal:** the highest-scoring phase. Grade, classify, publish, withhold.
**Budget:** 3–4 hours.

**Server**
- [x] `result.repo.ts` / `result.service.ts` — upsert grade (0–100 validated), publish,
      withhold with reason, bulk publish
- [x] Classification computed, never stored: `>=70 Distinction, >=60 Merit, >=40 Pass,
      <40 Fail`
- [x] Student queries return `PUBLISHED` and `WITHHELD` only; `DRAFT` is invisible
- [x] Overdue-balance lookup exposed to the publish flow
- [x] `POST/PATCH /api/results`, `POST /api/results/publish`

**Staff UI**
- [x] Inline grade input in the submission row; classification updates live on save
- [x] Publish / withhold per row; withhold captures a reason
- [x] **Overdue balance warning inside the row** — the single highest-value detail
- [x] `Publish all marked` confirm listing overdue students with an exclude checkbox
- [x] Student detail → Results tab

**Student UI**
- [x] Marksheet: published results, grade + classification, published date
- [x] Average across published results only, with the count stated
- [x] Separate **Not yet available** section for withheld results with the reason
- [x] Unmarked work not listed at all — the draft/withheld distinction must be legible

**Decided during this phase — carry into the README (Phase 8)**
- Grading a student with no submission is allowed and **requires a note** (absent = 0
  with a reason on record). An unexplained zero is indistinguishable from a mistake a
  year later. `WITHDRAWN` students cannot be graded at all, matching the submission rule
- `Result.note` is **staff-internal** and absent from every student-facing DTO. The
  student-facing channel is `withheldReason`
- Bulk publish acts on `DRAFT` only. A withheld result is a decision someone already made
  with a reason attached, and a bulk action does not overwrite it
- Bulk publish **withholds** students in arrears rather than skipping them: skipping
  leaves them in `DRAFT`, which tells the student nothing
- **A released mark closes the work.** No submission or replacement is accepted once a
  student has been shown a grade, deadline or not — replacing the file afterwards would
  leave that grade describing a document nobody marked. Keyed on `publishedAt`, not on
  the current status, so the work stays closed while staff take a result back to correct
  it; and not on "has a grade", so a draft mark entered before the deadline still leaves
  the resubmission the brief allows
- **Grading a non-submitter is behind a deliberate action**, not the inline grade box:
  `Record as absent` captures the mark and a required reason together. Absence stays
  recordable — a student left permanently `Unmarked` drops silently out of their own
  average — but it cannot happen by tabbing into the wrong row. Correcting the mark later
  does not re-ask for the reason; the stored one still explains it
- **A published grade is not editable in place.** Changing one takes an explicit withhold
  first, so nobody silently rewrites a number a student is already acting on. There is no
  separate `Unpublish` action: returning a result to `DRAFT` would make it vanish from the
  marksheet without explanation, which is the silence withholding exists to replace, so
  the two jobs share one control. `publishedAt` survives the withhold — it records that
  the student was once shown the mark — and republishing keeps the original date rather
  than pretending the result is new
- **The withhold reason is optional to type and never absent from what the student
  reads.** The dialog opens on a neutral default suited to a correction; blank falls back
  to it server-side. Staff overwrite it when the real reason is arrears or misconduct
- **Staff can close submissions.** A passed deadline flags late work but never refuses it,
  so someone has to be able to say "that is everything" before marking can finish.
  `Assessment.submissionsClosedAt` records when, and the cutoff is separate from the
  deadline — closing does not move who was late, and reopening is allowed because closing
  a day early is an easy mistake. Closing does **not** auto-mark non-submitters: a bulk
  zero would hit deferred students and unrecorded extensions, so the confirm dialog names
  the count and points at `Record as absent` instead
- **Dialog errors are shown inside the dialog.** A native `<dialog>` opened with
  `showModal()` sits in the browser's top layer and paints over any toast, at any
  z-index — so a duplicate payment reference now reports inline on the field it belongs
  to. Toasts remain for mutations with no dialog behind them
- **The payments ledger sorts by entry order, not by `paidAt`.** Recorded payments carry a
  date-only `paidAt` from a date input while reversals carry a real timestamp, so sorting
  on it floated every reversal above same-day payments. `createdAt` is the order the
  registry actually did things, and it keeps a reversal directly above the payment it
  reverses
- **No Programmes screen.** Programmes are seeded, per the cut list; a nav entry leading
  to a screen that only explains its own absence is worse than no entry. The fee-snapshot
  reasoning it would have carried belongs in the README
- **No Submissions tab on the student record.** Coursework is read per assessment on the
  marking screen, where the deadline and the rest of the cohort give it meaning

**Done when:** a staff member can grade, withhold with a reason, and the student sees
"withheld + reason" rather than a blank — and publishing a result for an overdue student
warns first.

---

## Phase 6 — Dashboard

**Goal:** answer the three admin questions in one screen.
**Budget:** 1.5–2 hours — cheap, because every pattern already exists.

- [x] Four stat tiles: enrolled count, total outstanding, overdue count, awaiting marking
- [x] Overdue tile number turns red above zero
- [x] Overdue accounts table, sorted by days overdue descending, rows link to the student
- [x] Late submissions summary panel
- [x] Ready-to-publish panel linking to the assessment
- [x] Informative empty states (*"No overdue accounts. Next payment due 14 March."*)
- [x] No charts

**Decided during this phase**
- The dashboard has **no repository**. It composes `studentService` and
  `assessmentService`, so "overdue" and "unmarked" keep one definition each and the
  summary cannot contradict the screen it links to
- Rendered server-side in one pass, no TanStack Query: a read-only composite with nothing
  to mutate gains a loading state and a stale window from a client cache, and nothing else
- "Ready to publish" counts `awaitingPublishCount` (marked **and** still `DRAFT`), not
  `marked − published`. A withheld result is a decision already made, and bulk publish
  skips it — the dashboard must not advertise work the marking screen refuses to do

**Done when:** a reviewer landing on `/` immediately sees what's wrong today.

---

## Phase 7 — Seed, states, polish

**Goal:** what the reviewer actually experiences.
**Budget:** 3–4 hours. Do not compress this into an hour.

**Seed** — `prisma/seed.ts`, idempotent, `npm run db:seed`
- [x] 2 programmes at different fees (CSE $100, BBA $50); 4+ modules; 6+ assessments with
      past, imminent, and future deadlines
- [x] 8+ students across both programmes, covering **every** enrolment status
- [x] **Backdated `createdAt`** on several students so the 30-day window has elapsed —
      without this nothing is overdue on a fresh seed and the dashboard looks broken
- [x] Fees producing: paid in full, partially paid, not yet due, overdue
- [x] One reversed payment
- [x] Submissions: on time, late, resubmitted (2 attempts), missing
- [x] Results: unmarked, draft, published, withheld-with-reason
- [x] **One student who is both overdue and awaiting publication** — the demo case

**States**
- [x] Every list has loading skeleton / empty / error, with copy written per screen
- [x] Every mutation has a toast; verb matches the button
- [x] Confirm dialogs on publish, payment, status change, replace submission
- [x] Form errors inline and specific; submit disabled while pending

**Polish**
- [x] Remove every `console.log`
- [x] `npm run build` passes with no type errors and no `any`
- [x] Clean clone test: `git clone` → install → migrate → seed → dev works

---

## Phase 8 — README and submission

**Goal:** 45% of the score. **Budget: a half-day, non-negotiable.**

- [x] Setup: prerequisites, `.env` variables, install → migrate → seed → dev
- [x] **Demo guide** — walk the reviewer to the interesting cases: *"switch to Rafi Hasan
      to see an overdue account; switch to Sadia Islam to see a withheld result"*
- [x] **Product decisions** — every rule from CLAUDE.md §12 with its reasoning. Fee
      snapshotting, overdue definition, versioned submissions, draft vs withheld, computed
      classification, no hard deletes
- [x] **Assumptions & questions raised** — the four questions sent to the recruiters and
      the assumption built against each
- [x] **Architecture** — folder structure, four layers, why identity is stubbed, why the
      UI is hand-built Tailwind
- [x] **Scope decisions** — desktop-only layouts, local file storage, no auth
- [x] **AI usage** — specific: which tools, which parts, what you accepted, what you
      rejected and why, what you reviewed manually. Vague answers score nothing here
- [x] **What I'd do next** — auth, S3, tests, audit log, bulk import
- [ ] Final commit, push, verify the repo is public and clean

---

## Cut order

When time runs out, cut from the top:

1. Payments ledger screen
2. Programmes management screen (seed them instead)
3. Student detail History tab
4. Payment reversals
5. Bulk publish
6. Server-side pagination
7. Optimistic updates

**Never cut:** the `viewer` cookie pattern, overdue detection, late flagging, the
draft/withheld distinction, the overdue warning on publish, the seed's edge-case coverage,
or the README. Those are the rubric.

---

## Risk register

| Risk | Mitigation |
|---|---|
| File upload eats a day | Timebox to 90 min; fall back to metadata-only (Phase 4) |
| Schema churn mid-build | Write the full schema in Phase 0, not incrementally |
| Recruiter answers arrive late | Every assumption in CLAUDE.md §3 is the flexible reading — an answer simplifies, never rebuilds |
| Nothing overdue in the demo | Backdated seed data (Phase 7) — easy to forget, kills the dashboard |
| Stale cache on viewer switch | `queryClient.clear()` in Phase 1, viewer in query keys |
| README written at 2am | It is Phase 8 with its own budget, not leftover time |

---

## Definition of done

- [ ] Clean clone → install → migrate → seed → dev works with no manual steps
- [ ] All four workflows usable in both Staff and Student views
- [ ] Every domain rule in CLAUDE.md §12 implemented
- [ ] Seed demonstrates every edge case without the reviewer hunting
- [ ] README covers decisions, assumptions, and AI usage specifically
- [ ] `npm run build` clean; no `.env`, `uploads/`, or `node_modules` committed
- [ ] Commit history is small, ordered, and readable
