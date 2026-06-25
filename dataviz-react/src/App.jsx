import React, { useState, useEffect, useRef, useCallback } from 'react'
import scrollama from 'scrollama'
import 'intersection-observer'
import D3Charts from './components/D3Charts'
import ParticleBackground from './components/ParticleBackground'
import ScrollProgress from './components/ScrollProgress'
import AnimatedCounter from './components/AnimatedCounter'
import CountryDetailPanel from './components/CountryDetailPanel'
import { ChevronDown } from 'lucide-react'
import './App.css'
import dataUrl from './assets/data_final_imputed.json?url'

/**
 * Story steps — Chapter 0 is the geomap, Chapters 1-5 are data viz.
 */
const STORY_STEPS = [
  {
    chapter: 'Chapter 0',
    title: 'Where They Are',
    content: (
      <>
        Scattered across <span className="highlight">one-third of Earth's surface</span>,
        23 Pacific Island Countries and Territories sit isolated in the vast ocean.
        These tiny dots on a map represent real nations — communities with rich
        cultures, ancient traditions, and millions of lives at stake.
        <em style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Click any marker to explore a country's data →
        </em>
      </>
    ),
  },
  {
    chapter: 'Chapter 1',
    title: 'The Paradox',
    stat: { number: '~0.01', unit: 't CO₂/capita', desc: 'Average per-capita emissions across Pacific island nations' },
    content: (
      <>
        The Pacific Island Countries produce{' '}
        <span className="highlight-amber">minimal greenhouse gas emissions per capita</span>{' '}
        — yet they face an existential climate threat. Each amber circle represents
        a nation's average emissions, dwarfed by industrial counterparts thousands of miles away.
      </>
    ),
  },
  {
    chapter: 'Chapter 2',
    title: 'The Rising Tides',
    stat: { number: '+10cm', unit: 'sea level rise', desc: 'Average anomaly increase in recent decades' },
    content: (
      <>
        Sea levels have been rising steadily since the 1970s. The anomaly curve reveals a
        frightening <span className="highlight">acceleration</span> — with an average increase
        of over 10cm in recent years, threatening low-lying atolls and forcing communities
        to consider relocation.
      </>
    ),
  },
  {
    chapter: 'Chapter 3',
    title: 'The Economic Toll',
    stat: { number: '$1.25B', unit: 'in losses', desc: 'Fiji alone — fewer than 1 million people' },
    content: (
      <>
        When disasters strike, the economic devastation is crippling.{' '}
        <span className="highlight-coral">Fiji alone has suffered over $1.25 Billion</span>{' '}
        in losses — a staggering figure for a nation of fewer than 1 million people.
      </>
    ),
  },
  {
    chapter: 'Chapter 4',
    title: 'Rainfall Shifts',
    stat: { number: '35+', unit: 'years of data', desc: 'Anomalies tracked across 23 nations since 1990' },
    content: (
      <>
        Climate change is disrupting centuries-old rainfall patterns.
        This heatmap shows <span className="highlight">precipitation anomalies</span>{' '}
        across Pacific nations since 1990 — blue means wetter, red means drier.
        The increasing intensity reveals a destabilizing climate.
      </>
    ),
  },
  {
    chapter: 'Methodology',
    title: 'Bridging the Data Gaps',
    stat: { number: '54%', unit: 'data imputed', desc: 'Out of 6,440 records — reporting inequality' },
    content: (
      <>
        Our data isn't perfect. Out of <span className="highlight">6,440 records</span>,{' '}
        <span className="highlight-coral">54% were initially missing</span> due to
        reporting challenges in remote islands. We used Hierarchical Mean Imputation
        to fill gaps — teal dots are reported, coral dots are imputed.
      </>
    ),
  },
]

function App() {
  const [data, setData] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const scrollerRef = useRef(null)
  const stepRefs = useRef([])

  // Load data
  useEffect(() => {
    fetch(dataUrl)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error('Failed to load data:', err))
  }, [])

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scrollama
  useEffect(() => {
    if (!data) return
    const scroller = scrollama()
    scrollerRef.current = scroller
    scroller
      .setup({ step: '.story-step', offset: 0.5, debug: false })
      .onStepEnter(({ index }) => setCurrentStep(index))
    const handleResize = () => scroller.resize()
    window.addEventListener('resize', handleResize)
    return () => { scroller.destroy(); window.removeEventListener('resize', handleResize) }
  }, [data])

  const handleNavigate = useCallback((idx) => {
    const stepEl = stepRefs.current[idx]
    if (stepEl) stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const scrollToStory = () => {
    const section = document.querySelector('.chapter-intro')
    if (section) section.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectCountry = useCallback((name) => {
    setSelectedCountry(name)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedCountry(null)
  }, [])

  if (!data) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading Pacific data…</p>
      </div>
    )
  }

  return (
    <>
      <ParticleBackground scrollProgress={scrollProgress} />
      <ScrollProgress activeStep={currentStep} onNavigate={handleNavigate} />

      {/* Country Detail Panel (shown when a marker is clicked) */}
      {selectedCountry && (
        <CountryDetailPanel
          country={selectedCountry}
          data={data}
          onClose={handleClosePanel}
        />
      )}

      {/* ====== HERO ====== */}
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Pacific Islands Climate Data</p>

          <h1 className="hero-title">
            The <span className="accent">Sinking</span> Voices<br />
            <span className="italic">of the Pacific</span>
          </h1>

          <p className="hero-subtitle">
            A tale of climate injustice — the islands contribute the least to global emissions,
            but suffer the most devastating consequences. Scroll to explore their story through data.
          </p>

          <div className="hero-divider" />

          <div className="hero-stats">
            <AnimatedCounter end={23} suffix="" duration={2000} label="Island Nations" />
            <AnimatedCounter end={1.25} prefix="$" suffix="B" decimals={2} duration={2500} label="Economic Losses" />
            <AnimatedCounter end={54} suffix="%" duration={2000} label="Data Gaps Bridged" />
          </div>
        </div>

        <div className="scroll-indicator" onClick={scrollToStory}>
          <span>Scroll to explore</span>
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ====== CHAPTER INTRO ====== */}
      <div className="chapter-intro">
        <p className="chapter-intro-label">The Data Story</p>
        <h2>
          "Numbers alone cannot convey the weight of a sinking nation —<br />
          but they can bear witness."
        </h2>
      </div>

      {/* ====== SCROLLYTELLING ====== */}
      <section className="scrollytelling-section">
        <div className="scrolly-container">

          {/* Left: text cards */}
          <div className="scrolly-text-column">
            {STORY_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="story-step"
                ref={el => (stepRefs.current[idx] = el)}
              >
                <div className={`step-card ${currentStep === idx ? 'is-active' : ''}`}>
                  <div className="step-chapter">{step.chapter}</div>
                  <h2>{step.title}</h2>
                  <p>{step.content}</p>

                  {step.stat && (
                    <div className="step-stat">
                      <div className="step-stat-number" style={{ color: 'var(--accent-teal)' }}>
                        {step.stat.number}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-teal)', opacity: 0.7 }}>
                          {step.stat.unit}
                        </div>
                        <div className="step-stat-desc">{step.stat.desc}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: sticky chart */}
          <div className="scrolly-chart-column">
            <div className="chart-wrapper">
              <D3Charts
                data={data}
                currentStep={currentStep}
                onSelectCountry={handleSelectCountry}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ====== CLOSING ====== */}
      <section className="closing-section">
        <hr className="closing-divider" />
        <h2>About This Visualization</h2>
        <p>
          This scrollytelling data visualization explores the disproportionate impact of
          climate change on Pacific Island nations — communities that contribute the least
          to global emissions yet face the most severe consequences.
        </p>
        <p>
          The data spans from 1970 to 2025 across 23 Pacific Island Countries and Territories (PICTs),
          covering greenhouse gas emissions, sea level anomalies, disaster-related economic losses,
          and precipitation patterns.
        </p>

        <div className="data-sources">
          <h3>Data Sources &amp; Methodology</h3>
          <ul>
            <li>Pacific Data Hub — SPC Statistics for Development Division</li>
            <li>NOAA Global Mean Sea Level Data</li>
            <li>EM-DAT International Disaster Database</li>
            <li>World Bank Climate Change Portal</li>
            <li>Missing data (54%) filled via Hierarchical Mean Imputation</li>
          </ul>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="footer">
        <p>
          Built with React, D3.js &amp; Scrollama · Data Visualization Project · 2025
        </p>
      </footer>
    </>
  )
}

export default App
