import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
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

type QuestResearchStatus = 'local' | 'submitting' | 'queued' | 'researching' | 'ready' | 'error'

type QuestSourceLink = {
  label: string
  url: string
}

type QuestSuggestion = {
  name: string
  neighborhood?: string
  why?: string
  what_to_order?: string
  confidence?: string
  sources?: QuestSourceLink[]
}

type QuestResult = {
  summary?: string
  suggestions?: QuestSuggestion[]
}

type QuestResearch = {
  id: string
  relayId?: string
  statusToken?: string
  city: string
  topic: string
  notes?: string
  status: QuestResearchStatus
  statusMessage?: string
  error?: string
  result?: QuestResult
  createdAt: string
  updatedAt: string
  sources: string[]
}

type NewQuestForm = {
  topic: string
  city: string
  notes: string
}

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'quests', label: 'Quests', icon: '🍜' },
  { id: 'rankings', label: 'Ranks', icon: '⭐' },
  { id: 'research', label: 'AI', icon: '🔎' },
  { id: 'cook', label: 'Cook', icon: '🍳' },
]

const statusFilters: Array<{ id: RecipeStatus; label: string }> = [
  { id: 'to_try', label: 'To try' },
  { id: 'loved', label: 'Loved' },
]

const sourceTypes: RecipeSourceType[] = ['website', 'youtube', 'tiktok', 'instagram', 'photo', 'cookbook', 'manual']
const storageKey = 'foodie-me-recipes-v2'
const legacyStorageKey = 'foodie-me-recipes-v1'
const questResearchStorageKey = 'foodie-me-quest-research-v2'
const legacyQuestResearchStorageKey = 'foodie-me-quest-research-v1'
const foodieRelayBaseUrl = (import.meta.env.VITE_FOODIE_RELAY_URL || 'https://chat.withluna.dev').replace(/\/$/, '')
const recipeStatuses: RecipeStatus[] = ['to_try', 'loved']
const legacyMockRecipeIds = new Set([
  'cozy-tomato-bean-skillet',
  'golden-miso-pancakes',
  'chili-crisp-noodle-salad',
  'lavender-cloud-cookies',
])

const blankForm: NewRecipeForm = {
  title: '',
  sourceUrl: '',
  sourceType: 'website',
  note: '',
  category: 'weeknight',
}

const blankQuestForm: NewQuestForm = {
  topic: '',
  city: '',
  notes: '',
}

function defaultQuestSources(city: string) {
  const normalizedCity = city.trim().toLowerCase().replace(/\./g, '')
  const isLosAngeles = /(^|[\s,])la($|[\s,])/.test(normalizedCity) || normalizedCity.includes('los angeles')
  const editorialSources = isLosAngeles ? ['Eater LA', 'The Infatuation LA'] : ['Eater/Infatuation if they cover the city']
  return ['Reddit', ...editorialSources, 'Google Search', 'Google/Maps reviews', 'Yelp', 'Local food sources']
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

function normalizeStoredRecipe(value: unknown, options: { dropInvalidStatus?: boolean } = {}): Recipe | null {
  if (!isRecord(value)) return null

  const title = typeof value.title === 'string' ? value.title.trim() : ''
  if (!title) return null

  const now = new Date().toISOString()
  const sourceType = sourceTypes.includes(value.sourceType as RecipeSourceType) ? (value.sourceType as RecipeSourceType) : 'manual'
  const hasValidStatus = recipeStatuses.includes(value.status as RecipeStatus)
  if (options.dropInvalidStatus && !hasValidStatus) return null

  const status = hasValidStatus ? (value.status as RecipeStatus) : 'to_try'

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

function normalizeStoredRecipes(value: unknown, options: { dropInvalidStatus?: boolean; excludedIds?: Set<string> } = {}) {
  if (!Array.isArray(value)) return mockRecipes

  const normalized = value
    .map((item) => normalizeStoredRecipe(item, { dropInvalidStatus: options.dropInvalidStatus }))
    .filter((recipe): recipe is Recipe => recipe !== null && !options.excludedIds?.has(recipe.id))
  return normalized.length > 0 ? normalized : mockRecipes
}

function normalizeQuestSources(value: unknown, city: string) {
  if (!Array.isArray(value)) return defaultQuestSources(city)

  const normalized = value.filter((source): source is string => typeof source === 'string' && source.trim().length > 0).map((source) => source.trim())
  return normalized.length > 0 ? normalized : defaultQuestSources(city)
}

function normalizeQuestSourceLinks(value: unknown): QuestSourceLink[] {
  if (!Array.isArray(value)) return []

  return value
    .filter(isRecord)
    .map((source) => ({
      label: typeof source.label === 'string' && source.label.trim() ? source.label.trim() : 'Source',
      url: typeof source.url === 'string' ? safeExternalUrl(source.url) : undefined,
    }))
    .filter((source): source is QuestSourceLink => Boolean(source.url))
}

function normalizeQuestResult(value: unknown): QuestResult | undefined {
  if (!isRecord(value)) return undefined

  const suggestions = Array.isArray(value.suggestions)
    ? value.suggestions
        .filter(isRecord)
        .map((suggestion) => ({
          name: typeof suggestion.name === 'string' ? suggestion.name.trim() : '',
          neighborhood: typeof suggestion.neighborhood === 'string' && suggestion.neighborhood.trim() ? suggestion.neighborhood.trim() : undefined,
          why: typeof suggestion.why === 'string' && suggestion.why.trim() ? suggestion.why.trim() : undefined,
          what_to_order: typeof suggestion.what_to_order === 'string' && suggestion.what_to_order.trim() ? suggestion.what_to_order.trim() : undefined,
          confidence: typeof suggestion.confidence === 'string' && suggestion.confidence.trim() ? suggestion.confidence.trim() : undefined,
          sources: normalizeQuestSourceLinks(suggestion.sources),
        }))
        .filter((suggestion) => suggestion.name)
    : []

  const summary = typeof value.summary === 'string' && value.summary.trim() ? value.summary.trim() : undefined
  return summary || suggestions.length > 0 ? { summary, suggestions } : undefined
}

function normalizeQuestStatus(value: unknown): QuestResearchStatus {
  const allowed: QuestResearchStatus[] = ['local', 'submitting', 'queued', 'researching', 'ready', 'error']
  if (value === 'needs_research') return 'local'
  return allowed.includes(value as QuestResearchStatus) ? (value as QuestResearchStatus) : 'local'
}

function normalizeStoredQuestResearch(value: unknown): QuestResearch | null {
  if (!isRecord(value)) return null

  const city = typeof value.city === 'string' ? value.city.trim() : ''
  const topic = typeof value.topic === 'string' ? value.topic.trim() : ''
  if (!city || !topic) return null

  const now = new Date().toISOString()

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : `quest-${crypto.randomUUID()}`,
    relayId: typeof value.relayId === 'string' && value.relayId.trim() ? value.relayId : undefined,
    statusToken: typeof value.statusToken === 'string' && value.statusToken.trim() ? value.statusToken : undefined,
    city,
    topic,
    notes: typeof value.notes === 'string' && value.notes.trim() ? value.notes.trim() : undefined,
    status: normalizeQuestStatus(value.status),
    statusMessage: typeof value.statusMessage === 'string' && value.statusMessage.trim() ? value.statusMessage.trim() : undefined,
    error: typeof value.error === 'string' && value.error.trim() ? value.error.trim() : undefined,
    result: normalizeQuestResult(value.result),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    sources: normalizeQuestSources(value.sources, city),
  }
}

function normalizeStoredQuestResearchRequests(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.map(normalizeStoredQuestResearch).filter((quest): quest is QuestResearch => quest !== null)
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
    if (stored) return normalizeStoredRecipes(JSON.parse(stored))

    const legacyStored = window.localStorage.getItem(legacyStorageKey)
    if (legacyStored) {
      return normalizeStoredRecipes(JSON.parse(legacyStored), {
        dropInvalidStatus: true,
        excludedIds: legacyMockRecipeIds,
      })
    }

    return mockRecipes
  } catch {
    return mockRecipes
  }
}

function loadStoredQuestResearchRequests() {
  try {
    const stored = window.localStorage.getItem(questResearchStorageKey)
    if (stored) return normalizeStoredQuestResearchRequests(JSON.parse(stored))

    const legacyStored = window.localStorage.getItem(legacyQuestResearchStorageKey)
    return legacyStored ? normalizeStoredQuestResearchRequests(JSON.parse(legacyStored)) : []
  } catch {
    return []
  }
}

function questStatusLabel(status: QuestResearchStatus, statusMessage?: string) {
  if (statusMessage) return statusMessage
  if (status === 'local') return 'Saved locally — send to Oraion when ready'
  if (status === 'submitting') return 'Sending quest to Oraion...'
  if (status === 'queued') return 'Queued for Oraion research'
  if (status === 'researching') return 'Oraion is researching source-backed picks'
  if (status === 'ready') return 'Research ready'
  return 'Research hit an error'
}

function questStatusClass(status: QuestResearchStatus) {
  return `status-badge status-${status}`
}

function isPollableQuest(quest: QuestResearch) {
  return Boolean(quest.relayId && quest.statusToken && ['submitting', 'queued', 'researching'].includes(quest.status))
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

function normalizeRelayQuestStatus(value: unknown): QuestResearchStatus {
  const status = normalizeQuestStatus(value)
  return status === 'local' ? 'queued' : status
}

async function submitQuestToRelay(quest: QuestResearch) {
  const response = await fetch(`${foodieRelayBaseUrl}/foodie/quests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: quest.topic,
      city: quest.city,
      notes: quest.notes || '',
      sources: quest.sources,
      client_request_id: quest.id,
    }),
  })

  const body: unknown = await response.json().catch(() => ({}))
  if (!response.ok || !isRecord(body)) {
    throw new Error(isRecord(body) && typeof body.error === 'string' ? body.error : 'Quest relay request failed')
  }

  return {
    relayId: typeof body.id === 'string' ? body.id : '',
    statusToken: typeof body.status_token === 'string' ? body.status_token : '',
    status: normalizeRelayQuestStatus(body.status),
    statusMessage: typeof body.status_message === 'string' ? body.status_message : undefined,
    updatedAt: typeof body.updated_at === 'string' ? body.updated_at : new Date().toISOString(),
  }
}

async function fetchQuestStatus(quest: QuestResearch) {
  if (!quest.relayId || !quest.statusToken) throw new Error('Missing relay quest details')

  const response = await fetch(`${foodieRelayBaseUrl}/foodie/quests/${encodeURIComponent(quest.relayId)}/status?token=${encodeURIComponent(quest.statusToken)}`)
  const body: unknown = await response.json().catch(() => ({}))
  if (!response.ok || !isRecord(body)) {
    throw new Error(isRecord(body) && typeof body.error === 'string' ? body.error : 'Quest status request failed')
  }

  return {
    status: normalizeRelayQuestStatus(body.status),
    statusMessage: typeof body.status_message === 'string' ? body.status_message : undefined,
    error: typeof body.error === 'string' ? body.error : undefined,
    result: normalizeQuestResult(body.result),
    updatedAt: typeof body.updated_at === 'string' ? body.updated_at : new Date().toISOString(),
  }
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
  const [questRequests, setQuestRequests] = useState<QuestResearch[]>(loadStoredQuestResearchRequests)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [newQuest, setNewQuest] = useState<NewQuestForm>(blankQuestForm)
  const [questError, setQuestError] = useState('')

  const title = useMemo(() => {
    if (activeTab === 'home') return 'Home'
    if (activeTab === 'cook') return 'Cook'
    if (activeTab === 'quests') return 'Food quests'
    if (activeTab === 'rankings') return 'Rankings'
    return 'AI research'
  }, [activeTab])

  const toTryCount = recipes.filter((recipe) => recipe.status === 'to_try').length
  const lovedCount = recipes.filter((recipe) => recipe.status === 'loved').length
  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null
  const selectedRecipeSafeSourceUrl = safeExternalUrl(selectedRecipe?.sourceUrl)
  const activeQuestRequest = questRequests[0] ?? null

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

  useEffect(() => {
    try {
      window.localStorage.setItem(questResearchStorageKey, JSON.stringify(questRequests))
    } catch {
      // Keep the static app usable even if quest storage is unavailable.
    }
  }, [questRequests])

  useEffect(() => {
    const pollableQuests = questRequests.filter(isPollableQuest)
    if (pollableQuests.length === 0) return undefined

    let cancelled = false
    async function pollQuestStatuses() {
      const updates = await Promise.allSettled(
        pollableQuests.map(async (quest) => ({ questId: quest.id, status: await fetchQuestStatus(quest) })),
      )
      if (cancelled) return

      setQuestRequests((current) => current.map((quest) => {
        const update = updates.find((item) => item.status === 'fulfilled' && item.value.questId === quest.id)
        if (update?.status !== 'fulfilled') return quest
        const next = update.value.status
        if (
          quest.status === next.status
          && quest.statusMessage === next.statusMessage
          && quest.error === next.error
          && quest.result === (next.result ?? quest.result)
          && quest.updatedAt === next.updatedAt
        ) return quest
        return {
          ...quest,
          status: next.status,
          statusMessage: next.statusMessage,
          error: next.error,
          result: next.result ?? quest.result,
          updatedAt: next.updatedAt,
        }
      }))
    }

    pollQuestStatuses().catch(() => {})
    const interval = window.setInterval(() => {
      pollQuestStatuses().catch(() => {})
    }, 9000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [questRequests])

  function openCookTab(showForm = false) {
    setActiveTab('cook')
    setSelectedRecipeId(null)
    setShowSaveForm(showForm)
  }

  function openResearchTab(showForm = false) {
    setActiveTab('research')
    setSelectedRecipeId(null)
    setShowQuestForm(showForm)
    setQuestError('')
  }

  async function sendQuestToOraion(quest: QuestResearch) {
    setQuestRequests((current) => current.map((item) => (
      item.id === quest.id
        ? {
            ...item,
            relayId: undefined,
            statusToken: undefined,
            result: undefined,
            status: 'submitting',
            statusMessage: 'Sending quest to Oraion...',
            error: undefined,
            updatedAt: new Date().toISOString(),
          }
        : item
    )))

    try {
      const relay = await submitQuestToRelay(quest)
      if (!relay.relayId || !relay.statusToken) throw new Error('Relay response was missing quest tracking details')
      setQuestRequests((current) => current.map((item) => (
        item.id === quest.id
          ? {
              ...item,
              relayId: relay.relayId,
              statusToken: relay.statusToken,
              status: relay.status,
              statusMessage: relay.statusMessage,
              error: undefined,
              updatedAt: relay.updatedAt,
            }
          : item
      )))
    } catch (error) {
      setQuestRequests((current) => current.map((item) => (
        item.id === quest.id
          ? {
              ...item,
              status: 'error',
              statusMessage: 'Could not send quest to Oraion.',
              error: error instanceof Error ? error.message : 'Quest relay request failed',
              updatedAt: new Date().toISOString(),
            }
          : item
      )))
    }
  }

  function retryQuestSend(quest: QuestResearch) {
    void sendQuestToOraion({ ...quest, relayId: undefined, statusToken: undefined, result: undefined })
  }

  function handleAddQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const topic = newQuest.topic.trim()
    const city = newQuest.city.trim()

    if (!topic || !city) {
      setQuestError('Add a food topic and city first.')
      return
    }

    const now = new Date().toISOString()
    const quest: QuestResearch = {
      id: `quest-${Date.now()}`,
      topic,
      city,
      notes: newQuest.notes.trim() || undefined,
      status: 'submitting',
      statusMessage: 'Sending quest to Oraion...',
      createdAt: now,
      updatedAt: now,
      sources: defaultQuestSources(city),
    }

    setQuestRequests((current) => [quest, ...current])
    setNewQuest(blankQuestForm)
    setQuestError('')
    setShowQuestForm(false)
    setActiveTab('quests')
    void sendQuestToOraion(quest)
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
                    rating: 5,
                    notes: 'Saved to loved recipes.',
                  },
                ],
        }
      }),
    )
    setStatusFilter(status)
    setSelectedRecipeId(null)
  }

  function deleteRecipe(recipeId: string) {
    const confirmed = window.confirm('Delete this recipe from Foodie Me?')
    if (!confirmed) return

    setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId))
    setSelectedRecipeId(null)
    setStatusFilter('to_try')
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
        </header>

        {activeTab === 'home' && (
          <section className="tab-page" aria-label="Home dashboard">
            {activeQuestRequest ? (
              <article className="card compact-card">
                <div>
                  <p className="eyebrow">Active quest</p>
                  <h2>{activeQuestRequest.topic} in {activeQuestRequest.city}</h2>
                  <span className={questStatusClass(activeQuestRequest.status)}>{questStatusLabel(activeQuestRequest.status, activeQuestRequest.statusMessage)}</span>
                </div>
                <span className="pill">{activeQuestRequest.city}</span>
              </article>
            ) : (
              <article className="card empty-state">
                <p className="eyebrow">Active quest</p>
                <h2>No active quest yet</h2>
                <p>Start with a food topic and city. Foodie Me will save the request for source-backed research, not fake restaurant results.</p>
                <button type="button" onClick={() => openResearchTab(true)}>Research a quest</button>
              </article>
            )}
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
                  <button type="button" onClick={() => deleteRecipe(selectedRecipe.id)}>Delete</button>
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
            {questRequests.length > 0 ? (
              <div className="quest-list">
                {questRequests.map((quest) => (
                  <article className="card quest-card" key={quest.id}>
                    <div className="detail-topline">
                      <p className="eyebrow">Quest request</p>
                      <span className={questStatusClass(quest.status)}>{questStatusLabel(quest.status, quest.statusMessage)}</span>
                    </div>
                    <div>
                      <h3>{quest.topic} in {quest.city}</h3>
                      <p>{quest.city}</p>
                      {quest.error && <p className="form-error" role="alert">{quest.error}</p>}
                    </div>
                    {(quest.status === 'error' || quest.status === 'local') && (
                      <div className="form-actions">
                        <button type="button" onClick={() => retryQuestSend(quest)}>{quest.status === 'local' ? 'Send to Oraion' : 'Retry send'}</button>
                      </div>
                    )}
                    {quest.result && (
                      <section className="quest-results" aria-label="Quest research results">
                        {quest.result.summary && <p>{quest.result.summary}</p>}
                        {quest.result.suggestions && quest.result.suggestions.length > 0 && (
                          <div className="quest-suggestion-list">
                            {quest.result.suggestions.map((suggestion) => (
                              <article className="quest-suggestion" key={`${quest.id}-${suggestion.name}`}>
                                <div className="detail-topline">
                                  <h3>{suggestion.name}</h3>
                                  {suggestion.confidence && <span className="pill">{suggestion.confidence} confidence</span>}
                                </div>
                                {suggestion.neighborhood && <p className="eyebrow">{suggestion.neighborhood}</p>}
                                {suggestion.why && <p>{suggestion.why}</p>}
                                {suggestion.what_to_order && <p><strong>Order:</strong> {suggestion.what_to_order}</p>}
                                {suggestion.sources && suggestion.sources.length > 0 && (
                                  <div className="source-link-list" aria-label={`${suggestion.name} sources`}>
                                    {suggestion.sources.map((source) => (
                                      <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                                    ))}
                                  </div>
                                )}
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    )}
                    {quest.notes && (
                      <section className="quest-notes" aria-label="Quest notes">
                        <h3>Notes</h3>
                        <p>{quest.notes}</p>
                      </section>
                    )}
                    <section className="quest-sources" aria-label="Source checklist">
                      <h3>Source checklist</h3>
                      <ul>
                        {quest.sources.map((source) => (
                          <li key={source}>{source}</li>
                        ))}
                      </ul>
                    </section>
                  </article>
                ))}
              </div>
            ) : (
              <article className="card empty-state">
                <p className="eyebrow">Quests</p>
                <h3>No quest cards yet</h3>
                <p>Research a quest from the AI tab to save a source-backed restaurant request here.</p>
                <button type="button" onClick={() => openResearchTab(true)}>Research a quest</button>
              </article>
            )}
          </section>
        )}

        {activeTab === 'rankings' && (
          <section className="tab-page" aria-label="Rankings">
            <article className="card empty-state">
              <p className="eyebrow">Ranks</p>
              <h3>Ranks are on hold</h3>
              <p>Ranking cards will come back when we are ready to compare favorites.</p>
            </article>
          </section>
        )}

        {activeTab === 'research' && (
          <section className="tab-page" aria-label="AI research">
            <article className="card research-card">
              <p className="eyebrow">AI helper</p>
              <h3>What should AI help with?</h3>
              <p>Research a future quest or capture a recipe from YouTube, a link, a blog, Instagram, and more.</p>
              <div className="action-stack">
                <button type="button" onClick={() => setShowQuestForm(true)}>Research a quest</button>
                <button type="button" onClick={() => openCookTab(true)}>Save recipe</button>
              </div>
            </article>

            {showQuestForm && (
              <form className="card save-recipe-form quest-research-form" onSubmit={handleAddQuest} noValidate>
                <div>
                  <p className="eyebrow">Source-backed research</p>
                  <h3>Research a quest</h3>
                  <p>Oraion will use Reddit, Eater/Infatuation, Google/Maps reviews, Yelp, and local food sources before any restaurant results are saved.</p>
                </div>
                <label htmlFor="quest-topic-input">
                  Food topic
                  <input
                    id="quest-topic-input"
                    value={newQuest.topic}
                    onChange={(event) => setNewQuest((current) => ({ ...current, topic: event.target.value }))}
                    placeholder="e.g. crispy tacos, cozy bakeries"
                  />
                </label>
                <label htmlFor="quest-city-input">
                  City
                  <input
                    id="quest-city-input"
                    value={newQuest.city}
                    onChange={(event) => setNewQuest((current) => ({ ...current, city: event.target.value }))}
                    placeholder="e.g. Los Angeles"
                  />
                </label>
                <label htmlFor="quest-notes-input">
                  Notes
                  <textarea
                    id="quest-notes-input"
                    value={newQuest.notes}
                    onChange={(event) => setNewQuest((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Neighborhoods, vibes, budget, dietary notes, or must-avoid spots"
                  />
                </label>
                <section className="quest-sources" aria-label="Default source checklist">
                  <h3>Default source checklist</h3>
                  <ul>
                    {defaultQuestSources(newQuest.city).map((source) => (
                      <li key={source}>{source}</li>
                    ))}
                  </ul>
                </section>
                {questError && <p className="form-error" role="alert">{questError}</p>}
                <div className="form-actions">
                  <button type="submit">Send quest to Oraion</button>
                  <button type="button" onClick={() => { setShowQuestForm(false); setQuestError('') }}>Cancel</button>
                </div>
              </form>
            )}

            {activeQuestRequest && (
              <article className="card quest-status-card" aria-label="Latest quest status">
                <div className="detail-topline">
                  <p className="eyebrow">Latest quest status</p>
                  <span className={questStatusClass(activeQuestRequest.status)}>{questStatusLabel(activeQuestRequest.status, activeQuestRequest.statusMessage)}</span>
                </div>
                <h3>{activeQuestRequest.topic} in {activeQuestRequest.city}</h3>
                <p>Foodie Me checks this every few seconds. You do not need to refresh; open Quests for the full card and results.</p>
                <button type="button" onClick={() => setActiveTab('quests')}>Open quest card</button>
              </article>
            )}
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
