export type RecipeSourceType =
  | 'website'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'photo'
  | 'cookbook'
  | 'manual'

export type RecipeStatus = 'to_try' | 'loved'

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
    id: 'shizuku-curry-grilled-mackerel-bento',
    title: 'Curry-flavored grilled mackerel bento',
    description: 'Monday bento from Shizuku’s 5-day meal prep video with mild curry mackerel, turmeric rice, and prepped vegetables.',
    sourceType: 'youtube',
    sourceUrl: 'https://youtu.be/fqrhOaAyUEM',
    sourceLabel: 'Shizuku: 5 Days of Meal Prep｜Easy Bento Lunches｜Honey Plum Syrup',
    status: 'to_try',
    categories: ['meal-prep', 'weeknight'],
    tags: ['shizuku', 'bento', 'mackerel', 'curry'],
    cuisine: 'Japanese',
    yield: '1 bento',
    prepMinutes: 15,
    cookMinutes: 10,
    totalMinutes: 25,
    ingredients: [
      { id: 'i1', text: 'Mackerel fillets' },
      { id: 'i2', text: 'Sake' },
      { id: 'i3', text: 'Mild curry powder' },
      { id: 'i4', text: 'Flour' },
      { id: 'i5', text: 'Cooked rice, butter, turmeric, curry powder, and onion koji' },
      { id: 'i6', text: 'Steamed carrots and green beans, sesame oil, and toasted sesame seeds' },
      { id: 'i7', text: 'Air-fried agedashi-style vegetables, bonito flakes, soy sauce, and fukujinzuke' },
    ],
    steps: [
      { id: 's1', text: 'Splash mackerel with sake, rest for about 5 minutes, then pat dry.' },
      { id: 's2', text: 'Coat both sides with mild curry powder and flour.' },
      { id: 's3', text: 'Air-fry on non-stick foil at 180°C until cooked and lightly browned.', timerMinutes: 10 },
      { id: 's4', text: 'Make quick turmeric rice with butter, turmeric, a little curry powder, and onion koji.' },
      { id: 's5', text: 'Pack with sesame-tossed steamed vegetables, agedashi-style vegetables, and fukujinzuke.' },
    ],
    notes: 'Transcript source: Monday bento segment; Shizuku reheats the prepped mackerel in the air fryer before packing.',
    capturedAt: '2026-06-14T10:00:00.000Z',
    updatedAt: '2026-06-14T10:00:00.000Z',
    verdicts: [],
  },
  {
    id: 'shizuku-meatballs-okahijiki-pasta-bento',
    title: 'Meatballs + okahijiki pasta bento',
    description: 'Tuesday bento with prepped meatballs and a crisp seasonal okahijiki pasta tossed simply with garlic and onion koji.',
    sourceType: 'youtube',
    sourceUrl: 'https://youtu.be/fqrhOaAyUEM',
    sourceLabel: 'Shizuku: 5 Days of Meal Prep｜Easy Bento Lunches｜Honey Plum Syrup',
    status: 'to_try',
    categories: ['meal-prep', 'weeknight'],
    tags: ['shizuku', 'bento', 'meatballs', 'pasta', 'okahijiki'],
    cuisine: 'Japanese-inspired',
    yield: '1 bento',
    prepMinutes: 20,
    cookMinutes: 15,
    totalMinutes: 35,
    ingredients: [
      { id: 'i1', text: 'Ground meat, 300g' },
      { id: 'i2', text: 'Onion, bell pepper, baby corn silk, and shiitake stems' },
      { id: 'i3', text: 'Potato starch, 1 tablespoon' },
      { id: 'i4', text: 'Salt koji, 1 teaspoon, and onion koji, 1 tablespoon' },
      { id: 'i5', text: 'Cooked pasta, olive oil, garlic, and okahijiki' },
      { id: 'i6', text: 'Optional shrimp gratin and cheese stars for packing' },
    ],
    steps: [
      { id: 's1', text: 'Mix ground meat with chopped vegetables, potato starch, salt koji, and onion koji.' },
      { id: 's2', text: 'Lightly oil hands, shape into meatballs or small patties, brown, then steam with a splash of sake.' },
      { id: 's3', text: 'Boil pasta in salted water about 1 minute shy of package directions; toss with olive oil if prepping ahead.' },
      { id: 's4', text: 'Sauté okahijiki in olive oil with garlic and onion koji, then toss with pasta.' },
      { id: 's5', text: 'Pack pasta and meatballs with any gap fillers, such as gratin or cheese cutouts.' },
    ],
    notes: 'Transcript source: Tuesday bento segment; the pasta is intentionally lightly seasoned because the meatballs are well seasoned.',
    capturedAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-06-15T10:00:00.000Z',
    verdicts: [],
  },
  {
    id: 'shizuku-salt-koji-salmon-soccer-onigiri-bento',
    title: 'Salt-koji salmon + soccer-ball onigiri bento',
    description: 'Thursday bento with salt-koji salmon, hijiki, roasted sweet peppers, chikuwa, and a soccer-ball rice inspired by World Cup mode.',
    sourceType: 'youtube',
    sourceUrl: 'https://youtu.be/fqrhOaAyUEM',
    sourceLabel: 'Shizuku: 5 Days of Meal Prep｜Easy Bento Lunches｜Honey Plum Syrup',
    status: 'to_try',
    categories: ['meal-prep', 'cozy'],
    tags: ['shizuku', 'bento', 'salmon', 'onigiri', 'soccer'],
    cuisine: 'Japanese',
    yield: '1 bento',
    prepMinutes: 25,
    cookMinutes: 12,
    totalMinutes: 37,
    ingredients: [
      { id: 'i1', text: 'Boneless salmon fillets' },
      { id: 'i2', text: 'Salt koji' },
      { id: 'i3', text: 'Sweet peppers and chikuwa' },
      { id: 'i4', text: 'Bonito flakes and soy sauce' },
      { id: 'i5', text: 'Cooked rice, scallop furikake, and nori' },
      { id: 'i6', text: 'Lettuce and simmered hijiki with soybeans' },
    ],
    steps: [
      { id: 's1', text: 'Massage boneless salmon with salt koji; freeze or marinate until ready to cook.' },
      { id: 's2', text: 'Roast salmon on non-stick foil with sweet peppers and chikuwa, watching closely because salt koji browns easily.' },
      { id: 's3', text: 'Season roasted peppers and chikuwa with bonito flakes and soy sauce.' },
      { id: 's4', text: 'Shape rice in an oiled bowl with scallop furikake in the middle.' },
      { id: 's5', text: 'Cut nori pentagons and strips, place them on the rice ball, and pack on lettuce with salmon and hijiki.' },
    ],
    notes: 'Transcript source: Thursday bento segment; Shizuku traces a soccer-ball template from her phone and cuts the pattern from nori.',
    capturedAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
    verdicts: [],
  },
  {
    id: 'shizuku-mille-feuille-cheese-cutlet-sandwich-bento',
    title: 'Mille-feuille cheese cutlet sandwich bento',
    description: 'Friday sandwich bento with thin-sliced pork and cheese cutlets, BBQ sauce, potatoes, and fruit.',
    sourceType: 'youtube',
    sourceUrl: 'https://youtu.be/fqrhOaAyUEM',
    sourceLabel: 'Shizuku: 5 Days of Meal Prep｜Easy Bento Lunches｜Honey Plum Syrup',
    status: 'to_try',
    categories: ['meal-prep', 'weeknight'],
    tags: ['shizuku', 'bento', 'sandwich', 'tonkatsu', 'cheese'],
    cuisine: 'Japanese-inspired',
    yield: '1 sandwich bento',
    prepMinutes: 25,
    cookMinutes: 20,
    totalMinutes: 45,
    ingredients: [
      { id: 'i1', text: 'Thinly sliced pork for shabu-shabu' },
      { id: 'i2', text: 'Cheese slices' },
      { id: 'i3', text: 'Salt, pepper, flour, panko, 1 egg, cake flour 4 tablespoons, and water 30ml' },
      { id: 'i4', text: 'Ketchup 2 tablespoons, sauce 1 tablespoon, soy sauce 1 teaspoon, and honey 1 teaspoon' },
      { id: 'i5', text: 'Shokupan, mustard, mayonnaise, lettuce, and extra cheese' },
      { id: 'i6', text: 'Oil for frying, plus potatoes and fruit for the bento' },
    ],
    steps: [
      { id: 's1', text: 'Layer thin pork with cheese in the middle; season with salt and pepper.' },
      { id: 's2', text: 'Dust with flour, dip in egg-cake-flour-water batter, coat with panko, then freeze if prepping ahead.' },
      { id: 's3', text: 'Fry frozen cutlets from cold oil over medium heat, keeping oil around 140–160°C; flip after about 9 minutes.' },
      { id: 's4', text: 'Raise oil near 180°C for a quick second fry or crisp finish, then drain upright.' },
      { id: 's5', text: 'Stir BBQ sauce, spread shokupan with mustard and mayonnaise, then layer lettuce, cheese, cutlet, and sauce.' },
      { id: 's6', text: 'Wrap tightly in parchment and pack with potatoes and fruit.' },
    ],
    notes: 'Transcript source: Friday bento segment; Shizuku notes the thin pork stays tender and the sandwich holds together when wrapped tightly.',
    capturedAt: '2026-06-17T10:00:00.000Z',
    updatedAt: '2026-06-17T10:00:00.000Z',
    verdicts: [],
  },
  {
    id: 'shizuku-honey-plums-soda',
    title: 'Honey plums / honey plum soda',
    description: 'Quick honey plum syrup from Shizuku’s storm-day prep, served with sparkling water for a sweet-tangy soda.',
    sourceType: 'youtube',
    sourceUrl: 'https://youtu.be/fqrhOaAyUEM',
    sourceLabel: 'Shizuku: 5 Days of Meal Prep｜Easy Bento Lunches｜Honey Plum Syrup',
    status: 'to_try',
    categories: ['dessert', 'snack'],
    tags: ['shizuku', 'plums', 'honey', 'soda', 'syrup'],
    cuisine: 'Japanese-inspired',
    yield: 'Several jars',
    prepMinutes: 15,
    cookMinutes: 60,
    totalMinutes: 75,
    ingredients: [
      { id: 'i1', text: 'Plums, 1kg' },
      { id: 'i2', text: 'Honey, 1kg' },
      { id: 'i3', text: 'Rock sugar, 350g' },
      { id: 'i4', text: 'Sparkling water, for serving' },
    ],
    steps: [
      { id: 's1', text: 'Wash plums quickly and remove the stems.' },
      { id: 's2', text: 'Combine plums and honey, then simmer gently over low heat.' },
      { id: 's3', text: 'Skim foam, add rock sugar, and continue simmering gently for about 1 hour.', timerMinutes: 60 },
      { id: 's4', text: 'Let the plums rest overnight until translucent and syrupy.' },
      { id: 's5', text: 'Transfer to clean jars; serve syrup and fruit with sparkling water as honey plum soda.' },
    ],
    notes: 'Transcript source: Wednesday/Thursday plum segment and weekend snack; Shizuku says the jars store for over a year.',
    capturedAt: '2026-06-18T10:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
    verdicts: [],
  },
]
