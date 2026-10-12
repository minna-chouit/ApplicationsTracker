import { describe, expect, it } from 'vitest'
import { addDays, empty, mergeState, planWeek, streaks, tasks, weekday, overdue, habitsOn, ieltsSession, nextDeadlines, todayIn } from './logic'
import plan from '../data/plan.json'

describe('dates', () => {
  it('plan starts on a Sunday, week 1', () => {
    expect(weekday('2026-10-11')).toBe(0)
    expect(planWeek('2026-10-11')).toBe(1)
    expect(planWeek('2026-10-17')).toBe(1) // Saturday closes the week
    expect(planWeek('2026-10-18')).toBe(2)
  })
  it('seed week numbers match their dates', () => {
    for (const t of plan.tasks) expect([t.id, planWeek(t.date)]).toEqual([t.id, t.week])
  })
  it('today uses Algiers time', () => {
    // 23:30 UTC on 10 Oct is 00:30 on 11 Oct in Algiers (UTC+1)
    expect(todayIn(new Date('2026-10-10T23:30:00Z'))).toBe('2026-10-11')
  })
})

describe('tasks', () => {
  it('user changes override the seed but keep the seed date visible', () => {
    const s = empty()
    s.tasks.t001 = { done: true, date: '2026-10-20', note: 'hi' }
    const t = tasks(s).find(t => t.id === 't001')!
    expect(t).toMatchObject({ done: true, date: '2026-10-20', seedDate: '2026-10-11', note: 'hi', week: 2 })
  })
  it('new seed items appear and unknown ids are kept harmlessly', () => {
    const s = empty()
    s.tasks.gone = { done: true }
    expect(tasks(s).length).toBe(plan.tasks.length)
  })
  it('custom tasks are included with a computed week', () => {
    const s = empty()
    s.custom.push({ id: 'u-1', date: '2026-10-25', title: 'Mine', category: 'admin' })
    expect(tasks(s).find(t => t.id === 'u-1')).toMatchObject({ week: 3, custom: true })
  })
  it('overdue = unchecked and before today', () => {
    const s = empty()
    s.tasks.t001 = { done: true }
    const ids = overdue(tasks(s), '2026-10-13').map(t => t.id)
    expect(ids).not.toContain('t001')
    expect(ids).toContain('t002')
    expect(ids.every(id => tasks(s).find(t => t.id === id)!.date < '2026-10-13')).toBe(true)
  })
})

describe('habits', () => {
  const h = { id: 'x', title: 'x', frequency: 'daily', days: [0, 1, 2, 3, 4], from: '2026-10-11', to: '2026-12-31' }
  it('streak skips unscheduled days and ignores an unchecked today', () => {
    // Sun 11 .. Thu 15 checked, Fri/Sat not scheduled, Sun 18 checked, Mon 19 = today unchecked
    const done = ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-18']
    expect(streaks(h, done, '2026-10-19')).toEqual({ current: 6, best: 6 })
  })
  it('a missed past day resets the current streak', () => {
    expect(streaks(h, ['2026-10-11', '2026-10-13'], '2026-10-15')).toEqual({ current: 0, best: 1 }) // 14th missed
  })
  it('only habits in range and on their days show', () => {
    expect(habitsOn('2026-10-16').map(h => h.id)).not.toContain('h08') // Friday
    expect(habitsOn('2026-10-11').map(h => h.id)).not.toContain('h01') // starts 18 Oct
  })
})

describe('other', () => {
  it('ielts session by week and weekday', () => {
    expect(ieltsSession('2026-10-18')?.focus).toBe('Writing Task 2')
    expect(ieltsSession('2026-10-17')).toBeUndefined()
    expect(ieltsSession(addDays('2026-11-08', 7))).toBeUndefined()
  })
  it('next deadlines use edited dates', () => {
    const s = empty()
    s.deadlines.dl02 = { date: '2027-01-01', estimated: false }
    const next = nextDeadlines(s, '2026-10-11', 3)
    expect(next.map(d => d.id)).toEqual(['dl01', 'dl02', 'dl03'])
    expect(next[1].estimated).toBe(false)
  })
  it('imported or stored data is merged onto defaults', () => {
    expect(mergeState({ ielts: [{ id: 'a' }] }).driving.lessons).toEqual([])
    expect(() => mergeState('nope')).toThrow()
  })
})
