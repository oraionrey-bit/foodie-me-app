import { expect, test } from '@playwright/test'

test('cook tab renders recipe queue, filters, and detail view', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Cook', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What should we cook next?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'To try' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Curry-flavored grilled mackerel bento' })).toBeVisible()

  await page.getByRole('button', { name: 'Loved' }).click()
  await expect(page.getByRole('button', { name: 'Loved' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Cozy tomato bean skillet' })).toBeVisible()

  await page.getByRole('button', { name: 'Open' }).first().click()
  await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Steps' })).toBeVisible()
})

test('saving a manual recipe and marking it loved updates filters', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()

  await page.getByRole('button', { name: 'Save recipe' }).click()
  await page.getByRole('button', { name: 'Add to To Try' }).click()
  await expect(page.getByRole('alert')).toContainText('Add a recipe name first.')

  await page.getByLabel('Recipe name').fill('Crispy rice salad')
  await page.getByLabel('Source link').fill('https://example.com/crispy-rice-salad')
  await page.getByLabel('Source type').selectOption('website')
  await page.getByRole('combobox', { name: 'Category' }).selectOption('weeknight')
  await page.getByLabel('Why save it?').fill('Looks crunchy and bright for lunch.')
  await page.getByRole('button', { name: 'Add to To Try' }).click()

  await expect(page.getByRole('heading', { name: 'Crispy rice salad' })).toBeVisible()
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Crispy rice salad' })).toBeVisible()
  await page.getByRole('button', { name: 'Open' }).first().click()
  await expect(page.getByRole('heading', { name: 'Crispy rice salad' })).toBeVisible()
  await page.getByRole('button', { name: 'Loved it' }).click()

  await expect(page.getByRole('heading', { name: 'Crispy rice salad' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Loved' })).toHaveClass(/active/)
})

test('bad stored recipes fall back to mock data without crashing', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('foodie-me-recipes-v1', JSON.stringify([{ id: 'bad-shape', categories: 'nope', sourceType: 'javascript:' }]))
  })

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Curry-flavored grilled mackerel bento' })).toBeVisible()
})

test('unsupported source URLs are shown as text, not clickable links', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'foodie-me-recipes-v1',
      JSON.stringify([
        {
          id: 'unsafe-url-recipe',
          title: 'Unsafe URL recipe',
          sourceType: 'website',
          sourceUrl: 'javascript:alert(1)',
          status: 'to_try',
          categories: ['weeknight'],
          tags: [],
          ingredients: [{ id: 'i1', text: 'One ingredient' }],
          steps: [{ id: 's1', text: 'One step' }],
          capturedAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
          verdicts: [],
        },
      ]),
    )
  })

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()
  await page.getByRole('button', { name: 'Open' }).click()

  await expect(page.getByText('javascript:alert(1)')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open original source' })).toHaveCount(0)
})
