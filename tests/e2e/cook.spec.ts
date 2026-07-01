import { expect, test } from '@playwright/test'

const shizukuRecipeNames = [
  'Curry-flavored grilled mackerel bento',
  'Meatballs + okahijiki pasta bento',
  'Salt-koji salmon + soccer-ball onigiri bento',
  'Mille-feuille cheese cutlet sandwich bento',
  'Honey plums / honey plum soda',
]

test('cook tab starts with Shizuku recipes in To try and empty Loved', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Cook', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What should we cook next?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'To try' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Cooked' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Archived' })).toHaveCount(0)

  for (const recipeName of shizukuRecipeNames) {
    await expect(page.getByRole('heading', { name: recipeName })).toBeVisible()
  }

  await page.getByRole('button', { name: 'Loved' }).click()
  await expect(page.getByRole('button', { name: 'Loved' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'No loved recipes here yet' })).toBeVisible()
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

test('delete verdict removes a recipe from the queue', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()

  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Curry-flavored grilled mackerel bento' }) }).getByRole('button', { name: 'Open' }).click()
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Delete this recipe')
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByRole('heading', { name: 'Curry-flavored grilled mackerel bento' })).toHaveCount(0)
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Curry-flavored grilled mackerel bento' })).toHaveCount(0)
})

test('v1 storage migrates user loved recipes and drops old seeds plus non-loved statuses', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'foodie-me-recipes-v1',
      JSON.stringify([
        {
          id: 'cozy-tomato-bean-skillet',
          title: 'Cozy tomato bean skillet',
          sourceType: 'website',
          status: 'loved',
          categories: ['cozy'],
          tags: [],
          ingredients: [{ id: 'i1', text: 'Beans' }],
          steps: [{ id: 's1', text: 'Simmer' }],
          capturedAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
          verdicts: [],
        },
        {
          id: 'user-loved-v1-recipe',
          title: 'Grandma saved udon',
          sourceType: 'manual',
          status: 'loved',
          categories: ['cozy'],
          tags: ['family'],
          ingredients: [{ id: 'i1', text: 'Udon noodles' }],
          steps: [{ id: 's1', text: 'Warm gently' }],
          capturedAt: '2026-05-02T00:00:00.000Z',
          updatedAt: '2026-05-02T00:00:00.000Z',
          verdicts: [],
        },
        {
          id: 'user-cooked-v1-recipe',
          title: 'Temporary cooked soup',
          sourceType: 'manual',
          status: 'cooked',
          categories: ['weeknight'],
          tags: [],
          ingredients: [{ id: 'i1', text: 'Stock' }],
          steps: [{ id: 's1', text: 'Heat' }],
          capturedAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z',
          verdicts: [],
        },
        {
          id: 'user-archived-v1-recipe',
          title: 'Archived test cake',
          sourceType: 'manual',
          status: 'archived',
          categories: ['dessert'],
          tags: [],
          ingredients: [{ id: 'i1', text: 'Flour' }],
          steps: [{ id: 's1', text: 'Bake' }],
          capturedAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z',
          verdicts: [],
        },
      ]),
    )
  })

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Cozy tomato bean skillet' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Temporary cooked soup' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Archived test cake' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Loved' }).click()
  await expect(page.getByRole('heading', { name: 'Grandma saved udon' })).toBeVisible()
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()
  await page.getByRole('button', { name: 'Loved' }).click()
  await expect(page.getByRole('heading', { name: 'Grandma saved udon' })).toBeVisible()
})

test('bad stored recipes fall back to mock data without crashing', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('foodie-me-recipes-v2', JSON.stringify([{ id: 'bad-shape', categories: 'nope', sourceType: 'javascript:' }]))
  })

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Cook', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Curry-flavored grilled mackerel bento' })).toBeVisible()
})

test('unsupported source URLs are shown as text, not clickable links', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'foodie-me-recipes-v3',
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
