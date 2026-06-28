import { useMemo, useState } from 'react'
import './App.css'
import { cities, nextPlaces, quests, rankings } from './data/mockFoodie'

type TabId = 'home' | 'cities' | 'quests' | 'rankings' | 'research'

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'cities', label: 'Cities', icon: '📍' },
  { id: 'quests', label: 'Quests', icon: '🍜' },
  { id: 'rankings', label: 'Ranks', icon: '⭐' },
  { id: 'research', label: 'AI', icon: '🔎' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home')

  const featuredQuest = quests[0]
  const nextPlace = nextPlaces[0]
  const title = useMemo(() => {
    if (activeTab === 'home') return 'Home'
    if (activeTab === 'cities') return 'Cities'
    if (activeTab === 'quests') return 'Food quests'
    if (activeTab === 'rankings') return 'Rankings'
    return 'AI research'
  }, [activeTab])

  return (
    <main className="phone-shell">
      <section className="image-hero" aria-label="Foodie Me header image">
        <img
          src="/images/foodie-me-header-cropped.jpeg"
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
                <strong>6</strong>
                <span>quests</span>
              </article>
              <article>
                <strong>39</strong>
                <span>places</span>
              </article>
              <article>
                <strong>14</strong>
                <span>rated</span>
              </article>
            </div>

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

        {activeTab === 'cities' && (
          <section className="tab-page" aria-label="Cities">
            {cities.map((city) => (
              <article className={`card city-card ${city.color}`} key={city.name}>
                <div>
                  <h3>{city.name}</h3>
                  <p>{city.mood}</p>
                </div>
                <span className="pill">{city.activeQuests} quests · {city.savedPlaces} places</span>
              </article>
            ))}
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
                Later this tab will show source-backed restaurant candidates. Nothing saves until you approve it.
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
            onClick={() => setActiveTab(tab.id)}
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
