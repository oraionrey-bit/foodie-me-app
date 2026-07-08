import { expect, test, type Page } from '@playwright/test'

async function expectNoHorizontalOverflow(page: Page) {
  const overflowReport = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth
    const offenders = Array.from(document.body.querySelectorAll<HTMLElement>('*'))
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className.toString(),
          text: element.textContent?.trim().slice(0, 80) || '',
          left: rect.left,
          right: rect.right,
          width: rect.width,
        }
      })
      .filter((item) => item.width > 0 && (item.left < -0.5 || item.right > clientWidth + 0.5))
    return {
      clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders,
    }
  })

  expect(overflowReport.scrollWidth).toBeLessThanOrEqual(overflowReport.clientWidth)
  expect(overflowReport.offenders).toEqual([])
}

test('home screen starts without fake active quest or settings', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No active quest yet' })).toBeVisible()
  await expect(page.getByText('Start with a food topic and city.')).toBeVisible()
  await expect(page.getByText('I’m feeling kimbap')).toHaveCount(0)
  await expect(page.getByText('Appetite settings')).toHaveCount(0)
  await expect(page.getByText('Auto-pick')).toHaveCount(0)
  await expect(page.getByText('Active plan')).toHaveCount(0)
  await expect(page.getByRole('article', { name: 'Foodie today' })).toBeVisible()
  await expect(page.getByText('0 active quests')).toBeVisible()
  await expect(page.getByText(/\d+ recipes to try/)).toBeVisible()
  await expect(page.getByRole('article', { name: 'Quick actions' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Cook' })).toBeVisible()
})

test('home shows richer active quest stats and quick actions', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-home-rich',
        city: 'Los Angeles',
        topic: 'Korean noodles',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-08T00:00:00.000Z',
        updatedAt: '2026-06-08T00:00:00.000Z',
        result: {
          summary: 'Home card research.',
          suggestions: [
            {
              name: 'Hangari Kalguksu',
              neighborhood: 'Koreatown',
              ratings: { tina: { notes: 'Cozy soup note', updatedAt: '2026-06-08T00:01:00.000Z' } },
            },
            {
              name: 'MDK Noodles',
              neighborhood: 'Koreatown',
              ratings: { anthony: { status: 'want_to_try', updatedAt: '2026-06-08T00:02:00.000Z' } },
            },
          ],
        },
      },
    ]))
  })
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Korean noodles in Los Angeles', level: 2 })).toBeVisible()
  await expect(page.getByText('Research ready')).toBeVisible()
  await expect(page.getByText('2 picks')).toBeVisible()
  await expect(page.getByText('1 saved notes')).toBeVisible()
  await expect(page.getByText('New latest rating')).toBeVisible()
  await expect(page.getByText('1 active quests')).toBeVisible()
  await expect(page.getByText('2 rated picks')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open quest' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'New quest' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Research a quest' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save recipe' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Cook' })).toBeVisible()
})

test('bottom navigation order keeps Cook last', async ({ page }) => {
  await page.goto('/')

  const tabs = page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button')
  await expect(tabs).toHaveText(['🏠Home', '🍜Quests', '⭐Ranks', '🔎AI', '🍳Cook'])
})

test('quests, ranks, and AI tabs show cleanup placeholders and actions', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Food quests' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No quest cards yet' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Research a quest' })).toBeVisible()

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Ranks', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Rankings' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Best saved bites' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No shared favorites yet' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open quests' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Research a quest' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Cook' })).toBeVisible()

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'AI', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Research a quest' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save recipe' })).toBeVisible()

  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page.getByRole('heading', { name: 'Cook', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Save a recipe idea' })).toBeVisible()
})

test('rankings derive useful sections from quest ratings and loved recipes', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-rankings',
        city: 'Los Angeles',
        topic: 'Date-night noodles',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-10T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
        result: {
          summary: 'Noodle research.',
          suggestions: [
            {
              name: 'Pine & Crane',
              neighborhood: 'Silver Lake',
              what_to_order: 'Dan dan noodles and thousand layer pancake',
              confidence: 'high',
              ratings: {
                tina: { status: 'tried_liked', score: 5, updatedAt: '2026-06-10T00:02:00.000Z' },
                anthony: { status: 'tried_liked', score: 4, updatedAt: '2026-06-10T00:03:00.000Z' },
              },
            },
            {
              name: 'Marugame Monzo',
              neighborhood: 'Little Tokyo',
              what_to_order: 'Mentai cream udon',
              confidence: 'medium',
              ratings: {
                tina: { score: 5, updatedAt: '2026-06-10T00:04:00.000Z' },
              },
            },
            {
              name: 'Ramen Nagi',
              neighborhood: 'Century City',
              what_to_order: 'Red King',
              confidence: 'high',
              ratings: {
                anthony: { status: 'tried_liked', updatedAt: '2026-06-10T00:05:00.000Z' },
              },
            },
          ],
        },
      },
    ]))
    window.localStorage.setItem('foodie-me-recipes-v3', JSON.stringify([
      {
        id: 'loved-rankings-recipe',
        title: 'Weekend miso pancakes',
        description: 'Fluffy pancakes with a little savory edge.',
        sourceType: 'manual',
        status: 'loved',
        categories: ['breakfast'],
        tags: ['keeper'],
        ingredients: [{ id: 'i1', text: 'Miso' }],
        steps: [{ id: 's1', text: 'Cook pancakes' }],
        notes: 'Tina and Anthony both wanted these again.',
        capturedAt: '2026-06-11T00:00:00.000Z',
        updatedAt: '2026-06-11T00:00:00.000Z',
        verdicts: [],
      },
    ]))
  })

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Ranks', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Both-loved picks' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tina-liked picks' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Anthony-liked picks' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Loved recipes' })).toBeVisible()
  await expect(page.locator('.ranking-section').filter({ has: page.getByRole('heading', { name: 'Both-loved picks' }) })).toContainText('Pine & Crane')
  await expect(page.locator('.ranking-section').filter({ has: page.getByRole('heading', { name: 'Both-loved picks' }) })).toContainText('Both liked it · high confidence')
  await expect(page.locator('.ranking-section').filter({ has: page.getByRole('heading', { name: 'Tina-liked picks' }) })).toContainText('Marugame Monzo')
  await expect(page.locator('.ranking-section').filter({ has: page.getByRole('heading', { name: 'Anthony-liked picks' }) })).toContainText('Ramen Nagi')
  await expect(page.locator('.ranking-section').filter({ has: page.getByRole('heading', { name: 'Loved recipes' }) })).toContainText('Weekend miso pancakes')
  await expect(page.getByText('Ranks are on hold')).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
})

test('rankings stay mobile friendly with long saved ranking text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await page.addInitScript(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-rankings-mobile',
        city: 'Los Angeles with a very long city-region name that still wraps',
        topic: 'Very long shared favorite quest topic with lots of descriptive words',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:00:00.000Z',
        result: {
          suggestions: [
            {
              name: 'A Very Long Restaurant Name With A SuperLongUnbrokenRankingTokenThatMustWrap',
              neighborhood: 'A long neighborhood and cross-street description',
              what_to_order: 'A very long signature order with SuperLongUnbrokenOrderTokenThatShouldNotCreateSideScroll',
              confidence: 'high',
              ratings: {
                tina: { status: 'tried_liked', score: 5, updatedAt: '2026-06-12T00:01:00.000Z' },
                anthony: { status: 'tried_liked', score: 5, updatedAt: '2026-06-12T00:02:00.000Z' },
              },
            },
          ],
        },
      },
    ]))
  })

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Ranks', exact: true }).click()
  await expect(page.locator('.ranking-section').filter({ has: page.getByRole('heading', { name: 'Both-loved picks' }) })).toContainText(/SuperLongUnbrokenRankingToken/)
  await expectNoHorizontalOverflow(page)
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
  await expect(page.getByText('I’ll prioritize Reddit/local chatter + LA editorial guides, then sanity-check reviews. Official restaurant pages are menu/location context only.')).toBeVisible()

  await page.getByRole('button', { name: 'Send quest to Oraion' }).click()
  await expect(page.getByRole('alert')).toContainText('Add a food topic and city first.')

  await page.getByLabel('Food topic').fill('best sushi omakase')
  await page.getByLabel('City').fill('Los Angeles')
  await page.getByLabel('Notes').fill('Prefer west side, dinner date vibe, not too formal.')
  await expect(page.getByText('Research plan')).toBeVisible()
  await expect(page.getByText('Reddit/local chatter + city editorial guides first, then review sanity checks. Official pages only help with menu and location context.')).toBeVisible()
  await page.getByRole('button', { name: 'Send quest to Oraion' }).click()

  await expect(page.getByRole('heading', { name: 'Food quests' })).toBeVisible()
  await expect(page.getByRole('button', { name: /best sushi omakase in Los Angeles/ })).toBeVisible()
  await expect(page.getByText('Prefer west side, dinner date vibe, not too formal.')).toBeVisible()
  await expect(page.getByText('Source checklist')).toHaveCount(0)

  await expect(page.getByText('Research ready')).toBeVisible()
  await expect(page.getByText('Two west side omakase picks with source links.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Sushi Tama/ })).toBeVisible()
  await expect(page.getByText('Strong reviews for a polished but approachable counter.')).toHaveCount(0)
  await page.getByRole('button', { name: /Sushi Tama/ }).click()
  await expect(page.getByText('Strong reviews for a polished but approachable counter.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Eater LA' })).toHaveAttribute('href', 'https://la.eater.com/example')

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles', level: 2 })).toBeVisible()
  await expect(page.getByText('Research ready')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'best sushi omakase in Los Angeles', level: 2 })).toBeVisible()
})

test('stored relay error quests recover when server status is ready', async ({ page }) => {
  await page.route('https://chat.withluna.dev/foodie/quests/foodie-stale-error/status?token=stale-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'foodie-stale-error',
        status: 'ready',
        status_message: 'Research ready',
        updated_at: '2026-06-01T00:00:03.000Z',
        result: {
          summary: 'Recovered pastry research.',
          suggestions: [
            {
              name: 'République',
              neighborhood: 'La Brea',
              why: 'Source-backed pastry counter pick.',
              what_to_order: 'Croissant',
              confidence: 'high',
              sources: [{ label: 'Eater LA', url: 'https://la.eater.com/example' }],
            },
          ],
        },
      }),
    })
  })

  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'local-stale-error',
        relayId: 'foodie-stale-error',
        statusToken: 'stale-token',
        city: 'Los Angeles',
        topic: 'Pastries',
        status: 'error',
        statusMessage: 'Oraion research worker returned invalid JSON.',
        error: 'Oraion research worker returned invalid JSON.',
        sources: ['Reddit', 'Eater LA'],
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:01.000Z',
      },
    ]))
  })
  await page.reload()

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await expect(page.getByRole('button', { name: /Pastries in Los Angeles/ })).toBeVisible()
  await expect(page.getByText('Research ready')).toBeVisible()
  await expect(page.getByText('Recovered pastry research.')).toBeVisible()
  await expect(page.getByText('Oraion research worker returned invalid JSON.')).toHaveCount(0)
})

test('researching quests poll on interval instead of looping on changing timestamps', async ({ page }) => {
  let statusCalls = 0
  await page.route('https://chat.withluna.dev/foodie/quests/foodie-loop-guard/status?token=loop-token', async (route) => {
    statusCalls += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'foodie-loop-guard',
        status: 'researching',
        status_message: 'Oraion is still checking source-backed picks.',
        updated_at: new Date().toISOString(),
      }),
    })
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'local-loop-guard',
        relayId: 'foodie-loop-guard',
        statusToken: 'loop-token',
        city: 'Los Angeles',
        topic: 'Tacos',
        status: 'researching',
        statusMessage: 'Oraion is still checking source-backed picks.',
        sources: ['Reddit', 'Eater LA'],
        createdAt: '2026-06-03T00:00:00.000Z',
        updatedAt: '2026-06-03T00:00:01.000Z',
      },
    ]))
  })
  await page.reload()
  await page.waitForTimeout(1200)
  await expect.poll(() => statusCalls).toBeLessThanOrEqual(2)

  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await expect(page.getByRole('button', { name: /Tacos in Los Angeles/ })).toBeVisible()
})

test('stored quests and restaurant suggestions are collapsible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    const quests = [
      {
        id: 'quest-new',
        city: 'Los Angeles',
        topic: 'Pizza',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit', 'Eater LA'],
        createdAt: '2026-06-02T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
        result: {
          summary: 'New pizza summary.',
          suggestions: [
            {
              name: 'Quarter Sheets',
              neighborhood: 'Echo Park',
              why: 'Crowd-backed pan pizza pick.',
              what_to_order: 'Sicilian slice',
              confidence: 'high',
              sources: [{ label: 'Eater LA', url: 'https://la.eater.com/pizza' }],
            },
          ],
        },
      },
      {
        id: 'quest-old',
        city: 'Los Angeles',
        topic: 'Bagels',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
        result: {
          summary: 'Older bagel summary.',
          suggestions: [{ name: 'Courage Bagels', neighborhood: 'Virgil Village', why: 'Lines and local chatter.' }],
        },
      },
    ]
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify(quests))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()

  await expect(page.getByRole('button', { name: /Pizza in Los Angeles/ })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText('New pizza summary.')).toHaveCount(0)
  await page.getByRole('button', { name: /Pizza in Los Angeles/ }).click()
  await expect(page.getByRole('button', { name: /Pizza in Los Angeles/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('New pizza summary.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Bagels in Los Angeles/ })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText('Older bagel summary.')).toHaveCount(0)

  await expect(page.getByRole('button', { name: /Quarter Sheets/ })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText('Crowd-backed pan pizza pick.')).toHaveCount(0)
  await page.getByRole('button', { name: /Quarter Sheets/ }).click()
  await expect(page.getByRole('button', { name: /Quarter Sheets/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Crowd-backed pan pizza pick.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Eater LA' })).toBeVisible()
})

test('long quest history renders in capped batches with show more', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    const quests = Array.from({ length: 12 }, (_, index) => ({
      id: `quest-page-${index + 1}`,
      city: 'Los Angeles',
      topic: `Paging quest ${index + 1}`,
      status: 'ready',
      statusMessage: 'Research ready',
      sources: ['Reddit'],
      createdAt: `2026-06-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
      updatedAt: `2026-06-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
      result: {
        summary: `Summary ${index + 1}`,
        suggestions: [{ name: `Restaurant ${index + 1}`, neighborhood: 'Echo Park' }],
      },
    }))
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify(quests))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()

  await expect(page.getByRole('button', { name: /Paging quest 1 in Los Angeles/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Paging quest 10 in Los Angeles/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Paging quest 11 in Los Angeles/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Show 2 more quests' })).toBeVisible()

  await page.getByRole('button', { name: 'Show 2 more quests' }).click()
  await expect(page.getByRole('button', { name: /Paging quest 11 in Los Angeles/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Paging quest 12 in Los Angeles/ })).toBeVisible()
})

test('restaurant rating persists through questRequests storage', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-rating',
        city: 'Los Angeles',
        topic: 'Tacos',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-03T00:00:00.000Z',
        updatedAt: '2026-06-03T00:00:00.000Z',
        result: {
          summary: 'Taco research.',
          suggestions: [
            {
              name: 'Sonoratown',
              neighborhood: 'Downtown',
              why: 'Flour tortilla favorite.',
              what_to_order: 'Chivichanga',
              confidence: 'high',
            },
          ],
        },
      },
    ]))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: /Tacos in Los Angeles/ }).click()
  await page.getByRole('button', { name: /Sonoratown/ }).click()
  await page.getByLabel('Tina status').getByRole('button', { name: 'Want to try' }).click()
  await page.getByLabel('Tina optional score').getByRole('button', { name: '5' }).click()
  await page.getByLabel('Tina note').fill('Go after Grand Central Market.')
  await page.getByLabel('Anthony status').getByRole('button', { name: 'Liked' }).click()
  await page.getByLabel('Anthony optional score').getByRole('button', { name: '4' }).click()
  await page.getByLabel('Anthony note').fill('Anthony wants extra salsa.')

  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: /Tacos in Los Angeles/ }).click()
  await expect(page.getByRole('button', { name: /Sonoratown/ })).toContainText('Tina: Want to try · 5/5')
  await expect(page.getByRole('button', { name: /Sonoratown/ })).toContainText('Anthony: Liked · 4/5')
  await page.getByRole('button', { name: /Sonoratown/ }).click()
  await expect(page.getByLabel('Tina note')).toHaveValue('Go after Grand Central Market.')
  await expect(page.getByLabel('Anthony note')).toHaveValue('Anthony wants extra salsa.')
})

test('note-only restaurant rating persists and shows a collapsed badge after reload', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-note-only',
        city: 'Los Angeles',
        topic: 'Burgers',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-09T00:00:00.000Z',
        updatedAt: '2026-06-09T00:00:00.000Z',
        result: {
          summary: 'Burger research.',
          suggestions: [{ name: 'Amboy', neighborhood: 'Chinatown', why: 'Burger counter favorite.' }],
        },
      },
    ]))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: /Burgers in Los Angeles/ }).click()
  await page.getByRole('button', { name: /Amboy/ }).click()
  await expect(page.getByText('Saved on this device')).toHaveCount(2)
  await page.getByLabel('Tina note').fill('Try the double and fries.')
  await expect(page.getByText('Saved on this device')).toHaveCount(2)

  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem('foodie-me-quest-research-v2') || '[]')
    return stored[0].result.suggestions[0].ratings?.tina?.notes
  })).toBe('Try the double and fries.')

  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: /Burgers in Los Angeles/ }).click()
  await expect(page.getByRole('button', { name: /Amboy/ })).toContainText('Tina: note saved')
  await page.getByRole('button', { name: /Amboy/ }).click()
  await expect(page.getByLabel('Tina note')).toHaveValue('Try the double and fries.')
})

test('relay-backed restaurant notes sync through Foodie relay and survive reload', async ({ page }) => {
  let patchedNote = ''
  let patchCalls = 0
  await page.route('https://chat.withluna.dev/foodie/quests/relay-synced-ratings/ratings?token=sync-token', async (route) => {
    patchCalls += 1
    expect(route.request().method()).toBe('PATCH')
    const body = route.request().postDataJSON() as { suggestion_key: string; owner: string; rating: { notes?: string } }
    expect(body.suggestion_key).toBe('quest-synced-rating-0-amboy-chinatown')
    expect(body.owner).toBe('tina')
    patchedNote = body.rating.notes || ''
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'relay-synced-ratings',
        status: 'ready',
        status_message: 'Research ready',
        updated_at: '2026-06-09T00:01:00.000Z',
        result: {
          summary: 'Burger research.',
          suggestions: [{ name: 'Amboy', neighborhood: 'Chinatown', why: 'Burger counter favorite.', ratings: { tina: { notes: patchedNote, updatedAt: '2026-06-09T00:01:00.000Z' } } }],
        },
      }),
    })
  })
  await page.route('https://chat.withluna.dev/foodie/quests/relay-synced-ratings/status?token=sync-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'relay-synced-ratings',
        status: 'ready',
        status_message: 'Research ready',
        updated_at: '2026-06-09T00:01:00.000Z',
        result: {
          summary: 'Burger research.',
          suggestions: [{ name: 'Amboy', neighborhood: 'Chinatown', why: 'Burger counter favorite.', ratings: { tina: { notes: patchedNote, updatedAt: '2026-06-09T00:01:00.000Z' } } }],
        },
      }),
    })
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-synced-rating',
        relayId: 'relay-synced-ratings',
        statusToken: 'sync-token',
        city: 'Los Angeles',
        topic: 'Burgers',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-09T00:00:00.000Z',
        updatedAt: '2026-06-09T00:00:00.000Z',
        syncedReadyAt: '2026-06-09T00:00:00.000Z',
        result: { summary: 'Burger research.', suggestions: [{ name: 'Amboy', neighborhood: 'Chinatown', why: 'Burger counter favorite.' }] },
      },
    ]))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: /Burgers in Los Angeles/ }).click()
  await page.getByRole('button', { name: /Amboy/ }).click()
  await expect(page.getByText('Synced through Foodie Me')).toHaveCount(2)
  await page.getByLabel('Tina note').fill('Relay synced note.')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await expect.poll(() => patchCalls).toBeGreaterThan(0)

  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: /Burgers in Los Angeles/ }).click()
  await page.getByRole('button', { name: /Amboy/ }).click()
  await expect(page.getByLabel('Tina note')).toHaveValue('Relay synced note.')
})

test('ready quests do one background refresh and keep local ratings', async ({ page }) => {
  await page.route('https://chat.withluna.dev/foodie/quests/foodie-ready-refresh/status?token=ready-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'foodie-ready-refresh',
        status: 'ready',
        status_message: 'Research ready',
        updated_at: '2026-06-05T00:00:03.000Z',
        result: {
          summary: 'Updated crowd/editorial-first research.',
          suggestions: [
            {
              name: 'Porto’s Bakery & Cafe',
              neighborhood: 'Glendale',
              why: 'Updated independent-source summary.',
              what_to_order: 'Cheese roll',
              confidence: 'high',
              sources: [{ label: 'Eater LA', url: 'https://la.eater.com/example' }],
            },
          ],
        },
      }),
    })
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'local-ready-refresh',
        relayId: 'foodie-ready-refresh',
        statusToken: 'ready-token',
        city: 'Los Angeles',
        topic: 'Pastries',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit', 'Eater LA'],
        createdAt: '2026-06-05T00:00:00.000Z',
        updatedAt: '2026-06-05T00:00:01.000Z',
        result: {
          summary: 'Old result with official source.',
          suggestions: [
            {
              name: 'Porto’s Bakery & Cafe',
              neighborhood: 'Glendale',
              why: 'Old source summary.',
              what_to_order: 'Cheese roll',
              confidence: 'high',
              sources: [{ label: 'Porto’s official site', url: 'https://www.portosbakery.com/' }],
              rating: { status: 'want_to_try', score: 5, notes: 'Keep this note' },
            },
          ],
        },
      },
    ]))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()

  await page.getByRole('button', { name: /Pastries in Los Angeles/ }).click()
  await expect(page.getByText('Updated crowd/editorial-first research.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Porto’s Bakery/ })).toContainText('Tina: Want to try · 5/5')
  await page.getByRole('button', { name: /Porto’s Bakery/ }).click()
  await expect(page.getByLabel('Tina note')).toHaveValue('Keep this note')
  await expect(page.getByRole('link', { name: 'Eater LA' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Porto’s official site' })).toHaveCount(0)
})

test('duplicate restaurant names keep separate ratings', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-duplicates',
        city: 'Los Angeles',
        topic: 'Pizza',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-04T00:00:00.000Z',
        updatedAt: '2026-06-04T00:00:00.000Z',
        result: {
          summary: 'Duplicate name research.',
          suggestions: [
            {
              name: 'Same Place',
              neighborhood: 'Downtown',
              why: 'First location.',
              what_to_order: 'Slice one',
              confidence: 'medium',
            },
            {
              name: 'Same Place',
              neighborhood: 'Downtown',
              why: 'Second location should not share state.',
              what_to_order: 'Slice two',
              confidence: 'medium',
            },
          ],
        },
      },
    ]))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()

  await page.getByRole('button', { name: /Pizza in Los Angeles/ }).click()
  const duplicateButtons = page.getByRole('button', { name: /Same Place/ })
  await expect(duplicateButtons).toHaveCount(2)
  await duplicateButtons.nth(0).click()
  await page.getByLabel('Tina status').getByRole('button', { name: 'Liked' }).click()

  await expect(duplicateButtons.nth(0)).toContainText('Tina: Liked')
  await expect(duplicateButtons.nth(1)).not.toContainText('Liked')
})

test('quest delete confirms, cancels, removes local card, and calls relay delete', async ({ page }) => {
  let deleteCalls = 0
  await page.route('https://chat.withluna.dev/foodie/quests/relay-delete-me/status?token=delete-token', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteCalls += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: true }) })
      return
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not found' }) })
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-delete',
        relayId: 'relay-delete-me',
        statusToken: 'delete-token',
        city: 'Los Angeles',
        topic: 'Dumplings',
        status: 'ready',
        statusMessage: 'Research ready',
        sources: ['Reddit'],
        createdAt: '2026-06-06T00:00:00.000Z',
        updatedAt: '2026-06-06T00:00:00.000Z',
        result: { summary: 'Dumpling research.', suggestions: [{ name: 'Hui Tou Xiang', neighborhood: 'San Gabriel' }] },
      },
    ]))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()

  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Delete this quest?')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('button', { name: /Dumplings in Los Angeles/ })).toBeVisible()

  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Yes, delete quest' }).click()
  await expect(page.getByRole('button', { name: /Dumplings in Los Angeles/ })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'No quest cards yet' })).toBeVisible()
  await expect.poll(() => deleteCalls).toBe(1)
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('foodie-me-quest-research-v2') || '[]').length)).toBe(0)

  const storedQuestCount = await page.evaluate(() => JSON.parse(window.localStorage.getItem('foodie-me-quest-research-v2') || '[]').length)
  expect(storedQuestCount).toBe(0)
})

test('mobile quest cards wrap long quest and suggestion text within viewport', async ({ page }) => {
  const viewportWidth = 320
  await page.setViewportSize({ width: viewportWidth, height: 812 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('foodie-me-quest-research-v2', JSON.stringify([
      {
        id: 'quest-mobile-long',
        city: 'Los Angeles with an extra long neighborhood corridor name that should wrap',
        topic: 'Extremely long crispy spicy noodle soup pop-up quest with lots of descriptive words',
        status: 'ready',
        statusMessage: 'Research ready with a very long status label that still wraps',
        sources: ['Reddit'],
        createdAt: '2026-06-07T00:00:00.000Z',
        updatedAt: '2026-06-07T00:00:00.000Z',
        result: {
          summary: 'A long summary that should wrap cleanly on a narrow iPhone-sized screen without forcing horizontal scrolling.',
          suggestions: [
            {
              name: 'A Very Long Restaurant Name With Multiple Words And Hyphenated Pop-Up Details',
              neighborhood: 'A very long neighborhood and cross-street descriptor',
              why: 'Long source-backed explanation that should stay readable and use the same comfortable text size as other quest copy.',
              what_to_order: 'A very long order name with add-ons, substitutions, sauces, and combo notes that should wrap plus SuperLongUnbrokenOrderTokenWithNoSpacesThatPreviouslyForcedSidewaysScrollingAcrossThePhoneViewport',
              confidence: 'high',
              sources: [{ label: 'An extraordinarily long source label that should wrap', url: 'https://example.com/a/really/long/source/path' }],
            },
          ],
        },
      },
    ]))
  })
  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: /Extremely long crispy spicy noodle soup/ }).click()
  await page.getByRole('button', { name: /A Very Long Restaurant Name/ }).click()

  const questBox = await page.locator('.quest-card').first().boundingBox()
  const suggestionBox = await page.locator('.quest-suggestion').first().boundingBox()
  const orderPreviewBox = await page.locator('.suggestion-order-preview').first().boundingBox()
  const orderDetailBox = await page.locator('.suggestion-order-detail').first().boundingBox()
  expect(questBox).not.toBeNull()
  expect(suggestionBox).not.toBeNull()
  expect(orderPreviewBox).not.toBeNull()
  expect(orderDetailBox).not.toBeNull()
  expect(questBox!.x).toBeGreaterThanOrEqual(0)
  expect(suggestionBox!.x).toBeGreaterThanOrEqual(0)
  expect(orderPreviewBox!.x).toBeGreaterThanOrEqual(0)
  expect(orderDetailBox!.x).toBeGreaterThanOrEqual(0)
  expect(questBox!.x + questBox!.width).toBeLessThanOrEqual(viewportWidth)
  expect(suggestionBox!.x + suggestionBox!.width).toBeLessThanOrEqual(viewportWidth)
  expect(orderPreviewBox!.x + orderPreviewBox!.width).toBeLessThanOrEqual(viewportWidth)
  expect(orderDetailBox!.x + orderDetailBox!.width).toBeLessThanOrEqual(viewportWidth)
  await expect(page.locator('.rating-owner-card')).toHaveCount(2)
  await expectNoHorizontalOverflow(page)
})
