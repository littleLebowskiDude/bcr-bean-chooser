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
  { key: 'decaf', label: 'Decaf' }
]

const TIPS: Record<string, string> = {
  espresso: 'Use a fine grind, 18-20 g in the basket, aim for ~30 ml in 25-30 sec.',
  moka: 'Use a fine (between filter and espresso) grind, pre-heat water, and remove just before it sputters.',
  pourover: 'Use a medium grind, bloom first, then pour slowly in circles for even extraction.',
  frenchpress: 'Use a coarse grind, steep 3-4 minutes, and press slowly to reduce sediment.',
  filter: 'Use a medium grind, paper filter, and a steady pour for consistency.',
  coldbrew: 'Use a coarse grind, steep for 12-18 hours, then filter before serving.'
}

const TOTAL_QUESTIONS = 3

export default function App() {
  const { step, next, back, answers, answer, setProducts, products, results, setResults, reset } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const utm_source = params.get('utm_source') || undefined
    const utm_medium = params.get('utm_medium') || undefined

    const load = async () => {
      try {
        const res = await fetch('/data/products.json')
        const data: Product[] = await res.json()
        setProducts(data)
      } finally {
        setLoading(false)
        track({ event: 'quiz_started', session_id: sessionId(), utm_source, utm_medium })
      }
    }

    load()
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
    if (step === 1) {
      const flavour = answers.flavour
      if (Array.isArray(flavour)) {
        return flavour.length > 0
      }
      return !!flavour
    }
    if (step === 2) return !!answers.caffeine
    return true
  }, [step, answers])

  const progress = Math.min(step, TOTAL_QUESTIONS) / TOTAL_QUESTIONS

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-brand-50 via-white to-brand-100 text-brand-800">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 rounded-full border-4 border-brand-100 border-t-brand-800 animate-spin" />
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">Preparing your beans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-100 text-brand-800">
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="py-8 text-center space-y-4">
          <img
            src="https://beechworth.coffee/cdn/shop/files/Beechworth_Coffee_Roasters_Logo_Big.png?v=1750331650"
            alt="Beechworth Coffee Roasters"
            className="mx-auto h-16 sm:h-20 drop-shadow-sm"
          />
          <div className="space-y-2">
            <p className="text-base opacity-80 sm:text-lg">Answer three quick questions and we&apos;ll line up the perfect beans.</p>
          </div>
        </header>

        {step <= 2 && (
          <section className="rounded-3xl border border-brand-100/60 bg-white/90 p-6 shadow-xl shadow-brand-800/10 backdrop-blur sm:p-8 space-y-6">
            <ProgressIndicator step={step} total={TOTAL_QUESTIONS} progress={progress} />

            {step === 0 && (
              <Question
                title="How do you brew at home or work?"
                options={BREW_OPTIONS}
                value={answers.brew}
                onChange={(v) => {
                  answer('brew', v)
                  track({
                    event: 'question_answered',
                    session_id: sessionId(),
                    question_id: 'brew_method',
                    answer: String(v),
                    sequence: 1
                  })
                }}
              />
            )}
            {step === 1 && (
              <Question
                title="Which flavour directions are you into today?"
                options={FLAVOURS}
                value={answers.flavour}
                onChange={(v) => {
                  answer('flavour', v)
                  track({
                    event: 'question_answered',
                    session_id: sessionId(),
                    question_id: 'flavour',
                    answer: Array.isArray(v) ? v.join(',') : String(v),
                    sequence: 2
                  })
                }}
                selectionHint="Choose up to three flavours"
                multi
                maxSelections={3}
              />
            )}
            {step === 2 && (
              <Question
                title="Caffeine preference?"
                options={CAFFEINE}
                value={answers.caffeine}
                onChange={(v) => {
                  answer('caffeine', v)
                  track({
                    event: 'question_answered',
                    session_id: sessionId(),
                    question_id: 'caffeine',
                    answer: String(v),
                    sequence: 3
                  })
                }}
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                className="rounded-xl border border-brand-100 px-4 py-2 text-sm font-medium text-brand-600 transition hover:border-brand-300 hover:text-brand-800 disabled:opacity-40 disabled:hover:border-brand-100"
                onClick={back}
                disabled={step === 0}
              >
                Back
              </button>
              <button
                className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-800/20 transition hover:bg-brand-600 disabled:opacity-40 disabled:shadow-none"
                onClick={next}
                disabled={!canNext}
              >
                {step < 2 ? 'Next' : 'Show my beans'}
              </button>
            </div>
          </section>
        )}

        {step >= 3 && (
            <section className="space-y-6">
              <div className="rounded-3xl border border-amber-300 bg-white/95 p-0 shadow-xl shadow-amber-500/15 backdrop-blur">
                <div className="h-2 rounded-t-3xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500" />
                <div className="space-y-4 p-6 sm:p-8">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-600">Your curated pick</p>
                      <h2 className="text-2xl font-semibold">Top Choice</h2>
                    </div>
                  </div>
                  {results[0] ? (
                    <ResultCard p={results[0]} position={1} />
                  ) : (
                    <p className="text-sm text-brand-600">No perfect match - here are close picks.</p>
                  )}
                  <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
                    {TIPS[answers.brew || 'espresso']}
                  </p>
                </div>
              </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {results.slice(1).map((p, i) => (
                <div
                  className="rounded-3xl border border-brand-100/60 bg-white/95 p-5 shadow-lg shadow-brand-800/10 backdrop-blur"
                  key={p.handle}
                >
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Alternative #{i + 2}</h3>
                  <ResultCard p={p} position={i + 2} />
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
                onClick={reset}
              >
                Start again
              </button>
            </div>
          </section>
        )}

        <footer className="pt-12 pb-6 text-center text-xs text-brand-600">(c) Beechworth Coffee Roasters</footer>
      </div>
    </div>
  )
}

function Question({
  title,
  options,
  value,
  onChange,
  selectionHint,
  multi = false,
  maxSelections
}: {
  title: string
  options: { key: string; label: string }[]
  value?: string | string[]
  onChange: (v: string | string[]) => void
  selectionHint?: string
  multi?: boolean
  maxSelections?: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-xs uppercase tracking-[0.3em] text-brand-500">{selectionHint || 'Select one option'}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const selectedValues = Array.isArray(value) ? value : value ? [value] : []
          const isSelected = selectedValues.includes(opt.key)
          const atLimit = multi && maxSelections ? selectedValues.length >= maxSelections : false
          return (
            <button
              key={opt.key}
              onClick={() => {
                if (!multi) {
                  onChange(opt.key)
                  return
                }

                if (isSelected) {
                  onChange(selectedValues.filter((val) => val !== opt.key))
                  return
                }

                if (atLimit) {
                  return
                }

                onChange([...selectedValues, opt.key])
              }}
              disabled={multi && !isSelected && atLimit}
              className={`group rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${
                isSelected
                  ? 'border-brand-800 bg-brand-800 text-white shadow-lg shadow-brand-800/30'
                  : 'border-brand-100 bg-white hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-800/10 disabled:opacity-40 disabled:hover:translate-y-0'
              }`}
            >
              <span className="block text-base font-medium">{opt.label}</span>
              {isSelected && (
                <span className="mt-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ResultCard({ p, position }: { p: Product; position: number }) {
  return (
    <div className="flex items-start gap-4 sm:gap-6">
      {p.image && (
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-brand-100/60 bg-brand-50 sm:h-28 sm:w-28">
          <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a
            href={p.shopify_url}
            className="text-lg font-semibold text-brand-800 transition hover:text-brand-600 hover:underline"
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track({ event: 'click_product', session_id: sessionId(), product_handle: p.handle, position })
            }
          >
            {p.title}
          </a>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600">
            from ${(p.priceCents / 100).toFixed(2)}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-brand-700">{p.tasting_notes}</p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            href={p.shopify_url}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track({ event: 'click_product', session_id: sessionId(), product_handle: p.handle, position })
            }
          >
            Buy {p.title} now
          </a>
        </div>
      </div>
    </div>
  )
}

function ProgressIndicator({ step, total, progress }: { step: number; total: number; progress: number }) {
  const displayStep = Math.min(step, total - 1) + 1
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
        <span>
          Step {displayStep} of {total}
        </span>
        <span>{Math.round(progress * 100)}% complete</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-800 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}






