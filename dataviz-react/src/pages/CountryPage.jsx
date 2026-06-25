import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft } from 'lucide-react';
import TransitionScreen from '../components/TransitionScreen';
import ChartSection from '../components/ChartSection';
import SeaLevelChart from '../components/charts/SeaLevelChart';
import RainfallChart from '../components/charts/RainfallChart';
import EconomicLossChart from '../components/charts/EconomicLossChart';
import AffectedPopChart from '../components/charts/AffectedPopChart';
import ParallaxSection from '../components/ParallaxSection';
import ScrollProgress from '../components/ScrollProgress';

const SECTIONS = [
  { id: 'country-hero', label: 'Overview' },
  { id: 'country-sea', label: 'Sea Level' },
  { id: 'country-rain', label: 'Rainfall' },
  { id: 'country-econ', label: 'Economic' },
  { id: 'country-affect', label: 'Affected' },
];

/**
 * CountryPage — Detail page for a selected country.
 * Shows 4 indicators with parallax flow, filtered data.
 */
export default function CountryPage() {
  const { countryName } = useParams();
  const decodedName = decodeURIComponent(countryName);
  const { loading, error, getCountryData, getIndicatorData, topCountries } = useData();

  const countryData = useMemo(() => {
    return getCountryData(decodedName);
  }, [decodedName, getCountryData]);

  const countryRank = useMemo(() => {
    const idx = topCountries.findIndex(c => c.country === decodedName);
    return idx >= 0 ? idx + 1 : null;
  }, [decodedName, topCountries]);

  // Get raw loss data for horizontal bar chart (country-filtered)
  const lossRawFiltered = useMemo(() => {
    return getIndicatorData('VC_DSR_AALT', decodedName);
  }, [decodedName, getIndicatorData]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading data…</p>
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

  if (!countryData) {
    return (
      <div className="loading-screen">
        <p style={{ color: 'var(--accent-coral)' }}>No data found for "{decodedName}"</p>
        <Link to="/" style={{ color: 'var(--accent-cyan)', marginTop: '1rem' }}>← Back to Map</Link>
      </div>
    );
  }

  return (
    <div className="country-page">
      <ScrollProgress sections={SECTIONS} />

      {/* ═══ COUNTRY HERO ═══ */}
      <section className="country-hero" id="country-hero">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to Map
        </Link>

        <ParallaxSection animation="fadeUp">
          {countryRank && (
            <div className="hero-eyebrow">
              #{countryRank} Most Impacted Nation
            </div>
          )}
          <h1>{decodedName}</h1>
          <p className="country-subtitle">
            Exploring the climate impact data for {decodedName} — sea level rise,
            rainfall disruption, economic losses, and humanitarian toll.
          </p>
        </ParallaxSection>

        <ParallaxSection animation="fadeUp" delay={0.2}>
          <div className="country-stats">
            <div className="country-stat-card">
              <div className="country-stat-value" style={{ color: 'var(--accent-blue)' }}>
                {countryData.avgSeaLevel.toFixed(3)} cm
              </div>
              <div className="country-stat-label">Avg Sea Level Anomaly</div>
            </div>
            <div className="country-stat-card">
              <div className="country-stat-value" style={{ color: 'var(--accent-coral)' }}>
                ${(countryData.totalLoss / 1e6).toFixed(1)}M
              </div>
              <div className="country-stat-label">Total Economic Loss</div>
            </div>
            <div className="country-stat-card">
              <div className="country-stat-value" style={{ color: 'var(--accent-amber)' }}>
                {(countryData.totalAffected / 1e3).toFixed(1)}K
              </div>
              <div className="country-stat-label">People Affected</div>
            </div>
            <div className="country-stat-card">
              <div className="country-stat-value" style={{ color: 'var(--accent-purple)' }}>
                {countryData.avgRainAnomaly.toFixed(1)} mm
              </div>
              <div className="country-stat-label">Avg Rainfall Anomaly</div>
            </div>
          </div>
        </ParallaxSection>
      </section>

      {/* ═══ SEA LEVEL ═══ */}
      <TransitionScreen
        title="Rising Waters"
        accentWord="Waters"
        subtitle={`How has the sea level around ${decodedName} changed over the past three decades?`}
      />

      <ChartSection
        id="country-sea"
        label="Sea Level Anomaly"
        title={`Sea Level Trend — ${decodedName}`}
        narrative={
          <p>
            This chart shows the <span className="highlight-blue">sea level anomaly</span> measured
            around {decodedName} over time. Rising trends signal increasing threat to
            coastal communities and infrastructure.
          </p>
        }
        chart={<SeaLevelChart data={countryData.seaLevel} />}
      />

      {/* ═══ RAINFALL ═══ */}
      <TransitionScreen
        title="Shifting Rains"
        accentWord="Shifting"
        subtitle={`Rainfall patterns in ${decodedName} tell a story of increasing climate instability.`}
      />

      <ChartSection
        id="country-rain"
        label="Rainfall Anomaly"
        title={`Rainfall Anomalies — ${decodedName}`}
        narrative={
          <p>
            The <span className="highlight-purple">diverging bars</span> reveal years of extreme
            wet and dry conditions in {decodedName}. Growing amplitude signals climate
            disruption affecting agriculture, water supply, and daily life.
          </p>
        }
        chart={<RainfallChart data={countryData.rainfall} />}
      />

      {/* ═══ ECONOMIC LOSSES ═══ */}
      <TransitionScreen
        title="The Price of Climate"
        accentWord="Price"
        subtitle={`The financial devastation from climate-related disasters in ${decodedName}.`}
      />

      <ChartSection
        id="country-econ"
        label="Economic Impact"
        title={`Economic Losses — ${decodedName}`}
        narrative={
          <p>
            Climate disasters leave <span className="highlight-coral">deep economic scars</span> on
            {' '}{decodedName}. This chart shows the direct financial losses attributed
            to climate-related events over the decades.
          </p>
        }
        chart={
          <AffectedPopChart
            data={countryData.losses.map(d => ({ year: d.year, value: d.value }))}
          />
        }
      />

      {/* ═══ PEOPLE AFFECTED ═══ */}
      <TransitionScreen
        title="Human Cost"
        accentWord="Human"
        subtitle={`The lives disrupted by climate disasters in ${decodedName}.`}
      />

      <ChartSection
        id="country-affect"
        label="Humanitarian Impact"
        title={`People Directly Affected — ${decodedName}`}
        narrative={
          <p>
            Behind every number is a <span className="highlight-amber">person, a family,
            a community</span> displaced by climate-related disasters. This data captures
            the scale of human impact in {decodedName}.
          </p>
        }
        chart={<AffectedPopChart data={countryData.affected} />}
      />

      {/* ═══ BACK TO MAP ═══ */}
      <section className="closing-section">
        <ParallaxSection animation="fadeUp">
          <h2>Explore More Nations</h2>
          <p>
            Return to the interactive map to discover the climate stories of other
            Pacific Island nations.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--accent-cyan)',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: 'var(--space-lg)',
              transition: 'all var(--transition-base)',
            }}
          >
            <ArrowLeft size={18} /> Back to Map
          </Link>
        </ParallaxSection>
      </section>

      <footer className="footer">
        <p>The Sinking Voices of the Pacific · {decodedName} · Data Visualization Project · 2025</p>
      </footer>
    </div>
  );
}
