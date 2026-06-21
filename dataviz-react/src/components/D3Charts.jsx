import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

export default function D3Charts({ data, currentStep }) {
  const containerRef = useRef(null);
  const prevStepRef = useRef(-1);

  const draw = useCallback(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    // Clear previous chart
    d3.select(container).selectAll('svg').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Defs: filters, gradients
    const defs = svg.append('defs');

    // Subtle shadow filter (replacing glow for light theme)
    const shadow = defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow')
      .attr('dx', '0').attr('dy', '2')
      .attr('stdDeviation', '4')
      .attr('flood-color', 'rgba(0,0,0,0.1)');

    // Soft highlight filter
    const softHighlight = defs.append('filter')
      .attr('id', 'soft-highlight')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    softHighlight.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    const feMerge = softHighlight.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Teal gradient for area chart
    const tealGrad = defs.append('linearGradient')
      .attr('id', 'teal-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    tealGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0d9488').attr('stop-opacity', 0.3);
    tealGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0d9488').attr('stop-opacity', 0.02);

    // Warm gradient for bar chart
    const warmGrad = defs.append('linearGradient')
      .attr('id', 'warm-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    warmGrad.append('stop').attr('offset', '0%').attr('stop-color', '#e74c3c');
    warmGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d97706');

    // Setup tooltip
    let tooltip = d3.select('body').select('.d3-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'd3-tooltip');
    }

    const showTooltip = (event, html) => {
      tooltip
        .html(html)
        .style('opacity', 1)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 30) + 'px');
    };

    const hideTooltip = () => {
      tooltip.style('opacity', 0);
    };

    const t = d3.transition().duration(900).ease(d3.easeCubicOut);
    const margin = { top: 50, right: 40, bottom: 50, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ==========================================
    // STEP 0: BUBBLE PACK — GHG Emissions
    // ==========================================
    if (currentStep === 0) {
      const ghgData = d3.rollup(
        data.filter(d => d.INDICATOR === 'GHG_EMI_CAPITA'),
        v => d3.mean(v, d => d.OBS_VALUE),
        d => d.GEO_PICT_LABEL
      );
      const dataArr = Array.from(ghgData, ([key, value]) => ({ key, value }))
        .filter(d => d.value > 0);

      const packLayout = d3.pack()
        .size([innerWidth, innerHeight])
        .padding(8);
      const root = d3.hierarchy({ children: dataArr }).sum(d => d.value);
      const nodes = packLayout(root).leaves();

      const nodeGroups = g.selectAll('g.node')
        .data(nodes)
        .join('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .style('cursor', 'pointer');

      // Subtle shadow circle behind
      nodeGroups.append('circle')
        .attr('r', 0)
        .attr('fill', '#d97706')
        .attr('opacity', 0.08)
        .transition(t)
        .attr('r', d => d.r * 1.15);

      // Main bubble
      const bubbles = nodeGroups.append('circle')
        .attr('r', 0)
        .attr('fill', 'rgba(217, 119, 6, 0.1)')
        .attr('stroke', '#d97706')
        .attr('stroke-width', 1.5);

      bubbles.transition(t)
        .attr('r', d => d.r);

      // Labels — dark text for light theme
      nodeGroups.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#1a1a2e')
        .attr('dy', '-0.2em')
        .style('font-size', d => Math.min(d.r / 3.5, 13) + 'px')
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .text(d => d.r > 22 ? d.data.key : '')
        .style('opacity', 0)
        .transition(t).delay(400).style('opacity', 1);

      // Value labels
      nodeGroups.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#d97706')
        .attr('dy', '1em')
        .style('font-size', d => Math.min(d.r / 4, 11) + 'px')
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '500')
        .style('pointer-events', 'none')
        .text(d => d.r > 30 ? d.data.value.toFixed(1) : '')
        .style('opacity', 0)
        .transition(t).delay(600).style('opacity', 0.9);

      // Interactions
      nodeGroups
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).select('circle:nth-child(2)')
            .transition().duration(200)
            .attr('fill', 'rgba(217, 119, 6, 0.2)')
            .attr('stroke-width', 2.5);
          showTooltip(event, `<strong>${d.data.key}</strong><br/>Avg Emissions: ${d.data.value.toFixed(2)} t CO₂/capita`);
        })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).select('circle:nth-child(2)')
            .transition().duration(300)
            .attr('fill', 'rgba(217, 119, 6, 0.1)')
            .attr('stroke-width', 1.5);
          hideTooltip();
        });
    }

    // ==========================================
    // STEP 1: AREA CHART — Sea Level Anomaly
    // ==========================================
    else if (currentStep === 1) {
      const seaData = d3.rollup(
        data.filter(d => d.INDICATOR === 'SEA_LVL'),
        v => d3.mean(v, d => d.OBS_VALUE),
        d => d.TIME_PERIOD
      );
      const dataArr = Array.from(seaData, ([year, value]) => ({ year, value }))
        .sort((a, b) => a.year - b.year);

      const x = d3.scaleLinear()
        .domain(d3.extent(dataArr, d => d.year))
        .range([0, innerWidth]);

      const yExtent = d3.extent(dataArr, d => d.value);
      const y = d3.scaleLinear()
        .domain([Math.min(yExtent[0], 0), yExtent[1]])
        .range([innerHeight, 0])
        .nice();

      // Grid lines
      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(''))
        .call(g => g.select('.domain').remove());

      // Zero line
      g.append('line')
        .attr('x1', 0).attr('x2', innerWidth)
        .attr('y1', y(0)).attr('y2', y(0))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-dasharray', '6 4');

      // Area
      const areaGen = d3.area()
        .x(d => x(d.year))
        .y0(y(0))
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(dataArr)
        .attr('fill', 'url(#teal-area-grad)')
        .attr('d', areaGen)
        .style('opacity', 0)
        .transition(t).style('opacity', 1);

      // Line
      const lineGen = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

      const path = g.append('path')
        .datum(dataArr)
        .attr('fill', 'none')
        .attr('stroke', '#0d9488')
        .attr('stroke-width', 2.5)
        .attr('d', lineGen);

      const pathLength = path.node().getTotalLength();
      path.attr('stroke-dasharray', pathLength)
        .attr('stroke-dashoffset', pathLength)
        .transition(t)
        .duration(1500)
        .attr('stroke-dashoffset', 0);

      // Interactive dots
      const dots = g.selectAll('.sea-dot')
        .data(dataArr.filter((_, i) => i % 4 === 0 || i === dataArr.length - 1))
        .join('circle')
        .attr('class', 'sea-dot')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.value))
        .attr('r', 0)
        .attr('fill', '#ffffff')
        .attr('stroke', '#0d9488')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      dots.transition(t).delay(800).attr('r', 5);

      dots.on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr('r', 8).attr('fill', '#0d9488').attr('stroke-width', 3);
        showTooltip(event, `<strong>Year: ${d.year}</strong><br/>Sea Level Anomaly: ${d.value.toFixed(3)}m`);
      })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget)
            .transition().duration(300)
            .attr('r', 5).attr('fill', '#ffffff').attr('stroke-width', 2);
          hideTooltip();
        });

      // Axes
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .attr('class', 'axis')
        .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));

      g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(6));

      // Y-axis label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -55)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .style('font-size', '11px')
        .style('font-family', 'Inter, sans-serif')
        .text('Sea Level Anomaly (m)');
    }

    // ==========================================
    // STEP 2: HORIZONTAL BAR — Economic Losses
    // ==========================================
    else if (currentStep === 2) {
      const lossData = d3.rollup(
        data.filter(d => d.INDICATOR === 'VC_DSR_AALT'),
        v => d3.sum(v, d => d.OBS_VALUE),
        d => d.GEO_PICT_LABEL
      );
      const dataArr = Array.from(lossData, ([key, value]) => ({ key, value }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 12);

      const barMargin = { top: 30, right: 100, bottom: 40, left: 160 };
      const bWidth = width - barMargin.left - barMargin.right;
      const bHeight = height - barMargin.top - barMargin.bottom;

      const bg = svg.append('g')
        .attr('transform', `translate(${barMargin.left},${barMargin.top})`);

      const x = d3.scaleLinear()
        .domain([0, d3.max(dataArr, d => d.value)])
        .range([0, bWidth]);

      const y = d3.scaleBand()
        .domain(dataArr.map(d => d.key))
        .range([0, bHeight])
        .padding(0.25);

      // Grid
      bg.append('g')
        .attr('class', 'grid')
        .call(d3.axisBottom(x).tickSize(bHeight).tickFormat('').ticks(5))
        .call(g => g.select('.domain').remove());

      // Bar groups
      const barGroups = bg.selectAll('g.bar-group')
        .data(dataArr)
        .join('g')
        .attr('class', 'bar-group')
        .attr('transform', d => `translate(0,${y(d.key)})`)
        .style('cursor', 'pointer');

      // Bars
      barGroups.append('rect')
        .attr('height', y.bandwidth())
        .attr('fill', 'url(#warm-grad)')
        .attr('rx', 4)
        .attr('width', 0)
        .transition(t)
        .attr('width', d => x(d.value));

      // Value labels — dark text for light theme
      barGroups.append('text')
        .attr('x', 0)
        .attr('y', y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('fill', '#4a5568')
        .style('font-size', '12px')
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600')
        .style('opacity', 0)
        .text(d => '$' + d3.format('.2s')(d.value).replace('G', 'B'))
        .transition(t)
        .delay(600)
        .attr('x', d => x(d.value) + 10)
        .style('opacity', 1);

      // Y axis (country names)
      bg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).tickSizeOuter(0))
        .selectAll('text')
        .style('font-size', '12px')
        .style('font-weight', '500');

      // Interactions
      barGroups
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).select('rect')
            .transition().duration(200).attr('opacity', 0.85);
          showTooltip(event, `<strong>${d.key}</strong><br/>Total Loss: $${d3.format(',.0f')(d.value)}`);
        })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).select('rect')
            .transition().duration(300).attr('opacity', 1);
          hideTooltip();
        });
    }

    // ==========================================
    // STEP 3: HEATMAP — Rainfall Anomaly
    // ==========================================
    else if (currentStep === 3) {
      const rainData = data.filter(d => d.INDICATOR === 'RAIN_ANOM');

      // Get unique countries and years
      const countries = [...new Set(rainData.map(d => d.GEO_PICT_LABEL))].sort();
      const years = [...new Set(rainData.map(d => d.TIME_PERIOD))].sort((a, b) => a - b);

      // Use recent years for readability
      const recentYears = years.filter(y => y >= 1990);

      // Build lookup
      const lookup = new Map();
      rainData.forEach(d => {
        lookup.set(`${d.GEO_PICT_LABEL}-${d.TIME_PERIOD}`, d.OBS_VALUE);
      });

      const hmMargin = { top: 40, right: 20, bottom: 60, left: 150 };
      const hmWidth = width - hmMargin.left - hmMargin.right;
      const hmHeight = height - hmMargin.top - hmMargin.bottom;

      const hg = svg.append('g')
        .attr('transform', `translate(${hmMargin.left},${hmMargin.top})`);

      const cellWidth = Math.max(hmWidth / recentYears.length, 2);
      const cellHeight = Math.max(hmHeight / countries.length, 2);

      const x = d3.scaleBand()
        .domain(recentYears)
        .range([0, hmWidth])
        .padding(0.05);

      const y = d3.scaleBand()
        .domain(countries)
        .range([0, hmHeight])
        .padding(0.05);

      // Diverging color scale: blue (wet) → neutral → red (dry)
      const maxAbs = d3.max(rainData.filter(d => recentYears.includes(d.TIME_PERIOD)), d => Math.abs(d.OBS_VALUE)) || 2;
      const colorScale = d3.scaleDiverging()
        .domain([-maxAbs, 0, maxAbs])
        .interpolator(d3.interpolateRdBu)
        .clamp(true);

      // Draw cells
      const cells = [];
      countries.forEach(country => {
        recentYears.forEach(year => {
          const val = lookup.get(`${country}-${year}`);
          if (val !== undefined) {
            cells.push({ country, year, value: val });
          }
        });
      });

      hg.selectAll('rect.hm-cell')
        .data(cells)
        .join('rect')
        .attr('class', 'hm-cell')
        .attr('x', d => x(d.year))
        .attr('y', d => y(d.country))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .attr('rx', 1)
        .attr('fill', d => colorScale(d.value))
        .attr('opacity', 0)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).attr('stroke', '#1a1a2e').attr('stroke-width', 2);
          const direction = d.value > 0 ? 'above' : 'below';
          showTooltip(event, `<strong>${d.country}</strong><br/>Year: ${d.year}<br/>Anomaly: ${d.value > 0 ? '+' : ''}${d.value.toFixed(2)} (${direction} avg)`);
        })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).attr('stroke', null);
          hideTooltip();
        })
        .transition(t)
        .delay((d, i) => i * 0.5)
        .attr('opacity', 0.9);

      // X axis (years) — show every 5th year
      hg.append('g')
        .attr('transform', `translate(0,${hmHeight})`)
        .attr('class', 'axis')
        .call(d3.axisBottom(x)
          .tickValues(recentYears.filter(y => y % 5 === 0))
          .tickFormat(d3.format('d'))
        )
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

      // Y axis (countries)
      hg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).tickSizeOuter(0))
        .selectAll('text')
        .style('font-size', '10px');

      // Color legend
      const legendWidth = 200;
      const legendHeight = 12;
      const legendG = svg.append('g')
        .attr('transform', `translate(${width / 2 - legendWidth / 2},${height - 15})`)
        .style('opacity', 0);

      // Gradient for legend
      const lgGrad = defs.append('linearGradient')
        .attr('id', 'heatmap-legend-grad')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const val = -maxAbs + (2 * maxAbs * i) / steps;
        lgGrad.append('stop')
          .attr('offset', `${(i / steps) * 100}%`)
          .attr('stop-color', colorScale(val));
      }

      legendG.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('rx', 3)
        .attr('fill', 'url(#heatmap-legend-grad)');

      legendG.append('text')
        .attr('x', 0).attr('y', -4)
        .attr('fill', '#94a3b8')
        .style('font-size', '9px')
        .style('font-family', 'Inter, sans-serif')
        .text('Wet ←');

      legendG.append('text')
        .attr('x', legendWidth).attr('y', -4)
        .attr('text-anchor', 'end')
        .attr('fill', '#94a3b8')
        .style('font-size', '9px')
        .style('font-family', 'Inter, sans-serif')
        .text('→ Dry');

      legendG.transition().delay(800).duration(600).style('opacity', 1);
    }

    // ==========================================
    // STEP 4: DOT MATRIX — Data Completeness
    // ==========================================
    else if (currentStep === 4) {
      const totalPoints = 6440;
      const missing = 3460;
      const real = totalPoints - missing;

      const dmMargin = { top: 30, right: 30, bottom: 80, left: 30 };
      const dmWidth = width - dmMargin.left - dmMargin.right;
      const dmHeight = height - dmMargin.top - dmMargin.bottom;

      const dg = svg.append('g')
        .attr('transform', `translate(${dmMargin.left},${dmMargin.top})`);

      const pointSize = 5;
      const padding = 3;
      const totalSize = pointSize + padding;
      const cols = Math.floor(dmWidth / totalSize);
      const visiblePoints = Math.min(totalPoints, cols * Math.floor(dmHeight / totalSize));

      const arr = Array(visiblePoints).fill(0).map((_, i) => ({
        type: i < Math.round(real * visiblePoints / totalPoints) ? 'real' : 'imputed',
      }));

      dg.selectAll('rect.dot-cell')
        .data(arr)
        .join('rect')
        .attr('class', 'dot-cell')
        .attr('width', pointSize)
        .attr('height', pointSize)
        .attr('rx', 1.5)
        .attr('x', (_, i) => (i % cols) * totalSize)
        .attr('y', (_, i) => Math.floor(i / cols) * totalSize)
        .attr('fill', d => d.type === 'real' ? '#0d9488' : '#e74c3c')
        .attr('opacity', 0)
        .transition()
        .duration(300)
        .delay((_, i) => (i % cols) * 5 + Math.floor(i / cols) * 15)
        .attr('opacity', d => d.type === 'real' ? 0.75 : 0.3);

      // Legend
      const legend = dg.append('g')
        .attr('transform', `translate(0,${dmHeight + 20})`)
        .style('opacity', 0);

      // Real data
      legend.append('rect')
        .attr('width', 14).attr('height', 14).attr('rx', 3)
        .attr('fill', '#0d9488');
      legend.append('text')
        .attr('x', 22).attr('y', 11)
        .text(`Reported Data (${real.toLocaleString()})`)
        .attr('fill', '#1a1a2e')
        .style('font-size', '13px')
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600');

      // Imputed data
      legend.append('rect')
        .attr('x', 250)
        .attr('width', 14).attr('height', 14).attr('rx', 3)
        .attr('fill', '#e74c3c').attr('opacity', 0.5);
      legend.append('text')
        .attr('x', 272).attr('y', 11)
        .text(`Imputed Data (${missing.toLocaleString()})`)
        .attr('fill', '#1a1a2e')
        .style('font-size', '13px')
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600');

      legend.transition().delay(1200).duration(800).style('opacity', 1);
    }

    prevStepRef.current = currentStep;
  }, [data, currentStep]);

  // Draw on mount and step change
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle resize
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(draw, 250);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
      // Clean up tooltip
      d3.select('body').selectAll('.d3-tooltip').remove();
    };
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      id="d3-chart-container"
    />
  );
}
