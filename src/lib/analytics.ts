type Event =
  | { event: 'quiz_started'; session_id: string; utm_source?: string; utm_medium?: string }
  | { event: 'question_answered'; session_id: string; question_id: string; answer: string; sequence: number }
  | { event: 'results_viewed'; session_id: string; top_choice?: string; alt_1?: string; alt_2?: string }
  | { event: 'click_product'; session_id: string; product_handle: string; position: number }

const MID = (window as any).__GA_MEASUREMENT_ID__ || import.meta.env.VITE_GA_MEASUREMENT_ID

function gtagEvent(name: string, params: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag && MID) {
    ;(window as any).gtag('event', name, params)
  }
}

export async function track(ev: Event) {
  try {
    // Fire GA4 if available
    gtagEvent(ev.event, { ...ev })

    // Send to serverless endpoint - safe to ignore errors
    await fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
      keepalive: true
    })
  } catch (e) {
    // no-op
  }
}

export function sessionId(): string {
  const k = 'bean_choose_sid'
  let sid = sessionStorage.getItem(k)
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 10)
    sessionStorage.setItem(k, sid)
  }
  return sid
}
