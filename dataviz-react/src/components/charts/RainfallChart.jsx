import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useContainerSize from '../../hooks/useContainerSize';

/**
 * RainfallChart — Diverging bar chart for rainfall anomaly.
 * Color: Neon purple (#B388FF) positive, darker purple negative.
 */
export default function RainfallChart({ data, height: propHeight = 420 }) {
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerWidth) return;

    const width = containerWidth;
    const height = propHeight;
    const margin = { top: 30, right: 30, bottom: 55, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    if (innerW <= 0 || innerH <= 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate: average per year
    const yearMap = d3.rollup(data, v => d3.mean(v, d => d.value), d => d.year);
    const chartData = Array.from(yearMap, ([year, value]) => ({ year: +year, value }))
      .sort((a, b) => a.year - b.year);

    const x = d3.scaleBand().domain(chartData.map(d => d.year)).range([0, innerW]).padding(0.25);
    const maxAbs = d3.max(chartData, d => Math.abs(d.value)) * 1.1;
    const y = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([innerH, 0]).nice();

    // Grid + zero line
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-innerW).tickFormat('').ticks(8));
    g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', 'rgba(255,255,255,0.15)').attr('stroke-width', 1);

    // Bars
    g.selectAll('.bar').data(chartData).join('rect').attr('class', 'bar')
      .attr('x', d => x(d.year)).attr('width', x.bandwidth())
      .attr('y', y(0)).attr('height', 0).attr('rx', 2)
      .attr('fill', d => d.value >= 0 ? '#B388FF' : '#6C5CE7').attr('opacity', 0.85)
      .attr('filter', d => Math.abs(d.value) > maxAbs * 0.7 ? 'drop-shadow(0 0 6px rgba(179,136,255,0.5))' : 'none')
      .transition().duration(800).delay((d, i) => i * 12).ease(d3.easeCubicOut)
      .attr('y', d => d.value >= 0 ? y(d.value) : y(0))
      .attr('height', d => Math.abs(y(d.value) - y(0)));

    // Axes
    const yearTicks = chartData.filter((d, i) => i % Math.ceil(chartData.length / 10) === 0).map(d => d.year);
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickValues(yearTicks).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', '#64748B').attr('font-size', '10px').attr('transform', 'rotate(-45)').attr('text-anchor', 'end');
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(8).tickFormat(d => d.toFixed(0)));

    // Y label
    g.append('text').attr('transform', 'rotate(-90)').attr('y', -margin.left + 15).attr('x', -innerH / 2)
      .attr('text-anchor', 'middle').attr('fill', '#64748B').attr('font-size', '11px').attr('font-family', 'Inter, sans-serif')
      .text('Rainfall Anomaly (mm)');

    // Legend
    const ly = -15;
    g.append('circle').attr('cx', innerW - 180).attr('cy', ly).attr('r', 5).attr('fill', '#B388FF');
    g.append('text').attr('x', innerW - 170).attr('y', ly + 4).attr('fill', '#94A3B8').attr('font-size', '10px').text('Above Avg');
    g.append('circle').attr('cx', innerW - 80).attr('cy', ly).attr('r', 5).attr('fill', '#6C5CE7');
    g.append('text').attr('x', innerW - 70).attr('y', ly + 4).attr('fill', '#94A3B8').attr('font-size', '10px').text('Below Avg');

    // Tooltip
    const tooltip = d3.select(svgRef.current.parentNode).selectAll('.d3-tooltip').data([0]).join('div').attr('class', 'd3-tooltip');
    g.selectAll('.bar')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('filter', 'drop-shadow(0 0 10px rgba(179,136,255,0.6))');
        tooltip.style('opacity', 1)
          .style('left', `${x(d.year) + margin.left + x.bandwidth() / 2}px`)
          .style('top', `${y(d.value) + margin.top - 45}px`)
          .html(`<strong>${d.year}</strong><br/>Anomaly: ${d.value >= 0 ? '+' : ''}${d.value.toFixed(1)} mm`);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this).attr('opacity', 0.85);
        tooltip.style('opacity', 0);
      });

  }, [data, containerWidth, propHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
