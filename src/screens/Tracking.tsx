import docsSeed from '../../data/documents.json'
import unisSeed from '../../data/universities.json'
import { EST_TIP, addDays, deadlines, fmt, habitActive, habits, streaks, weekStart, weekday } from '../logic'
import { useStore } from '../store'
import { Card, Count, Est, Header } from '../ui'

// ---------- Habits ----------
export function Habits() {
  const { s, set, today } = useStore()
  const start = addDays(weekStart(today), -21) // 4 weeks, Sunday first, ending this Saturday
  const days = Array.from({ length: 28 }, (_, i) => addDays(start, i))
  const active = habits.filter(h => habitActive(h, today))

  const toggle = (id: string, d: string) => set(st => {
    const list = st.habits[id] ?? []
    st.habits[id] = list.includes(d) ? list.filter(x => x !== d) : [...list, d]
  })

  return (
    <>
      <Header title="Habits" sub="Last 4 weeks. Tap a past day to fix it." />
      {active.length === 0 && <p className="muted">No habits active right now.</p>}
      {active.map(h => {
        const done = s.habits[h.id] ?? []
        const { current, best } = streaks(h, done, today)
        return (
          <Card key={h.id}>
            <div className="habit-head">
              <h2>{h.title}</h2>
              <div className="streaks"><span><b>{current}</b> streak</span><span><b>{best}</b> best</span></div>
            </div>
            <p className="muted small">{h.minutes ? `${h.minutes} min · ` : ''}until {fmt(h.to)}{h.details ? ` · ${h.details}` : ''}</p>
            <div className="grid" role="group" aria-label={`${h.title}, last 4 weeks`}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => <span key={i} className="grid-l" aria-hidden>{l}</span>)}
              {days.map(d => {
                const sched = h.days.includes(weekday(d)) && habitActive(h, d)
                const on = done.includes(d)
                const future = d > today
                return (
                  <button key={d} className={`cell${on ? ' on' : ''}${sched ? '' : ' off'}${d === today ? ' now' : ''}`}
                    disabled={!sched || future} aria-pressed={on}
                    aria-label={`${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}${sched ? (on ? ', done' : ', not done') : ', not scheduled'}`}
                    onClick={() => toggle(h.id, d)} />
                )
              })}
            </div>
          </Card>
        )
      })}
    </>
  )
}

// ---------- Deadlines ----------
export function Deadlines() {
  const { s, set, today } = useStore()
  const upd = (id: string, patch: object) => set(d => { d.deadlines[id] = { ...d.deadlines[id], ...patch } })
  return (
    <>
      <Header title="Deadlines" sub={<>Estimated dates come from last year's calendars. Confirm each on the official site.</>} />
      <ul className="stubs">
        {deadlines(s).map(d => (
          <li key={d.id} className={`stub card${d.date < today ? ' past' : ''}`}>
            <Count today={today} date={d.date} />
            <div className="stub-main">
              <div className="stub-title">{d.title}</div>
              <div className="meta">
                <span>{fmt(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {d.estimated ? <Est /> : <span className="ok">confirmed</span>}
                {d.date !== d.seedDate && <span>was {fmt(d.seedDate)}</span>}
              </div>
              {d.notes && <p className="small">{d.notes}</p>}
              <details className="edit">
                <summary>Edit</summary>
                <div className="form">
                  <label>Date <input type="date" value={d.date} onChange={e => e.target.value && upd(d.id, { date: e.target.value, base: d.seedDate })} /></label>
                  <label className="check"><input type="checkbox" checked={!d.estimated} onChange={e => upd(d.id, { estimated: !e.target.checked })} /> Confirmed</label>
                  <label className="grow">Source <input type="url" placeholder="https://" value={d.source ?? ''} onChange={e => upd(d.id, { source: e.target.value })} /></label>
                </div>
              </details>
              {d.source && <a className="small" href={d.source} target="_blank" rel="noreferrer">Official page ↗</a>}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

// ---------- Documents ----------
export function Documents() {
  const { s, set } = useStore()
  const upd = (id: string, patch: object) => set(d => { d.docs[id] = { ...d.docs[id], ...patch } })
  const docs = docsSeed.documents
  const ready = docs.filter(d => s.docs[d.id]?.stage === d.stages.at(-1)).length
  return (
    <>
      <Header title="Documents" sub={`${ready} of ${docs.length} ready. Most ENSIA papers come in Arabic, so plan for official translation.`} />
      {docs.map(doc => {
        const cur = s.docs[doc.id]?.stage ?? doc.stages[0]
        const idx = doc.stages.indexOf(cur)
        return (
          <Card key={doc.id}>
            <h2>{doc.title}</h2>
            <p className="meta">{doc.neededFor.map(n => <span key={n} className="cat">{n}</span>)}</p>
            {doc.details && <p className="small muted">{doc.details}</p>}
            <div className="stamps" role="group" aria-label="Stage">
              {doc.stages.map((st, i) => (
                <button key={st} className={`stamp${i <= idx ? ' inked' : ''}${i === idx ? ' cur' : ''}`} aria-pressed={i === idx} onClick={() => upd(doc.id, { stage: st })}>{st}</button>
              ))}
            </div>
            <label className="block">Note <input placeholder="Translator, price paid…" value={s.docs[doc.id]?.note ?? ''} onChange={e => upd(doc.id, { note: e.target.value })} /></label>
          </Card>
        )
      })}
    </>
  )
}

// ---------- Universities ----------
const ELIG = ['unknown', 'yes', 'no', 'conditional']
const STATUS = ['not started', 'in progress', 'submitted', 'admitted', 'rejected', 'waitlisted']

export function Universities() {
  const { s, set } = useStore()
  const unis = [...unisSeed.universities].sort((a, b) => a.priority - b.priority)
  return (
    <>
      <Header title="Universities" sub="Key risk: whether ENSIA's two preparatory years count. Get it confirmed in writing." />
      {unis.map(u => {
        const st = s.unis[u.id] ?? {}
        const elig = st.eligibility ?? 'unknown'
        return (
          <Card key={u.id}>
            <div className="habit-head">
              <h2>{u.name}</h2>
              <span className={`elig elig-${elig}`}>{elig === 'unknown' ? 'eligibility ?' : `eligible: ${elig}`}</span>
            </div>
            <p className="meta"><span>{u.city}</span><span>priority {u.priority}</span>{u.fee && <span>fee {u.fee}</span>}</p>
            <p className="small"><b>Calls:</b> {u.calls} {/estimated|past pattern/.test(u.calls) && <span className="est" title={EST_TIP} tabIndex={0}>estimated</span>}</p>
            {u.notes && <p className="small muted">{u.notes}</p>}
            <div className="form">
              <label>Eligibility reply
                <select value={elig} onChange={e => set(d => { d.unis[u.id] = { ...d.unis[u.id], eligibility: e.target.value } })}>{ELIG.map(x => <option key={x}>{x}</option>)}</select>
              </label>
            </div>
            <ul className="programmes">
              {u.programmes.map(p => (
                <li key={p}>
                  <span>{p}</span>
                  <select aria-label={`${p} status`} value={st.status?.[p] ?? 'not started'} onChange={e => set(d => { const x = (d.unis[u.id] ??= {}); x.status = { ...x.status, [p]: e.target.value } })}>
                    {STATUS.map(x => <option key={x}>{x}</option>)}
                  </select>
                </li>
              ))}
            </ul>
            <label className="block">Notes <textarea rows={2} value={st.notes ?? ''} onChange={e => set(d => { d.unis[u.id] = { ...d.unis[u.id], notes: e.target.value } })} /></label>
            {u.link && <a className="small" href={u.link} target="_blank" rel="noreferrer">Admissions page ↗</a>}
          </Card>
        )
      })}
    </>
  )
}
