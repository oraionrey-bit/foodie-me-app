# Foodie Me shared rating/note persistence plan

## Problem
Ratings and notes currently live in each browser's `localStorage`. That makes typing feel saved on the same device, but it does not properly persist across devices/browsers and can be overwritten by relay status refreshes unless merged carefully.

## Goal
Make restaurant ratings and notes persist through the Foodie relay job store so the same quest card can reload ratings from `https://chat.withluna.dev` anywhere that has the quest's `relayId` + `statusToken`.

## Scope for this pass
- Backend: add public token-protected Foodie endpoint to PATCH a single suggestion's per-person rating/note into `quest-jobs.json`.
- Frontend: keep instant local updates, then sync to relay for relay-backed quests.
- UX: show `Syncing...`, `Saved`, or `Saved on this device` / `Sync failed — saved on this device`.
- Tests: frontend E2E route mocking proves PATCH payload and status; backend smoke with temp job store if feasible.

## API design
`PATCH /foodie/quests/:jobId/ratings?token=:statusToken`

Request:
```json
{
  "suggestion_key": "<client suggestionKey>",
  "owner": "tina|anthony",
  "rating": {
    "status": "want_to_try|tried_liked|tried_ok|skip",
    "score": 1,
    "notes": "optional note"
  }
}
```

Response: existing `publicFoodieJob(job)` shape, with updated result/rating included.

Security/safety:
- Requires the per-job status token already used for status/delete.
- Sanitizes notes and clamps score/status/owner.
- Matches suggestions by deterministic key generated from job ID + suggestion index/name/neighborhood.
- Stores only rating fields; no arbitrary result mutation.

## Frontend behavior
- Local state updates immediately for typing/responsiveness.
- Relay-backed rating changes are queued/debounced per owner/suggestion.
- Successful PATCH merges returned quest result into local state.
- Failed PATCH keeps local data but shows local-only warning.

## Verification
- `npm run verify && npx oxlint .` in Foodie app.
- `npm run verify` or targeted relay smoke in Healthy relay repo.
- Restart relay LaunchAgent and verify `/health`.
- Live Foodie smoke: mocked/real relay-backed quest accepts rating PATCH and page reload retrieves note from relay.
