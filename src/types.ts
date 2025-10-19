export type BrewMethod = 'espresso' | 'moka' | 'pourover' | 'frenchpress' | 'filter' | 'coldbrew'
export type Flavour =
  | 'chocolatey'
  | 'caramel'
  | 'balanced'
  | 'fruity'
  | 'floral'
  | 'dark'
export type Caffeine = 'regular' | 'decaf'
export type CoffeeStyle = 'milk' | 'alt_milk' | 'black'

export interface Product {
  handle: string
  title: string
  priceCents: number
  image?: string
  flavour_profile: Flavour[]
  brew_compatibility: Partial<Record<BrewMethod, number>> // 0.0 - 1.0
  caffeine: Caffeine[] // which caffeine options this product suits
  tasting_notes: string
  origin?: string
  shopify_url: string
  available?: boolean
}

export interface Answers {
  brew?: BrewMethod
  flavour?: Flavour | Flavour[]
  caffeine?: Caffeine
  coffeeStyle?: CoffeeStyle
}
