import { expect, test } from '@playwright/test'

test('home screen renders top image and tabbed dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Foodie Me/)
  await expect(page.getByRole('img', { name: /cute cream food truck/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pick the next bite' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Foodie Me tabs' })).toBeVisible()

  await page.getByRole('button', { name: /quests/i }).click()
  await expect(page.getByRole('heading', { name: 'Food quests' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Best cozy breakfast date' })).toBeVisible()
})
