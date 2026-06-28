export type City = {
  name: string
  mood: string
  activeQuests: number
  savedPlaces: number
  color: 'peach' | 'mint' | 'cream'
}

export type Quest = {
  title: string
  city: string
  progress: string
  nextStep: string
}

export type Place = {
  name: string
  city: string
  reason: string
  tags: string[]
}

export type Ranking = {
  place: string
  dish: string
  anthony: number
  tina: number
  note: string
}

export const cities: City[] = [
  {
    name: 'Los Angeles',
    mood: 'Neighborhood gems, tacos, pastries',
    activeQuests: 3,
    savedPlaces: 18,
    color: 'peach',
  },
  {
    name: 'New York',
    mood: 'Pizza slices, noodles, late-night bites',
    activeQuests: 2,
    savedPlaces: 12,
    color: 'mint',
  },
  {
    name: 'Tokyo',
    mood: 'Coffee shops, curry, dessert walks',
    activeQuests: 1,
    savedPlaces: 9,
    color: 'cream',
  },
]

export const quests: Quest[] = [
  {
    title: 'Best cozy breakfast date',
    city: 'Los Angeles',
    progress: '4 of 8 places tried',
    nextStep: 'Compare biscuit sandwich notes',
  },
  {
    title: 'Perfect rainy-day noodle bowl',
    city: 'New York',
    progress: '2 of 6 places tried',
    nextStep: 'Shortlist two broth styles',
  },
  {
    title: 'Dessert worth a detour',
    city: 'Tokyo',
    progress: '1 of 5 places tried',
    nextStep: 'Add reservation-friendly cafés',
  },
]

export const nextPlaces: Place[] = [
  {
    name: 'Sunny Side Cart',
    city: 'Los Angeles',
    reason: 'High confidence for quick brunch and outdoor seating.',
    tags: ['brunch', 'walkable', 'casual'],
  },
  {
    name: 'Little Broth Bar',
    city: 'New York',
    reason: 'Looks ideal for the rainy-day noodle quest.',
    tags: ['noodles', 'cozy', 'save for winter'],
  },
  {
    name: 'Peach Mint Bakery',
    city: 'Tokyo',
    reason: 'Dessert stop with a calm café vibe.',
    tags: ['dessert', 'coffee', 'date spot'],
  },
]

export const rankings: Ranking[] = [
  {
    place: 'Marigold Market',
    dish: 'Crispy potato taco',
    anthony: 9.1,
    tina: 8.8,
    note: 'Current top casual bite.',
  },
  {
    place: 'Oat & Honey',
    dish: 'Berry breakfast plate',
    anthony: 8.2,
    tina: 9.4,
    note: 'Best slow morning pick.',
  },
]
