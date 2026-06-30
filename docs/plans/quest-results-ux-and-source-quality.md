# Quest Results UX + Source Quality Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make Foodie Me quest results easier to scan and more trustworthy: no confusing source checklist tabs, collapsible quest/result cards, persistent restaurant ratings, and stricter research prompts that prioritize crowd/editorial evidence over official restaurant pages.

**Architecture:** Keep Foodie Me static-first. Persist user-side UI state and ratings in the existing `questRequests` localStorage object. Improve the relay prompt for future AI research jobs; do not add a backend database yet. Existing quest results should remain readable through normalizers/migrations.

**Tech Stack:** React + TypeScript + Vite + Playwright in `/Users/oraion/Projects/foodie-me-app`; Node relay in `/Users/oraion/Projects/healthy-me-app/src/relay/server.js`.

---

## Acceptance Criteria

1. Source checklist UI is clearly a research plan, not sorting/order tabs.
2. If per-restaurant source links are shown, the bottom checklist is reduced/removed so it does not feel redundant.
3. Restaurant suggestions do not treat official restaurant websites as proof of quality; official sites can be context only, after crowd/editorial/review sources.
4. Future AI prompt explicitly requires Reddit/local crowd checks when available and city/category-specific sources.
5. Quest cards are collapsible; multiple quests do not all consume the page.
6. Restaurant suggestion cards inside an expanded quest are collapsible.
7. Suggested restaurants can be rated/saved with persistent local ratings/notes.
8. Existing stored quests/results still load safely.
9. E2E tests cover collapsed quests, expanded restaurant cards, ratings persistence, and source checklist wording.
10. Deploy only after local verification, PR CI, Pages deploy, and relay restart verification.

---

## Product Decisions

- Default quest list state: newest quest expanded, older quests collapsed. A user can expand/collapse any quest.
- Default restaurant state: compact rows by default. User taps a restaurant to expand why/order/sources/rating controls.
- Rating model V1: `want_to_try | tried_liked | tried_ok | skip`, optional 1–5 score and notes. This is enough to feed future Ranks without pretending there is a full ranking engine yet.
- Source UI: replace bottom `Source checklist` with a small `Research plan` callout only when useful; after results, the actual evidence lives on each restaurant card.
- Source quality: future worker JSON should distinguish `evidence_sources` from `context_sources` or at least enforce that `sources` means evidence sources only. Keep frontend backwards-compatible with old `sources`.

---

## Task 1: Frontend data model + normalizers

**Objective:** Add persistent user rating fields and stable suggestion IDs without breaking existing quest localStorage.

**Files:**
- Modify: `src/App.tsx`
- Test: `tests/e2e/home.spec.ts`

**Steps:**
1. Add types:
   - `type RestaurantRatingStatus = 'want_to_try' | 'tried_liked' | 'tried_ok' | 'skip'`
   - `type QuestSuggestionRating = { status?: RestaurantRatingStatus; score?: number; notes?: string; updatedAt?: string }`
   - add `rating?: QuestSuggestionRating` to `QuestSuggestion`.
2. Add `suggestionKey(questId, suggestion)` helper based on normalized name/neighborhood.
3. Update `normalizeQuestSuggestion` logic so any stored `rating` is preserved only if valid.
4. Do not change server result format requirement for stored results; frontend must tolerate both old and new.
5. Add regression coverage later in Task 3.

---

## Task 2: Collapsible quests and suggestions

**Objective:** Make the Quests screen compact and scannable.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Steps:**
1. Add UI state:
   - `expandedQuestIds: Set<string>` initialized with the active/newest quest if present.
   - `expandedSuggestionIds: Set<string>` initialized empty.
2. Quest card header should show:
   - topic/city
   - status badge
   - count of picks if ready
   - expand/collapse button.
3. Only render result summary, notes, research plan, and suggestions when the quest is expanded.
4. Suggestion compact row should show:
   - name
   - neighborhood
   - confidence
   - `Order:` short text if available.
5. Expanded suggestion shows why/order/sources/rating controls.
6. Preserve accessible buttons with `aria-expanded`.

---

## Task 3: Restaurant rating controls

**Objective:** Let user rate suggested restaurants and persist it locally.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Test: `tests/e2e/home.spec.ts`

**Steps:**
1. Add `rateSuggestion(questId, suggestionKey, ratingPatch)` function that updates nested suggestion rating and `quest.updatedAt`.
2. Controls inside expanded suggestion:
   - buttons: `Want to try`, `Liked`, `It was ok`, `Skip`
   - score chips 1–5 or compact `Score 1..5` buttons when tried/liked/ok selected
   - optional short notes textarea.
3. Show compact rating badge on collapsed row after rating.
4. Persist through existing `questRequests` localStorage.
5. Add Playwright test: create mocked quest results, expand suggestion, mark `Want to try`, reload, rating badge remains.

---

## Task 4: Source checklist/research plan UI cleanup

**Objective:** Remove confusion around the bottom source checklist.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Test: `tests/e2e/home.spec.ts`

**Steps:**
1. On AI form, rename `Default source checklist` to `Research plan`.
2. Use copy: `I’ll prioritize Reddit/local chatter + LA editorial guides, then sanity-check reviews. Official restaurant pages are menu/location context only.`
3. On quest results, do not show the full checklist below cards. Instead show a small callout near summary only if expanded:
   - `Research plan: crowd + editorial first; official pages are not proof.`
4. Per-restaurant source links remain visible inside expanded suggestion cards.
5. Update tests to assert `Research plan` and not `Source checklist` for result cards.

---

## Task 5: Backend prompt source-quality hardening

**Objective:** Make future research jobs actually seek crowd/editorial evidence and avoid official sites as recommendation evidence.

**Files:**
- Modify: `/Users/oraion/Projects/healthy-me-app/src/relay/server.js`
- Test: existing relay tests or add focused unit test if exported test helpers allow; at minimum `node --check` + relevant Jest.

**Steps:**
1. Rewrite `buildFoodieHermesPrompt(job)` with explicit rules:
   - Search Reddit using city/category-specific queries where possible.
   - Use Eater/Infatuation/LA Times/Time Out/local publications when available for the city.
   - Use Yelp/Google/Maps only as sanity check, not sole evidence unless confidence is low.
   - Official restaurant websites are allowed only for menu/address/context and should not appear in `sources` unless clearly labeled as `Menu/location context` and there are already independent evidence sources.
   - If no Reddit/crowd source is found, say so in `why` and lower confidence.
   - For every suggestion, include at least two independent non-official evidence sources when possible.
2. Update expected JSON shape if needed to include `source_notes`? Prefer not for V1; avoid breaking frontend. Put explanation in `why`.
3. Restart LaunchAgent after merge.

---

## Task 6: Tests, review, deploy

**Objective:** Verify and ship the full batch safely.

**Steps:**
1. Run frontend:
   - `npm run verify`
   - `npx oxlint .`
2. Run relay:
   - `node --check src/relay/server.js`
   - `npm test -- --runInBand --runTestsByPath src/__tests__/relay-config.test.ts src/__tests__/relay-routing.test.ts src/__tests__/relay-status.test.ts`
3. Code review pass:
   - spec compliance against this plan
   - quality/security pass for localStorage, URLs, nested updates, prompt injection risk.
4. Branch/PR per repo.
5. Wait for PR CI, merge, wait for main CI/deploy.
6. Restart relay LaunchAgent.
7. Verify live site with cache-busted URL and relay health.
8. Update current Pastries quest result if needed to remove official-site-first source patterns.
