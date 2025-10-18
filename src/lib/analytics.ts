type BaseEvent = {
  event: 'quiz_started' | 'question_answered' | 'results_viewed' | 'click_product' | 'quiz_completed'
  session_id: string
  timestamp?: string
}

export type Event =
  | (BaseEvent & { event: 'quiz_started'; utm_source?: string; utm_medium?: string })
  | (BaseEvent & { event: 'question_answered'; question_id: string; answer: string; sequence: number })
  | (BaseEvent & { event: 'results_viewed'; top_choice?: string; alt_1?: string; alt_2?: string })
  | (BaseEvent & { event: 'click_product'; product_handle: string; position: number })
  | (BaseEvent & { event: 'quiz_completed'; duration?: number })

type Gtag = (...args: any[]) => void

let windowMID: string | undefined
if (typeof window !== 'undefined' && '__GA_MEASUREMENT_ID__' in window) {
  windowMID = (window as any).__GA_MEASUREMENT_ID__ as string | undefined
}

const MID = windowMID || (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)

let gaInitialised = false

function ensureGa() {
  if (gaInitialised || typeof window === 'undefined' || typeof document === 'undefined' || !MID) return
  gaInitialised = true

  const w = window as typeof window & { dataLayer?: unknown[]; gtag?: Gtag }
  w.dataLayer = w.dataLayer || []
  w.gtag =
    w.gtag ||
    function gtag() {
      w.dataLayer!.push(arguments)
    }

  w.gtag('js', new Date())
  w.gtag('config', MID)

  if (!document.getElementById('ga4-gtag')) {
    const script = document.createElement('script')
    script.id = 'ga4-gtag'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MID}`
    document.head.appendChild(script)
  }
}

function gtagEvent(name: Event['event'], params: Record<string, any>) {
  ensureGa()

  if (typeof window !== 'undefined' && (window as any).gtag && MID) {
    ;(window as any).gtag('event', name, params)
  }
}

export async function track(ev: Event) {
  const payload = { ...ev, timestamp: ev.timestamp ?? new Date().toISOString() }
  const { event, ...params } = payload

  try {
    gtagEvent(event, params)

    await fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...params }),
      keepalive: true
    })
  } catch {
    // no-op
  }
}

export function sessionId(): string {
  const k = 'bean_choose_sid'
  let sid: string | null = null
  try {
    sid = sessionStorage.getItem(k)
    if (!sid) {
      sid = Math.random().toString(36).slice(2, 10)
      sessionStorage.setItem(k, sid)
    }
  } catch {
    sid = Math.random().toString(36).slice(2, 10)
  }
  return sid
}
