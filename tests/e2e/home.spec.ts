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

test('AI Research a quest sends a source-backed quest request to Oraion and shows results', async ({ page }) => {
  let statusCalls = 0
  await page.route('https://chat.withluna.dev/foodie/quests', async (route) => {
    expect(route.request().method()).toBe('POST')
    const body = route.request().postDataJSON() as { topic: string; city: string; notes: string; sources: string[] }
    expect(body.topic).toBe('best sushi omakase')
    expect(body.city).toBe('Los Angeles')
    expect(body.sources).toContain('Reddit')
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'foodie-test-quest',
        status_token: 'status-token-123',
        status: 'queued',
        status_message: 'Queued for Oraion research.',
        updated_at: '2026-06-01T00:00:00.000Z',
      }),
    })
  })
  await page.route('https://chat.withluna.dev/foodie/quests/foodie-test-quest/status?token=status-token-123', async (route) => {
    statusCalls += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(statusCalls === 1
        ? {
            id: 'foodie-test-quest',
            status: 'researching',
            status_message: 'Oraion is checking Reddit and local sources.',
            updated_at: '2026-06-01T00:00:01.000Z',
          }
        : {
            id: 'foodie-test-quest',
            status: 'ready',
            status_message: 'Research ready',
            updated_at: '2026-06-01T00:00:02.000Z',
            result: {
              summary: 'Two west side omakase picks with source links.',
              suggestions: [
                {
                  name: 'Sushi Tama',
                  neighborhood: 'Beverly Grove',
                  why: 'Strong reviews for a polished but approachable counter.',
                  what_to_order: 'Omakase set',
                  confidence: 'high',
                  sources: [{ label: 'Eater LA', url: 'https://la.eater.com/example' }],
                },
              ],
            },
          }),
    })
  })

  await page.goto('/')

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'AI', exact: true }).click()
  await page.getByRole('button', { name: 'Research a quest' }).click()
  await expect(page.getByRole('heading', { name: 'Research a quest' })).toBeVisible()
  await expect(page.getByText('Oraion will use Reddit, Eater/Infatuation, Google/Maps reviews, Yelp, and local food sources before any restaurant results are saved.')).toBeVisible()

  await page.getByRole('button', { name: 'Send quest to Oraion' }).click()
  await expect(page.getByRole('alert')).toContainText('Add a food topic and city first.')

  await page.getByLabel('Food topic').fill('best sushi omakase')
  await page.getByLabel('City').fill('Los Angeles')
  await page.getByLabel('Notes').fill('Prefer west side, dinner date vibe, not too formal.')
  await expect(page.getByText('Eater LA')).toBeVisible()
  await expect(page.getByText('The Infatuation LA')).toBeVisible()
  await page.getByRole('button', { name: 'Send quest to Oraion' }).click()

  await expect(page.getByRole('heading', { name: 'Food quests' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles' })).toBeVisible()
  await expect(page.getByText('Prefer west side, dinner date vibe, not too formal.')).toBeVisible()
  await expect(page.getByText('Reddit')).toBeVisible()
  await expect(page.getByText('Google/Maps reviews')).toBeVisible()

  await expect(page.getByText('Research ready')).toBeVisible()
  await expect(page.getByText('Two west side omakase picks with source links.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sushi Tama' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Eater LA' })).toHaveAttribute('href', 'https://la.eater.com/example')

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles', level: 2 })).toBeVisible()
  await expect(page.getByText('Research ready')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles', level: 2 })).toBeVisible()
})
