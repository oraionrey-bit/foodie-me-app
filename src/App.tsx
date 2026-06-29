import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { nextPlaces, quests, rankings } from './data/mockFoodie'
import {
  categoryLabels,
  mockRecipes,
  recipeCategories,
  sourceTypeLabels,
  type Recipe,
  type RecipeCategory,
  type RecipeSourceType,
  type RecipeStatus,
} from './data/mockRecipes'

type TabId = 'home' | 'cook' | 'quests' | 'rankings' | 'research'

type NewRecipeForm = {
  title: string
  sourceUrl: string
  sourceType: RecipeSourceType
  note: string
  category: RecipeCategory
}

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'cook', label: 'Cook', icon: '🍳' },
  { id: 'quests', label: 'Quests', icon: '🍜' },
  { id: 'rankings', label: 'Ranks', icon: '⭐' },
  { id: 'research', label: 'AI', icon: '🔎' },
]

const statusFilters: Array<{ id: RecipeStatus; label: string }> = [
  { id: 'to_try', label: 'To try' },
  { id: 'loved', label: 'Loved' },
  { id: 'cooked', label: 'Cooked' },
  { id: 'archived', label: 'Archived' },
]

const sourceTypes: RecipeSourceType[] = ['website', 'youtube', 'tiktok', 'instagram', 'photo', 'cookbook', 'manual']
const storageKey = 'foodie-me-recipes-v1'
const recipeStatuses: RecipeStatus[] = ['to_try', 'cooked', 'loved', 'archived']

const blankForm: NewRecipeForm = {
  title: '',
  sourceUrl: '',
  sourceType: 'website',
  note: '',
  category: 'weeknight',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeRecipeArray<T>(value: unknown, allowedValues: T[], fallback: T): T[] {
  if (!Array.isArray(value)) return [fallback]

  const normalized = value.filter((item): item is T => allowedValues.includes(item as T))
  return normalized.length > 0 ? normalized : [fallback]
}

function normalizeTextItems(value: unknown, fallbackText: string) {
  if (!Array.isArray(value)) return [{ id: 'i1', text: fallbackText }]

  const normalized = value
    .filter(isRecord)
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id : `i${index + 1}`,
      text: typeof item.text === 'string' && item.text.trim() ? item.text : '',
    }))
    .filter((item) => item.text)

  return normalized.length > 0 ? normalized : [{ id: 'i1', text: fallbackText }]
}

function normalizeVerdicts(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.filter(isRecord).map((verdict) => ({
    cookedAt: typeof verdict.cookedAt === 'string' ? verdict.cookedAt : new Date().toISOString(),
    rating: typeof verdict.rating === 'number' ? verdict.rating : undefined,
    notes: typeof verdict.notes === 'string' ? verdict.notes : undefined,
    changesNextTime: typeof verdict.changesNextTime === 'string' ? verdict.changesNextTime : undefined,
  }))
}

function normalizeStoredRecipe(value: unknown): Recipe | null {
  if (!isRecord(value)) return null

  const title = typeof value.title === 'string' ? value.title.trim() : ''
  if (!title) return null

  const now = new Date().toISOString()
  const sourceType = sourceTypes.includes(value.sourceType as RecipeSourceType) ? (value.sourceType as RecipeSourceType) : 'manual'
  const status = recipeStatuses.includes(value.status as RecipeStatus) ? (value.status as RecipeStatus) : 'to_try'

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : `stored-${crypto.randomUUID()}`,
    title,
    description: typeof value.description === 'string' ? value.description : undefined,
    sourceType,
    sourceUrl: typeof value.sourceUrl === 'string' ? value.sourceUrl : undefined,
    sourceLabel: typeof value.sourceLabel === 'string' ? value.sourceLabel : undefined,
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : undefined,
    status,
    categories: normalizeRecipeArray(value.categories, recipeCategories, 'weeknight'),
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    cuisine: typeof value.cuisine === 'string' ? value.cuisine : undefined,
    yield: typeof value.yield === 'string' ? value.yield : undefined,
    prepMinutes: typeof value.prepMinutes === 'number' ? value.prepMinutes : undefined,
    cookMinutes: typeof value.cookMinutes === 'number' ? value.cookMinutes : undefined,
    totalMinutes: typeof value.totalMinutes === 'number' ? value.totalMinutes : undefined,
    ingredients: normalizeTextItems(value.ingredients, 'Add ingredients while reviewing the source.'),
    steps: normalizeTextItems(value.steps, 'Open the source or notes, then turn this into a cookable recipe.'),
    notes: typeof value.notes === 'string' ? value.notes : undefined,
    capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    verdicts: normalizeVerdicts(value.verdicts),
  }
}

function normalizeStoredRecipes(value: unknown) {
  if (!Array.isArray(value)) return mockRecipes

  const normalized = value.map(normalizeStoredRecipe).filter((recipe): recipe is Recipe => recipe !== null)
  return normalized.length > 0 ? normalized : mockRecipes
}

function safeExternalUrl(value?: string) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function loadStoredRecipes() {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return mockRecipes

    return normalizeStoredRecipes(JSON.parse(stored))
  } catch {
    return mockRecipes
  }
}

function formatCategory(category: RecipeCategory) {
  return categoryLabels[category]
}

function sourceLabel(recipe: Recipe) {
  return recipe.sourceLabel ?? sourceTypeLabels[recipe.sourceType]
}

function recipeMeta(recipe: Recipe) {
  const parts = [recipe.totalMinutes ? `${recipe.totalMinutes} min` : undefined, recipe.yield, recipe.categories[0] ? formatCategory(recipe.categories[0]) : undefined]
  return parts.filter(Boolean).join(' · ')
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [recipes, setRecipes] = useState<Recipe[]>(loadStoredRecipes)
  const [statusFilter, setStatusFilter] = useState<RecipeStatus>('to_try')
  const [categoryFilter, setCategoryFilter] = useState<'all' | RecipeCategory>('all')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [newRecipe, setNewRecipe] = useState<NewRecipeForm>(blankForm)
  const [formError, setFormError] = useState('')

  const featuredQuest = quests[0]
  const nextPlace = nextPlaces[0]
  const title = useMemo(() => {
    if (activeTab === 'home') return 'Home'
    if (activeTab === 'cook') return 'Cook'
    if (activeTab === 'quests') return 'Food quests'
    if (activeTab === 'rankings') return 'Rankings'
    return 'AI research'
  }, [activeTab])

  const toTryCount = recipes.filter((recipe) => recipe.status === 'to_try').length
  const lovedCount = recipes.filter((recipe) => recipe.status === 'loved').length
  const nextRecipe = recipes.find((recipe) => recipe.status === 'to_try') ?? recipes[0]
  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null
  const selectedRecipeSafeSourceUrl = safeExternalUrl(selectedRecipe?.sourceUrl)

  const visibleRecipes = recipes.filter((recipe) => {
    const statusMatches = recipe.status === statusFilter
    const categoryMatches = categoryFilter === 'all' || recipe.categories.includes(categoryFilter)
    return statusMatches && categoryMatches
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(recipes))
    } catch {
      // Static demo should keep working even if storage is unavailable.
    }
  }, [recipes])

  function openCookTab() {
    setActiveTab('cook')
    setSelectedRecipeId(null)
  }

  function handleAddRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const titleValue = newRecipe.title.trim()

    if (!titleValue) {
      setFormError('Add a recipe name first.')
      return
    }

    const now = new Date().toISOString()
    const recipe: Recipe = {
      id: `local-${Date.now()}`,
      title: titleValue,
      description: newRecipe.note.trim() || 'Saved manually for a future cooking session.',
      sourceType: newRecipe.sourceType,
      sourceUrl: newRecipe.sourceUrl.trim() || undefined,
      sourceLabel: newRecipe.sourceUrl.trim() ? sourceTypeLabels[newRecipe.sourceType] : 'Manual save',
      status: 'to_try',
      categories: [newRecipe.category],
      tags: ['saved'],
      yield: 'Add servings later',
      ingredients: [{ id: 'i1', text: 'Add ingredients while reviewing the source.' }],
      steps: [{ id: 's1', text: 'Open the source or notes, then turn this into a cookable recipe.' }],
      notes: newRecipe.note.trim() || 'Needs ingredient and step review.',
      capturedAt: now,
      updatedAt: now,
      verdicts: [],
    }

    setRecipes((current) => [recipe, ...current])
    setNewRecipe(blankForm)
    setFormError('')
    setShowSaveForm(false)
    setStatusFilter('to_try')
    setCategoryFilter('all')
  }

  function updateRecipeStatus(recipeId: string, status: RecipeStatus) {
    const now = new Date().toISOString()
    setRecipes((current) =>
      current.map((recipe) => {
        if (recipe.id !== recipeId) return recipe

        return {
          ...recipe,
          status,
          updatedAt: now,
          verdicts:
            status === 'to_try'
              ? recipe.verdicts
              : [
                  ...recipe.verdicts,
                  {
                    cookedAt: now,
                    rating: status === 'loved' ? 5 : status === 'archived' ? 1 : 3,
                    notes: status === 'loved' ? 'Saved to loved recipes.' : status === 'cooked' ? 'Cooked and kept as maybe.' : 'Archived after review.',
                  },
                ],
        }
      }),
    )
    setStatusFilter(status)
    setSelectedRecipeId(null)
  }

  return (
    <main className="phone-shell">
      <section className="image-hero" aria-label="Foodie Me header image">
        <img
          src={`${import.meta.env.BASE_URL}images/foodie-me-header-cropped.jpeg`}
          alt="Cute cream food truck with yellow striped awning, roof plants, and pastel food details"
          className="hero-image"
        />
      </section>

      <section className="app-screen" aria-labelledby="screen-title">
        <header className="screen-header">
          <div>
            <p className="eyebrow">Foodie Me</p>
            <h1 id="screen-title">{title}</h1>
          </div>
          <button className="settings-button" type="button" aria-label="Settings">
            ⚙️
          </button>
        </header>

        {activeTab === 'home' && (
          <section className="tab-page" aria-label="Home dashboard">
            <article className="hero-card">
              <div>
                <p className="eyebrow">Today</p>
                <h2>Pick the next bite</h2>
                <p>{nextPlace.name} is queued for {nextPlace.city}.</p>
              </div>
              <button type="button">Rate visit</button>
            </article>

            <div className="stat-row" aria-label="Foodie Me overview">
              <article>
                <strong>{quests.length}</strong>
                <span>quests</span>
              </article>
              <article>
                <strong>{recipes.length}</strong>
                <span>recipes</span>
              </article>
              <article>
                <strong>{lovedCount}</strong>
                <span>loved</span>
              </article>
            </div>

            <article className="card compact-card cook-home-card">
              <div>
                <p className="eyebrow">Cook next</p>
                <h3>{nextRecipe.title}</h3>
                <p>{sourceLabel(nextRecipe)} · {recipeMeta(nextRecipe) || 'ready to review'}</p>
              </div>
              <button type="button" onClick={openCookTab}>Open Cook</button>
            </article>

            <article className="card compact-card">
              <div>
                <p className="eyebrow">Active quest</p>
                <h3>{featuredQuest.title}</h3>
                <p>{featuredQuest.progress}</p>
              </div>
              <span className="pill">{featuredQuest.city}</span>
            </article>
          </section>
        )}

        {activeTab === 'cook' && (
          <section className="tab-page cook-page" aria-label="Cook recipes">
            {selectedRecipe ? (
              <article className="card recipe-detail">
                <div className="detail-topline">
                  <button type="button" onClick={() => setSelectedRecipeId(null)}>← Back</button>
                  <span className="pill source-pill">{sourceLabel(selectedRecipe)}</span>
                </div>
                <div>
                  <p className="eyebrow">Cooking view</p>
                  <h2>{selectedRecipe.title}</h2>
                  <p>{selectedRecipe.description}</p>
                </div>
                <div className="recipe-meta-row">
                  {recipeMeta(selectedRecipe) && <span className="pill">{recipeMeta(selectedRecipe)}</span>}
                  {selectedRecipe.cuisine && <span className="pill">{selectedRecipe.cuisine}</span>}
                </div>
                {selectedRecipeSafeSourceUrl ? (
                  <a className="source-link" href={selectedRecipeSafeSourceUrl} target="_blank" rel="noreferrer">
                    Open original source
                  </a>
                ) : selectedRecipe.sourceUrl ? (
                  <p className="source-link" aria-label="Original source saved as text">{selectedRecipe.sourceUrl}</p>
                ) : null}
                <section className="cook-section" aria-labelledby="ingredients-title">
                  <h3 id="ingredients-title">Ingredients</h3>
                  <ul className="ingredient-list">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id}>
                        <span aria-hidden="true">□</span>
                        {ingredient.text}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="cook-section" aria-labelledby="steps-title">
                  <h3 id="steps-title">Steps</h3>
                  <ol className="step-list">
                    {selectedRecipe.steps.map((step) => (
                      <li key={step.id}>
                        <span>{step.text}</span>
                        {step.timerMinutes && <strong>{step.timerMinutes} min</strong>}
                      </li>
                    ))}
                  </ol>
                </section>
                {selectedRecipe.notes && (
                  <section className="cook-section notes-box" aria-label="Recipe notes">
                    <h3>Notes</h3>
                    <p>{selectedRecipe.notes}</p>
                  </section>
                )}
                <div className="verdict-row" aria-label="Recipe verdicts">
                  <button type="button" onClick={() => updateRecipeStatus(selectedRecipe.id, 'loved')}>Loved it</button>
                  <button type="button" onClick={() => updateRecipeStatus(selectedRecipe.id, 'cooked')}>Cooked maybe</button>
                  <button type="button" onClick={() => updateRecipeStatus(selectedRecipe.id, 'archived')}>Archive</button>
                </div>
              </article>
            ) : (
              <>
                <article className="hero-card recipe-queue-card">
                  <div>
                    <p className="eyebrow">Recipe queue</p>
                    <h2>What should we cook next?</h2>
                    <p>{toTryCount} to try · {lovedCount} loved keepers</p>
                  </div>
                  <button type="button" onClick={() => setShowSaveForm(true)}>Save recipe</button>
                </article>

                {showSaveForm && (
                  <form className="card save-recipe-form" onSubmit={handleAddRecipe} noValidate>
                    <div>
                      <p className="eyebrow">Capture</p>
                      <h3>Save a recipe idea</h3>
                    </div>
                    <label htmlFor="recipe-name-input">
                      Recipe name
                      <input
                        id="recipe-name-input"
                        value={newRecipe.title}
                        onChange={(event) => setNewRecipe((current) => ({ ...current, title: event.target.value }))}
                        placeholder="e.g. Crispy rice salad"
                      />
                    </label>
                    <label htmlFor="recipe-source-link-input">
                      Source link
                      <input
                        id="recipe-source-link-input"
                        value={newRecipe.sourceUrl}
                        onChange={(event) => setNewRecipe((current) => ({ ...current, sourceUrl: event.target.value }))}
                        placeholder="Paste a link or video URL"
                      />
                    </label>
                    <div className="form-grid">
                      <label htmlFor="recipe-source-type-select">
                        Source type
                        <select
                          id="recipe-source-type-select"
                          value={newRecipe.sourceType}
                          onChange={(event) => setNewRecipe((current) => ({ ...current, sourceType: event.target.value as RecipeSourceType }))}
                        >
                          {sourceTypes.map((type) => (
                            <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                          ))}
                        </select>
                      </label>
                      <label htmlFor="recipe-category-select">
                        Category
                        <select
                          id="recipe-category-select"
                          value={newRecipe.category}
                          onChange={(event) => setNewRecipe((current) => ({ ...current, category: event.target.value as RecipeCategory }))}
                        >
                          {recipeCategories.map((category) => (
                            <option key={category} value={category}>{formatCategory(category)}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label htmlFor="recipe-note-input">
                      Why save it?
                      <textarea
                        id="recipe-note-input"
                        value={newRecipe.note}
                        onChange={(event) => setNewRecipe((current) => ({ ...current, note: event.target.value }))}
                        placeholder="What looks good? Any substitutions?"
                      />
                    </label>
                    {formError && <p className="form-error" role="alert">{formError}</p>}
                    <div className="form-actions">
                      <button type="submit">Add to To Try</button>
                      <button type="button" onClick={() => { setShowSaveForm(false); setFormError('') }}>Cancel</button>
                    </div>
                  </form>
                )}

                <div className="segmented" aria-label="Recipe status filters">
                  {statusFilters.map((filter) => (
                    <button
                      type="button"
                      key={filter.id}
                      className={statusFilter === filter.id ? 'active' : ''}
                      aria-pressed={statusFilter === filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="chip-row" aria-label="Recipe category filters">
                  <button type="button" className={categoryFilter === 'all' ? 'active' : ''} aria-pressed={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>All</button>
                  {recipeCategories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      className={categoryFilter === category ? 'active' : ''}
                      aria-pressed={categoryFilter === category}
                      onClick={() => setCategoryFilter(category)}
                    >
                      {formatCategory(category)}
                    </button>
                  ))}
                </div>

                {visibleRecipes.length > 0 ? (
                  <div className="recipe-list">
                    {visibleRecipes.map((recipe) => (
                      <article className="card recipe-card" key={recipe.id}>
                        <div>
                          <p className="eyebrow">{sourceLabel(recipe)}</p>
                          <h3>{recipe.title}</h3>
                          <p>{recipe.notes ?? recipe.description}</p>
                        </div>
                        <div className="recipe-card-footer">
                          <span className="pill">{recipeMeta(recipe) || formatCategory(recipe.categories[0])}</span>
                          <button type="button" onClick={() => setSelectedRecipeId(recipe.id)}>Open</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <article className="card empty-state">
                    <h3>{statusFilter === 'loved' ? 'No loved recipes here yet' : 'No recipes match these chips yet.'}</h3>
                    <p>{statusFilter === 'loved' ? 'Cook a few from To Try, then keep only the winners here.' : 'Paste a link or jot down a dish you want to try.'}</p>
                    <button type="button" onClick={() => setShowSaveForm(true)}>Save recipe</button>
                  </article>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'quests' && (
          <section className="tab-page" aria-label="Food quests">
            {quests.map((quest) => (
              <article className="card" key={`${quest.city}-${quest.title}`}>
                <p className="eyebrow">{quest.city}</p>
                <h3>{quest.title}</h3>
                <p>{quest.progress}</p>
                <span className="pill">{quest.nextStep}</span>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'rankings' && (
          <section className="tab-page" aria-label="Rankings">
            {rankings.map((ranking) => (
              <article className="card" key={ranking.place}>
                <p className="eyebrow">{ranking.dish}</p>
                <h3>{ranking.place}</h3>
                <div className="score-row">
                  <span>A {ranking.anthony}</span>
                  <span>T {ranking.tina}</span>
                </div>
                <p>{ranking.note}</p>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'research' && (
          <section className="tab-page" aria-label="AI research">
            <article className="card research-card">
              <p className="eyebrow">Review first</p>
              <h3>AI ideas stay in a queue</h3>
              <p>
                Later this tab will show source-backed restaurant and recipe candidates. Nothing saves until you approve it.
              </p>
              <button type="button">Research a quest</button>
            </article>
          </section>
        )}
      </section>

      <nav className="tab-bar" aria-label="Foodie Me tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id !== 'cook') setSelectedRecipeId(null)
            }}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </main>
  )
}

export default App
