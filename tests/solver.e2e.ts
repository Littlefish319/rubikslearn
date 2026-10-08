import { expect, test, type Page } from '@playwright/test'
import Cube from '../src/vendor/cubejs/cube.js'
import { CUBE_COLORS, INPUT_FACES } from '../src/lib/cubeInput'

const faceNames = { F: 'Front', R: 'Right', B: 'Back', L: 'Left', U: 'Top', D: 'Bottom' } as const

async function expectNet(page: Page, facelets: string) {
  for (const [index, face] of INPUT_FACES.entries()) {
    const colors = await page.locator(`.cube-net-face--${face} i`).evaluateAll(cells => cells.map(cell => (cell as HTMLElement).style.background))
    const expected = [...facelets.slice(index * 9, index * 9 + 9)].map(color => {
      const hex = CUBE_COLORS[color as keyof typeof CUBE_COLORS].hex
      return `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`
    })
    expect(colors, `The ${face} face must match the actual entered cube`).toEqual(expected)
  }
}

test('all six entered faces become the exact coached cube, solve turn by turn, and survive reload', async ({ page }) => {
  test.setTimeout(45_000)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null
      return original.apply(this, [type, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await page.goto('/#solver')
  await page.getByRole('button', { name: 'Find short solution', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('48 remaining stickers')
  const scramble = new Cube().move("R U F'").asString()
  for (const face of ['F', 'R', 'B', 'L', 'U', 'D'] as const) {
    await page.locator('.solver-face-tabs button').filter({ hasText: faceNames[face] }).click()
    const colors = scramble.slice(INPUT_FACES.indexOf(face) * 9, INPUT_FACES.indexOf(face) * 9 + 9)
    for (let index = 0; index < 9; index++) {
      if (index === 4) continue
      await page.getByRole('button', { name: `Paint ${CUBE_COLORS[colors[index] as keyof typeof CUBE_COLORS].name.toLowerCase()}`, exact: true }).click()
      await page.locator('.solver-sticker-grid button').nth(index).click()
    }
  }
  await expect(page.locator('.solver-entry-review > p').first()).toContainText('6 of 6 faces filled · 48 of 48 stickers entered')
  await page.getByRole('button', { name: 'Find short solution', exact: true }).click()
  await expect(page.getByRole('heading', { name: '3-turn solution', exact: true })).toBeVisible({ timeout: 15_000 })
  await expectNet(page, scramble)
  await page.locator('.solver-route-details > summary').click()
  const route = (await page.locator('.solver-route-details code').textContent())!.replaceAll('′', "'").split(' ')
  await page.locator('.solver-route-details > summary').click()
  const start = Date.now()
  await page.getByRole('button', { name: 'Next move', exact: true }).click()
  await expect(page.locator('.cube-coach-count')).toHaveText('1 / 3', { timeout: 7000 })
  expect(Date.now() - start).toBeGreaterThanOrEqual(1800)
  await expectNet(page, Cube.fromString(scramble).move(route[0]).asString())
  await page.locator('.cube-coach-options > summary').click()
  await page.getByLabel('Autoplay speed').selectOption('fast')
  await page.getByRole('button', { name: 'Play remaining', exact: true }).click()
  await expect(page.locator('.solver-finished')).toContainText('All six faces solved.')
  await expectNet(page, new Cube().asString())
  await page.getByRole('button', { name: 'Reset case', exact: true }).click()
  await expectNet(page, scramble)
  await expect(page.locator('.solver-finished')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.solver-entry-review > p').first()).toContainText('6 of 6 faces filled')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cubiq-cube-entry')!))).toEqual(Object.fromEntries(INPUT_FACES.map((face, i) => [face, [...scramble.slice(i * 9, i * 9 + 9)]])))
})

test('a full scramble solves in the browser worker and the phone screen fits', async ({ page }) => {
  test.setTimeout(45_000)
  await page.goto('/#solver')
  await page.getByRole('button', { name: 'Try example cube', exact: true }).click()
  await page.screenshot({ path: '/tmp/cubiq-solver-entry.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Find short solution', exact: true }).click()
  await expect(page.locator('.solver-result-heading h2')).toContainText('-turn solution', { timeout: 20_000 })
  expect(Number((await page.locator('.solver-result-heading h2').textContent())!.split('-')[0])).toBeLessThanOrEqual(22)
  await expect(page.locator('.solver-phases')).toContainText('Prepare the pieces')
  await page.locator('.cube-trainer--coach').scrollIntoViewIfNeeded()
  await page.screenshot({ path: '/tmp/cubiq-solver-coach.png', fullPage: true })
  await page.locator('.cube-coach-options > summary').click()
  await page.getByLabel('Autoplay speed').selectOption('fast')
  await page.getByRole('button', { name: 'Play all', exact: true }).click()
  await expect(page.locator('.solver-finished')).toContainText('All six faces solved.', { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: 'Your cube is solved.', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 320, height: 740 })
  await page.getByRole('button', { name: 'Edit my cube', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: '/tmp/cubiq-solver-desktop.png', fullPage: true })
})

test('lessons show the whole goal, named steps, total count, and CFOP stages above the exercise', async ({ page }) => {
  await page.goto('/#learn')
  const roadmap = page.getByRole('navigation', { name: 'The four stages of CFOP' })
  await expect(roadmap).toBeVisible()
  for (const stage of ['Cross', 'F2L', 'OLL', 'PLL']) await expect(roadmap.getByRole('button').filter({ hasText: stage })).toBeVisible()
  const plan = page.getByRole('navigation', { name: 'Named lesson steps' })
  const total = await plan.getByRole('button').count()
  await expect(page.locator('.learn-lesson-goal')).toContainText('Your goal')
  await expect(page.locator('.learn-lesson-goal')).toContainText(`Lesson step 1 of ${total}`)
  await expect(plan.getByRole('button', { name: /^Step 1:/ })).toHaveAttribute('aria-current', 'step')
  await plan.getByRole('button', { name: /^Step 2:/ }).click()
  await expect(page.locator('.learn-lesson-goal')).toContainText(`Lesson step 2 of ${total}`)
  await plan.getByRole('button', { name: 'Knowledge check', exact: true }).click()
  await expect(page.locator('.learn-lesson-goal')).toContainText(`Lesson step ${total} of ${total}`)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
