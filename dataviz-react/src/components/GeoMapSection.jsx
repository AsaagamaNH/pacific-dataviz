import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import PACIFIC_COUNTRIES from '../assets/pacific_countries';
import ParallaxSection from './ParallaxSection';
import useContainerSize from '../hooks/useContainerSize';

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/**
 * GeoMapSection — Interactive Pacific-zoomed map with top 10 countries.
 * Click → navigate to country detail page.
 *
 * Changes (2.0):
 * - Projection rotation [-175, 0] to fix antimeridian countries
 * - EEZ dashed circles behind top-10 markers
 * - Zoom-out (lower scale) so all countries fit
 * - Non-top-10 Pacific countries shown as dim dots
 * - Rank numbers inside circles
 */
export default function GeoMapSection({ topCountries = [], id }) {
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const svgRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!topCountries.length || !containerWidth) return;

    const width = containerWidth;
    const height = 500;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    const scoreMap = new Map(topCountries.map(c => [c.country, c.score]));
    const maxScore = d3.max(topCountries, c => c.score);

    const colorScale = d3.scaleSequential()
      .domain([0, maxScore])
      .interpolator(t => d3.interpolateRgb('#0B2E26', '#00F5D4')(t));

    // Projection with rotation to fix antimeridian (Samoa, Tonga, Niue, etc.)
    const projection = d3.geoMercator()
      .rotate([-175, 0])
      .center([-3, -8])
      .scale(width * 0.75)
      .translate([width / 2, height / 2]);
    const pathGen = d3.geoPath().projection(projection);

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#060D1A').attr('rx', 20);

    const g = svg.append('g');

    d3.json(WORLD_TOPO_URL).then(world => {
      const countries = topojson.feature(world, world.objects.countries);

      g.selectAll('.bg').data(countries.features).join('path').attr('class', 'bg')
        .attr('d', pathGen).attr('fill', '#1A1F2E').attr('stroke', 'rgba(255,255,255,0.03)').attr('stroke-width', 0.3);

      // --- Non-top-10 dim dots (all Pacific countries not in top 10) ---
      const nonTopCoords = PACIFIC_COUNTRIES
        .filter(pc => !scoreMap.has(pc.name))
        .map(pc => ({
          ...pc,
          projected: projection([pc.lon, pc.lat]),
        }))
        .filter(d => d.projected[0] > -100 && d.projected[0] < width + 100 && d.projected[1] > -100 && d.projected[1] < height + 100);

      g.selectAll('.non-top').data(nonTopCoords).join('circle').attr('class', 'non-top')
        .attr('cx', d => d.projected[0]).attr('cy', d => d.projected[1])
        .attr('r', 4)
        .attr('fill', 'rgba(255,255,255,0.08)')
        .attr('stroke', 'rgba(255,255,255,0.12)')
        .attr('stroke-width', 0.5);

      // Dim labels for non-top-10
      g.selectAll('.non-top-lbl').data(nonTopCoords).join('text').attr('class', 'non-top-lbl')
        .attr('x', d => d.projected[0]).attr('y', d => d.projected[1] - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.2)')
        .attr('font-size', '7px')
        .attr('font-family', 'Inter, sans-serif')
        .text(d => d.name.length > 12 ? d.name.substring(0, 10) + '…' : d.name);

      // --- Top 10 countries ---
      const topCoords = PACIFIC_COUNTRIES
        .filter(pc => scoreMap.has(pc.name))
        .map(pc => ({
          ...pc,
          score: scoreMap.get(pc.name),
          projected: projection([pc.lon, pc.lat]),
        }))
        .filter(d => d.projected[0] > -100 && d.projected[0] < width + 100 && d.projected[1] > -100 && d.projected[1] < height + 100)
        .sort((a, b) => b.score - a.score);

      const circles = g.selectAll('.cc').data(topCoords).join('g').attr('class', 'cc')
        .attr('transform', d => `translate(${d.projected[0]}, ${d.projected[1]})`)
        .style('cursor', 'pointer');

      // EEZ dashed circle (Large Ocean State territory representation)
      circles.append('circle').attr('r', 0).attr('fill', 'none')
        .attr('stroke', d => colorScale(d.score)).attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 3').attr('stroke-opacity', 0.2)
        .transition().duration(1200).delay((d, i) => i * 100).attr('r', 36);

      // Outer glow
      circles.append('circle').attr('r', 0).attr('fill', 'none')
        .attr('stroke', d => colorScale(d.score)).attr('stroke-width', 1.5).attr('stroke-opacity', 0.3)
        .transition().duration(1000).delay((d, i) => i * 100).attr('r', 24);

      // Main circle
      circles.append('circle').attr('r', 0)
        .attr('fill', d => colorScale(d.score))
        .attr('stroke', d => d.score === maxScore ? '#00F5D4' : 'rgba(255,255,255,0.15)')
        .attr('stroke-width', d => d.score === maxScore ? 2 : 1)
        .attr('filter', d => d.score === maxScore
          ? 'drop-shadow(0 0 18px rgba(0,245,212,0.6))'
          : `drop-shadow(0 0 8px ${colorScale(d.score)})`)
        .transition().duration(800).delay((d, i) => 200 + i * 100).attr('r', 14);

      // Labels
      circles.append('text').attr('y', -22).attr('text-anchor', 'middle')
        .attr('fill', '#F1F5F9').attr('font-size', '10px').attr('font-weight', '600').attr('font-family', 'Inter, sans-serif')
        .attr('opacity', 0).text(d => d.name.length > 18 ? d.name.substring(0, 15) + '…' : d.name)
        .transition().delay(1500).duration(600).attr('opacity', 0.85);

      // Rank inside circle
      circles.append('text').attr('dy', '0.35em').attr('text-anchor', 'middle')
        .attr('fill', '#0B0F19').attr('font-size', '8px').attr('font-weight', '700').attr('font-family', 'Inter, sans-serif')
        .attr('opacity', 0).text((d, i) => `#${i + 1}`)
        .transition().delay(1800).duration(400).attr('opacity', 1);

      // Tooltip
      const tooltip = d3.select(svgRef.current.parentNode).selectAll('.d3-tooltip').data([0]).join('div').attr('class', 'd3-tooltip');

      circles
        .on('mouseenter', function (event, d) {
          d3.select(this).select('circle:nth-child(3)')
            .transition().duration(200).attr('r', 20)
            .attr('filter', 'drop-shadow(0 0 24px rgba(0,245,212,0.7))');
          tooltip.style('opacity', 1)
            .style('left', `${d.projected[0] + 30}px`)
            .style('top', `${d.projected[1] - 30}px`)
            .html(`<strong style="color:#00F5D4">${d.name}</strong><br/>Impact Score: ${d.score}<br/><span style="color:#64748B;font-size:0.75rem">Click to explore →</span>`);
        })
        .on('mouseleave', function (event, d) {
          d3.select(this).select('circle:nth-child(3)')
            .transition().duration(200).attr('r', 14)
            .attr('filter', d.score === maxScore
              ? 'drop-shadow(0 0 18px rgba(0,245,212,0.6))'
              : `drop-shadow(0 0 8px ${colorScale(d.score)})`);
          tooltip.style('opacity', 0);
        })
        .on('click', (event, d) => navigate(`/country/${encodeURIComponent(d.name)}`));

      // Fiji pulse
      const fiji = circles.filter(d => d.score === maxScore);
      if (fiji.size()) {
        (function pulse() {
          fiji.select('circle:first-child')
            .transition().duration(1500).attr('r', 42).attr('stroke-opacity', 0.4)
            .transition().duration(1500).attr('r', 36).attr('stroke-opacity', 0.2)
            .on('end', pulse);
        })();
      }
    });

    // Legend
    const lw = 200, lx = width - lw - 30, ly = height - 50;
    const defs = svg.append('defs');
    const lg = defs.append('linearGradient').attr('id', 'geo-leg');
    lg.append('stop').attr('offset', '0%').attr('stop-color', '#0B2E26');
    lg.append('stop').attr('offset', '100%').attr('stop-color', '#00F5D4');
    svg.append('rect').attr('x', lx).attr('y', ly).attr('width', lw).attr('height', 8).attr('rx', 4).attr('fill', 'url(#geo-leg)');
    svg.append('text').attr('x', lx).attr('y', ly - 6).attr('fill', '#64748B').attr('font-size', '9px').attr('font-family', 'Inter').text('Lower Impact');
    svg.append('text').attr('x', lx + lw).attr('y', ly - 6).attr('text-anchor', 'end').attr('fill', '#00F5D4').attr('font-size', '9px').attr('font-family', 'Inter').text('Higher Impact');

  }, [topCountries, containerWidth, navigate]);

  return (
    <section className="geomap-section" id={id}>
      <ParallaxSection animation="fadeUp">
        <div className="chart-narrative" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="chart-narrative-label">Interactive Map</div>
          <h2>Explore the 10 Most Impacted Nations</h2>
          <p>Click on any country to dive deeper into their climate data — sea level rise, rainfall disruption, economic losses, and humanitarian toll.</p>
        </div>
      </ParallaxSection>

      <div className="geomap-container" ref={containerRef}>
        <svg ref={svgRef} style={{ display: 'block' }} />
      </div>

      <div className="geomap-instruction">Click on a glowing marker to explore each nation's climate story</div>
    </section>
  );
}
