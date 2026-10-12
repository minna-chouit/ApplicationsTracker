# Italy Plan Tracker – Spec

## Who it's for
One user: a 4th-year AI engineering student at ENSIA (Algiers) applying for a September 2027 master's in Italy. English UI. Uses it daily on a phone, sometimes on a laptop.

## Calendar conventions
- Weeks start on **Sunday** and end on **Saturday** (Algerian week: classes Sun–Thu, weekend Fri–Sat).
- Timezone: Africa/Algiers.
- Plan runs from 2026-10-11 to 2027-09-30.

## Screens

### 1. Today (home)
- Today's date and "week N of the plan".
- Today's tasks (tasks whose `date` is today) plus overdue unchecked tasks, overdue shown first and marked clearly.
- Today's habits as a checklist (from `habits.json`, filtered by `days` and active `phase`).
- The next 3 deadlines with a day countdown. Estimated deadlines labelled "estimated".
- Today's IELTS session from `ielts_plan.json` (while the IELTS phase is active).

### 2. Plan (timeline)
- All tasks grouped by week (`week` field), current week expanded, others collapsed.
- Filter by category: applications, documents, ensia, ielts, driving, scholarships, visa, family, admin.
- Each task: checkbox, title, optional details (expandable), notes field, editable date.
- Add my own tasks.
- Progress bar per category and overall.

### 3. Habits
- Grid of the last 4 weeks per habit (checked/unchecked), current streak, best streak.
- Habits have an active date range (`from`/`to`); hide inactive ones.

### 4. Deadlines
- Sorted list with countdowns. Toggle "estimated" → "confirmed" and edit the date when I confirm it on an official site. Store a `source` URL per deadline.

### 5. Documents
- Each document moves through a pipeline: `needed → requested → received → translated → legalized → scanned`. Only show stages listed in that document's `stages` array.
- Note field per document (e.g. translator name, price paid).

### 6. Universities
- One card per programme: eligibility reply (`unknown / yes / no / conditional`), application status (`not started / in progress / submitted / admitted / rejected / waitlisted`), fee, call dates, links, notes.

### 7. IELTS
- The 4-week plan from `ielts_plan.json`.
- Log mock test scores (listening, reading, writing, speaking, overall) with date; small line chart of overall band over time; target line at 6.5.

### 8. Driving
- Stages from `driving_plan.json` with status and dates.
- Lesson log: date, minutes, what I practised. Show total hours vs the 30h mandatory and vs the 45h "realistic beginner" target.

### 9. Templates
- Show `templates/*.md` rendered, with a copy-to-clipboard button for the email body.

### 10. Settings
- Export all progress as JSON; import JSON; reset (with confirmation).

## Data model (seed files in `data/`)
- `plan.json` – `{ phases[], tasks[] }`. Task: `id, week, date (YYYY-MM-DD), title, details?, category, estimated?, dependsOn?[]`.
- `habits.json` – habit: `id, title, details?, frequency ("daily" | "weekly"), days (0=Sun..6=Sat), minutes?, from, to`.
- `deadlines.json` – `id, title, date, estimated, source?, notes?`.
- `documents.json` – `id, title, details?, stages[], neededFor[]`.
- `universities.json` – programme cards.
- `ielts_plan.json` – `weeks[]`, each with `days[]` (day index, focus, tasks).
- `driving_plan.json` – `stages[]`, `hourTargets`, `notes`.

User state lives separately in localStorage (`italyTracker.v1`), keyed by ids. Never overwrite user state when seed data changes; new seed items just appear.

## Behaviour details
- "Overdue" = unchecked task with date before today.
- Moving a task's date is allowed; keep the original seed date visible in small text.
- Estimated items show a subtle marker and a tooltip "Estimated from last year's dates – check the official site."
- Works offline (PWA). Fast on a mid-range Android phone.

## Design constraints
- Mobile-first, readable at 360px width, dark and light themes following the system setting.
- Accessible: keyboard focus visible, good contrast, respects reduced motion.
- The subject is a year-long move from Algiers to an Italian university. Let that inform a distinctive visual identity rather than a generic dashboard look. Propose the design before building.
- Keep copy plain and short, sentence case.
