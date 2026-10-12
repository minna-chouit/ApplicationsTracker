import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { KEY, empty, mergeState, todayIn, type State } from './logic'

function load(): State {
  const raw = localStorage.getItem(KEY)
  if (!raw) return empty()
  try {
    return mergeState(JSON.parse(raw))
  } catch {
    // never silently drop progress: park the unreadable copy before starting fresh
    localStorage.setItem(KEY + '.corrupt-' + Date.now(), raw)
    return empty()
  }
}

type Ctx = { s: State; set: (fn: (draft: State) => void) => void; replace: (s: State) => void; today: string }
const StoreCtx = createContext<Ctx>(null!)
export const useStore = () => useContext(StoreCtx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState(load)
  const [today, setToday] = useState(todayIn)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch (e) { alert('Could not save: ' + e) }
  }, [s])

  // the app may stay open overnight on a phone: refresh "today" when it comes back
  useEffect(() => {
    const tick = () => setToday(todayIn())
    document.addEventListener('visibilitychange', tick)
    const id = setInterval(tick, 60_000)
    return () => { document.removeEventListener('visibilitychange', tick); clearInterval(id) }
  }, [])

  const set = (fn: (d: State) => void) => setS(prev => { const d = structuredClone(prev); fn(d); return d })
  return <StoreCtx.Provider value={{ s, set, replace: setS, today }}>{children}</StoreCtx.Provider>
}
