import { expect, test } from '@playwright/test'

test('home screen starts without fake active quest or settings', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Foodie Me/)
  await expect(page.getByRole('img', { name: /cute cream food truck/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Settings' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'No active quest yet', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Best cozy breakfast date' })).toHaveCount(0)

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

test('AI Research a quest saves a source-backed quest request to Quests and Home', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'AI', exact: true }).click()
  await page.getByRole('button', { name: 'Research a quest' }).click()
  await expect(page.getByRole('heading', { name: 'Research a quest' })).toBeVisible()
  await expect(page.getByText('Oraion will use Reddit, Eater/Infatuation, Google/Maps reviews, Yelp, and local food sources before any restaurant results are saved.')).toBeVisible()

  await page.getByRole('button', { name: 'Add quest for research' }).click()
  await expect(page.getByRole('alert')).toContainText('Add a food topic and city first.')

  await page.getByLabel('Food topic').fill('best sushi omakase')
  await page.getByLabel('City').fill('Los Angeles')
  await page.getByLabel('Notes').fill('Prefer west side, dinner date vibe, not too formal.')
  await expect(page.getByText('Eater LA')).toBeVisible()
  await expect(page.getByText('The Infatuation LA')).toBeVisible()
  await page.getByRole('button', { name: 'Add quest for research' }).click()

  await expect(page.getByRole('heading', { name: 'Food quests' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles' })).toBeVisible()
  await expect(page.getByText('Ready for source-backed research')).toBeVisible()
  await expect(page.getByText('Prefer west side, dinner date vibe, not too formal.')).toBeVisible()
  await expect(page.getByText('Reddit')).toBeVisible()
  await expect(page.getByText('Google/Maps reviews')).toBeVisible()

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles', level: 2 })).toBeVisible()
  await expect(page.getByText('Ready for source-backed research')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles', level: 2 })).toBeVisible()
})
