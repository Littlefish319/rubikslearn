import { expect, test, type Page } from '@playwright/test'

async function openPairDrill(page: Page) {
  await page.goto('/#learn')
  await page.locator('.learn-navigation-disclosure > summary').click()
  await page.getByLabel('Lesson', { exact: true }).selectOption('cfop-f2l')
  await page.locator('.learn-navigation-disclosure > summary').click()
  await page.getByRole('button', { name: /^Step 2/ }).click()
  await expect(page.locator('.cube-coach-count')).toHaveText('0 / 3')
  await page.locator('.cube-trainer--coach').scrollIntoViewIfNeeded()
}

function completeNextTurn(page: Page, expectedCount: string) {
  return page.evaluate(expected => new Promise<number>((resolve, reject) => {
    const count = document.querySelector('.cube-coach-count')!
    const button = document.querySelector<HTMLButtonElement>('.cube-coach-step-buttons button:last-child')!
    const start = performance.now()
    const timeout = window.setTimeout(() => { observer.disconnect(); reject(new Error('Turn never completed')) }, 15_000)
    const observer = new MutationObserver(() => {
      if (count.textContent?.trim() !== expected) return
      observer.disconnect()
      window.clearTimeout(timeout)
      resolve(performance.now() - start)
    })
    observer.observe(count, { childList: true, subtree: true, characterData: true })
    button.click()
  }), expectedCount)
}

test('Next move visibly animates slowly even with reduced motion and fast playback selected', async ({ page }) => {
  await openPairDrill(page)
  const next = page.getByRole('button', { name: 'Next move', exact: true })
  const canvas = page.locator('.cube-canvas canvas')
  await expect(canvas).toBeVisible()
  const before = await canvas.screenshot()
  const playback = page.getByLabel('Autoplay speed')
  await page.locator('.cube-coach-options > summary').click()
  await playback.selectOption('fast')
  await page.locator('.cube-coach-options > summary').click()
  const elapsed = completeNextTurn(page, '1 / 3')
  await expect(next).toBeDisabled()
  await page.waitForTimeout(500)
  await expect(page.locator('.cube-coach-count')).toHaveText('0 / 3')
  const during = await canvas.screenshot()
  expect(during.equals(before), 'The cube must show an intermediate turned position').toBe(false)
  expect(await elapsed, 'A manual quarter turn must take at least 1.8 seconds').toBeGreaterThanOrEqual(1800)
  await expect(next).toBeEnabled()
  const after = await canvas.screenshot()
  expect(during.equals(after), 'The intermediate frame must differ from the completed turn').toBe(false)
  const halfTurn = completeNextTurn(page, '2 / 3')
  await page.waitForTimeout(700)
  await expect(page.locator('.cube-coach-count')).toHaveText('1 / 3')
  expect(await halfTurn, 'A manual half turn must take at least 2.5 seconds').toBeGreaterThanOrEqual(2500)
})

test('On a phone, current instruction and Next move stay beside the visible cube', async ({ page }) => {
  await openPairDrill(page)
  const canvas = await page.locator('.cube-canvas').boundingBox()
  const instruction = await page.locator('.cube-coach-instruction').boundingBox()
  const next = await page.getByRole('button', { name: 'Next move', exact: true }).boundingBox()
  expect(canvas).not.toBeNull()
  expect(instruction).not.toBeNull()
  expect(next).not.toBeNull()
  const totalHeight = next!.y + next!.height - canvas!.y
  expect(totalHeight, 'Following a turn must not require scrolling between cube and button').toBeLessThanOrEqual(760)
  expect(canvas!.y).toBeGreaterThanOrEqual(0)
  expect(next!.y + next!.height).toBeLessThanOrEqual(844)
  expect(await page.locator('.cube-coach-instruction h4').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(20)
  expect(await page.getByRole('button', { name: 'Next move', exact: true }).evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('The desktop cube keeps a stable visible size', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openPairDrill(page)
  const canvas = page.locator('.cube-canvas')
  const before = await canvas.boundingBox()
  expect(before!.height).toBeGreaterThanOrEqual(300)
  expect(before!.height).toBeLessThanOrEqual(600)
  await page.waitForTimeout(1000)
  const after = await canvas.boundingBox()
  expect(Math.abs(after!.height - before!.height), 'Rendering and resizing must not grow the cube indefinitely').toBeLessThanOrEqual(1)
})

test('The flat fallback shows an in-flight turn instead of flashing to the result', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return original.apply(this, [type, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await openPairDrill(page)
  await expect(page.locator('.cube-fallback')).toBeVisible()
  const elapsed = completeNextTurn(page, '1 / 3')
  await page.waitForTimeout(500)
  await expect(page.locator('.cube-coach-count')).toHaveText('0 / 3')
  const progress = page.getByRole('progressbar', { name: 'Turn progress' })
  const value = Number(await progress.getAttribute('aria-valuenow'))
  expect(value).toBeGreaterThan(0)
  expect(value).toBeLessThan(100)
  expect(await page.locator('.cube-net-face--R').evaluate(el => getComputedStyle(el).transform)).not.toBe('none')
  expect(await elapsed).toBeGreaterThanOrEqual(1800)
})
