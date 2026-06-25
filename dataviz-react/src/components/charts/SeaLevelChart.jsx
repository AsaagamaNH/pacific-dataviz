import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useContainerSize from '../../hooks/useContainerSize';

/**
 * SeaLevelChart — Area chart showing sea level anomaly.
 * Color: Neon blue (#4CC9F0) with gradient fill.
 */
export default function SeaLevelChart({ data, height: propHeight = 420 }) {
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerWidth) return;

    const width = containerWidth;
    const height = propHeight;
    const margin = { top: 30, right: 30, bottom: 50, left: 65 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    if (innerW <= 0 || innerH <= 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate: average per year
    const yearMap = d3.rollup(data, v => d3.mean(v, d => d.value), d => d.year);
    const chartData = Array.from(yearMap, ([year, value]) => ({ year: +year, value }))
      .sort((a, b) => a.year - b.year);

    // Scales
    const x = d3.scaleLinear().domain(d3.extent(chartData, d => d.year)).range([0, innerW]);
    const yExt = d3.extent(chartData, d => d.value);
    const yPad = (yExt[1] - yExt[0]) * 0.15 || 0.01;
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([innerH, 0]);

    // Gradient
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'sea-grad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#4CC9F0').attr('stop-opacity', 0.4);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#4CC9F0').attr('stop-opacity', 0.02);

    // Grid
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-innerW).tickFormat('').ticks(6));

    // Area
    const area = d3.area().x(d => x(d.year)).y0(innerH).y1(d => y(d.value)).curve(d3.curveMonotoneX);
    g.append('path').datum(chartData).attr('fill', 'url(#sea-grad)').attr('d', area).attr('opacity', 0)
      .transition().duration(1200).attr('opacity', 1);

    // Line
    const line = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
    const path = g.append('path').datum(chartData).attr('fill', 'none').attr('stroke', '#4CC9F0')
      .attr('stroke-width', 2.5).attr('filter', 'drop-shadow(0 0 6px rgba(76,201,240,0.5))').attr('d', line);
    const len = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
      .transition().duration(2000).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    // Dots
    g.selectAll('.dot').data(chartData).join('circle').attr('class', 'dot')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.value)).attr('r', 0)
      .attr('fill', '#4CC9F0').attr('stroke', '#0B0F19').attr('stroke-width', 2)
      .transition().delay((d, i) => 1500 + i * 30).duration(400).attr('r', 3.5);

    // Axes
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(6).tickFormat(d => d.toFixed(2)));

    // Labels
    g.append('text').attr('transform', 'rotate(-90)').attr('y', -margin.left + 15).attr('x', -innerH / 2)
      .attr('text-anchor', 'middle').attr('fill', '#64748B').attr('font-size', '11px').attr('font-family', 'Inter, sans-serif')
      .text('Sea Level Anomaly (cm)');

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
          .html(`<strong>${d.year}</strong><br/>Anomaly: ${d.value.toFixed(3)} cm`);
        g.selectAll('.hover-line').remove();
        g.append('line').attr('class', 'hover-line')
          .attr('x1', x(d.year)).attr('x2', x(d.year)).attr('y1', 0).attr('y2', innerH)
          .attr('stroke', 'rgba(76,201,240,0.3)').attr('stroke-dasharray', '4 4');
      })
      .on('mouseleave', () => { tooltip.style('opacity', 0); g.selectAll('.hover-line').remove(); });

  }, [data, containerWidth, propHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
