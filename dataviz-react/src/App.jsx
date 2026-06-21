import React, { useState, useEffect, useRef, useCallback } from 'react'
import scrollama from 'scrollama'
import 'intersection-observer'
import D3Charts from './components/D3Charts'
import ParticleBackground from './components/ParticleBackground'
import ScrollProgress from './components/ScrollProgress'
import AnimatedCounter from './components/AnimatedCounter'
import { ChevronDown } from 'lucide-react'
import './App.css'
import dataUrl from './assets/data_final_imputed.json?url'

/**
 * Story steps for the scrollytelling sections.
 * Each step maps to a D3 chart (step index = currentStep in D3Charts).
 */
const STORY_STEPS = [
  {
    chapter: 'Chapter 1',
    title: 'The Paradox',
    content: (
      <>
        The Pacific Island Countries and Territories produce{' '}
        <span className="highlight-amber">minimal greenhouse gas emissions per capita</span>{' '}
        — yet they face an existential climate threat. Each glowing amber circle represents
        a nation's average emissions, dwarfed by industrial counterparts thousands of miles away.
      </>
    ),
  },
  {
    chapter: 'Chapter 2',
    title: 'The Rising Tides',
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
    content: (
      <>
        When disasters strike, the economic devastation is crippling. The bars show total
        economic losses (USD) by country.{' '}
        <span className="highlight-coral">Fiji alone has suffered over $1.25 Billion</span>{' '}
        in losses — a staggering figure for a nation of fewer than 1 million people.
      </>
    ),
  },
  {
    chapter: 'Chapter 4',
    title: 'Rainfall Shifts',
    content: (
      <>
        Climate change is disrupting centuries-old rainfall patterns.
        This heatmap shows <span className="highlight">precipitation anomalies</span>{' '}
        across Pacific nations since 1990 — blue cells mean wetter-than-average years,
        red means drier. The increasing intensity of swings reveals a destabilizing climate.
      </>
    ),
  },
  {
    chapter: 'Methodology',
    title: 'Bridging the Data Gaps',
    content: (
      <>
        Our data isn't perfect. Out of <span className="highlight">6,440 records</span>,{' '}
        <span className="highlight-coral">54% were initially missing</span> due to
        reporting challenges in remote islands. We used Hierarchical Mean Imputation
        to fill these gaps — cyan dots are reported data, coral dots are imputed.
      </>
    ),
  },
]

function App() {
  const [data, setData] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollerRef = useRef(null)
  const stepRefs = useRef([])

  // Load data
  useEffect(() => {
    fetch(dataUrl)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error('Failed to load data:', err))
  }, [])

  // Track overall page scroll progress for particle background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Initialize Scrollama
  useEffect(() => {
    if (!data) return

    const scroller = scrollama()
    scrollerRef.current = scroller

    scroller
      .setup({
        step: '.story-step',
        offset: 0.5,
        debug: false,
      })
      .onStepEnter(({ index }) => {
        setCurrentStep(index)
      })

    const handleResize = () => scroller.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      scroller.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [data])

  // Navigate to a step (from ScrollProgress click)
  const handleNavigate = useCallback((idx) => {
    const stepEl = stepRefs.current[idx]
    if (stepEl) {
      stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  // Scroll to first story section
  const scrollToStory = () => {
    const section = document.querySelector('.scrollytelling-section')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Loading state
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
      {/* Subtle particle background */}
      <ParticleBackground scrollProgress={scrollProgress} />

      {/* Scroll Progress Nav */}
      <ScrollProgress activeStep={currentStep} onNavigate={handleNavigate} />

      {/* ====== HERO SECTION ====== */}
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Pacific Islands Climate Data</p>
          <h1 className="hero-title">
            The <span className="accent">Sinking</span> Voices<br />of the Pacific
          </h1>
          <p className="hero-subtitle">
            A tale of climate injustice — the islands contribute the least to global emissions,
            but suffer the most devastating consequences. Scroll to explore their story through data.
          </p>

          <div className="hero-stats">
            <AnimatedCounter end={23} suffix="" duration={2000} />
            <AnimatedCounter end={1.25} prefix="$" suffix="B" decimals={2} duration={2500} />
            <AnimatedCounter end={54} suffix="%" duration={2000} />
          </div>
          <div className="hero-stats" style={{ marginTop: '0.25rem' }}>
            <div className="stat-label">Island Nations</div>
            <div className="stat-label">Economic Losses</div>
            <div className="stat-label">Data Gaps Bridged</div>
          </div>
        </div>

        <div className="scroll-indicator" onClick={scrollToStory}>
          <span>Scroll to explore</span>
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ====== SCROLLYTELLING SECTION ====== */}
      <section className="scrollytelling-section">
        <div className="scrolly-container">
          {/* Left: scrolling text cards */}
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
                </div>
              </div>
            ))}
          </div>

          {/* Right: sticky chart */}
          <div className="scrolly-chart-column">
            <div className="chart-wrapper">
              <D3Charts data={data} currentStep={currentStep} />
            </div>
          </div>
        </div>
      </section>

      {/* ====== CLOSING SECTION ====== */}
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
          <h3>Data Sources & Methodology</h3>
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
          Built with React, D3.js & Scrollama · Data Visualization Project · 2025
        </p>
      </footer>
    </>
  )
}

export default App
