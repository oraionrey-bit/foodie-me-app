import { expect, test } from '@playwright/test'

test('home screen is cleaned up around the active quest', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Foodie Me/)
  await expect(page.getByRole('img', { name: /cute cream food truck/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Settings' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Best cozy breakfast date', level: 2 })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Pick the next bite' })).toHaveCount(0)
  await expect(page.getByLabel('Foodie Me overview')).toHaveCount(0)
  await expect(page.getByText('Cook next')).toHaveCount(0)
})

test('bottom navigation order keeps Cook last', async ({ page }) => {
  await page.goto('/')

  const labels = await page
    .getByRole('navigation', { name: 'Foodie Me tabs' })
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.textContent?.replace(/\s+/g, ' ').trim()))

  expect(labels).toEqual(['🏠Home', '🍜Quests', '⭐Ranks', '🔎AI', '🍳Cook'])
})

test('quests, ranks, and AI tabs show cleanup placeholders and actions', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Food quests' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No quest cards yet' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Best cozy breakfast date' })).toHaveCount(0)

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Ranks', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ranks are on hold' })).toBeVisible()
  await expect(page.getByText('Current top casual bite')).toHaveCount(0)

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'AI', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Research a quest' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save recipe' })).toBeVisible()

  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page.getByRole('heading', { name: 'Cook', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Save a recipe idea' })).toBeVisible()
})
