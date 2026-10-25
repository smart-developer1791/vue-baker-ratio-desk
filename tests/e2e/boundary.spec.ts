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

test('maximum escaped workspace downloads and reimports losslessly at 320 px with full artifacts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.goto('/')
  let value: any = { ...fixture, name: '<script>' + '"'.repeat(64) }
  value = {
    ...value,
    flour: '"'.repeat(32),
    target: 5000,
    portions: 24,
    ingredients: Array.from({ length: 10 }, (_, i) => ({
      id: 'i-' + i,
      name: '<script>' + '"'.repeat(20) + i,
      ratio: 2000,
    })),
  }

  await importData(page, value)
  const file = await deliver(page, 'JSON'),
    json = JSON.parse(file.buffer.toString('utf8'))
  for (const k of Object.keys(value).filter((k) => k !== 'provenance'))
    expect(json[k]).toEqual(value[k])
  await importData(page, json)
  expect((await deliver(page, 'JSON')).buffer.toString('utf8')).toBe(file.buffer.toString('utf8'))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('[data-ui="allocation-list"] li')).toHaveCount(11)
  await expect(page.locator('[data-ui="portion-list"] li')).toHaveCount(24)
  await expect(page.locator('[data-ui="dough-total"]')).toHaveText('5000')
  expect(
    (await deliver(page, 'Ingredients CSV')).buffer.toString('utf8').trim().split('\r\n'),
  ).toHaveLength(12)
})
