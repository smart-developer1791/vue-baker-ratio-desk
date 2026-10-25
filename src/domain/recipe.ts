import { record, list, unique } from './validation.ts'
import { single, id, integer, provenance } from './shared.ts'
export interface Ingredient {
  id: string
  name: string
  ratio: number
}
export interface Workspace {
  version: 1
  name: string
  flour: string
  target: number
  portions: number
  ingredients: Ingredient[]
}
export interface Allocation {
  id: string
  name: string
  ratio: number
  grams: number
}
export function parse(value: unknown): Workspace {
  const w = record(value, 'Workspace')
  if (w.version !== 1) throw new Error('Workspace version must be 1.')
  const ingredients = list(w.ingredients, 'Extra ingredients', 10).map((v) => {
    const r = record(v, 'Ingredient'),
      identity = id(r.id)
    if (identity === 'flour') throw new Error('The flour identity is reserved.')
    return {
      id: identity,
      name: single(r.name, 'Ingredient name', 32),
      ratio: integer(r.ratio, 'Ratio tenths', 0, 2000),
    }
  })
  unique(
    ingredients.map((r) => r.id),
    'Ingredient IDs',
  )
  return {
    version: 1,
    name: single(w.name, 'Workspace name', 80),
    flour: single(w.flour, 'Flour name', 32),
    target: integer(w.target, 'Dough grams', 100, 5000),
    portions: integer(w.portions, 'Portions', 1, 24),
    ingredients,
  }
}
export function serialize(value: unknown) {
  const w = parse(value)
  return { ...w, provenance: provenance('BR', 'vue-baker-ratio-desk', w) }
}
export function ratioInput(text: string | number) {
  const s = String(text).trim()
  if (!/^\d+(?:\.\d)?$/.test(s))
    throw new Error('Use a percentage from 0 to 200 with at most one decimal.')
  const ratio = Math.round(Number(s) * 10)
  return integer(ratio, 'Ratio tenths', 0, 2000)
}
export function scale(value: Workspace) {
  const w = parse(value),
    rows = [{ id: 'flour', name: w.flour, ratio: 1000 }, ...w.ingredients],
    total = rows.reduce((n, r) => n + r.ratio, 0),
    allocations: Allocation[] = rows.map((r) => ({
      ...r,
      grams: Math.floor((w.target * r.ratio) / total),
    })),
    left = w.target - allocations.reduce((n, r) => n + r.grams, 0)
  const order = rows
    .map((r, i) => ({ i, remainder: (w.target * r.ratio) % total }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i)
  for (const r of order.slice(0, left)) allocations[r.i]!.grams++
  const base = Math.floor(w.target / w.portions),
    extra = w.target % w.portions,
    portions = Array.from({ length: w.portions }, (_, i) => base + (i < extra ? 1 : 0))
  return { allocations, totalRatio: total, portions }
}
const csv = (v: string) => '"' + (/^[=+\-@\t\r\n]/.test(v) ? "'" : '') + v.replace(/"/g, '""') + '"'
export function csvExport(value: Workspace) {
  const w = parse(value)
  return (
    'ingredient_id,ingredient,baker_percent,grams,marker\r\n' +
    scale(w)
      .allocations.map((r) =>
        [
          r.id,
          csv(r.name),
          (r.ratio / 10).toFixed(1),
          r.grams,
          serialize(w).provenance.marker,
        ].join(','),
      )
      .join('\r\n') +
    '\r\n'
  )
}
export function textExport(value: Workspace) {
  const w = parse(value),
    r = scale(w)
  return (
    w.name +
    '\n' +
    serialize(w).provenance.marker +
    ' · CodeSculptor\nTarget dough: ' +
    w.target +
    ' g\nBase flour: 100.0%\nRecipe ratio total: ' +
    (r.totalRatio / 10).toFixed(1) +
    '%\n\n' +
    r.allocations
      .map((v) => v.name + ': ' + (v.ratio / 10).toFixed(1) + '% -> ' + v.grams + ' g')
      .join('\n') +
    '\n\nPORTIONS\n' +
    r.portions.map((n, i) => i + 1 + '. ' + n + ' g').join('\n') +
    '\nWhole grams use largest remainders; tied remainders follow ingredient order.\n'
  )
}
