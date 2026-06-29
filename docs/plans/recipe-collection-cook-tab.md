# Foodie Me Cook / Recipes Feature Plan

Status: initial V1 implementation is in place. This document now serves as planning/background for follow-up enhancements; verify current code before treating any section below as pending work.

## Goal

Add a **Cook** experience where Foodie Me can collect recipes from many sources, maintain a low-pressure "recipes to try" backlog, and keep only loved recipes in a tidy cooking library.

Core workflow:

1. Capture: save a recipe idea from a link, video, social post, screenshot/photo, or manual note.
2. Triage: put it into **To Try** with enough metadata to find it again.
3. Cook: use a concise, distraction-free recipe view while cooking.
4. Decide: mark it **Loved**, **Maybe**, or **Archive/Nope** after trying.
5. Keep: categorize only liked recipes for easy future cooking.

## Research notes

Competitive recipe apps emphasize:

- One-tap import from websites, TikTok/Instagram/YouTube, photos/screenshots, and handwritten cards.
- AI/automatic extraction of ingredients, steps, times, servings, and tags.
- A clean cooking view without the noisy original page.
- Search/filter by ingredient, category, diet, cook time, and custom cookbooks.
- Optional meal planning and grocery lists later, but these are not required for Foodie Me V1.

Technical references:

- `schema.org/Recipe` is the best normalized shape for imported web recipes. Useful fields: `name`, `image`, `description`, `prepTime`, `cookTime`, `totalTime`, `recipeYield`, `recipeCategory`, `recipeCuisine`, `recipeIngredient`, `recipeInstructions`, `nutrition`, `suitableForDiet`, `keywords`.
- Web Share Target can make an installed PWA appear in the OS share sheet, but MDN marks it experimental / not Baseline. Plan it as a later progressive enhancement, not the first implementation path.
- For static Vite/GitHub Pages hosting, true server-side URL/video extraction is not available in-app unless a backend/API is added. V1 should therefore support manual/paste capture and mock extraction states. Actual video/social extraction belongs behind a future backend or user-reviewed AI workflow.

## Existing codebase findings

Current project shape:

- App path: `/Users/oraion/Projects/foodie-me-app`
- Framework: Vite + React 19 + TypeScript.
- Main shell: `src/App.tsx`
- Styling: `src/App.css`
- Mock data: `src/data/mockFoodie.ts`
- Smoke test: `tests/e2e/home.spec.ts`
- Vite base path: `/foodie-me-app/` in `vite.config.ts`
- Deploy: GitHub Pages workflow at `.github/workflows/deploy-pages.yml`
- Commands in `package.json`:
  - `npm run dev`
  - `npm run typecheck`
  - `npm run build:pages`
  - `npm run test:e2e`
  - `npm run verify`

Current UX constraints to preserve:

- Cute Healthy Me-style mobile shell, with hero image, concise Home, rounded cards, pastel colors, and fixed bottom tabs.
- Existing tabs are `Home`, `Cities`, `Quests`, `Ranks`, `AI`.
- Home should stay concise; do not turn it into a dense dashboard.
- App is currently mock-only; no backend, auth, or secrets.

Git note:

- Working tree already has an untracked `live-foodie-me-pages.png`; this plan does not touch it.

## Product direction

Recommended IA change:

- Add a `Cook` bottom tab and keep five tabs by folding/renaming one existing area:
  - Preferred V1 tab set: `Home`, `Cook`, `Quests`, `Ranks`, `AI`.
  - Move city browsing into quests/details later, or expose city chips inside `Quests`.
- Reason: the user explicitly wants a recipes workflow; bottom tabs should stay concise and not exceed 5 items on mobile.

Alternative if Cities must remain:

- Use 6 tabs only temporarily, but expect cramped labels and weaker mobile ergonomics.
- Or rename `Quests` to `Explore` and nest Cities + Quests under it.

Home integration:

- Add only one small Cook card to Home after the stats row:
  - Eyebrow: `Cook next`
  - Title: next queued recipe name.
  - Body: `Saved from <source> · <time/category>`.
  - CTA: `Open Cook`.
- Do not add capture forms or recipe lists to Home.

## V1 scope

### In scope

- Mock-backed Cook tab.
- Recipe collection list with statuses:
  - `to_try`
  - `cooked`
  - `loved`
  - `archived`
- Add recipe capture UI for paste/manual entry. In V1 it can create local/mock state only.
- Source metadata for websites, social videos, screenshots/photos, cookbooks, and notes.
- Recipe detail/cooking view with ingredients, steps, notes, and verdict buttons.
- Category chips for saved/loved recipes.
- Search/filter by status/category/source.
- Local persistence with `localStorage` after mock data is loaded, if implementation is allowed to go beyond static mocks.
- E2E coverage for rendering Cook, adding a recipe draft, filtering, and marking loved.

### Out of scope for V1

- Real TikTok/Instagram/YouTube extraction.
- Server-side scraping.
- OCR from screenshots.
- Grocery list generation.
- Meal calendar.
- User accounts/sync.
- Trello automation from the app.

## Suggested data model

Create a new feature data module first, then split components later if the file grows.

File: `src/data/mockRecipes.ts`

```ts
export type RecipeSourceType =
  | 'website'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'photo'
  | 'cookbook'
  | 'manual'

export type RecipeStatus = 'to_try' | 'cooked' | 'loved' | 'archived'

export type RecipeCategory =
  | 'weeknight'
  | 'cozy'
  | 'breakfast'
  | 'dessert'
  | 'meal-prep'
  | 'date-night'
  | 'snack'
  | 'hosting'

export type RecipeIngredient = {
  id: string
  text: string
  checked?: boolean
}

export type RecipeStep = {
  id: string
  text: string
  timerMinutes?: number
}

export type RecipeVerdict = {
  cookedAt: string
  rating?: number
  lovedBy?: Array<'anthony' | 'tina'>
  notes?: string
  changesNextTime?: string
}

export type Recipe = {
  id: string
  title: string
  description?: string
  sourceType: RecipeSourceType
  sourceUrl?: string
  sourceLabel?: string
  imageUrl?: string
  status: RecipeStatus
  categories: RecipeCategory[]
  tags: string[]
  cuisine?: string
  yield?: string
  prepMinutes?: number
  cookMinutes?: number
  totalMinutes?: number
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  notes?: string
  capturedAt: string
  updatedAt: string
  verdicts: RecipeVerdict[]
}
```

Why this model:

- Keeps original source separate from normalized cookable recipe.
- Status supports the desired funnel: many saved ideas → try backlog → only loved recipes kept.
- Categories/tags keep future filtering simple.
- Ingredients/steps are structured enough for check-off/timers later but can start as plain text.
- Verdict history allows repeated cooking without losing notes.

## UI states and screens

### Cook tab default

Header title: `Cook`

Top card:

- Eyebrow: `Recipe queue`
- Title: `What should we cook next?`
- Body: counts for To Try and Loved.
- CTA: `Save recipe`

Segmented filters:

- `To try`
- `Loved`
- `Cooked`
- `Archived`

Secondary chips:

- `All`
- `Weeknight`
- `Cozy`
- `Breakfast`
- `Dessert`
- `Date night`
- etc.

Recipe cards:

- Title
- Source icon/label (`🌐 Blog`, `▶️ YouTube`, `📸 Photo`, etc.)
- Time/yield/category pill
- Short note or next action
- Status/verdict pill

Empty states:

- No recipes: `Paste a link or jot down a dish you want to try.` CTA `Save recipe`.
- No loved recipes: `Cook a few from To Try, then keep only the winners here.`
- No filter results: `No recipes match these chips yet.`

### Save recipe sheet/card

Because the current app has no modal framework, V1 can render an inline card at the top of the Cook tab.

Fields:

- `Recipe name` (required for manual V1)
- `Source link` (optional but primary capture path)
- `Source type` select/chips
- `Why save it?` short note
- `Category` chips

Actions:

- `Add to To Try`
- `Cancel`

Extraction state placeholders:

- `Pasted`: URL captured; user can add title/category.
- `Needs review`: future extracted recipe should not auto-save without user approval.
- `Saved`: recipe is in To Try.
- `Failed import`: keep original URL and let user save manually.

### Recipe detail / cooking view

V1 can use selected recipe state in `App.tsx` rather than routing.

Sections:

- Title + source pill + back button.
- Time/yield/category row.
- Ingredients checklist.
- Steps list with optional timer pills.
- Notes.
- Verdict actions:
  - `Loved it`
  - `Cooked / maybe`
  - `Archive`

After marking loved:

- Status becomes `loved`.
- Prompt for categories/tags if missing.
- Show confirmation: `Saved to loved recipes.`

### Home additions

Keep Home concise:

- Update stats from `6 quests / 39 places / 14 rated` to either keep as-is or add a single recipe stat only if it does not crowd the row.
- Recommended Home stat row after recipes exist:
  - `6 quests`
  - `12 recipes`
  - `5 loved`
- Add one compact Cook card below active quest or replace active quest on alternating priority later.

## Exact implementation files

Plan-only task stops here. Future implementation should use these files:

### Modify

- `src/App.tsx`
  - Add `cook` to `TabId`.
  - Update `tabs` array to include Cook.
  - Decide whether to remove/fold `cities` to preserve five tabs.
  - Add title mapping for `cook`.
  - Add Cook tab rendering and lightweight state for filters, selected recipe, and add form.
  - Add Home compact Cook card.

- `src/App.css`
  - Add styles for segmented filters, recipe cards, source pills, ingredient checklist, cooking steps, inline add form, and detail header.
  - Reuse existing `.card`, `.pill`, `.hero-card`, `.tab-page` styles where possible.
  - Ensure `.tab-bar` remains `repeat(5, 1fr)` if the tab count stays five.

- `src/data/mockFoodie.ts`
  - Optional: only update counts/exports if Home needs aggregate recipe stats from a shared module.
  - Prefer keeping restaurant/quest data separate from recipe data.

- `tests/e2e/home.spec.ts`
  - Update tab expectations if `Cities` is removed/folded.
  - Add smoke checks for the Cook tab.

- `README.md`
  - Update current milestone and product direction after implementation.

### Add

- `src/data/mockRecipes.ts`
  - Types above.
  - 6–8 starter recipes covering website, YouTube/social, photo/manual sources.
  - Include at least: 3 `to_try`, 2 `loved`, 1 `archived`.

- `tests/e2e/cook.spec.ts`
  - Test Cook tab render.
  - Test filters (`To try`, `Loved`).
  - Test add/manual save flow if implemented.
  - Test opening a recipe detail and marking loved if implemented.

Optional later split, once `App.tsx` gets too large:

- `src/components/CookTab.tsx`
- `src/components/RecipeCard.tsx`
- `src/components/RecipeDetail.tsx`
- `src/components/RecipeCaptureForm.tsx`
- `src/lib/recipeStorage.ts`

## Implementation sequence

1. Add `mockRecipes.ts` with data model and starter recipes.
2. Add Cook tab to `App.tsx`, preserving mobile shell and bottom tabs.
3. Render Cook list with status filter and category chips.
4. Add selected recipe detail/cooking view.
5. Add inline Save Recipe form with local component state.
6. Add optional `localStorage` persistence wrapper if state mutations are included.
7. Add concise Home Cook card and recipe stats.
8. Update CSS using existing pastel card language.
9. Add/update Playwright tests.
10. Run verification commands.

## Test plan

Manual checks:

- App opens at Home and still shows the food truck header image.
- Bottom tabs are visible, tappable, and not cramped on Pixel 5 viewport.
- Home remains concise.
- Cook tab shows queue counts and recipe cards.
- Filtering does not remove all content unexpectedly.
- Save form handles missing title with a friendly validation message.
- Recipe detail view can return to list.
- Verdict buttons update visible status.

Automated checks:

- Existing home smoke test still passes after expected text updates.
- New Cook smoke test covers:
  - Click `Cook` tab.
  - Expect heading `Cook`.
  - Expect `What should we cook next?`.
  - Click `Loved` filter and expect a loved recipe card.
  - Open a recipe and expect `Ingredients` / `Steps`.

Commands:

```bash
npm run typecheck
npm run build:pages
npm run test:e2e
npm run verify
```

Local development:

```bash
npm install
npm run dev
```

Preview production build:

```bash
npm run build:pages
npm run preview -- --host 127.0.0.1
```

Deploy:

- Push to `main`; `.github/workflows/deploy-pages.yml` runs typecheck/build/tests and deploys `dist/` to GitHub Pages.

## Risks / constraints

- Static GitHub Pages cannot securely scrape arbitrary recipe links or videos. Any real extraction should happen in a backend/edge function or explicitly through a user-provided API.
- Social platforms often restrict automated extraction and may require public URLs, embeds, or manual user entry.
- Web Share Target support is useful but not universal. Do not make it the only way to capture recipes.
- If adding a sixth tab, the current bottom bar (`repeat(5, 1fr)`) must change and visual density will suffer.
- Avoid private couple data in committed mocks; keep examples fictional.

## Future enhancements

- PWA manifest + installability.
- Web Share Target for installed app capture.
- Backend recipe extraction from JSON-LD and readable HTML.
- AI-assisted extraction with review queue, aligned with current AI tab philosophy: nothing saves until approved.
- OCR import for screenshots and cookbook photos.
- Grocery list generation from selected recipes.
- Meal planning calendar.
- Recipe scaling and unit conversion.
- Tags for dietary preferences, appliances, season, pantry ingredients, and effort level.

## Tracker items for Trello later

Trello CLI is currently blocked in the main session because `trello-api-key` / `trello-token` are missing from the vault. Port these items manually or after credentials are available.

Suggested cards:

1. **Plan Cook tab IA**
   - Decide final bottom tabs: `Home / Cook / Quests / Ranks / AI` vs alternative.
   - Acceptance: no more than 5 bottom tabs on mobile.

2. **Add recipe data model and mocks**
   - Add `src/data/mockRecipes.ts`.
   - Acceptance: includes statuses, sources, categories, ingredients, steps, verdicts.

3. **Build Cook tab list UI**
   - Render queue counts, status filters, category chips, cards.
   - Acceptance: works on Pixel 5 viewport and matches existing pastel style.

4. **Build recipe detail cooking view**
   - Ingredients, steps, notes, source, back action.
   - Acceptance: user can move between list and detail without route changes.

5. **Build save recipe form**
   - Paste URL/manual title/category/note.
   - Acceptance: adds a To Try recipe in local state with validation.

6. **Add verdict workflow**
   - Loved / Maybe / Archive actions.
   - Acceptance: loved recipes appear under Loved filter and can be categorized.

7. **Update Home summary**
   - Add one concise Cook card and recipe stats if needed.
   - Acceptance: Home remains short and cute.

8. **Add Playwright coverage**
   - Cook render, filters, detail, add flow.
   - Acceptance: `npm run verify` passes.

9. **Research real import backend**
   - JSON-LD extraction for websites first; videos/social later.
   - Acceptance: implementation proposal with privacy/rate-limit notes.

10. **PWA share target spike**
    - Manifest/service worker feasibility for GitHub Pages.
    - Acceptance: documented browser support and fallback path.
