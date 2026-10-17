import plan from '../data/plan.json'
import habitsSeed from '../data/habits.json'
import deadlinesSeed from '../data/deadlines.json'
import ielts from '../data/ielts_plan.json'

// ---------- types ----------
export type SeedTask = { id: string; week?: number; date: string; title: string; details?: string; category: string; estimated?: boolean; dependsOn?: string[] }
export type Task = SeedTask & { week: number; seedDate: string; done: boolean; note: string; custom: boolean }
export type Habit = { id: string; title: string; details?: string; frequency: string; days: number[]; minutes?: number; from: string; to: string }
export type Score = { id: string; date: string; l?: number; r?: number; w?: number; s?: number; overall?: number; note?: string }
export type Lesson = { id: string; date: string; minutes: number; what: string }

export type State = {
  tasks: Record<string, { done?: boolean; note?: string; date?: string }>
  custom: SeedTask[]
  habits: Record<string, string[]> // habit id -> checked dates
  deadlines: Record<string, { date?: string; estimated?: boolean; source?: string }>
  docs: Record<string, { stage?: string; note?: string }>
  unis: Record<string, { eligibility?: string; status?: Record<string, string>; notes?: string }>
  ielts: Score[]
  driving: { stages: Record<string, { status?: string; date?: string }>; lessons: Lesson[] }
}

export const KEY = 'italyTracker.v1'
export const EST_TIP = "Estimated from last year's dates – check the official site."
export const CATEGORIES = ['applications', 'documents', 'ensia', 'ielts', 'driving', 'scholarships', 'visa', 'family', 'admin']

export const empty = (): State => ({ tasks: {}, custom: [], habits: {}, deadlines: {}, docs: {}, unis: {}, ielts: [], driving: { stages: {}, lessons: [] } })

/** Validates data from localStorage or an import file and fills in missing parts. */
export function mergeState(raw: unknown): State {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Not a tracker backup')
  const r = raw as Partial<State>
  const e = empty()
  return { ...e, ...r, driving: { ...e.driving, ...(r.driving ?? {}) } }
}

// ---------- dates (all as YYYY-MM-DD strings, computed in UTC so no DST surprises) ----------
export const todayIn = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(now)
const ms = (d: string) => Date.parse(d + 'T00:00:00Z')
export const addDays = (d: string, n: number) => new Date(ms(d) + n * 864e5).toISOString().slice(0, 10)
export const daysBetween = (from: string, to: string) => Math.round((ms(to) - ms(from)) / 864e5)
export const weekday = (d: string) => new Date(ms(d)).getUTCDay() // 0 = Sunday
export const weekStart = (d: string) => addDays(d, -weekday(d)) // weeks run Sun–Sat
export const planWeek = (d: string) => Math.floor(daysBetween(weekStart(plan.start), d) / 7) + 1
export const fmt = (d: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(ms(d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' })

// ---------- tasks ----------
export function tasks(s: State): Task[] {
  const all = [...(plan.tasks as SeedTask[]).map(t => ({ ...t, custom: false })), ...s.custom.map(t => ({ ...t, custom: true }))]
  return all.map(t => {
    const u = s.tasks[t.id] ?? {}
    const date = u.date || t.date
    // keep the seed week unless the date was moved
    const week = date === t.date && t.week ? t.week : planWeek(date)
    return { ...t, date, week, seedDate: t.date, done: !!u.done, note: u.note ?? '' }
  })
}
export const overdue = (ts: Task[], today: string) => ts.filter(t => !t.done && t.date < today).sort((a, b) => a.date.localeCompare(b.date))

// ---------- habits ----------
export const habits = habitsSeed.habits as Habit[]
export const habitActive = (h: Habit, d: string) => h.from <= d && d <= h.to
export const habitsOn = (d: string) => habits.filter(h => habitActive(h, d) && h.days.includes(weekday(d)))

/** Streaks count scheduled days only. An unchecked today doesn't break the streak yet. */
export function streaks(h: Habit, checked: string[], today: string) {
  const set = new Set(checked)
  let run = 0, best = 0
  const end = today < h.to ? today : h.to
  for (let d = h.from; d <= end; d = addDays(d, 1)) {
    if (!h.days.includes(weekday(d))) continue
    if (set.has(d)) best = Math.max(best, ++run)
    else if (d !== today) run = 0
  }
  return { current: run, best }
}

// ---------- deadlines ----------
export type Deadline = { id: string; title: string; date: string; estimated: boolean; source?: string; notes?: string; seedDate: string }
export function deadlines(s: State): Deadline[] {
  return deadlinesSeed.deadlines
    .map(d => {
      const u = s.deadlines[d.id] ?? {}
      return { ...d, seedDate: d.date, date: u.date || d.date, estimated: u.estimated ?? d.estimated, source: u.source ?? d.source }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}
export const nextDeadlines = (s: State, today: string, n: number) => deadlines(s).filter(d => d.date >= today).slice(0, n)

// ---------- IELTS ----------
export function ieltsSession(d: string) {
  const w = ielts.weeks.find(w => w.from <= d && d < addDays(w.from, 7))
  const day = w?.days.find(x => x.day === weekday(d))
  return w && day ? { week: w.week, goal: w.goal, ...day } : undefined
}

/** "6,5" or "6.5" → 6.5; empty → undefined; anything that isn't a 0–9 half band → null. */
export function parseBand(raw: unknown): number | undefined | null {
  const t = String(raw ?? '').trim().replace(',', '.')
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 && n <= 9 && Number.isInteger(n * 2) ? n : null
}
// IELTS overall = mean of the four skills, rounded to the nearest half band (.25 and .75 round up)
export const band = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 2) / 2

export const uid =(p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
