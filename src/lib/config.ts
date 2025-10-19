import type { BrewMethod, Caffeine, CoffeeStyle, Flavour, Product } from '../types'
import { DEFAULT_WEIGHTS, type WeightMap } from './recommend'

const WEIGHT_KEYS = ['brew', 'flavour', 'coffeeStyle', 'caffeine'] as const
type WeightKey = (typeof WEIGHT_KEYS)[number]
const WEIGHT_KEY_LOOKUP: Record<string, WeightKey> = {
  brew: 'brew',
  flavour: 'flavour',
  coffeestyle: 'coffeeStyle',
  caffeine: 'caffeine'
}

const BREW_COLUMNS: Array<[string, BrewMethod]> = [
  ['brew_espresso', 'espresso'],
  ['brew_moka', 'moka'],
  ['brew_pourover', 'pourover'],
  ['brew_frenchpress', 'frenchpress'],
  ['brew_filter', 'filter'],
  ['brew_coldbrew', 'coldbrew']
]

const FLAVOUR_COLUMNS: Array<[string, Flavour]> = [
  ['flavour_chocolatey', 'chocolatey'],
  ['flavour_caramel', 'caramel'],
  ['flavour_balanced', 'balanced'],
  ['flavour_fruity', 'fruity'],
  ['flavour_floral', 'floral'],
  ['flavour_dark', 'dark']
]

const CAFFEINE_COLUMNS: Array<[string, Caffeine]> = [
  ['caffeine_regular', 'regular'],
  ['caffeine_decaf', 'decaf']
]

const COFFEE_STYLE_COLUMNS: Array<[string, CoffeeStyle]> = [
  ['style_milk', 'milk'],
  ['style_alt_milk', 'alt_milk'],
  ['style_black', 'black']
]

const UTF8_DECODER: TextDecoder | undefined =
  typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }) : undefined

function decodeLikelyMojibake(value: string): string | undefined {
  if (!UTF8_DECODER || !value) return undefined

  let needsDecode = false
  const bytes = new Uint8Array(value.length)

  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code > 0xff) {
      return undefined
    }
    if (code >= 0x80) {
      needsDecode = true
    }
    bytes[i] = code
  }

  if (!needsDecode) return undefined

  try {
    return UTF8_DECODER.decode(bytes)
  } catch {
    return undefined
  }
}

function normaliseTextCell(cell?: string): string {
  if (!cell) return ''

  let value = cell.trim()
  if (!value) return ''

  const decoded = decodeLikelyMojibake(value)
  if (decoded !== undefined) {
    value = decoded.trim()
  }

  value = value
    .replace(/\u00a0/g, ' ') // replace NBSP with regular space
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')

  return value.replace(/\s+/g, ' ')
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ''
  let inQuotes = false

  const pushValue = () => {
    currentRow.push(currentValue)
    currentValue = ''
  }

  const pushRow = () => {
    if (currentRow.length === 0 && currentValue === '') {
      currentValue = ''
      return
    }
    pushValue()
    rows.push(currentRow)
    currentRow = []
  }

  const content = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n')

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]

    if (inQuotes) {
      if (char === '"') {
        const nextChar = content[i + 1]
        if (nextChar === '"') {
          currentValue += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        currentValue += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      pushValue()
      continue
    }

    if (char === '\n') {
      pushRow()
      continue
    }

    currentValue += char
  }

  if (inQuotes) {
    throw new Error('Unclosed quote in CSV input')
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    pushRow()
  }

  return rows
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value?.length) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined
  const normalised = value.trim().toLowerCase()
  if (!normalised) return undefined
  if (['0', 'false', 'no', 'off'].includes(normalised)) return false
  if (['1', 'true', 'yes', 'on'].includes(normalised)) return true
  return undefined
}

export function parseWeightsCsv(csv: string): Partial<WeightMap> {
  const rows = parseCsv(csv)
  if (rows.length <= 1) return {}

  const result: Partial<WeightMap> = {}

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (!row.length) continue

    const rawKey = row[0]?.trim().toLowerCase()
    const key = rawKey ? WEIGHT_KEY_LOOKUP[rawKey] : undefined
    if (!key) continue

    const value = parseNumber(row[1])
    if (value === undefined || value < 0) continue

    result[key] = value
  }

  // Allow alternative format with explicit headers (question,weight)
  if (Object.keys(result).length === 0 && rows[0].length >= 2) {
    const index: Record<string, number> = {}
    rows[0].forEach((h, idx) => {
      index[h.trim().toLowerCase()] = idx
    })
    const questionIdx = index.question
    const weightIdx = index.weight

    if (questionIdx !== undefined && weightIdx !== undefined) {
      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i]
        const rawKey = row[questionIdx]?.trim().toLowerCase()
        const key = rawKey ? WEIGHT_KEY_LOOKUP[rawKey] : undefined
        if (!key) continue
        const value = parseNumber(row[weightIdx])
        if (value === undefined || value < 0) continue
        result[key] = value
      }
    }
  }

  return result
}

export function normaliseWeights(partial: Partial<WeightMap>): WeightMap {
  const merged: WeightMap = { ...DEFAULT_WEIGHTS }
  WEIGHT_KEYS.forEach((key) => {
    const value = partial[key]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      merged[key] = value
    }
  })

  const total = WEIGHT_KEYS.reduce((acc, key) => acc + merged[key], 0)
  if (total <= 0) {
    return { ...DEFAULT_WEIGHTS }
  }

  const normalised = { ...merged } as WeightMap
  WEIGHT_KEYS.forEach((key) => {
    normalised[key] = merged[key] / total
  })

  return normalised
}

export function parseProductsCsv(csv: string): Product[] {
  const rows = parseCsv(csv)
  if (rows.length === 0) return []

  const headers = rows[0]
  const headerIndex = new Map<string, number>()
  headers.forEach((header, idx) => {
    headerIndex.set(header.trim().toLowerCase(), idx)
  })

  const getCell = (row: string[], column: string) => {
    const idx = headerIndex.get(column.toLowerCase())
    if (idx === undefined) return ''
    return normaliseTextCell(row[idx])
  }

  const products: Product[] = []

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (!row || row.every((cell) => !cell.trim())) continue

    const handle = getCell(row, 'handle')
    const title = getCell(row, 'title')
    const priceRaw = getCell(row, 'pricecents')
    const shopifyUrl = getCell(row, 'shopify_url')

    if (!handle || !title || !priceRaw || !shopifyUrl) {
      console.warn('Skipping product row with missing required fields', { handle, title })
      continue
    }

    const priceCents = Number(priceRaw)
    if (!Number.isFinite(priceCents)) {
      console.warn('Skipping product row with invalid price', { handle, priceRaw })
      continue
    }

    const availableCell = getCell(row, 'available')
    const availableParsed = parseBoolean(availableCell)
    const available = availableParsed === undefined ? true : availableParsed

    const brewCompatibility: Product['brew_compatibility'] = {}
    BREW_COLUMNS.forEach(([column, method]) => {
      const value = parseNumber(getCell(row, column))
      if (value !== undefined) {
        brewCompatibility[method] = Math.max(0, value)
      }
    })

    const flavourWeights: Product['flavour_weights'] = {}
    const flavourProfile: Product['flavour_profile'] = []
    FLAVOUR_COLUMNS.forEach(([column, flavour]) => {
      const value = parseNumber(getCell(row, column))
      if (value !== undefined) {
        const clamped = clamp01(value)
        if (clamped > 0) {
          flavourProfile.push(flavour)
        }
        flavourWeights[flavour] = clamped
      }
    })

    const caffeineWeights: Product['caffeine_weights'] = {}
    const caffeine: Product['caffeine'] = []
    CAFFEINE_COLUMNS.forEach(([column, option]) => {
      const value = parseNumber(getCell(row, column))
      if (value !== undefined) {
        const clamped = clamp01(value)
        if (clamped > 0) {
          caffeine.push(option)
        }
        caffeineWeights[option] = clamped
      }
    })

    const coffeeStyleWeights: Product['coffee_style_weights'] = {}
    COFFEE_STYLE_COLUMNS.forEach(([column, style]) => {
      const value = parseNumber(getCell(row, column))
      if (value !== undefined) {
        coffeeStyleWeights[style] = clamp01(value)
      }
    })

    const product: Product = {
      handle,
      title,
      priceCents,
      image: getCell(row, 'image') || undefined,
      flavour_profile: flavourProfile,
      flavour_weights: flavourWeights,
      brew_compatibility: brewCompatibility,
      caffeine,
      caffeine_weights: caffeineWeights,
      coffee_style_weights: coffeeStyleWeights,
      tasting_notes: getCell(row, 'tasting_notes'),
      origin: getCell(row, 'origin') || undefined,
      shopify_url: shopifyUrl,
      available
    }

    products.push(product)
  }

  return products
}
