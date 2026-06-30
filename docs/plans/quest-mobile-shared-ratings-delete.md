# Quest Mobile Shared Ratings + Delete Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix quest result usability on iPhone, support separate Tina/Anthony ratings, and make quest deletion safe.

**Architecture:** Foodie Me remains a static GitHub Pages app backed by browser `localStorage` for user-visible recipe/quest/rating state. The relay stores submitted Foodie quest worker jobs in a local JSON job store, not a relational DB. Deleting a quest should remove it from local UI immediately and attempt a token-authenticated relay job deletion when a relay job exists.

**Tech Stack:** React/Vite/TypeScript, Playwright E2E, Healthy Me Node relay.

---

## Current storage facts

- Frontend recipes: `localStorage['foodie-me-recipes-v2']`
- Frontend quest cards/results/ratings: `localStorage['foodie-me-quest-research-v2']`
- Relay submitted jobs: JSON file at `FOODIE_JOB_STORE` or `~/.hermes/foodie-me/quest-jobs.json`
- There is currently no shared Foodie Me database for quests/ratings. Supabase exists for Healthy Me chat/photos, but Foodie quest results are not using Supabase tables.

## Requirements

1. iPhone adaptation:
   - Quest header and suggestion popouts must not overflow narrow screens.
   - Long names/orders/sources must wrap cleanly.
   - Rating controls must be comfortable on ~375px width.
2. Uniform text:
   - Quest and suggestion text should use consistent sizes/classes.
   - Avoid nested spans inheriting inconsistent tiny text unexpectedly.
3. Shared ratings:
   - Restaurant suggestions should support separate `tina` and `anthony` ratings.
   - Existing single `rating` data should migrate into `tina` for backward compatibility.
   - Summary badge should show both people when set.
4. Delete quest:
   - Add a delete button on each quest card.
   - Show a confirmation box/dialog before removing.
   - Remove from localStorage immediately after confirmation.
   - If the quest has `relayId` + `statusToken`, call a relay delete endpoint and do not block local deletion if server cleanup fails.
5. DB safety:
   - Do not claim sync/backup that does not exist.
   - Document that current state is local-first and okay for MVP, but not okay as the long-term shared source of truth.

## Implementation tasks

### Task 1: Frontend data model

Modify `src/App.tsx`:
- Add `RatingOwner = 'tina' | 'anthony'`.
- Add `ratings?: Partial<Record<RatingOwner, QuestSuggestionRating>>` to suggestions.
- Keep legacy `rating?: QuestSuggestionRating` for migration only.
- Normalize `ratings` and migrate legacy `rating` into `ratings.tina`.
- Update merge logic to preserve `ratings`, not only `rating`.

### Task 2: Ratings UI

Modify `src/App.tsx`:
- Render two rating panels: `Tina's take`, `Anthony's take`.
- Use separate note labels: `Tina note`, `Anthony note`.
- Rating badges in collapsed suggestion should show `Tina: Liked · 5/5` and/or `Anthony: Want to try`.
- Update `rateSuggestion` signature to include owner.

### Task 3: Quest delete

Modify `src/App.tsx`:
- Add `confirmingDeleteQuestId` state.
- Add `requestDeleteQuest`, `cancelDeleteQuest`, `confirmDeleteQuest` functions.
- Add async `deleteRelayQuest(quest)` that calls `DELETE /foodie/quests/:id/status?token=...`.
- Add confirmation UI inside the expanded quest body.
- Remove expanded quest/suggestion IDs related to the deleted quest.

### Task 4: Relay delete endpoint

Modify `/Users/oraion/Projects/healthy-me-app/src/relay/server.js`:
- Add `deleteFoodieJob(jobId, token)` helper that checks token and deletes from JSON store.
- Add route: `DELETE /foodie/quests/:id/status?token=...`.
- Return `{deleted: true}` on success, 404 on missing/wrong token.

Modify Healthy Me tests:
- Add guardrail/relay route test for token-protected delete if easy; otherwise add process guardrail string checks.

### Task 5: iPhone CSS

Modify `src/App.css`:
- Ensure `.quest-card`, `.quest-card-header`, `.quest-toggle`, `.suggestion-toggle`, `.suggestion-compact-main`, `.suggestion-compact-meta`, `.rating-controls`, `.rating-owner-card`, `.source-link-list` have `min-width: 0` and wrapping.
- Use consistent text sizes for quest body/suggestion body/rating controls.
- Avoid side-by-side layouts on <=390px.
- Add danger/confirmation button styling.

### Task 6: E2E tests

Modify `tests/e2e/home.spec.ts`:
- Update existing rating tests for Tina/Anthony.
- Add test for delete confirmation cancel/confirm and local removal + relay DELETE call.
- Add mobile-width test that long quest/suggestion text fits within viewport.

## Verification

- Foodie: `npm run verify && npx oxlint .`
- Healthy relay: `node --check src/relay/server.js && npm test -- --runInBand --runTestsByPath src/__tests__/relay-config.test.ts src/__tests__/relay-routing.test.ts src/__tests__/relay-status.test.ts src/__tests__/process-guardrails.test.ts`
- GitHub PRs and CI green.
- Deploy Foodie and smoke-test live page with cache-busted URL.
- Restart Healthy relay after merging backend changes and verify `https://chat.withluna.dev/health`.
