import { Fragment, useRef, useState, type FormEvent, type ReactNode } from 'react'
import ielts from '../../data/ielts_plan.json'
import driving from '../../data/driving_plan.json'
import { KEY, addDays, band, deadlines, fmt, mergeState, parseBand, uid, weekday, type Score } from '../logic'
import { useStore } from '../store'
import { Bar, Card, Est, Header } from '../ui'

const SKILLS = { l: 'Listening', r: 'Reading', w: 'Writing', s: 'Speaking', overall: 'Overall' } as const

// ---------- IELTS ----------
export function Ielts() {
  const { s, set, today } = useStore()
  const test = deadlines(s).find(d => d.id === 'dl01')
  const scores = [...s.ielts].sort((a, b) => a.date.localeCompare(b.date))

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    // text inputs, so phones with a French/Arabic keyboard can type "6,5"
    const parsed = Object.fromEntries((Object.keys(SKILLS) as (keyof typeof SKILLS)[]).map(k => [k, parseBand(f.get(k))]))
    const bad = Object.entries(parsed).filter(([, v]) => v === null).map(([k]) => SKILLS[k as keyof typeof SKILLS])
    if (bad.length) return alert(`${bad.join(', ')}: use a band from 0 to 9 in steps of 0.5, like 6,5.`)
    const { l, r, w, s: sp, overall } = parsed as Record<keyof typeof SKILLS, number | undefined>
    const given = [l, r, w, sp].filter((x): x is number => x !== undefined)
    if (!given.length && overall === undefined) return alert('Enter at least one score.')
    const note = String(f.get('note') ?? '').trim()
    set(d => { d.ielts.push({ id: uid('s'), date: String(f.get('date')), l, r, w, s: sp, overall: overall ?? (given.length === 4 ? band(given) : undefined), ...(note && { note }) }) })
    e.currentTarget.reset()
  }

  return (
    <>
      <Header title="IELTS" sub={<>Target {ielts.target.overall} overall, at least {ielts.target.minEachSkill} in each skill. Test {test && fmt(test.date, { day: 'numeric', month: 'short' })} {test?.estimated && <Est />}</>} />

      <Card>
        <h2>Mock scores</h2>
        <Chart scores={scores.filter((x): x is Score & { overall: number } => x.overall !== undefined)} target={ielts.target.overall} />
        <form className="form" onSubmit={add}>
          <label>Date <input name="date" type="date" defaultValue={today} required /></label>
          {(Object.keys(SKILLS) as (keyof typeof SKILLS)[]).map(k => (
            <label key={k} className="narrow">{SKILLS[k]}<input name={k} type="text" inputMode="decimal" autoComplete="off" placeholder={k === 'overall' ? 'auto' : ''} /></label>
          ))}
          <label className="grow">Note <input name="note" placeholder="Quick, untimed…" /></label>
          <button className="btn">Log score</button>
        </form>
        <p className="muted small">Fill only the skills you tested. Overall is worked out when all four are in.</p>
        {scores.length > 0 && (
          <table className="table">
            <thead><tr><th>Date</th><th>L</th><th>R</th><th>W</th><th>S</th><th>All</th><th><span className="sr">Delete</span></th></tr></thead>
            <tbody>{[...scores].reverse().map(x => (
              <Fragment key={x.id}>
                <tr><td>{fmt(x.date)}</td><td>{x.l ?? '–'}</td><td>{x.r ?? '–'}</td><td>{x.w ?? '–'}</td><td>{x.s ?? '–'}</td><td><b>{x.overall ?? '–'}</b></td>
                  <td><button className="link danger" aria-label="Delete score" onClick={() => confirm('Delete this score?') && set(d => { d.ielts = d.ielts.filter(y => y.id !== x.id) })}>×</button></td></tr>
                {x.note && <tr className="note-row"><td colSpan={7}>{x.note}</td></tr>}
              </Fragment>
            ))}</tbody>
          </table>
        )}
      </Card>

      <Card><p className="small"><b>Every session:</b> {ielts.dailyCore.replace(/^Every session: /, '')}</p></Card>

      {ielts.weeks.map(w => {
        const now = w.from <= today && today < addDays(w.from, 7)
        return (
          <details key={w.week} className={`week${now ? ' current' : ''}`} open={now || undefined}>
            <summary><span className="week-n">Week {w.week}</span><span className="muted">{w.goal}</span></summary>
            <ul className="sessions">
              {w.days.map(d => (
                <li key={d.day} className={now && d.day === weekday(today) ? 'now' : ''}>
                  <span className="day">{fmt(addDays(w.from, d.day), { weekday: 'short', day: 'numeric' })}</span>
                  <span><b>{d.focus}.</b> {d.tasks}</span>
                </li>
              ))}
            </ul>
          </details>
        )
      })}

      <Card><h2>Materials</h2><ul className="plain">{ielts.materials.map(m => <li key={m}>{m}</li>)}</ul></Card>
    </>
  )
}

function Chart({ scores, target }: { scores: (Score & { overall: number })[]; target: number }) {
  if (scores.length === 0) return <p className="muted small">The chart shows overall bands. It appears once a test has all four skills or an overall score.</p>
  const W = 320, H = 140, pad = 24, lo = 4, hi = 9
  const x = (i: number) => pad + (scores.length === 1 ? (W - 2 * pad) / 2 : (i * (W - 2 * pad)) / (scores.length - 1))
  const y = (v: number) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad)
  const pts = scores.map((sc, i) => `${x(i)},${y(Math.max(lo, sc.overall))}`).join(' ')
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Overall band over time: ${scores.map(sc => sc.overall).join(', ')}. Target ${target}.`}>
      {[5, 6, 7, 8].map(v => <g key={v}><line className="gridline" x1={pad} x2={W - 8} y1={y(v)} y2={y(v)} /><text x={pad - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
      <line className="target" x1={pad} x2={W - 8} y1={y(target)} y2={y(target)} />
      <text className="target-l" x={W - 8} y={y(target) - 5} textAnchor="end">target {target}</text>
      <polyline className="line" points={pts} />
      {scores.map((sc, i) => <circle key={sc.id} className="dot" cx={x(i)} cy={y(Math.max(lo, sc.overall))} r="4" />)}
    </svg>
  )
}

// ---------- Driving ----------
const STAGE = ['not started', 'booked', 'in progress', 'done', 'retake']

export function Driving() {
  const { s, set, today } = useStore()
  const mins = s.driving.lessons.reduce((a, l) => a + l.minutes, 0)
  const hours = Math.round((mins / 60) * 10) / 10
  const t = driving.hourTargets

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const minutes = Number(f.get('minutes'))
    if (!(minutes > 0)) return
    set(d => { d.driving.lessons.push({ id: uid('l'), date: String(f.get('date')), minutes, what: String(f.get('what')) }) })
    e.currentTarget.reset()
  }

  return (
    <>
      <Header title="Driving" sub={`Package ~${driving.costEstimateDZD.package} DZD. ${driving.costEstimateDZD.extraHoursNote}.`} />
      <Card>
        <h2>Practice hours</h2>
        <p className="big-num">{hours}<span> h</span></p>
        <Bar label="Mandatory" value={hours} max={t.mandatoryPractice} />
        <Bar label="Beginner target" value={hours} max={t.realisticBeginner} />
        <form className="form" onSubmit={add}>
          <label>Date <input name="date" type="date" defaultValue={today} required /></label>
          <label className="narrow">Minutes <input name="minutes" type="number" min="5" step="5" defaultValue={60} inputMode="numeric" required /></label>
          <label className="grow">Practised <input name="what" placeholder="Parking, roundabouts…" /></label>
          <button className="btn">Log lesson</button>
        </form>
        {s.driving.lessons.length > 0 && (
          <ul className="plain lessons">
            {[...s.driving.lessons].sort((a, b) => b.date.localeCompare(a.date)).map(l => (
              <li key={l.id}><span className="day">{fmt(l.date)}</span><span>{l.minutes} min{l.what && ` · ${l.what}`}</span>
                <button className="link danger" aria-label="Delete lesson" onClick={() => confirm('Delete this lesson?') && set(d => { d.driving.lessons = d.driving.lessons.filter(x => x.id !== l.id) })}>×</button></li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2>Stages</h2>
        <ol className="stages">
          {driving.stages.map(st => {
            const u = s.driving.stages[st.id] ?? {}
            const upd = (p: object) => set(d => { d.driving.stages[st.id] = { ...d.driving.stages[st.id], ...p } })
            return (
              <li key={st.id} className={u.status === 'done' ? 'done' : ''}>
                <div className="stub-title">{st.title}</div>
                <div className="meta"><span>target {st.target.replace(/\d{4}-\d{2}-\d{2}/g, m => fmt(m))}</span>{st.estimated && <Est />}{st.retakeDelay && <span>retake after {st.retakeDelay}</span>}</div>
                {st.notes && <p className="small muted">{st.notes}</p>}
                <div className="form">
                  <label>Status <select value={u.status ?? 'not started'} onChange={e => upd({ status: e.target.value })}>{STAGE.map(x => <option key={x}>{x}</option>)}</select></label>
                  <label>Actual date <input type="date" value={u.date ?? ''} onChange={e => upd({ date: e.target.value })} /></label>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>

      <Card><h2>Notes</h2><ul className="plain">{driving.notes.map(n => <li key={n}>{n}</li>)}</ul></Card>
    </>
  )
}

// ---------- Templates ----------
const templates = import.meta.glob('../../templates/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Tiny markdown: "# heading", blank-line paragraphs, **bold**. Enough for the email templates. */
const inline = (t: string) => t.split(/\*\*(.+?)\*\*/).map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p))
const md = (src: string): ReactNode[] =>
  src.trim().split(/\n\s*\n/).map((b, i) =>
    b.startsWith('# ') ? <h2 key={i}>{b.slice(2)}</h2> : <p key={i}>{b.split('\n').flatMap((l, j) => (j ? [<br key={j} />, ...inline(l)] : inline(l)))}</p>)

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false)
  return <button className="btn" onClick={() => navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) }, () => alert('Copy failed. Select the text instead.'))}>{ok ? 'Copied' : label}</button>
}

export function Templates() {
  return (
    <>
      <Header title="Templates" />
      {Object.entries(templates).map(([path, src]) => {
        const subj = src.match(/^\*\*Subject:\*\*\s*(.+)$/m)
        const body = subj ? src.slice(src.indexOf(subj[0]) + subj[0].length).trim() : src
        return (
          <Card key={path} className="template">
            <div className="copy-row">{subj && <CopyBtn text={subj[1]} label="Copy subject" />}<CopyBtn text={body} label="Copy email body" /></div>
            {md(src)}
          </Card>
        )
      })}
    </>
  )
}

// ---------- Settings ----------
export function Settings() {
  const { s, replace } = useStore()
  const file = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }))
    a.download = `italy-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = async (f?: File) => {
    if (!f) return
    try {
      const next = mergeState(JSON.parse(await f.text()))
      if (confirm('Replace all current progress with this file?')) replace(next)
    } catch (e) { alert('Could not import: ' + (e as Error).message) }
    if (file.current) file.current.value = ''
  }

  return (
    <>
      <Header title="Settings" sub="Your progress lives only in this browser. Export it now and then." />
      <Card>
        <h2>Backup</h2>
        <div className="copy-row">
          <button className="btn" onClick={exportJson}>Export JSON</button>
          <button className="btn ghost" onClick={() => file.current?.click()}>Import JSON</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => importJson(e.target.files?.[0])} />
        </div>
      </Card>
      <Card>
        <h2>Reset</h2>
        <p className="small muted">Deletes every tick, note, score and lesson. The plan itself stays.</p>
        <button className="btn danger" onClick={() => confirm('Delete all your progress? Export first if unsure.') && confirm('Really delete everything?') && (localStorage.removeItem(KEY), replace(mergeState({})))}>Reset progress</button>
      </Card>
    </>
  )
}
