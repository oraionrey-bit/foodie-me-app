import { expect, test } from '@playwright/test'

test('home screen starts without fake active quest or settings', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No active quest yet' })).toBeVisible()
  await expect(page.getByText('Start with a food topic and city.')).toBeVisible()
  await expect(page.getByText('I’m feeling kimbap')).toHaveCount(0)
  await expect(page.getByText('Appetite settings')).toHaveCount(0)
  await expect(page.getByText('Auto-pick')).toHaveCount(0)
  await expect(page.getByText('Active plan')).toHaveCount(0)
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
  await expect(page.getByText('Ranking cards will come back when we are ready to compare favorites.')).toBeVisible()

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
  await page.getByRole('button', { name: /Sonoratown/ }).click()
  await page.getByLabel('Tina status').getByRole('button', { name: 'Want to try' }).click()
  await page.getByLabel('Tina optional score').getByRole('button', { name: '5' }).click()
  await page.getByLabel('Tina note').fill('Go after Grand Central Market.')
  await page.getByLabel('Anthony status').getByRole('button', { name: 'Liked' }).click()
  await page.getByLabel('Anthony optional score').getByRole('button', { name: '4' }).click()
  await page.getByLabel('Anthony note').fill('Anthony wants extra salsa.')

  await page.reload()
  await page.getByRole('navigation', { name: 'Foodie Me tabs' }).getByRole('button', { name: 'Quests', exact: true }).click()
  await expect(page.getByRole('button', { name: /Sonoratown/ })).toContainText('Tina: Want to try · 5/5')
  await expect(page.getByRole('button', { name: /Sonoratown/ })).toContainText('Anthony: Liked · 4/5')
  await page.getByRole('button', { name: /Sonoratown/ }).click()
  await expect(page.getByLabel('Tina note')).toHaveValue('Go after Grand Central Market.')
  await expect(page.getByLabel('Anthony note')).toHaveValue('Anthony wants extra salsa.')
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

  const storedQuestCount = await page.evaluate(() => JSON.parse(window.localStorage.getItem('foodie-me-quest-research-v2') || '[]').length)
  expect(storedQuestCount).toBe(0)
})

test('mobile quest cards wrap long quest and suggestion text within viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
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
              what_to_order: 'A very long order name with add-ons, substitutions, sauces, and combo notes that should wrap',
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
  await page.getByRole('button', { name: /A Very Long Restaurant Name/ }).click()

  const questBox = await page.locator('.quest-card').first().boundingBox()
  const suggestionBox = await page.locator('.quest-suggestion').first().boundingBox()
  expect(questBox).not.toBeNull()
  expect(suggestionBox).not.toBeNull()
  expect(questBox!.x).toBeGreaterThanOrEqual(0)
  expect(suggestionBox!.x).toBeGreaterThanOrEqual(0)
  expect(questBox!.x + questBox!.width).toBeLessThanOrEqual(375)
  expect(suggestionBox!.x + suggestionBox!.width).toBeLessThanOrEqual(375)
  await expect(page.locator('.rating-owner-card')).toHaveCount(2)
})
