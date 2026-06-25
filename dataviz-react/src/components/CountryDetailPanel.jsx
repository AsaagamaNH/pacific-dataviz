import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

/**
 * Slide-in panel showing 4 mini D3 charts for a selected country.
 * Props: country (string), data (full dataset array), onClose (function)
 */
export default function CountryDetailPanel({ country, data, onClose }) {
  const emissionsRef = useRef(null);
  const seaLevelRef  = useRef(null);
  const lossesRef    = useRef(null);
  const rainRef      = useRef(null);

  // Filter data for this country
  const countryData = useMemo(() => {
    if (!data || !country) return {};

    // Handle the Micronesia naming inconsistency
    const names = [country];
    if (country === 'Micronesia (Federated States of)') {
      names.push('Micronesia, Federated State of');
    }

    const rows = data.filter(d => names.includes(d.GEO_PICT_LABEL));

    const emissions = rows.filter(d => d.INDICATOR === 'GHG_EMI_CAPITA')
      .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
      .sort((a, b) => a.year - b.year);

    const seaLevel = rows.filter(d => d.INDICATOR === 'SEA_LVL')
      .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
      .sort((a, b) => a.year - b.year);

    const losses = rows.filter(d => d.INDICATOR === 'VC_DSR_AALT')
      .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
      .sort((a, b) => a.year - b.year);

    const rainfall = rows.filter(d => d.INDICATOR === 'RAIN_ANOM')
      .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
      .sort((a, b) => a.year - b.year);

    const affected = rows.filter(d => d.INDICATOR === 'VC_DSR_AFFCT');

    // Summary stats
    const avgEmission = emissions.length > 0 ? d3.mean(emissions, d => d.value) : 0;
    const totalLoss   = losses.length > 0 ? d3.sum(losses, d => d.value) : 0;
    const totalAffected = affected.length > 0 ? d3.sum(affected, d => d.OBS_VALUE) : 0;

    return { emissions, seaLevel, losses, rainfall, avgEmission, totalLoss, totalAffected };
  }, [data, country]);

  // Draw mini charts
  useEffect(() => {
    if (!country) return;

    const t = d3.transition().duration(600).ease(d3.easeCubicOut);

    // ── 1. Emissions Sparkline ──
    drawSparkline(emissionsRef.current, countryData.emissions, '#d97706', 'rgba(217,119,6,0.08)', t);

    // ── 2. Sea Level Area ──
    drawAreaChart(seaLevelRef.current, countryData.seaLevel, '#0d9488', 'rgba(13,148,136,0.12)', t);

    // ── 3. Economic Losses Bar ──
    drawBarChart(lossesRef.current, countryData.losses, '#e74c3c', t);

    // ── 4. Rainfall Strip Heatmap ──
    drawRainfallStrip(rainRef.current, countryData.rainfall, t);

  }, [country, countryData]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!country) return null;

  const formatCurrency = (val) => {
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(0) + 'K';
    return '$' + val.toFixed(0);
  };

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="country-detail-panel">
        {/* Header */}
        <div className="panel-header">
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#0d9488', marginBottom: '4px' }}>
              Country Profile
            </div>
            <h2>{country}</h2>
          </div>
          <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Summary Stats */}
        <div className="panel-stats">
          <div className="panel-stat-card">
            <div className="panel-stat-value" style={{ color: '#d97706' }}>
              {countryData.avgEmission?.toFixed(2) ?? '—'}
            </div>
            <div className="panel-stat-label">Avg Emisi (t CO₂)</div>
          </div>
          <div className="panel-stat-card">
            <div className="panel-stat-value" style={{ color: '#e74c3c' }}>
              {formatCurrency(countryData.totalLoss ?? 0)}
            </div>
            <div className="panel-stat-label">Total Kerugian</div>
          </div>
          <div className="panel-stat-card">
            <div className="panel-stat-value">
              {(countryData.totalAffected ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="panel-stat-label">Jiwa Terdampak</div>
          </div>
        </div>

        {/* Mini Charts */}
        <div className="mini-chart-section">
          <div className="mini-chart-title">🔥 Emisi GHG per Kapita (t CO₂)</div>
          <div className="mini-chart-container" ref={emissionsRef} />
        </div>

        <div className="mini-chart-section">
          <div className="mini-chart-title">🌊 Sea Level Anomaly (m)</div>
          <div className="mini-chart-container" ref={seaLevelRef} />
        </div>

        <div className="mini-chart-section">
          <div className="mini-chart-title">💰 Kerugian Ekonomi per Tahun</div>
          <div className="mini-chart-container" ref={lossesRef} />
        </div>

        <div className="mini-chart-section">
          <div className="mini-chart-title">🌧️ Anomali Curah Hujan</div>
          <div className="mini-chart-container strip" ref={rainRef} />
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────
// HELPER: Sparkline (line chart)
// ────────────────────────────────────
function drawSparkline(container, data, color, fillColor, t) {
  if (!container || !data || data.length === 0) return;
  d3.select(container).selectAll('svg').remove();

  const w = container.clientWidth;
  const h = container.clientHeight;
  const m = { top: 12, right: 12, bottom: 24, left: 36 };

  const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
  const iw = w - m.left - m.right;
  const ih = h - m.top - m.bottom;

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 1]).range([ih, 0]).nice();

  // Area
  const area = d3.area().x(d => x(d.year)).y0(ih).y1(d => y(d.value)).curve(d3.curveMonotoneX);
  g.append('path').datum(data).attr('fill', fillColor).attr('d', area).style('opacity', 0).transition(t).style('opacity', 1);

  // Line
  const line = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
  g.append('path').datum(data).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', line);

  // Axes
  g.append('g').attr('transform', `translate(0,${ih})`).attr('class', 'axis')
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d'))).call(g => g.select('.domain').attr('stroke', '#e2e8f0'));
  g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(3)).call(g => g.select('.domain').attr('stroke', '#e2e8f0'));
}

// ────────────────────────────────────
// HELPER: Area chart
// ────────────────────────────────────
function drawAreaChart(container, data, color, fillColor, t) {
  if (!container || !data || data.length === 0) return;
  d3.select(container).selectAll('svg').remove();

  const w = container.clientWidth;
  const h = container.clientHeight;
  const m = { top: 12, right: 12, bottom: 24, left: 36 };

  const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
  const iw = w - m.left - m.right;
  const ih = h - m.top - m.bottom;

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);
  const ext = d3.extent(data, d => d.value);
  const y = d3.scaleLinear().domain([Math.min(ext[0], 0), Math.max(ext[1], 0)]).range([ih, 0]).nice();

  const area = d3.area().x(d => x(d.year)).y0(y(0)).y1(d => y(d.value)).curve(d3.curveMonotoneX);
  g.append('path').datum(data).attr('fill', fillColor).attr('d', area).style('opacity', 0).transition(t).style('opacity', 1);

  const line = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
  g.append('path').datum(data).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', line);

  // Zero line
  g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', '#e2e8f0').attr('stroke-dasharray', '4 3');

  g.append('g').attr('transform', `translate(0,${ih})`).attr('class', 'axis')
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d'))).call(g => g.select('.domain').attr('stroke', '#e2e8f0'));
  g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(3)).call(g => g.select('.domain').attr('stroke', '#e2e8f0'));
}

// ────────────────────────────────────
// HELPER: Bar chart
// ────────────────────────────────────
function drawBarChart(container, data, color, t) {
  if (!container || !data || data.length === 0) return;
  d3.select(container).selectAll('svg').remove();

  const w = container.clientWidth;
  const h = container.clientHeight;
  const m = { top: 12, right: 12, bottom: 24, left: 44 };

  const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
  const iw = w - m.left - m.right;
  const ih = h - m.top - m.bottom;

  const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, iw]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 1]).range([ih, 0]).nice();

  g.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.year))
    .attr('width', x.bandwidth())
    .attr('y', ih)
    .attr('height', 0)
    .attr('fill', color)
    .attr('opacity', 0.7)
    .attr('rx', 1)
    .transition(t)
    .attr('y', d => y(d.value))
    .attr('height', d => ih - y(d.value));

  // Show only every 10th year on x-axis for readability
  const thinYears = data.filter((_, i) => i % 10 === 0 || i === data.length - 1).map(d => d.year);
  g.append('g').attr('transform', `translate(0,${ih})`).attr('class', 'axis')
    .call(d3.axisBottom(x).tickValues(thinYears).tickFormat(d3.format('d'))).call(g => g.select('.domain').attr('stroke', '#e2e8f0'));
  g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(3).tickFormat(d3.format('.2s'))).call(g => g.select('.domain').attr('stroke', '#e2e8f0'));
}

// ────────────────────────────────────
// HELPER: Rainfall strip heatmap
// ────────────────────────────────────
function drawRainfallStrip(container, data, t) {
  if (!container || !data || data.length === 0) return;
  d3.select(container).selectAll('svg').remove();

  const w = container.clientWidth;
  const h = container.clientHeight;
  const m = { top: 4, right: 4, bottom: 14, left: 4 };

  const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
  const iw = w - m.left - m.right;
  const ih = h - m.top - m.bottom;

  const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, iw]).padding(0.05);
  const maxAbs = d3.max(data, d => Math.abs(d.value)) || 1;
  const color = d3.scaleDiverging().domain([-maxAbs, 0, maxAbs]).interpolator(d3.interpolateRdBu).clamp(true);

  g.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.year))
    .attr('y', 0)
    .attr('width', x.bandwidth())
    .attr('height', ih)
    .attr('fill', d => color(d.value))
    .attr('rx', 1)
    .attr('opacity', 0)
    .transition(t)
    .delay((_, i) => i * 8)
    .attr('opacity', 0.85);

  // Year labels at edges
  const years = data.map(d => d.year);
  g.append('text').attr('x', 0).attr('y', ih + 11).text(years[0]).attr('fill', '#94a3b8').style('font-size', '8px').style('font-family', 'Inter, sans-serif');
  g.append('text').attr('x', iw).attr('y', ih + 11).attr('text-anchor', 'end').text(years[years.length - 1]).attr('fill', '#94a3b8').style('font-size', '8px').style('font-family', 'Inter, sans-serif');
}
