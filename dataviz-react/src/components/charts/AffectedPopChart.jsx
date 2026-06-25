import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useContainerSize from '../../hooks/useContainerSize';

/**
 * AffectedPopChart — Area chart for number of people affected.
 * Color: Neon amber (#FFD93D) with gradient fill.
 */
export default function AffectedPopChart({ data, height: propHeight = 420 }) {
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerWidth) return;

    const width = containerWidth;
    const height = propHeight;
    const margin = { top: 30, right: 30, bottom: 50, left: 70 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    if (innerW <= 0 || innerH <= 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate: sum per year
    const yearMap = d3.rollup(data, v => d3.sum(v, d => d.value), d => d.year);
    const chartData = Array.from(yearMap, ([year, value]) => ({ year: +year, value }))
      .sort((a, b) => a.year - b.year);

    const x = d3.scaleLinear().domain(d3.extent(chartData, d => d.year)).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d.value) * 1.15]).range([innerH, 0]).nice();

    // Gradient
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'aff-grad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#FFD93D').attr('stop-opacity', 0.45);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#FFD93D').attr('stop-opacity', 0.03);

    // Grid
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-innerW).tickFormat('').ticks(6));

    // Area
    const area = d3.area().x(d => x(d.year)).y0(innerH).y1(d => y(d.value)).curve(d3.curveMonotoneX);
    g.append('path').datum(chartData).attr('fill', 'url(#aff-grad)').attr('d', area)
      .attr('opacity', 0).transition().duration(1200).attr('opacity', 1);

    // Line
    const line = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
    const path = g.append('path').datum(chartData).attr('fill', 'none').attr('stroke', '#FFD93D')
      .attr('stroke-width', 2.5).attr('filter', 'drop-shadow(0 0 6px rgba(255,217,61,0.5))').attr('d', line);
    const len = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
      .transition().duration(2000).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    // Peak annotation
    const peak = chartData.reduce((max, d) => d.value > max.value ? d : max, chartData[0]);
    g.append('circle').attr('cx', x(peak.year)).attr('cy', y(peak.value)).attr('r', 0)
      .attr('fill', '#FFD93D').attr('stroke', '#0B0F19').attr('stroke-width', 3)
      .attr('filter', 'drop-shadow(0 0 10px rgba(255,217,61,0.6))')
      .transition().delay(2000).duration(600).attr('r', 7);
    g.append('text').attr('x', x(peak.year)).attr('y', y(peak.value) - 18).attr('text-anchor', 'middle')
      .attr('fill', '#FFD93D').attr('font-size', '11px').attr('font-weight', '600').attr('font-family', 'Inter, sans-serif')
      .attr('opacity', 0).text(`Peak: ${peak.value >= 1e6 ? (peak.value / 1e6).toFixed(1) + 'M' : peak.value.toLocaleString()} (${peak.year})`)
      .transition().delay(2200).duration(400).attr('opacity', 1);

    // Axes
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(6).tickFormat(d => {
      if (d >= 1e6) return `${(d / 1e6).toFixed(1)}M`;
      if (d >= 1e3) return `${(d / 1e3).toFixed(0)}K`;
      return d;
    }));

    // Y label
    g.append('text').attr('transform', 'rotate(-90)').attr('y', -margin.left + 15).attr('x', -innerH / 2)
      .attr('text-anchor', 'middle').attr('fill', '#64748B').attr('font-size', '11px').attr('font-family', 'Inter, sans-serif')
      .text('People Affected');

    // Tooltip
    const tooltip = d3.select(svgRef.current.parentNode).selectAll('.d3-tooltip').data([0]).join('div').attr('class', 'd3-tooltip');
    const bisector = d3.bisector(d => d.year).left;
    g.append('rect').attr('width', innerW).attr('height', innerH).attr('fill', 'transparent')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const yr = x.invert(mx);
        const idx = bisector(chartData, yr, 1);
        const d0 = chartData[idx - 1], d1 = chartData[idx];
        if (!d0) return;
        const d = d1 && (yr - d0.year > d1.year - yr) ? d1 : d0;
        tooltip.style('opacity', 1)
          .style('left', `${x(d.year) + margin.left + 15}px`)
          .style('top', `${y(d.value) + margin.top - 20}px`)
          .html(`<strong>${d.year}</strong><br/>Affected: ${d.value >= 1e6 ? (d.value / 1e6).toFixed(2) + 'M' : d.value.toLocaleString()}`);
        g.selectAll('.hover-line').remove();
        g.append('line').attr('class', 'hover-line')
          .attr('x1', x(d.year)).attr('x2', x(d.year)).attr('y1', 0).attr('y2', innerH)
          .attr('stroke', 'rgba(255,217,61,0.3)').attr('stroke-dasharray', '4 4');
      })
      .on('mouseleave', () => { tooltip.style('opacity', 0); g.selectAll('.hover-line').remove(); });

  }, [data, containerWidth, propHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
