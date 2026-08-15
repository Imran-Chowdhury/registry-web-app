# DESIGN.md — Student Management System (Registry Module)

Design brief for Claude Design. Pair with `CLAUDE.md`, which holds the architecture and
domain rules. This file covers **what each screen shows and why**.

---

## 1. What this is

An internal tool for a **university Registry Administrator** — the person who enrols
students, chases unpaid fees, collects coursework, and releases results. Not a
consumer product. Not a marketing site.

Two audiences, one codebase:

| Viewer | Who they are | What they need |
|---|---|---|
| **Staff** | Registry admin at a desk, all day, every day | Density, scanability, fast actions, obvious exceptions |
| **Student** | Checks in occasionally, at a desk | Clarity, reassurance, one thing to do |

These two need genuinely different design treatments. Staff screens are dense, tabular,
keyboard-friendly. Student screens are spacious and single-column. Do not
apply one visual rhythm to both.

### The three questions a Registry admin opens this app to answer

1. Who owes me money and how late are they?
2. Who hasn't submitted, and who submitted late?
3. What's ready to publish, and who shouldn't see their result yet?

Every staff screen should answer one of these in under three seconds. If a screen
requires reading to find the exception, the design has failed.

---

## 2. Design direction

### The one rule that shapes everything

**Colour means state, never emphasis.**

Primary buttons are solid ink, not a brand colour. Links are underlined ink. Nothing is
tinted to look important. The only saturated colour on any screen is a status: a red
figure means overdue, an amber pill means deferred, a green dot means enrolled. That
means a Registry admin can scan a screen of 40 students and every coloured pixel is
information.

This is a real constraint, not a mood. It's also the thing to write one line about in the
README — it's a design decision that comes from the stakeholder, not from a template.

### Signature: the record card

Registry work is identifier work — student codes, payment references, dates, amounts.
Treat that data like it matters:

- **All identifiers, money, and dates set in monospace** with tabular figures, so columns
  align down the page and a mismatched digit is visible.
- The student detail header is styled as a **physical record card**: ruled border, the
  student code set large in mono like a filing number, status and balance rendered as
  inline stamps in the corner.

That's the memorable element. Everything else stays quiet.

### Tokens

**Colour**

```
--ink        #101828   text, primary buttons, header bar
--paper      #FFFFFF   card and table backgrounds
--surface    #F5F6F8   page background, table header row
--rule       #E4E7EC   hairlines, borders, dividers
--muted      #667085   secondary text, labels, placeholder

Status — the only saturated colours in the product
--enrolled   #067647   green
--deferred   #B54708   amber
--withdrawn  #667085   grey
--completed  #175CD3   blue
--alert      #B42318   red — overdue, late, withheld, destructive
```

Status pills are the colour at 10% opacity for the fill, full strength for text and a
1px border. Never colour alone — every pill carries its label.

**Type**

| Role | Face | Usage |
|---|---|---|
| Headings | Inter Tight, 600, tight tracking | Page titles, section headers |
| Body / UI | Inter, 400–500 | Labels, prose, buttons, form fields |
| Data | IBM Plex Mono, 400–500 | Student codes, money, dates, references, grades |

Scale: `12 / 13 / 14 / 16 / 20 / 28`. Body text 14px on staff screens, 16px on student
screens. Tables 13px. Enable `tabular-nums` globally on the mono face.

**Layout**

- 4px spacing base. Staff density: 12px cell padding, 40px row height.
- Radius: `4px` on inputs and buttons, `6px` on cards, `full` on pills. Nothing rounder.
- Borders over shadows. One shadow token, used only for dialogs and dropdowns.
- Staff content max-width `1440px`, table full-bleed within it. Student content
  max-width `680px`, centred.

**Motion**

Almost none. 120ms colour and background transitions on interactive elements. A dialog
fades and rises 8px. No page transitions, no scroll reveals, no skeleton shimmer beyond a
gentle pulse. This is a tool people use for six hours a day.

---

## 3. Global shell

### Demo mode banner — always visible, both views

A 44px strip pinned to the top of every screen. Ink background, white text, monospace
label. This is how the reviewer moves through the app, so it has to be obvious and
frictionless.

```
┌──────────────────────────────────────────────────────────────────────┐
│ DEMO MODE   Viewing as [ Staff ▾ ]                                   │
└──────────────────────────────────────────────────────────────────────┘

when Student is selected:

┌──────────────────────────────────────────────────────────────────────┐
│ DEMO MODE   Viewing as [ Student ▾ ]  [ Aisha Rahman · SMS-2025-0003 ▾ ] │
└──────────────────────────────────────────────────────────────────────┘
```

- First control: Staff / Student.
- Second control appears only in Student mode: a searchable list of all students, showing
  name and code, grouped by programme. Changing it swaps the entire view instantly.
- Deliberately does **not** look like part of the product chrome. It should read as
  scaffolding — that's the point.

### Staff navigation

Horizontal tab bar under the banner, ink text on paper, 2px ink underline on the active
tab. Five items: **Dashboard · Students · Assessments · Programmes · Payments**.

No sidebar. A sidebar costs 240px of horizontal space that tables need, and there are
only five destinations.

### Student navigation

Three tabs, centred, matching the staff tab pattern: **Overview · Assessments · Marksheet**.

---

## 4. Staff screens

### 4.1 Dashboard — "what needs my attention"

The most important screen in the app. It must answer all three admin questions above
without scrolling on a laptop.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Registry                                                            │
│                                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Students │ │Outstanding│ │ Overdue  │ │ Awaiting │                │
│  │   142    │ │  $8,450   │ │    7     │ │ marking  │                │
│  │ enrolled │ │           │ │ students │ │    23    │                │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │
│                                                                       │
│  Overdue accounts                                    View all →      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ SMS-2025-0004  Rafi Hasan     CSE   $100.00   62 days over   │    │
│  │ SMS-2025-0011  Nusrat Jahan   BBA    $50.00   41 days over   │    │
│  │ SMS-2025-0007  Tanvir Ahmed   CSE    $35.00   12 days over   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Late submissions            │  Ready to publish                     │
│  ┌───────────────────────┐   │  ┌───────────────────────────────┐   │
│  │ 4 submissions flagged │   │  │ Data Structures — Midterm      │   │
│  │ late across 3 assess. │   │  │ 18 of 20 marked  [ Review → ]  │   │
│  └───────────────────────┘   │  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Design notes**

- The four stat tiles are the only place a large number appears. Number in mono at 28px,
  label in muted 12px uppercase below. The **Overdue** tile's number is red when > 0 and
  muted grey when 0 — one glance tells you if today is a chasing day.
- The overdue table is sorted by days overdue, descending. "62 days over" in red mono.
  Rows are clickable through to the student record.
- Do **not** add charts. A registry admin has no use for a pie chart of enrolment status,
  and it reads as padding.
- **Empty state matters here.** With nothing overdue, the panel shows a single line:
  *"No overdue accounts. Next payment due 14 March."* Give the empty state real
  information, not a shrug.

### 4.2 Students — list

The screen the admin lives in.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Students                                        [ + Add student ]   │
│                                                                       │
│  [ 🔍 Search name, code, or email        ]  [Programme ▾] [Status ▾] │
│                                                                       │
│  142 students · 7 overdue                                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ CODE          NAME           PROGRAMME  YEAR  STATUS   BALANCE│   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ SMS-2025-0001 Aisha Rahman   CSE         1   ●Enrolled  $0.00 │   │
│  │ SMS-2025-0004 Rafi Hasan     CSE         1   ●Enrolled $100.00│   │
│  │                                                    ⚠ 62 days  │   │
│  │ SMS-2025-0009 Sadia Islam    BBA         2   ●Deferred  $25.00│   │
│  │ SMS-2025-0012 Imtiaz Karim   CSE         3   ●Withdrawn $0.00 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Design notes**

- Code and balance in mono, right-aligned balance. Everything aligns vertically.
- Overdue rows get a **red left border**, 2px, plus the days-overdue line under the
  balance. No full-row red fill — it destroys readability at 40 rows.
- Withdrawn rows: name and programme at 60% opacity. Present, clearly inactive, never
  hidden. Registry records persist.
- Filters and search combine and are reflected in the result count line. Active filters
  render as removable chips below the controls.
- Row click → student detail. No per-row action menu; actions live on the detail screen.
- **Empty search state:** *"No students match 'jhon'. Check the spelling or clear
  filters."* with a clear-filters button. Never a bare "No results".

### 4.3 Add / edit student — form

Single-column form, max-width 560px, not a modal. Creating a student is a considered act
and has enough fields to deserve a page.

Fields, in this order: **Full name · Email · Date of birth · Programme · Academic year ·
Enrolment status**.

**The detail that shows product thinking:** when a programme is selected, a live summary
appears beneath the field —

```
┌────────────────────────────────────────────────┐
│ Computer Science (CSE)                          │
│ Fee $100.00 · due 12 April 2026 (30 days)       │
│ A fee record is created automatically.          │
└────────────────────────────────────────────────┘
```

This makes the invisible consequence of the choice visible before the admin commits. It
also quietly demonstrates that fee assignment is programme-driven and time-bound.

Student code is **not** an input. Show it as a disabled preview field reading
`SMS-2026-••••  Generated on save`.

On edit, changing enrolment status opens a small confirm with an optional reason field —
status changes are recorded, so the UI should say so: *"This change will be recorded in
the student's history."*

### 4.4 Student detail — the record card

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  SMS-2025-0004                              ●Enrolled          │  │
│  │  Rafi Hasan                                 ⚠ $100.00 overdue  │  │
│  │  rafi.hasan@example.edu · Computer Science · Year 1            │  │
│  │  Born 4 Feb 2003 · Enrolled 12 Jan 2026                        │  │
│  │                                     [ Edit ]  [ Record payment ]│  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  [ Fees ]  [ Submissions ]  [ Results ]  [ History ]                 │
│  ─────────                                                            │
│                                                                       │
│  Fee                                                                  │
│  Tuition 2025/26            $100.00    due 11 Feb 2026               │
│  Paid                        $0.00                                    │
│  ─────────────────────────────────────                               │
│  Outstanding                $100.00    ⚠ 62 days overdue             │
│                                                                       │
│  Payments                                                             │
│  No payments recorded.                                                │
└─────────────────────────────────────────────────────────────────────┘
```

**The record card header** is the signature element. Ruled 1px border, paper fill, student
code at 20px mono with wide tracking, name at 20px Inter Tight. Status and balance stamps
sit top-right, aligned to each other. It should feel like the top of an index card.

**Tabs:**

- **Fees** — the fee, payments ledger (date · reference · amount · status), and a running
  outstanding line. Reversed payments show struck-through with a `REVERSED` tag; they are
  never removed.
- **Submissions** — every attempt across every assessment, newest first, with late flags
  and a download link per file. Show `Attempt 2 of 2` where resubmission happened.
- **Results** — grade, classification, and publication state per assessment, with the
  publish/withhold control inline.
- **History** — the status change log, plain dated list. Low visual priority, high
  credibility.

**Record payment dialog:** amount, date, reference number. Show the outstanding balance
above the amount field and update a live "remaining after this payment" line as they
type. Block amounts above outstanding with an inline message rather than a toast.

### 4.5 Assessments — list

```
┌─────────────────────────────────────────────────────────────────────┐
│  Assessments                                  [ + New assessment ]   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ TITLE            MODULE   DEADLINE       SUBMITTED  MARKED    │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Midterm Report   CSE-201  11 Mar, 17:00    18/20     18/20 ✓  │   │
│  │ Case Study 1     BBA-110  20 Mar, 23:59    12/15      0/15    │   │
│  │                           in 6 days                            │   │
│  │ Final Project    CSE-201  02 Apr, 17:00     0/20      0/20    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

Deadline column carries a second line of relative time — *"in 6 days"*, *"closed 3 days
ago"* — because absolute dates alone don't tell you what's urgent. Ratios in mono so they
align. A closed assessment with unmarked work gets an amber marker.

### 4.6 Assessment detail — the marking screen

The busiest screen. Submission queue and grade entry are the same view; making the admin
navigate between them would be a design failure.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Midterm Report                                        [ Edit ]      │
│  CSE-201 Data Structures · Deadline 11 Mar 2026, 17:00 · closed      │
│                                                                       │
│  18 submitted · 2 missing · 3 late · 18 marked · 12 published        │
│                                                                       │
│  [ All ] [ Late ] [ Missing ] [ Unmarked ] [ Withheld ]              │
│                                    [ Publish all marked ]            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STUDENT              SUBMITTED       FILE    GRADE   RESULT   │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ SMS-2025-0001        10 Mar 14:22    ⬇ pdf   [ 78 ]  Published│   │
│  │ Aisha Rahman                                  Distinction     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ SMS-2025-0004    ⚠  13 Mar 09:10     ⬇ docx  [ 55 ]  Draft    │   │
│  │ Rafi Hasan          2 days 16h late   att. 2  Pass    [Publish]│   │
│  │                     ⚠ $100.00 overdue                          │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ SMS-2025-0009        Not submitted    —      [ 0  ]  Withheld  │   │
│  │ Sadia Islam                                   Fail    ⓘ reason │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Design notes**

- Grade is an **inline editable input** in the row. Type a number, blur or press Enter,
  it saves, the classification below updates immediately. No modal, no separate edit mode.
  Marking 20 students should be twenty keystroke sequences, not twenty dialogs.
- Classification renders as small muted text under the grade — computed, never entered.
- **The overdue warning inside the row** is the highest-value detail in the whole design.
  Before publishing a result, the admin sees that this student is in fee arrears. Real
  registries withhold results for arrears; surfacing it here without being asked is the
  clearest possible signal of stakeholder understanding.
- `Publish all marked` opens a confirm that names the count and **lists any students with
  overdue balances** as a warning, with a checkbox to exclude them.
- Withheld rows show a reason on hover or via an info icon.
- Filter chips at the top are the fast path to the three admin questions.
- Missing submissions still appear as rows. A student who didn't submit is exactly who
  the admin is looking for.

### 4.7 Programmes

Simple. Card or table listing code, name, fee, due window, module count, enrolled count.
Editing a fee shows a warning: *"Changing this fee affects new students only. 42 existing
students keep their current fee."* That one sentence demonstrates you understood why the
fee is snapshotted.

### 4.8 Payments — ledger

All payments across all students, newest first: date · student · reference · amount ·
status. Searchable by reference. This is the screen a finance-adjacent registry person
asks for, and it costs almost nothing once payments exist.

---

## 5. Student screens

Different rhythm entirely. Single column, 680px max, 16px body, generous vertical space.
A student opens this to answer one question and leave.

**Design at 1440px. Mobile is out of scope for this build** — Tailwind's defaults will
keep it usable on a narrow screen without deliberate work, and the reviewer will open it
on a laptop. Don't spend time on breakpoint-specific layouts; note it in the README as a
scope decision rather than leaving it unsaid.

### 5.1 Overview

```
┌───────────────────────────────────────────┐
│  Aisha Rahman                              │
│  SMS-2025-0001 · Computer Science · Year 1 │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Fees                                  │ │
│  │  $100.00 paid of $100.00               │ │
│  │  ████████████████████████  Paid in full│ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  ⚠  Payment overdue                    │ │
│  │  $100.00 was due 11 February 2026      │ │
│  │  62 days ago. Contact the Registry     │ │
│  │  office to arrange payment.            │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Due next                                   │
│  Case Study 1 · BBA-110                     │
│  Due in 6 days · not yet submitted          │
│  [ Submit work ]                            │
│                                             │
│  Recent results                             │
│  Midterm Report      78   Distinction       │
│  Final Project       —    Not published     │
└───────────────────────────────────────────┘
```

The overdue notice is a bordered alert block, not a toast — it must persist. Copy is
factual and gives a next action. It never scolds.

### 5.2 Assessments

One card per assessment, ordered by deadline. Four possible states, each visually distinct:

| State | Treatment |
|---|---|
| **Open, not submitted** | Ink border, countdown *"Due in 6 days"*, prominent upload area |
| **Open, submitted** | Green check, filename, submitted time, `Replace submission` as a quieter secondary action, plus *"You can replace this until 20 March, 23:59"* |
| **Closed, submitted late** | Red flag, *"Submitted 2 days 16 hours after the deadline"*, no replace option |
| **Closed, not submitted** | Muted, *"Deadline passed. Contact your module leader."* Upload disabled, and the reason stated |

Upload zone: drag-and-drop plus a file button, accepted types and 10MB cap stated **up
front**, not discovered on failure. During upload, a progress bar. On rejection, an inline
message naming the actual problem: *"That file is 14MB. The limit is 10MB."*

### 5.3 Marksheet

```
┌───────────────────────────────────────────┐
│  Marksheet                                 │
│  Aisha Rahman · SMS-2025-0001              │
│                                             │
│  Published results                          │
│  ┌───────────────────────────────────────┐ │
│  │ Midterm Report      CSE-201            │ │
│  │ 78          Distinction                │ │
│  │ Published 14 March 2026                │ │
│  ├───────────────────────────────────────┤ │
│  │ Case Study 1        BBA-110            │ │
│  │ 55          Pass                       │ │
│  │ Published 22 March 2026                │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Average          66.5      Merit           │
│  Across 2 published results                 │
│                                             │
│  Not yet available                          │
│  ┌───────────────────────────────────────┐ │
│  │ Final Project       CSE-201            │ │
│  │ Result withheld                        │ │
│  │ Outstanding balance on your account.   │ │
│  │ Contact the Registry office.           │ │
│  └───────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

**The critical distinction:** unmarked work simply isn't listed. Withheld work **is**
listed, in a separate section, with the reason. A student must be able to tell "not marked
yet" from "marked but held back" — that difference is the entire point of the withhold
feature, and most implementations blur it.

Grade at 28px mono, classification beside it as a pill. Average computed across published
results only, with the count stated so the number can't mislead.

---

## 6. Cross-cutting states

Design these once, use everywhere. A reviewer clicking around finds empty and error states
faster than happy paths.

**Loading** — skeleton rows matching the real table's column widths and row height. Never
a centred spinner; the layout shouldn't jump when data lands.

**Empty** — a one-line statement of fact plus one action. Write the copy per screen; a
generic "No data" is a wasted opportunity. Examples: *"No students yet. Add your first
student to get started."* / *"No payments recorded against this fee."*

**Error** — state what failed and offer retry: *"Couldn't load students. Retry."* Errors
don't apologise and are never vague.

**Toast** — bottom-right on staff, bottom-centre on student. Ink background for success,
alert border for failure. The verb matches the button: `Publish` produces *"Result
published."*

**Confirm dialog** — required for: publishing results, recording a payment, changing
enrolment status, replacing a submission. Title states the action, body states the
consequence, primary button repeats the verb. Destructive actions use the alert colour
for the button, and only there.

**Form errors** — inline under the field, red, specific. Disable submit while pending and
change the label to the in-progress verb (`Saving…`).

---

## 7. Screen inventory

| # | Screen | Viewer | Priority |
|---|---|---|---|
| 1 | Demo banner + shell | Both | Must |
| 2 | Dashboard | Staff | Must |
| 3 | Students list | Staff | Must |
| 4 | Add / edit student | Staff | Must |
| 5 | Student detail — Fees tab | Staff | Must |
| 6 | Record payment dialog | Staff | Must |
| 7 | Assessments list | Staff | Must |
| 8 | Assessment detail — marking | Staff | Must |
| 9 | Student overview | Student | Must |
| 10 | Student assessments + upload | Student | Must |
| 11 | Student marksheet | Student | Must |
| 12 | Student detail — Submissions / Results / History tabs | Staff | Should |
| 13 | Programmes | Staff | Should |
| 14 | Payments ledger | Staff | Could |

If the clock runs out, cut 13 and 14 and merge 12 into the Fees tab. Never cut 8 or 11 —
between them they carry the marking, publishing, and withholding logic that the rubric
names directly.

---

## 8. Design in this order

1. Tokens and the primitive set — button, input, select, pill, table, card, dialog, toast
2. Shell + demo banner (everything else sits inside it)
3. Students list (establishes the table pattern all staff screens reuse)
4. Student detail record card (establishes the header pattern)
5. Assessment detail marking view (the hardest screen; do it while fresh)
6. Student overview and marksheet (a different rhythm — switch context deliberately)
7. Dashboard last, assembled from patterns already built

Building the dashboard first is the common mistake. It's a composite of everything else,
so it's cheapest and most consistent once the other patterns exist.
