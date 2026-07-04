# Foodie Me

Foodie Me is a private couple food-quest tracker for planning restaurants by city, quest, and rating.

## Current milestone

This is the first public web preview:

- real selected food-truck header image at the top
- Healthy Me-inspired mobile Home screen
- fixed bottom tabs for Home, Cities, Quests, Rankings, and AI Research
- mock data only; no private backend or secrets yet

## Commands

Use Node 24 for local installs and builds. The repo includes `.nvmrc`, and CI/deploy workflows also run Node 24.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build:pages
npm run test:e2e
npm run verify
```

Useful targeted checks:

```bash
npm run test:e2e:desktop
npm run test:e2e:mobile
npm run test:e2e:tablet
npm run test:e2e:chromium
npm run deploy:check
npm run ci:local
```

Use `npm run deploy:check` for a faster local deployment sanity check before pushing. Use `npm run ci:local` for the full CI-style verification.

## Deployment

The app deploys to GitHub Pages via `.github/workflows/deploy-pages.yml`.

The deploy workflow:

1. installs dependencies with `npm ci`
2. runs typecheck
3. builds Vite output into `dist/`
4. prepares Pages artifacts with `.nojekyll` and `404.html`
5. runs Playwright tests across desktop Chromium, mobile Chromium, and tablet WebKit
6. deploys `dist/` to GitHub Pages

## Product direction

V1 should prioritize a working manual tracker before AI automation:

1. Cities
2. Quests
3. Restaurants
4. Quick couple ratings
5. Rankings
6. AI research review queue

AI research should suggest and cite restaurants, but never save candidates without review.
