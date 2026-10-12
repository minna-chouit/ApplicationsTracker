import { useEffect, useState, type ReactNode } from 'react'
import { Today } from './screens/Today'
import { Plan } from './screens/Plan'
import { Deadlines, Documents, Habits, Universities } from './screens/Tracking'
import { Driving, Ielts, Settings, Templates } from './screens/Prep'
import { Header } from './ui'

const SCREENS: Record<string, [string, () => ReactNode]> = {
  today: ['Today', Today],
  plan: ['Plan', Plan],
  deadlines: ['Deadlines', Deadlines],
  habits: ['Habits', Habits],
  documents: ['Documents', Documents],
  universities: ['Universities', Universities],
  ielts: ['IELTS', Ielts],
  driving: ['Driving', Driving],
  templates: ['Templates', Templates],
  settings: ['Settings', Settings],
  more: ['More', More],
}
const TABS = ['today', 'plan', 'deadlines', 'habits', 'more']
const MORE = ['documents', 'universities', 'ielts', 'driving', 'templates', 'settings']

function More() {
  return (
    <>
      <Header title="More" />
      <ul className="more-list">{MORE.map(k => <li key={k}><a href={'#/' + k}>{SCREENS[k][0]}<span aria-hidden>→</span></a></li>)}</ul>
    </>
  )
}

const route = () => location.hash.replace(/^#\/?/, '') || 'today'

export function App() {
  const [r, setR] = useState(route)
  useEffect(() => {
    const on = () => { setR(route()); window.scrollTo(0, 0) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  const [, Screen] = SCREENS[r] ?? SCREENS.today
  const tab = MORE.includes(r) ? 'more' : r

  return (
    <div className="shell">
      <nav className="side" aria-label="Sections">
        <div className="brand">Algiers <span>→</span> Italy</div>
        {Object.keys(SCREENS).filter(k => k !== 'more').map(k => <a key={k} href={'#/' + k} aria-current={r === k ? 'page' : undefined}>{SCREENS[k][0]}</a>)}
      </nav>
      <main><Screen /></main>
      <nav className="tabs" aria-label="Sections">
        {TABS.map(k => <a key={k} href={'#/' + k} aria-current={tab === k ? 'page' : undefined}>{SCREENS[k][0]}</a>)}
      </nav>
    </div>
  )
}
