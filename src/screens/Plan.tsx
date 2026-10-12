import { useState, type FormEvent } from 'react'
import plan from '../../data/plan.json'
import { CATEGORIES, addDays, fmt, planWeek, tasks, uid, weekStart } from '../logic'
import { useStore } from '../store'
import { Bar, Card, Header, Route, TaskRow } from '../ui'

export function Plan() {
  const { s, set, today } = useStore()
  const [cat, setCat] = useState('')
  const all = tasks(s)
  const shown = all.filter(t => !cat || t.category === cat).sort((a, b) => a.date.localeCompare(b.date))
  const weeks = [...new Set(shown.map(t => t.week))].sort((a, b) => a - b)
  const cur = planWeek(today)

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const title = String(f.get('title')).trim()
    if (!title) return
    set(d => { d.custom.push({ id: uid('u'), title, date: String(f.get('date')), category: String(f.get('category')) }) })
    e.currentTarget.reset()
  }

  return (
    <>
      <Header title="Plan" sub={`${all.filter(t => t.done).length} of ${all.length} tasks done`} />
      <Route done={all.filter(t => t.done).length} total={all.length} />

      <Card>
        <h2>Progress</h2>
        <Bar label="Overall" value={all.filter(t => t.done).length} max={all.length} />
        {CATEGORIES.map(c => {
          const ts = all.filter(t => t.category === c)
          return ts.length > 0 && <Bar key={c} label={c} value={ts.filter(t => t.done).length} max={ts.length} />
        })}
      </Card>

      <div className="chips" role="group" aria-label="Filter by category">
        {['', ...CATEGORIES].map(c => (
          <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c || 'all'}</button>
        ))}
      </div>

      {weeks.map(w => {
        const ts = shown.filter(t => t.week === w)
        const from = addDays(weekStart(plan.start), (w - 1) * 7)
        return (
          <details key={w} className={`week${w === cur ? ' current' : ''}${w < cur ? ' past' : ''}`} open={w === cur || undefined}>
            <summary>
              <span className="week-n">Week {w}</span>
              <span className="muted">{fmt(from)} – {fmt(addDays(from, 6))}</span>
              <span className="num">{ts.filter(t => t.done).length}/{ts.length}</span>
            </summary>
            <ul className="tasks">{ts.map(t => <TaskRow key={t.id} t={t} full isOverdue={!t.done && t.date < today} />)}</ul>
          </details>
        )
      })}

      <Card>
        <h2>Add a task</h2>
        <form className="form" onSubmit={add}>
          <label className="grow">Title <input name="title" required /></label>
          <label>Date <input name="date" type="date" required defaultValue={today} /></label>
          <label>Category <select name="category" defaultValue={cat || 'admin'}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
          <button className="btn">Add</button>
        </form>
      </Card>
    </>
  )
}
