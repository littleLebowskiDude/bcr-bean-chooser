import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const event = {
      ...raw,
      received_at: new Date().toISOString(),
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    }

    // For MVP we just log to Vercel function logs.
    console.log('BeanChooseEvent', event)

    // TODO: forward to Google Sheets / Firestore / Supabase if desired.
    // Example: await fetch(process.env.SHEETS_WEBHOOK_URL!, { method: 'POST', body: JSON.stringify(event), headers: { 'Content-Type': 'application/json' } })

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Unknown error' })
  }
}
