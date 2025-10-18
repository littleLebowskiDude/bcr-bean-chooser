import type { Answers, Product } from '../types'

const weights = {
  brew: 0.5,
  flavour: 0.35,
  caffeine: 0.15
}

function flavourOverlap(productFlavours: string[], selected?: string) {
  if (!selected) return 0
  return productFlavours.includes(selected) ? 1 : 0
}

export function scoreProducts(products: Product[], answers: Answers): Product[] {
  const scored = products
    .filter(p => p.available !== false)
    .map(p => {
      let score = 0
      if (answers.brew) {
        const compat = p.brew_compatibility[answers.brew] ?? 0
        score += weights.brew * compat
      }
      score += weights.flavour * flavourOverlap(p.flavour_profile, answers.flavour)
      if (answers.caffeine) {
        score += weights.caffeine * (p.caffeine.includes(answers.caffeine) ? 1 : 0)
      }
      return { ...p, _score: score as number }
    })
    .sort((a: any, b: any) => b._score - a._score)

  return scored.slice(0, 3)
}
