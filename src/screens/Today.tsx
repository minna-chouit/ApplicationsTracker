import plan from '../../data/plan.json'
import ielts from '../../data/ielts_plan.json'
import { fmt, habitsOn, ieltsSession, nextDeadlines, overdue, planWeek, tasks } from '../logic'
import { useStore } from '../store'
import { Card, Est, Route, TaskRow, Count } from '../ui'

export function Today() {
  const { s, set, today } = useStore()
  const all = tasks(s)
  const late = overdue(all, today)
  const todays = all.filter(t => t.date === today)
  const hs = habitsOn(today)
  const next = nextDeadlines(s, today, 3)
  const session = ieltsSession(today)
  const phases = plan.phases.filter(p => p.from <= today && today <= p.to).map(p => p.title)
  const week = planWeek(today)

  const toggleHabit = (id: string, on: boolean) => set(d => {
    const list = (d.habits[id] ??= []).filter(x => x !== today)
    d.habits[id] = on ? [...list, today] : list
  })

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{fmt(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <h1>{week < 1 ? 'Not started yet' : week > planWeek(plan.end) ? 'Arrived' : `Week ${week} of the plan`}</h1>
        {phases.length > 0 && <p className="muted">{phases.join(' + ')}</p>}
      </header>
      <Route done={all.filter(t => t.done).length} total={all.length} />

      <Card>
        <h2>Tasks</h2>
        {late.length + todays.length === 0 ? <p className="muted">Nothing due today.</p> : (
          <ul className="tasks">
            {late.map(t => <TaskRow key={t.id} t={t} isOverdue />)}
            {todays.map(t => <TaskRow key={t.id} t={t} />)}
          </ul>
        )}
      </Card>

      {hs.length > 0 && (
        <Card>
          <h2>Habits</h2>
          <ul className="tasks">
            {hs.map(h => {
              const on = (s.habits[h.id] ?? []).includes(today)
              return (
                <li key={h.id} className={`task${on ? ' done' : ''}`}>
                  <input type="checkbox" id={'h' + h.id} checked={on} onChange={e => toggleHabit(h.id, e.target.checked)} />
                  <label htmlFor={'h' + h.id} className="task-body">
                    <span className="task-title">{h.title}</span>
                    <span className="meta">{h.minutes && <span>{h.minutes} min</span>}{h.details && <span>{h.details}</span>}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {session && (
        <Card className="accent">
          <h2>IELTS · week {session.week}</h2>
          <p><strong>{session.focus}.</strong> {session.tasks}</p>
          <p className="muted small">{ielts.dailyCore}</p>
        </Card>
      )}

      <Card>
        <h2>Next deadlines</h2>
        <ul className="stubs">
          {next.map(d => (
            <li key={d.id} className="stub">
              <Count today={today} date={d.date} />
              <div><div className="stub-title">{d.title}</div><div className="meta"><span>{fmt(d.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>{d.estimated && <Est />}</div></div>
            </li>
          ))}
        </ul>
        <a href="#/deadlines" className="more">All deadlines →</a>
      </Card>
    </>
  )
}
