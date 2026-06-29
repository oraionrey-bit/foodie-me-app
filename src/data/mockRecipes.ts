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

export const recipeCategories: RecipeCategory[] = [
  'weeknight',
  'cozy',
  'breakfast',
  'dessert',
  'meal-prep',
  'date-night',
  'snack',
  'hosting',
]

export const sourceTypeLabels: Record<RecipeSourceType, string> = {
  website: '🌐 Blog',
  youtube: '▶️ YouTube',
  tiktok: '🎵 TikTok',
  instagram: '📱 Instagram',
  photo: '📸 Photo',
  cookbook: '📖 Cookbook',
  manual: '✍️ Note',
}

export const categoryLabels: Record<RecipeCategory, string> = {
  weeknight: 'Weeknight',
  cozy: 'Cozy',
  breakfast: 'Breakfast',
  dessert: 'Dessert',
  'meal-prep': 'Meal prep',
  'date-night': 'Date night',
  snack: 'Snack',
  hosting: 'Hosting',
}

export const mockRecipes: Recipe[] = [
  {
    id: 'shizuku-bento-rainbow-tamagoyaki',
    title: 'Shizuku rainbow tamagoyaki bento',
    description: 'A cheerful layered lunchbox inspired by Shizuku-style bento videos.',
    sourceType: 'youtube',
    sourceUrl: 'https://www.youtube.com/results?search_query=shizuku+bento+tamagoyaki',
    sourceLabel: 'Shizuku bento video collection',
    status: 'to_try',
    categories: ['meal-prep', 'cozy'],
    tags: ['bento', 'egg', 'lunchbox'],
    cuisine: 'Japanese-inspired',
    yield: '2 bentos',
    prepMinutes: 25,
    cookMinutes: 15,
    totalMinutes: 40,
    ingredients: [
      { id: 'i1', text: '4 eggs' },
      { id: 'i2', text: 'Cooked rice' },
      { id: 'i3', text: 'Furikake or sesame seeds' },
      { id: 'i4', text: 'Steamed broccoli and carrots' },
      { id: 'i5', text: 'Soy sauce, mirin, and a pinch of sugar' },
    ],
    steps: [
      { id: 's1', text: 'Season the eggs with soy sauce, mirin, and sugar.' },
      { id: 's2', text: 'Cook thin egg layers and roll into tamagoyaki.', timerMinutes: 8 },
      { id: 's3', text: 'Pack rice, sliced tamagoyaki, and vegetables into a bento box.' },
      { id: 's4', text: 'Finish with furikake and let cool slightly before closing.' },
    ],
    notes: 'Try the neat diagonal packing style from the video queue.',
    capturedAt: '2026-06-14T10:00:00.000Z',
    updatedAt: '2026-06-14T10:00:00.000Z',
    verdicts: [],
  },
  {
    id: 'shizuku-bento-karaage-stars',
    title: 'Shizuku mini karaage star bento',
    description: 'Crispy bites, star carrots, and soft rice for a cute lunchbox try.',
    sourceType: 'tiktok',
    sourceUrl: 'https://www.tiktok.com/search?q=shizuku%20bento%20karaage',
    sourceLabel: 'Shizuku bento short videos',
    status: 'to_try',
    categories: ['meal-prep', 'weeknight'],
    tags: ['bento', 'chicken', 'cute'],
    cuisine: 'Japanese-inspired',
    yield: '2 bentos',
    prepMinutes: 20,
    cookMinutes: 18,
    totalMinutes: 38,
    ingredients: [
      { id: 'i1', text: 'Chicken thigh pieces' },
      { id: 'i2', text: 'Soy sauce, ginger, and garlic' },
      { id: 'i3', text: 'Potato starch' },
      { id: 'i4', text: 'Rice and lettuce cups' },
      { id: 'i5', text: 'Carrots cut into stars' },
    ],
    steps: [
      { id: 's1', text: 'Marinate chicken with soy, ginger, and garlic.', timerMinutes: 10 },
      { id: 's2', text: 'Coat lightly in potato starch.' },
      { id: 's3', text: 'Pan-fry or air-fry until crisp and cooked through.', timerMinutes: 12 },
      { id: 's4', text: 'Pack with rice, lettuce cups, and star carrots.' },
    ],
    notes: 'Use air fryer if making on a weeknight.',
    capturedAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-06-15T10:00:00.000Z',
    verdicts: [],
  },
  {
    id: 'shizuku-bento-onigiri-garden',
    title: 'Shizuku onigiri garden box',
    description: 'Tiny onigiri with cucumber flowers and cozy miso soup energy.',
    sourceType: 'instagram',
    sourceUrl: 'https://www.instagram.com/explore/tags/bento/',
    sourceLabel: 'Bento reel collection',
    status: 'to_try',
    categories: ['snack', 'cozy'],
    tags: ['onigiri', 'rice', 'picnic'],
    cuisine: 'Japanese-inspired',
    yield: '6 mini onigiri',
    prepMinutes: 18,
    totalMinutes: 18,
    ingredients: [
      { id: 'i1', text: 'Warm sushi rice' },
      { id: 'i2', text: 'Nori strips' },
      { id: 'i3', text: 'Tuna mayo or pickled plum filling' },
      { id: 'i4', text: 'Cucumber and radish slices' },
    ],
    steps: [
      { id: 's1', text: 'Shape rice around a small spoonful of filling.' },
      { id: 's2', text: 'Wrap each onigiri with a nori strip.' },
      { id: 's3', text: 'Add cucumber flowers and radish slices around the rice.' },
    ],
    notes: 'Save as a picnic snack idea.',
    capturedAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
    verdicts: [],
  },
  {
    id: 'cozy-tomato-bean-skillet',
    title: 'Cozy tomato bean skillet',
    description: 'A low-effort pantry dinner with toast and herbs.',
    sourceType: 'website',
    sourceUrl: 'https://example.com/cozy-tomato-bean-skillet',
    sourceLabel: 'Weeknight blog',
    status: 'loved',
    categories: ['weeknight', 'cozy'],
    tags: ['beans', 'one-pan', 'pantry'],
    yield: '3 servings',
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
    ingredients: [
      { id: 'i1', text: '1 can white beans' },
      { id: 'i2', text: '1 cup crushed tomatoes' },
      { id: 'i3', text: 'Garlic and olive oil' },
      { id: 'i4', text: 'Toasted bread' },
    ],
    steps: [
      { id: 's1', text: 'Sizzle garlic in olive oil.' },
      { id: 's2', text: 'Add tomatoes and beans; simmer until glossy.', timerMinutes: 15 },
      { id: 's3', text: 'Serve with toast and herbs.' },
    ],
    notes: 'Loved with extra lemon zest at the end.',
    capturedAt: '2026-05-20T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    verdicts: [{ cookedAt: '2026-06-01T19:30:00.000Z', rating: 5, notes: 'Keep this in weeknight rotation.' }],
  },
  {
    id: 'golden-miso-pancakes',
    title: 'Golden miso breakfast pancakes',
    description: 'Sweet-salty pancakes with maple butter.',
    sourceType: 'cookbook',
    sourceLabel: 'Brunch notebook',
    status: 'loved',
    categories: ['breakfast', 'date-night'],
    tags: ['brunch', 'miso', 'pancakes'],
    yield: '8 pancakes',
    prepMinutes: 10,
    cookMinutes: 15,
    totalMinutes: 25,
    ingredients: [
      { id: 'i1', text: 'Pancake batter' },
      { id: 'i2', text: '1 tablespoon white miso' },
      { id: 'i3', text: 'Maple butter' },
      { id: 'i4', text: 'Seasonal fruit' },
    ],
    steps: [
      { id: 's1', text: 'Whisk miso into wet pancake ingredients.' },
      { id: 's2', text: 'Cook pancakes on a buttered griddle.', timerMinutes: 12 },
      { id: 's3', text: 'Stack with maple butter and fruit.' },
    ],
    notes: 'Best as a slow weekend breakfast.',
    capturedAt: '2026-04-11T10:00:00.000Z',
    updatedAt: '2026-05-02T10:00:00.000Z',
    verdicts: [{ cookedAt: '2026-05-02T10:30:00.000Z', rating: 5, notes: 'Fluffy and memorable.' }],
  },
  {
    id: 'chili-crisp-noodle-salad',
    title: 'Chili crisp noodle salad',
    description: 'A saved photo note that turned into an easy lunch.',
    sourceType: 'photo',
    sourceLabel: 'Screenshot from a cafe board',
    status: 'cooked',
    categories: ['weeknight', 'snack'],
    tags: ['noodles', 'chili crisp'],
    yield: '2 bowls',
    prepMinutes: 15,
    totalMinutes: 15,
    ingredients: [
      { id: 'i1', text: 'Cold noodles' },
      { id: 'i2', text: 'Cucumber ribbons' },
      { id: 'i3', text: 'Chili crisp and sesame dressing' },
    ],
    steps: [
      { id: 's1', text: 'Toss cooked cold noodles with dressing.' },
      { id: 's2', text: 'Fold in cucumber ribbons and extra chili crisp.' },
    ],
    notes: 'Good, but needs protein next time.',
    capturedAt: '2026-03-09T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
    verdicts: [{ cookedAt: '2026-03-10T12:30:00.000Z', rating: 3, changesNextTime: 'Add tofu or egg.' }],
  },
  {
    id: 'lavender-cloud-cookies',
    title: 'Lavender cloud cookies',
    description: 'Pretty cookies that were more looks than flavor.',
    sourceType: 'manual',
    sourceLabel: 'Manual note',
    status: 'archived',
    categories: ['dessert'],
    tags: ['cookies', 'lavender'],
    yield: '18 cookies',
    prepMinutes: 20,
    cookMinutes: 11,
    totalMinutes: 31,
    ingredients: [
      { id: 'i1', text: 'Sugar cookie dough' },
      { id: 'i2', text: 'Culinary lavender' },
      { id: 'i3', text: 'Vanilla glaze' },
    ],
    steps: [
      { id: 's1', text: 'Fold lavender into cookie dough.' },
      { id: 's2', text: 'Bake until edges set.', timerMinutes: 11 },
      { id: 's3', text: 'Glaze once cool.' },
    ],
    notes: 'Archived: too floral for a repeat.',
    capturedAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-14T10:00:00.000Z',
    verdicts: [{ cookedAt: '2026-02-14T20:00:00.000Z', rating: 2, notes: 'Skip next time.' }],
  },
]
