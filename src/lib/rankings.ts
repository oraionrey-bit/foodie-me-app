import type { Recipe } from '../data/mockRecipes'

export type RankingOwner = 'tina' | 'anthony'

export type RankingSuggestionRating = {
  status?: 'want_to_try' | 'tried_liked' | 'tried_ok' | 'skip'
  score?: number
  notes?: string
  updatedAt?: string
}

export type RankingSuggestion = {
  name: string
  neighborhood?: string
  what_to_order?: string
  confidence?: string
  ratings?: Partial<Record<RankingOwner, RankingSuggestionRating>>
}

export type RankingQuest = {
  id: string
  city: string
  topic: string
  result?: {
    suggestions?: RankingSuggestion[]
  }
}

export type RestaurantRankingItem = {
  id: string
  name: string
  neighborhood?: string
  city: string
  topic: string
  order?: string
  confidence?: string
  tina?: RankingSuggestionRating
  anthony?: RankingSuggestionRating
  score: number
  reason: string
}

export type RecipeRankingItem = {
  id: string
  title: string
  detail: string
}

export type RankingSection = {
  id: 'bothLoved' | 'tinaLiked' | 'anthonyLiked' | 'lovedRecipes'
  title: string
  emptyTitle: string
  emptyBody: string
  items: Array<RestaurantRankingItem | RecipeRankingItem>
}

const ownerLabels: Record<RankingOwner, string> = {
  tina: 'Tina',
  anthony: 'Anthony',
}

function isLiked(rating?: RankingSuggestionRating) {
  if (!rating) return false
  return rating.status === 'tried_liked' || (rating.score ?? 0) >= 4
}

function confidenceWeight(confidence?: string) {
  const normalized = confidence?.toLowerCase() ?? ''
  if (normalized.includes('high')) return 2
  if (normalized.includes('medium')) return 1
  return 0
}

function ratingScore(rating?: RankingSuggestionRating) {
  if (!rating) return 0
  return (rating.score ?? 0) + (rating.status === 'tried_liked' ? 2 : 0) + (rating.notes ? 0.5 : 0)
}

function latestRatingTime(item: RestaurantRankingItem) {
  return Math.max(
    item.tina?.updatedAt ? Date.parse(item.tina.updatedAt) || 0 : 0,
    item.anthony?.updatedAt ? Date.parse(item.anthony.updatedAt) || 0 : 0,
  )
}

function ownerReason(owner: RankingOwner, rating?: RankingSuggestionRating) {
  const label = ownerLabels[owner]
  if (!rating) return `${label} saved this pick`
  if (rating.status === 'tried_liked' && rating.score) return `${label} liked it and scored it ${rating.score}/5`
  if (rating.status === 'tried_liked') return `${label} marked it liked`
  if (rating.score) return `${label} scored it ${rating.score}/5`
  return `${label} saved a note`
}

function sortRestaurants(items: RestaurantRankingItem[]) {
  return [...items].sort((left, right) => (
    right.score - left.score
    || latestRatingTime(right) - latestRatingTime(left)
    || left.name.localeCompare(right.name)
  ))
}

function rankableRestaurantItems(quests: RankingQuest[]) {
  return quests.flatMap((quest) => (
    quest.result?.suggestions?.map((suggestion, index): RestaurantRankingItem => {
      const tina = suggestion.ratings?.tina
      const anthony = suggestion.ratings?.anthony
      return {
        id: `${quest.id}-${index}-${suggestion.name}`,
        name: suggestion.name,
        neighborhood: suggestion.neighborhood,
        city: quest.city,
        topic: quest.topic,
        order: suggestion.what_to_order,
        confidence: suggestion.confidence,
        tina,
        anthony,
        score: ratingScore(tina) + ratingScore(anthony) + confidenceWeight(suggestion.confidence),
        reason: '',
      }
    }) ?? []
  ))
}

function lovedRecipeItems(recipes: Recipe[]) {
  return recipes
    .filter((recipe) => recipe.status === 'loved')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title))
    .slice(0, 6)
    .map((recipe): RecipeRankingItem => ({
      id: recipe.id,
      title: recipe.title,
      detail: recipe.notes || recipe.description || 'Loved recipe saved in Cook.',
    }))
}

export function buildRankingSections(quests: RankingQuest[], recipes: Recipe[]): RankingSection[] {
  const restaurants = rankableRestaurantItems(quests)
  const bothLoved = sortRestaurants(restaurants)
    .filter((item) => isLiked(item.tina) && isLiked(item.anthony))
    .slice(0, 5)
    .map((item) => ({ ...item, reason: item.confidence ? `Both liked it · ${item.confidence} confidence` : 'Both liked it' }))
  const tinaLiked = sortRestaurants(restaurants)
    .filter((item) => isLiked(item.tina))
    .slice(0, 5)
    .map((item) => ({ ...item, reason: ownerReason('tina', item.tina) }))
  const anthonyLiked = sortRestaurants(restaurants)
    .filter((item) => isLiked(item.anthony))
    .slice(0, 5)
    .map((item) => ({ ...item, reason: ownerReason('anthony', item.anthony) }))

  return [
    {
      id: 'bothLoved',
      title: 'Both-loved picks',
      emptyTitle: 'No shared favorites yet',
      emptyBody: 'Rate the same quest pick for Tina and Anthony, then the best overlaps will show up here.',
      items: bothLoved,
    },
    {
      id: 'tinaLiked',
      title: 'Tina-liked picks',
      emptyTitle: 'No Tina favorites yet',
      emptyBody: 'Open a quest and mark Tina’s favorite spots so they are easy to find later.',
      items: tinaLiked,
    },
    {
      id: 'anthonyLiked',
      title: 'Anthony-liked picks',
      emptyTitle: 'No Anthony favorites yet',
      emptyBody: 'Open a quest and mark Anthony’s favorite spots so they are easy to find later.',
      items: anthonyLiked,
    },
    {
      id: 'lovedRecipes',
      title: 'Loved recipes',
      emptyTitle: 'No loved recipes yet',
      emptyBody: 'Cook from the To Try list, then save the keepers here.',
      items: lovedRecipeItems(recipes),
    },
  ]
}

export function isRecipeRankingItem(item: RestaurantRankingItem | RecipeRankingItem): item is RecipeRankingItem {
  return 'title' in item
}
