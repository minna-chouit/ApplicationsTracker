import type { ReactNode } from 'react'
import plan from '../data/plan.json'
import { EST_TIP, daysBetween, fmt, type Task } from './logic'
import { useStore } from './store'

export const Est = () => <span className="est" title={EST_TIP} tabIndex={0}>estimated</span>

export function Header({ title, sub }: { title: string; sub?: ReactNode }) {
  return <header className="page-head"><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</header>
}

export function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: pct + '%' }} /></div>
      <span className="num">{value}/{max}</span>
    </div>
  )
}

/** Big countdown number for ticket stubs. */
export function Count({ today, date }: { today: string; date: string }) {
  const n = daysBetween(today, date), a = Math.abs(n)
  return <div className="stub-count">{n === 0 ? <b>today</b> : <><b>{a}</b><span>{a === 1 ? 'day' : 'days'}{n < 0 && ' ago'}</span></>}</div>
}

/** The crossing: Algiers on the left, Italy on the right, a boat for time elapsed, a wake for tasks done. */
export function Route({ done, total }: { done: number; total: number }) {
  const { today } = useStore()
  const span = daysBetween(plan.start, plan.end)
  const t = Math.max(0, Math.min(1, daysBetween(plan.start, today) / span))
  const d = total ? done / total : 0
  const x0 = 14, x1 = 306, y = 34
  const at = (f: number) => x0 + (x1 - x0) * f
  return (
    <figure className="route">
      <svg viewBox="0 0 320 60" role="img" aria-label={`${Math.round(t * 100)}% of the year gone, ${done} of ${total} tasks done`}>
        <path className="route-sea" d={`M${x0} ${y} H${x1}`} />
        <path className="route-done" d={`M${x0} ${y} H${at(d)}`} />
        <circle className="route-dz" cx={x0} cy={y} r="6" />
        <circle className="route-it" cx={x1} cy={y} r="6" />
        <g transform={`translate(${at(t)} ${y - 4})`} className="route-boat">
          <path d="M-7 0 H7 L4 5 H-4 Z" />
          <path d="M0 -1 V-14 L8 -2 Z" />
        </g>
        <text x={x0} y="56" textAnchor="start">Algiers</text>
        <text x={x1} y="56" textAnchor="end">Italy</text>
      </svg>
      <figcaption className="muted">{fmt(plan.start, { day: 'numeric', month: 'short', year: 'numeric' })} → {fmt(plan.end, { day: 'numeric', month: 'short', year: 'numeric' })}</figcaption>
    </figure>
  )
}

export function TaskRow({ t, full, isOverdue }: { t: Task; full?: boolean; isOverdue?: boolean }) {
  const { set } = useStore()
  const upd = (patch: object) => set(d => { d.tasks[t.id] = { ...d.tasks[t.id], ...patch } })
  const meta = (
    <span className="meta">
      <span className={`cat cat-${t.category}`}>{t.category}</span>
      {isOverdue && <span className="tag-overdue">overdue · {fmt(t.date)}</span>}
      {!isOverdue && full && <span>{fmt(t.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
      {t.estimated && <Est />}
    </span>
  )
  return (
    <li className={`task${t.done ? ' done' : ''}${isOverdue ? ' overdue' : ''}`}>
      <input type="checkbox" id={'c' + t.id} checked={t.done} onChange={e => upd({ done: e.target.checked })} />
      <div className="task-body">
        {full ? (
          <details>
            <summary><span className="task-title">{t.title}</span>{meta}</summary>
            {t.details && <p className="details">{t.details}</p>}
            <div className="task-edit">
              <label>Date <input type="date" value={t.date} onChange={e => e.target.value && upd({ date: e.target.value })} /></label>
              {t.date !== t.seedDate && <small className="muted">planned {fmt(t.seedDate)} <button className="link" onClick={() => upd({ date: undefined })}>reset</button></small>}
              <label className="grow">Notes <textarea rows={2} value={t.note} onChange={e => upd({ note: e.target.value })} /></label>
              {t.custom && <button className="link danger" onClick={() => set(d => { d.custom = d.custom.filter(c => c.id !== t.id); delete d.tasks[t.id] })}>Delete task</button>}
            </div>
          </details>
        ) : (
          <label htmlFor={'c' + t.id}><span className="task-title">{t.title}</span>{meta}</label>
        )}
      </div>
    </li>
  )
}

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => <section className={'card ' + className}>{children}</section>
