import type { Answers, Flavour, Product } from '../types'

export type WeightMap = {
  brew: number
  flavour: number
  coffeeStyle: number
  caffeine: number
}

export const DEFAULT_WEIGHTS: WeightMap = {
  brew: 0.35,
  flavour: 0.3,
  coffeeStyle: 0.2,
  caffeine: 0.15
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function flavourScore(
  productWeights: Partial<Record<Flavour, number>>,
  selected?: string | string[]
) {
  if (!selected) return 0
  const selections = Array.isArray(selected) ? selected : [selected]
  if (!selections.length) return 0
  const total = selections.reduce((acc, sel) => acc + clamp01(productWeights[sel as Flavour] ?? 0), 0)
  return selections.length ? clamp01(total / selections.length) : 0
}

export function scoreProducts(
  products: Product[],
  answers: Answers,
  weights: WeightMap = DEFAULT_WEIGHTS
): Product[] {
  const scored = products
    .filter((p) => p.available !== false)
    .map((p) => {
      let score = 0
      if (answers.brew) {
        const compat = clamp01(p.brew_compatibility[answers.brew] ?? 0)
        score += weights.brew * compat
      }
      score += weights.flavour * flavourScore(p.flavour_weights ?? {}, answers.flavour)
      if (answers.coffeeStyle) {
        const styleWeight = clamp01(p.coffee_style_weights?.[answers.coffeeStyle] ?? 0)
        score += weights.coffeeStyle * styleWeight
      }
      if (answers.caffeine) {
        const caffeineWeight = clamp01(p.caffeine_weights?.[answers.caffeine] ?? 0)
        score += weights.caffeine * caffeineWeight
      }
      return { ...p, _score: score as number }
    })
    .sort((a: any, b: any) => b._score - a._score)

  return scored.slice(0, 3)
}
