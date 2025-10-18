import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/store'
import type { BrewMethod, Caffeine, Flavour, Product } from '../types'
import { scoreProducts } from '../lib/recommend'
import { sessionId, track } from '../lib/analytics'

const BREW_OPTIONS: { key: BrewMethod; label: string }[] = [
  { key: 'espresso', label: 'Espresso machine' },
  { key: 'moka', label: 'Stovetop / Moka pot' },
  { key: 'pourover', label: 'Pour-over / Chemex' },
  { key: 'frenchpress', label: 'French Press / Plunger' },
  { key: 'filter', label: 'Filter drip' },
  { key: 'coldbrew', label: 'Cold brew' }
]

const FLAVOURS: { key: Flavour; label: string }[] = [
  { key: 'chocolatey', label: 'Chocolatey and nutty' },
  { key: 'caramel', label: 'Caramel and sweet' },
  { key: 'balanced', label: 'Balanced and smooth' },
  { key: 'fruity', label: 'Fruity and bright' },
  { key: 'floral', label: 'Floral and delicate' },
  { key: 'dark', label: 'Dark and bold' }
]

const CAFFEINE: { key: Caffeine; label: string }[] = [
  { key: 'regular', label: 'Regular' },
  { key: 'half', label: 'Half caf' },
  { key: 'decaf', label: 'Decaf' }
]

const TIPS: Record<string, string> = {
  espresso: 'Use a fine grind, 18–20 g, ~30 ml in 25–30 sec.',
  moka: 'Use fine grind (between filter & espresso), pre-heat water, remove before sputter.',
  pourover: 'Use medium grind, bloom first, then pour slowly in circles.',
  frenchpress: 'Use coarse grind, 3–4 min steep, press slowly.',
  filter: 'Use medium grind and steady flow.',
  coldbrew: 'Use coarse grind, steep 12–18 hrs, filter well.'
}

export default function App() {
  const { step, next, back, answers, answer, setProducts, products, results, setResults, reset } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const utm_source = params.get('utm_source') || undefined
    const utm_medium = params.get('utm_medium') || undefined
    ;(async () => {
      const res = await fetch('/data/products.json')
      const data: Product[] = await res.json()
      setProducts(data)
      setLoading(false)
      track({ event: 'quiz_started', session_id: sessionId(), utm_source, utm_medium })
    })()
  }, [setProducts])

  useEffect(() => {
    if (step === 3) {
      const top3 = scoreProducts(products, answers)
      setResults(top3)
      track({
        event: 'results_viewed',
        session_id: sessionId(),
        top_choice: top3[0]?.handle,
        alt_1: top3[1]?.handle,
        alt_2: top3[2]?.handle
      })
    }
  }, [step, products, answers, setResults])

  const canNext = useMemo(() => {
    if (step === 0) return !!answers.brew
    if (step === 1) return !!answers.flavour
    if (step === 2) return !!answers.caffeine
    return true
  }, [step, answers])

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-brand-800">Loading…</div>
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto text-brand-800">
      <header className="py-6">
        <h1 className="text-3xl font-semibold">Bean Choose</h1>
        <p className="text-sm opacity-80">Find your perfect brew in under 30 seconds.</p>
      </header>

      {step <= 2 && (
        <div className="bg-white shadow-md rounded-2xl p-4 sm:p-6 space-y-6">
          {step === 0 && (
            <Question
              title="How do you brew at home or work?"
              options={BREW_OPTIONS}
              value={answers.brew}
              onChange={(v) => {
                answer('brew', v)
                track({ event: 'question_answered', session_id: sessionId(), question_id: 'brew_method', answer: String(v), sequence: 1 })
              }}
            />
          )}
          {step === 1 && (
            <Question
              title="Which flavour direction are you into today?"
              options={FLAVOURS}
              value={answers.flavour}
              onChange={(v) => {
                answer('flavour', v)
                track({ event: 'question_answered', session_id: sessionId(), question_id: 'flavour', answer: String(v), sequence: 2 })
              }}
            />
          )}
          {step === 2 && (
            <Question
              title="Caffeine preference?"
              options={CAFFEINE}
              value={answers.caffeine}
              onChange={(v) => {
                answer('caffeine', v)
                track({ event: 'question_answered', session_id: sessionId(), question_id: 'caffeine', answer: String(v), sequence: 3 })
              }}
            />
          )}

          <div className="flex items-center justify-between">
            <button className="px-4 py-2 rounded-xl bg-white border" onClick={back} disabled={step === 0}>
              Back
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-brand-800 text-white disabled:opacity-50"
              onClick={next}
              disabled={!canNext}
            >
              {step < 2 ? 'Next' : 'Show my beans'}
            </button>
          </div>
        </div>
      )}

      {step >= 3 && (
        <div className="space-y-4">
          <div className="bg-white shadow-md rounded-2xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-1">Top Choice</h2>
            {results[0] ? <ResultCard p={results[0]} position={1} /> : <p>No perfect match - here are close picks.</p>}
            <p className="mt-3 text-sm opacity-80">Tip for {answers.brew}: {TIPS[answers.brew || 'espresso']}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {results.slice(1).map((p, i) => (
              <div className="bg-white shadow-md rounded-2xl p-4 sm:p-6" key={p.handle}>
                <h3 className="text-base font-semibold mb-2">Alternative</h3>
                <ResultCard p={p} position={i + 2} />
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button className="px-4 py-2 rounded-xl bg-white border" onClick={reset}>Start again</button>
          </div>
        </div>
      )}

      <footer className="py-10 text-xs opacity-70 text-center">
        © Beechworth Coffee Roasters
      </footer>
    </div>
  )
}

function Question({
  title,
  options,
  value,
  onChange
}: {
  title: string
  options: { key: string; label: string }[]
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`rounded-2xl border p-3 text-left hover:shadow ${
              value === opt.key ? 'border-brand-800 ring-2 ring-brand-800' : 'border-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultCard({ p, position }: { p: Product; position: number }) {
  return (
    <div className="flex items-start gap-4">
      {p.image && <img src={p.image} alt={p.title} className="w-20 h-20 object-cover rounded-xl" />}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <a href={p.shopify_url} className="text-lg font-medium hover:underline" target="_blank" rel="noreferrer"
            onClick={() => track({ event: 'click_product', session_id: sessionId(), product_handle: p.handle, position })}>
            {p.title}
          </a>
          <span className="text-sm">${(p.priceCents / 100).toFixed(2)}</span>
        </div>
        <p className="text-sm opacity-80">{p.tasting_notes}</p>
        {p.origin && <p className="text-xs opacity-60 mt-1">{p.origin}</p>}
        <div className="mt-3">
          <a
            className="inline-block px-3 py-2 rounded-xl bg-brand-800 text-white"
            href={p.shopify_url}
            target="_blank"
            rel="noreferrer"
            onClick={() => track({ event: 'click_product', session_id: sessionId(), product_handle: p.handle, position })}
          >
            View on Shopify
          </a>
        </div>
      </div>
    </div>
  )
}
