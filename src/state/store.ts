import { create } from 'zustand'
import type { Answers, Product } from '../types'
import { DEFAULT_WEIGHTS, type WeightMap } from '../lib/recommend'

type State = {
  step: number
  answers: Answers
  products: Product[]
  results: Product[]
  weights: WeightMap
}

type Actions = {
  setProducts: (p: Product[]) => void
  answer: (key: keyof Answers, value: string | string[]) => void
  next: () => void
  back: () => void
  setResults: (r: Product[]) => void
  reset: () => void
  setWeights: (weights: Partial<WeightMap>) => void
}

export const useApp = create<State & Actions>((set, get) => ({
  step: 0,
  answers: {},
  products: [],
  results: [],
  weights: { ...DEFAULT_WEIGHTS },
  setProducts: (p) => set({ products: p }),
  answer: (key, value) => set({ answers: { ...get().answers, [key]: value } }),
  next: () => set({ step: get().step + 1 }),
  back: () => set({ step: Math.max(0, get().step - 1) }),
  setResults: (r) => set({ results: r }),
  reset: () => set({ step: 0, answers: {}, results: [] }),
  setWeights: (weights) =>
    set(() => ({
      weights: { ...DEFAULT_WEIGHTS, ...weights }
    }))
}))
