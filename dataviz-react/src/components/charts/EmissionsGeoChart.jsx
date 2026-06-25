import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import PACIFIC_COUNTRIES from '../../assets/pacific_countries';
import useContainerSize from '../../hooks/useContainerSize';

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/**
 * EmissionsGeoChart — GHG emissions on Pacific map as proportional circles.
 * Color scale: dark (#1A1F2E) → neon amber (#FFD93D).
 */
export default function EmissionsGeoChart({ data, topCountries = [], height: propHeight = 500 }) {
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerWidth) return;

    const width = containerWidth;
    const height = propHeight;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    // Compute avg emissions per country
    const grouped = d3.rollup(
      data.filter(d => d.GEO_PICT_LABEL !== 'Micronesia, Federated State of'),
      v => d3.mean(v, d => d.OBS_VALUE),
      d => d.GEO_PICT_LABEL
    );
    const countryEmissions = new Map(grouped);

    const emValues = Array.from(countryEmissions.values()).filter(v => v !== undefined);
    const colorScale = d3.scaleSequential()
      .domain([0, d3.quantile(emValues.sort(d3.ascending), 0.95) || 10])
      .interpolator(t => d3.interpolateRgb('#1A1F2E', '#FFD93D')(t));

    const topNames = new Set(topCountries.map(c => c.country));

    const projection = d3.geoMercator().center([170, -5]).scale(width * 0.9).translate([width / 2, height / 2]);
    const pathGen = d3.geoPath().projection(projection);

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#060D1A');

    const g = svg.append('g');

    d3.json(WORLD_TOPO_URL).then(world => {
      const countries = topojson.feature(world, world.objects.countries);
      g.selectAll('.land').data(countries.features).join('path').attr('class', 'land')
        .attr('d', pathGen).attr('fill', '#0E1420').attr('stroke', 'rgba(255,255,255,0.03)').attr('stroke-width', 0.5);

      const pacificData = PACIFIC_COUNTRIES.map(pc => ({
        ...pc,
        emission: countryEmissions.get(pc.name) || 0,
        isTop: topNames.has(pc.name),
      })).filter(d => {
        const [px, py] = projection([d.lon, d.lat]);
        return px >= -50 && px <= width + 50 && py >= -50 && py <= height + 50;
      });

      g.selectAll('.marker').data(pacificData).join('circle').attr('class', 'marker')
        .attr('cx', d => projection([d.lon, d.lat])[0]).attr('cy', d => projection([d.lon, d.lat])[1])
        .attr('r', 0).attr('fill', d => colorScale(d.emission))
        .attr('stroke', d => d.isTop ? '#FFD93D' : 'rgba(255,255,255,0.1)')
        .attr('stroke-width', d => d.isTop ? 2 : 0.5)
        .attr('filter', d => d.isTop && d.emission > 5 ? 'drop-shadow(0 0 10px rgba(255,217,61,0.5))' : 'none')
        .attr('opacity', 0.9)
        .transition().duration(800).delay((d, i) => i * 60)
        .attr('r', d => Math.max(d.isTop ? 12 : 6, Math.min((d.isTop ? 12 : 6) + Math.sqrt(d.emission) * 2, 22)));

      g.selectAll('.lbl').data(pacificData.filter(d => d.isTop)).join('text').attr('class', 'lbl')
        .attr('x', d => projection([d.lon, d.lat])[0]).attr('y', d => projection([d.lon, d.lat])[1] - 18)
        .attr('text-anchor', 'middle').attr('fill', '#F1F5F9').attr('font-size', '9px')
        .attr('font-weight', '600').attr('font-family', 'Inter, sans-serif').attr('opacity', 0)
        .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '…' : d.name)
        .transition().delay(1200).duration(600).attr('opacity', 0.8);

      // Tooltip
      const tooltip = d3.select(svgRef.current.parentNode).selectAll('.d3-tooltip').data([0]).join('div').attr('class', 'd3-tooltip');
      g.selectAll('.marker')
        .on('mouseenter', function (event, d) {
          d3.select(this).transition().duration(200).attr('r', d.isTop ? 18 : 10)
            .attr('filter', 'drop-shadow(0 0 16px rgba(255,217,61,0.7))');
          const [px, py] = projection([d.lon, d.lat]);
          tooltip.style('opacity', 1).style('left', `${px + 20}px`).style('top', `${py - 20}px`)
            .html(`<strong>${d.name}</strong><br/>GHG/capita: ${d.emission.toFixed(2)} t CO₂${d.isTop ? '<br/><span style="color:#FFD93D">★ Top 10</span>' : ''}`);
        })
        .on('mouseleave', function (event, d) {
          d3.select(this).transition().duration(200)
            .attr('r', Math.max(d.isTop ? 12 : 6, Math.min((d.isTop ? 12 : 6) + Math.sqrt(d.emission) * 2, 22)))
            .attr('filter', d.isTop && d.emission > 5 ? 'drop-shadow(0 0 10px rgba(255,217,61,0.5))' : 'none');
          tooltip.style('opacity', 0);
        });
    });

    // Legend
    const lw = 150, lx = width - lw - 20, ly = height - 40;
    const defs = svg.append('defs');
    const lg = defs.append('linearGradient').attr('id', 'em-leg');
    lg.append('stop').attr('offset', '0%').attr('stop-color', '#1A1F2E');
    lg.append('stop').attr('offset', '100%').attr('stop-color', '#FFD93D');
    svg.append('rect').attr('x', lx).attr('y', ly).attr('width', lw).attr('height', 10).attr('rx', 4).attr('fill', 'url(#em-leg)');
    svg.append('text').attr('x', lx).attr('y', ly - 5).attr('fill', '#64748B').attr('font-size', '9px').text('Low');
    svg.append('text').attr('x', lx + lw).attr('y', ly - 5).attr('text-anchor', 'end').attr('fill', '#FFD93D').attr('font-size', '9px').text('High Emissions');

  }, [data, topCountries, containerWidth, propHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
