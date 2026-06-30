# Mobile Home + Rating Persistence Fix Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make Foodie Me actually comfortable on iPhone, enrich Home, and make rating/note saving obvious and reliable.

**Architecture:** Keep current static React/Vite app and localStorage-first data model for this pass. Fix visual overflow at the CSS/source level, add local write-through persistence for quest rating edits, and improve Home with compact cards/actions. Do not pretend ratings sync between phones until a shared backend exists.

**Tech Stack:** React/Vite/TypeScript, CSS, Playwright.

---

## Root causes found

1. `.tab-page button { white-space: nowrap; }` has higher specificity than `.quest-toggle` / `.suggestion-toggle`, so long quest and suggestion text can still overflow on mobile.
2. Suggestion compact metadata can sit beside long title/order text and visually collide.
3. Rating controls are too chip-heavy for a narrow phone; they need stacked person cards with compact segmented controls.
4. Notes technically save to localStorage in the current browser, but saving is invisible and localStorage-only. Users can reasonably think it did not save, especially when no rating status badge appears for note-only edits or when checking another device/browser.
5. Home only shows one active quest card, so it feels empty.

## Required changes

### Task 1: Make quest/rating layout genuinely mobile-first ✅ Implemented locally

- Override button white-space specifically for quest/suggestion/rating controls.
- Make quest cards, suggestion cards, and rating cards `box-sizing: border-box`, `max-width: 100%`, and `overflow: hidden` where appropriate.
- Make suggestion compact layout a grid, not a side-by-side flex collision.
- Make rating buttons use grid columns on mobile:
  - status: 2 columns
  - score: 5 equal small columns
- Make source links and pills wrap inside available width.

### Task 2: Make notes saving visible and reliable ✅ Implemented locally

- Add `persistQuestRequests(next)` helper that writes to localStorage immediately.
- Use it in `rateSuggestion`, `confirmDeleteQuest`, and quest add/delete/update paths where relevant.
- Add a small `saving` / `saved` indicator state for rating edits.
- Show collapsed badges for note-only edits, e.g. `Tina: note saved`, so notes don’t look like they vanished.
- Add helper copy near rating panels: “Saved on this device.”

### Task 3: Improve Home ✅ Implemented locally

- If active quest exists, show a richer active quest card with:
  - status
  - number of picks
  - latest rated / notes count
  - buttons: Open quest, New quest
- Add a compact `Foodie today` stats card:
  - active quests count
  - rated picks count
  - recipes to try count
- Add a quick actions card:
  - Research a quest
  - Save recipe
  - Open Cook

### Task 4: Tests ✅ Implemented locally

Update `tests/e2e/home.spec.ts`:
- Add test that note-only edit persists and has visible collapsed badge after reload.
- Strengthen mobile overflow test to assert `document.documentElement.scrollWidth <= window.innerWidth`.
- Add Home active quest card/stats/action assertions.

### Task 5: Verification

- `npm run verify && npx oxlint .`
- Visual screenshot on 375x812 after expanding quest + suggestion + rating panels.
- Deploy via PR and verify live asset hash. (Not part of this local implementation pass.)
