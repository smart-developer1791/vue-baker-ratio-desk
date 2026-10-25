import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const fixture = JSON.parse(
  readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
)

import { ref, reactive } from 'vue'
import { parse, serialize, ratioInput, scale, csvExport, textExport } from '../src/domain/recipe.ts'
import { useRecipeScale } from '../src/composables/useRecipeScale.ts'
test('sample preserves exact dough mass, original percentages and ordered portion remainders', () => {
  const w = parse(fixture),
    r = scale(w)
  assert.deepEqual(
    r.allocations.map((v) => v.grams),
    [713, 482, 14, 25],
  )
  assert.equal(r.totalRatio, 1730)
  assert.deepEqual(r.portions, [206, 206, 206, 206, 205, 205])
  assert.deepEqual(serialize(w), fixture)
})
test('largest-remainder ties, zero ratios and varied maximum batches conserve grams and bound rounding error', () => {
  const tied = scale(
    parse({
      ...fixture,
      target: 100,
      ingredients: [
        { id: 'a', name: 'A', ratio: 1000 },
        { id: 'b', name: 'B', ratio: 1000 },
        { id: 'zero', name: 'Zero', ratio: 0 },
      ],
    }),
  )
  assert.deepEqual(
    tied.allocations.map((v) => v.grams),
    [34, 33, 33, 0],
  )
  for (let seed = 0; seed < 150; seed++) {
    const w = parse({
        ...fixture,
        target: 100 + ((seed * 31) % 4901),
        portions: 1 + (seed % 24),
        ingredients: Array.from({ length: 10 }, (_, i) => ({
          id: 'i-' + i,
          name: 'Ingredient ' + i,
          ratio: (seed * 117 + i * 293) % 2001,
        })),
      }),
      r = scale(w)
    assert.equal(
      r.allocations.reduce((n, v) => n + v.grams, 0),
      w.target,
    )
    assert.equal(
      r.portions.reduce((n, v) => n + v, 0),
      w.target,
    )
    assert.ok(Math.max(...r.portions) - Math.min(...r.portions) <= 1)
    r.allocations.forEach((v) =>
      assert.ok(Math.abs(v.grams - (w.target * v.ratio) / r.totalRatio) < 1.00000001),
    )
  }
})
test('real Vue ref/getter inputs recompute after complete workspace replacements without changing original sources', () => {
  const original = parse(fixture),
    source = ref(original),
    props = reactive({ workspace: original }),
    fromRef = useRecipeScale(source),
    fromGetter = useRecipeScale(() => props.workspace)
  assert.equal(fromRef.value.allocations[0]!.grams, 713)
  const next = parse({ ...fixture, target: 2000, ingredients: [] })
  source.value = next
  props.workspace = next
  assert.equal(fromRef.value.allocations[0]!.grams, 2000)
  assert.equal(fromGetter.value.allocations[0]!.grams, 2000)
  assert.equal(original.target, 1234)
  props.workspace = parse({ ...next, target: 1000 })
  assert.equal(fromGetter.value.allocations[0]!.grams, 1000)
})
test('percentage input enforces one decimal and bounded exact tenths', () => {
  for (const [v, n] of [
    ['0', 0],
    ['2', 20],
    ['67.5', 675],
    ['200.0', 2000],
  ] as const)
    assert.equal(ratioInput(v), n)
  for (const v of ['', '-1', '1.23', '1e2', '200.1', '+2', 'x']) assert.throws(() => ratioInput(v))
})
test('strict workspace validation rejects invalid identities, ratios, batches, portions and excessive rows', () => {
  for (const change of [
    (w: any) => (w.target = 99),
    (w: any) => (w.target = 5001),
    (w: any) => (w.portions = 0),
    (w: any) => (w.portions = '6'),
    (w: any) => (w.ingredients[0].id = 'flour'),
    (w: any) => (w.ingredients[1].id = w.ingredients[0].id),
    (w: any) => (w.ingredients[0].id = 'constructor'),
    (w: any) => (w.ingredients[0].ratio = 1.5),
    (w: any) => (w.ingredients[0].ratio = 2001),
    (w: any) => (w.ingredients = Array(11).fill(w.ingredients[0])),
    (w: any) => (w.version = 2),
  ]) {
    const w = structuredClone(fixture)
    change(w)
    assert.throws(() => parse(w))
  }
  assert.equal(scale(parse({ ...fixture, ingredients: [] })).allocations[0]!.grams, 1234)
})
test('maximum quoted CSV, full portion TXT and JSON preserve text safely and stamp Unicode correctly', () => {
  const w = parse({
      ...fixture,
      name: '"'.repeat(80),
      flour: '=SUM(1,2)"',
      target: 5000,
      portions: 24,
      ingredients: Array.from({ length: 10 }, (_, i) => ({
        id: 'i-' + i,
        name: '<script>' + '"'.repeat(20) + i,
        ratio: 2000,
      })),
    }),
    csv = csvExport(w),
    txt = textExport(w)
  assert.equal(csv.trim().split('\r\n').length, 12)
  assert.ok(csv.includes('"\'=SUM(1,2)"""'))
  assert.ok(txt.includes('24. 208 g'))
  assert.ok(txt.includes('Target dough: 5000 g'))
  assert.deepEqual(parse(serialize(w)), w)
  assert.notEqual(
    serialize({ ...w, name: '🙂' }).provenance.marker,
    serialize({ ...w, name: '🙃' }).provenance.marker,
  )
})
