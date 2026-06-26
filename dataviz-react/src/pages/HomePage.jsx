import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import HeroSection from '../components/HeroSection';
import TransitionScreen from '../components/TransitionScreen';
import ChartSection from '../components/ChartSection';
import SeaLevelChart from '../components/charts/SeaLevelChart';
import RainfallChart from '../components/charts/RainfallChart';
import EconomicLossChart from '../components/charts/EconomicLossChart';
import AffectedPopChart from '../components/charts/AffectedPopChart';
import EmissionsGeoChart from '../components/charts/EmissionsGeoChart';
import GeoMapSection from '../components/GeoMapSection';
import ScrollProgress from '../components/ScrollProgress';
import ParticleBackground from '../components/ParticleBackground';

/**
 * HomePage — Full scrollytelling flow.
 * Sections follow the Figma design flow with parallax transitions.
 */

const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'paradox', label: 'The Paradox' },
  { id: 'sea-level', label: 'Sea Level' },
  { id: 'rainfall', label: 'Rainfall' },
  { id: 'economic', label: 'Economic Toll' },
  { id: 'affected', label: 'Front Line' },
  { id: 'emissions', label: 'Emissions' },
  { id: 'geomap', label: 'Explore' },
];

export default function HomePage() {
  const { data, loading, error, topCountries } = useData();

  // Prepare chart data
  const chartDataSets = useMemo(() => {
    if (!data) return {};

    const seaLevel = data
      .filter(d => d.INDICATOR === 'SEA_LVL')
      .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }));

    const rainfall = data
      .filter(d => d.INDICATOR === 'RAIN_ANOM')
      .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }));

    const affected = data
      .filter(d => d.INDICATOR === 'VC_DSR_AFFCT')
      .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }));

    const lossRaw = data.filter(d => d.INDICATOR === 'VC_DSR_AALT');

    const emissionsRaw = data.filter(d => d.INDICATOR === 'GHG_EMI_CAPITA');

    // Summary stats for hero
    const totalLoss = lossRaw.reduce((s, d) => s + d.OBS_VALUE, 0);
    const totalAffected = affected.reduce((s, d) => s + d.value, 0);

    return { seaLevel, rainfall, affected, lossRaw, emissionsRaw, totalLoss, totalAffected };
  }, [data]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading Pacific climate data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <p style={{ color: 'var(--accent-coral)' }}>Error: {error}</p>
      </div>
    );
  }

  const { seaLevel, rainfall, affected, lossRaw, emissionsRaw, totalLoss, totalAffected } = chartDataSets;

  return (
    <div className="homepage">
      <ParticleBackground />
      <ScrollProgress sections={SECTIONS} />

      {/* ═══ SECTION 1: HERO ═══ */}
      <HeroSection
        totalCountries={topCountries.length}
        totalLoss={totalLoss}
        totalAffected={totalAffected}
      />

      {/* ═══ SECTION 2: TRANSITION — The Paradox ═══ */}
      <TransitionScreen
        id="paradox"
        title="The Paradox"
        accentWord="Paradox"
        subtitle="These island nations produce less than 0.03% of global greenhouse emissions — yet they are the first to face extinction from climate change. The data tells a story of profound injustice."
      />

      {/* ═══ SECTION 3: SEA LEVEL ═══ */}
      <ChartSection
        id="sea-level"
        label="Rising Waters"
        title="When the Sea Begins to Speak"
        narrative={
          <p>
            The carbon gas that builds up in the atmosphere acts like a global heat trap, and the
            oceans absorb most of that heat. Since 1993, sea levels across the Pacific have risen
            at an <span className="highlight-blue">alarming and accelerating rate</span>, threatening
            the very existence of low-lying island nations.
          </p>
        }
        chart={<SeaLevelChart data={seaLevel} />}
        footer="Source: Pacific Community (SPC) — Sea Level Anomaly Data (1993–2023)"
      />

      {/* ═══ SECTION 4: TRANSITION — Shattered Seasons ═══ */}
      <TransitionScreen
        title="Shattered Seasons"
        accentWord="Shattered"
        subtitle="Climate change doesn't just raise seas — it disrupts centuries-old rainfall patterns, bringing devastating droughts and floods to communities that depend on predictable weather."
      />

      {/* ═══ SECTION 5: RAINFALL ═══ */}
      <ChartSection
        id="rainfall"
        label="Climate Disruption"
        title="Rainfall Anomalies Across the Pacific"
        narrative={
          <p>
            This chart reveals the <span className="highlight-purple">volatile swings</span> in
            annual rainfall across Pacific Island nations. Bars above zero indicate years wetter
            than average; below zero means drought. The increasing amplitude of these swings
            signals a climate system under severe stress.
          </p>
        }
        chart={<RainfallChart data={rainfall} />}
        footer="Source: SPC — Rainfall Anomaly Data (1970–2025)"
      />

      {/* ═══ SECTION 6: TRANSITION — The Economic Toll ═══ */}
      <TransitionScreen
        title="The Economic Toll"
        accentWord="Economic"
        subtitle="When nature loses its balance, disasters strike with devastating force. The financial cost to these small nations is staggering — often exceeding their entire GDP."
      />

      {/* ═══ SECTION 7: ECONOMIC LOSSES ═══ */}
      <ChartSection
        id="economic"
        label="Financial Devastation"
        title="Economic Losses from Climate Disasters"
        narrative={
          <p>
            Beyond the loss of life and cultural heritage, climate disasters triggered by carbon
            emissions leave <span className="highlight-coral">deep financial scars</span>. Small island
            nations bear a disproportionate burden, with damages running into billions of dollars
            that devastate their economies for decades.
          </p>
        }
        chart={<EconomicLossChart data={lossRaw} />}
        footer="Source: SPC — Direct Economic Losses Attributed to Disasters (1970–2025)"
      />

      {/* ═══ SECTION 8: TRANSITION — Nations on the Front Line ═══ */}
      <TransitionScreen
        title="Nations on the Front Line"
        accentWord="Front Line"
        subtitle="Millions of lives disrupted. Communities displaced. The human cost of climate change is measured not just in dollars, but in people forced to abandon their homes, their land, and their heritage."
      />

      {/* ═══ SECTION 9: AFFECTED POPULATION ═══ */}
      <ChartSection
        id="affected"
        label="Human Impact"
        title="People Directly Affected by Disasters"
        narrative={
          <p>
            When nature loses its balance, humanity pays the price. This data shows the
            <span className="highlight-amber"> humanitarian impact</span> of climate-related
            disasters across Pacific Island nations — the communities displaced, the lives
            upended during extreme weather events.
          </p>
        }
        chart={<AffectedPopChart data={affected} />}
        footer="Source: SPC — Number of People Directly Affected by Disasters (1970–2025)"
      />

      {/* ═══ SECTION 10: EMISSIONS MAP ═══ */}
      <ChartSection
        id="emissions"
        label="The Irony"
        title="Emissions vs. Impact: A Geographic View"
        narrative={
          <p>
            Here lies the <span className="highlight-amber">cruel irony</span>: the nations suffering
            the most from climate change are among the world's lowest emitters. This map shows
            GHG emissions per capita overlaid on the Pacific — the smallest dots represent the
            nations paying the highest price.
          </p>
        }
        chart={<EmissionsGeoChart data={emissionsRaw} topCountries={topCountries} />}
        footer="Source: SPC — GHG Emissions per Capita"
      />

      {/* ═══ SECTION 11: INTERACTIVE GEOMAP ═══ */}
      <GeoMapSection id="geomap" topCountries={topCountries} />

      {/* ═══ SECTION 12: FOOTER ═══ */}
      <section className="closing-section">
        <h2>Their Voices Deserve to Be Heard</h2>
        <p>
          The data presented here tells a story of profound injustice — nations that contribute
          almost nothing to climate change bear its heaviest burden. Every chart, every number
          represents real communities fighting for survival.
        </p>
        <hr className="closing-divider" />
        <div className="data-sources">
          <h3>Data Sources</h3>
          <ul>
            <li>Pacific Data Hub — Pacific Community (SPC)</li>
            <li>SDG Indicators: 1.5.1, 11.5.1, 11.5.2</li>
            <li>Sea Level Monitoring Network — Pacific Region</li>
            <li>Global GHG Emissions Database</li>
            <li>Rainfall Anomaly Records — Regional Climate Centers</li>
          </ul>
        </div>

        <div className="author-section">
          <h3>Project Team</h3>
          <div className="author-grid">
            <div className="author-card">
              <div className="author-avatar">A1</div>
              <div className="author-info">
                <h4>Asaagama Nashrul Haq</h4>
                <p>103102400065</p>
                <p className="author-email">asaagamanashrulhaq@student.telkomuniversity.ac.id</p>
              </div>
            </div>

            <div className="author-card">
              <div className="author-avatar">A2</div>
              <div className="author-info">
                <h4>Muhammad Zahir Mubasysyir</h4>
                <p>103102400073</p>
                <p className="author-email">muhammadzahir@student.telkomuniversity.ac.id</p>
              </div>
            </div>

            <div className="author-card">
              <div className="author-avatar">A3</div>
              <div className="author-info">
                <h4>Avrio De Galyn Athar</h4>
                <p>103102400032</p>
                <p className="author-email">avriodegalynathar@student.telkomuniversity.ac.id</p>
              </div>
            </div>
          </div>
        </div>

        <div className="github-source">
          <a href="https://github.com/AsaagamaNH/pacific-dataviz" target="_blank" rel="noopener noreferrer" className="github-link">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View Source on GitHub
          </a>
        </div>
      </section>

      <footer className="footer">
        <p>The Sinking Voices of the Pacific · Data Visualization Project · 2026</p>
      </footer>
    </div>
  );
}
