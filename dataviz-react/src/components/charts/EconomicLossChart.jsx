import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useContainerSize from '../../hooks/useContainerSize';

/**
 * EconomicLossChart — Horizontal bar chart for economic losses by country.
 * Color: Neon coral (#FF6B6B), top-3 highlighted.
 */
export default function EconomicLossChart({ data, height: propHeight = 500, topN = 10 }) {
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerWidth) return;

    const width = containerWidth;
    const height = propHeight;
    const margin = { top: 20, right: 120, bottom: 40, left: 180 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    if (innerW <= 0 || innerH <= 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate: total loss per country
    const countryMap = d3.rollup(data, v => d3.sum(v, d => d.OBS_VALUE), d => d.GEO_PICT_LABEL);
    const chartData = Array.from(countryMap, ([country, total]) => ({ country, total }))
      .filter(d => d.country !== 'Micronesia, Federated State of')
      .sort((a, b) => b.total - a.total)
      .slice(0, topN);

    const x = d3.scaleLinear().domain([0, d3.max(chartData, d => d.total) * 1.1]).range([0, innerW]);
    const y = d3.scaleBand().domain(chartData.map(d => d.country)).range([0, innerH]).padding(0.3);

    // Grid
    g.append('g').attr('class', 'grid').call(d3.axisTop(x).tickSize(-innerH).tickFormat('').ticks(5));

    // Bars
    g.selectAll('.bar').data(chartData).join('rect').attr('class', 'bar')
      .attr('y', d => y(d.country)).attr('height', y.bandwidth()).attr('x', 0).attr('width', 0).attr('rx', 4)
      .attr('fill', (d, i) => i === 0 ? '#FF6B6B' : i <= 2 ? '#E85D5D' : '#9B4D4D')
      .attr('filter', (d, i) => i === 0 ? 'drop-shadow(0 0 12px rgba(255,107,107,0.5))' : 'none')
      .transition().duration(1000).delay((d, i) => i * 80).ease(d3.easeCubicOut)
      .attr('width', d => x(d.total));

    // Value labels
    g.selectAll('.val').data(chartData).join('text').attr('class', 'val')
      .attr('y', d => y(d.country) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('x', d => x(d.total) + 8)
      .attr('fill', (d, i) => i <= 2 ? '#FF6B6B' : '#94A3B8')
      .attr('font-size', '11px').attr('font-weight', (d, i) => i <= 2 ? '600' : '400')
      .attr('font-family', 'Inter, sans-serif').attr('opacity', 0)
      .text(d => d.total >= 1e9 ? `$${(d.total / 1e9).toFixed(2)}B` : `$${(d.total / 1e6).toFixed(1)}M`)
      .transition().delay((d, i) => 800 + i * 80).duration(400).attr('opacity', 1);

    // Y axis
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .attr('fill', (d, i) => i <= 2 ? '#F1F5F9' : '#94A3B8')
      .attr('font-size', '11px').attr('font-weight', (d, i) => i <= 2 ? '600' : '400');
    g.selectAll('.axis path').attr('stroke', 'none');

    // Rank badges
    const badges = ['🥇', '🥈', '🥉'];
    chartData.slice(0, 3).forEach((d, i) => {
      g.append('text').attr('x', -margin.left + 10).attr('y', y(d.country) + y.bandwidth() / 2)
        .attr('dy', '0.35em').attr('font-size', '16px').text(badges[i])
        .attr('opacity', 0).transition().delay(1200 + i * 100).duration(400).attr('opacity', 1);
    });

    // Tooltip
    const tooltip = d3.select(svgRef.current.parentNode).selectAll('.d3-tooltip').data([0]).join('div').attr('class', 'd3-tooltip');
    g.selectAll('.bar')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('filter', 'drop-shadow(0 0 16px rgba(255,107,107,0.6))');
        tooltip.style('opacity', 1)
          .style('left', `${x(d.total) / 2 + margin.left}px`)
          .style('top', `${y(d.country) + margin.top - 10}px`)
          .html(`<strong>${d.country}</strong><br/>Total Loss: $${(d.total / 1e6).toFixed(1)}M`);
      })
      .on('mouseleave', function (event, d) {
        const i = chartData.indexOf(d);
        d3.select(this).attr('filter', i === 0 ? 'drop-shadow(0 0 12px rgba(255,107,107,0.5))' : 'none');
        tooltip.style('opacity', 0);
      });

  }, [data, containerWidth, propHeight, topN]);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
