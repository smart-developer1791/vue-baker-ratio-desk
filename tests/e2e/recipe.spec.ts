import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
async function importData(page: Page, value: unknown) {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
}
async function deliver(page: Page, label: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const file = await pending
  return { name: file.suggestedFilename(), buffer: await readFile((await file.path())!) }
}

test('getter-backed destructured props update the existing summary after complete imports with exact gram totals and portions', async ({
  page,
}) => {
  await page.goto('/')
  const summary = page.locator('[data-ui="recipe-summary"]')
  await summary.evaluate((e) => {
    ;(window as any).__summary = e
  })
  await expect(page.locator('[data-grams="flour"]')).toHaveText('713 g')
  await expect(page.locator('[data-grams="water"]')).toHaveText('482 g')
  await expect(page.locator('[data-ui="portion-list"] li')).toHaveText([
    '1 · 206 g',
    '2 · 206 g',
    '3 · 206 g',
    '4 · 206 g',
    '5 · 205 g',
    '6 · 205 g',
  ])
  await importData(page, { ...fixture, target: 2000, ingredients: [] })
  await expect(page.locator('[data-grams="flour"]')).toHaveText('2000 g')
  await expect(page.locator('[data-ui="allocation-list"] li')).toHaveCount(1)
  expect(await summary.evaluate((e) => e === (window as any).__summary)).toBe(true)
  await page.reload()
  await expect(page.locator('[data-ui="dough-total"]')).toHaveText('2000')
})
test('separate forms retain pending fields while strict decimal ratios and zero-percent lines keep the last valid batch', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Baker percentage', exact: true }).fill('70.5')
  await page.getByRole('spinbutton', { name: 'Dough grams', exact: true }).fill('2000')
  await page.getByRole('button', { name: 'Apply batch settings', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Baker percentage', exact: true })).toHaveValue(
    '70.5',
  )
  await page.getByRole('spinbutton', { name: 'Dough grams', exact: true }).fill('2500')
  await page.getByRole('button', { name: 'Apply ingredient', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'Dough grams', exact: true })).toHaveValue(
    '2500',
  )
  await expect(page.locator('[data-ui="dough-total"]')).toHaveText('2000')
  const marker = await page.locator('[data-ui="marker"]').innerText()
  await page.getByRole('textbox', { name: 'Baker percentage', exact: true }).fill('1.23')
  await page.getByRole('button', { name: 'Apply ingredient', exact: true }).click()
  await expect(page.locator('[data-ui="ingredient-form"]').getByRole('alert')).toContainText(
    'at most one decimal',
  )
  await expect(page.locator('[data-ui="marker"]')).toHaveText(marker)
  await page.getByRole('textbox', { name: 'Baker percentage', exact: true }).fill('0')
  await page.getByRole('button', { name: 'Apply ingredient', exact: true }).click()
  await expect(page.locator('[data-grams="water"]')).toHaveText('0 g')
  await expect(page.locator('[data-ui="dough-total"]')).toHaveText('2000')
})
test('bounded additions and confirmed removal support a flour-only recipe without shifting panel dimensions', async ({
  page,
}) => {
  await page.goto('/')
  const panel = page.locator('[data-ui="preview-panel"]'),
    height = await panel.evaluate((e) => e.getBoundingClientRect().height)
  await importData(page, {
    ...fixture,
    ingredients: Array.from({ length: 9 }, (_, i) => ({
      id: 'i-' + i,
      name: 'Ingredient ' + i,
      ratio: 10,
    })),
  })
  await page.getByRole('button', { name: 'Add ingredient', exact: true }).click()
  await expect(page.locator('[data-ui="ingredient-list"] button')).toHaveCount(10)
  await expect(page.getByRole('button', { name: 'Add ingredient', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Remove ingredient', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('[data-ui="ingredient-list"] button')).toHaveCount(10)
  await page.getByRole('button', { name: 'Remove ingredient', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Remove ingredient', exact: true })
    .click()
  await expect(page.locator('[data-ui="ingredient-list"] button')).toHaveCount(9)
  await importData(page, { ...fixture, ingredients: [] })
  await expect(page.locator('[data-grams="flour"]')).toHaveText('1234 g')
  await expect(page.locator('[data-ui="ingredient-form"]')).toHaveCount(0)
  expect(await panel.evaluate((e) => e.getBoundingClientRect().height)).toBe(height)
})
test('actual CSV guards formula-leading names and TXT keeps all weighing and portion data without derived JSON fields', async ({
  page,
}) => {
  await page.goto('/')
  await importData(page, {
    ...fixture,
    flour: '=SUM(1,2)"',
    ingredients: [{ id: 'a', name: '<script>Salt</script>', ratio: 20 }],
  })
  const csv = await deliver(page, 'Ingredients CSV')
  expect(csv.name).toMatch(/^BR-[A-F0-9]{8}-ingredients\.csv$/)
  expect(csv.buffer.toString('utf8')).toContain('"\'=SUM(1,2)"""')
  expect(csv.buffer.toString('utf8').trim().split('\r\n')).toHaveLength(3)
  const txt = (await deliver(page, 'Batch TXT')).buffer.toString('utf8')
  expect(txt).toContain('Target dough: 1234 g')
  expect(txt).toContain('<script>Salt</script>: 2.0%')
  expect(txt).toContain('6. 205 g')
  expect(txt).toContain(await page.locator('[data-ui="marker"]').innerText())
  const json = JSON.parse((await deliver(page, 'JSON')).buffer.toString('utf8'))
  expect(json.allocations).toBeUndefined()
  expect(json.selected).toBeUndefined()
  expect(json.target).toBe(1234)
})
