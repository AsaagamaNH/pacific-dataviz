import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import PACIFIC_COUNTRIES from '../assets/pacific_countries';

export default function D3Charts({ data, currentStep, onSelectCountry }) {
  const containerRef = useRef(null);
  const [worldGeo, setWorldGeo] = useState(null);

  // Load world topojson once
  useEffect(() => {
    fetch('/countries-110m.json')
      .then(r => r.json())
      .then(topo => {
        const countries = topojson.feature(topo, topo.objects.countries);
        setWorldGeo(countries);
      })
      .catch(err => console.warn('Could not load world map:', err));
  }, []);

  const draw = useCallback(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    d3.select(container).selectAll('svg').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');

    // Shadow filter
    const shadow = defs.append('filter').attr('id', 'shadow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow').attr('dx', 0).attr('dy', 2).attr('stdDeviation', 4).attr('flood-color', 'rgba(0,0,0,0.1)');

    // Teal area gradient
    const tealGrad = defs.append('linearGradient').attr('id', 'teal-area-grad').attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    tealGrad.append('stop').attr('offset','0%').attr('stop-color','#0d9488').attr('stop-opacity', 0.3);
    tealGrad.append('stop').attr('offset','100%').attr('stop-color','#0d9488').attr('stop-opacity', 0.02);

    // Bar gradient
    const warmGrad = defs.append('linearGradient').attr('id', 'warm-grad').attr('x1','0%').attr('y1','0%').attr('x2','100%').attr('y2','0%');
    warmGrad.append('stop').attr('offset','0%').attr('stop-color','#e74c3c');
    warmGrad.append('stop').attr('offset','100%').attr('stop-color','#d97706');

    // Tooltip
    let tooltip = d3.select('body').select('.d3-tooltip');
    if (tooltip.empty()) tooltip = d3.select('body').append('div').attr('class', 'd3-tooltip');

    const showTooltip = (event, html) => {
      tooltip.html(html).style('opacity', 1)
        .style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px');
    };
    const hideTooltip = () => tooltip.style('opacity', 0);

    const t = d3.transition().duration(900).ease(d3.easeCubicOut);
    const margin = { top: 50, right: 40, bottom: 50, left: 70 };
    const innerWidth  = width  - margin.left - margin.right;
    const innerHeight = height - margin.top  - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // ==========================================
    // STEP 0: GEOMAP — Pacific Island Locations
    // ==========================================
    if (currentStep === 0) {
      // Use Natural Earth projection rotated to center on Pacific
      const projection = d3.geoNaturalEarth1()
        .rotate([-180, 0])
        .fitSize([width - 20, height - 20], { type: 'Sphere' });

      const path = d3.geoPath(projection);

      // Ocean background
      svg.insert('rect', ':first-child')
        .attr('width', width).attr('height', height)
        .attr('fill', '#f0f7fa').attr('rx', 8);

      // Sphere outline
      svg.append('path')
        .datum({ type: 'Sphere' })
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1);

      // Graticule
      svg.append('path')
        .datum(d3.geoGraticule10())
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#f1f5f9')
        .attr('stroke-width', 0.5);

      // Country outlines (if loaded)
      if (worldGeo) {
        svg.append('g')
          .selectAll('path')
          .data(worldGeo.features)
          .join('path')
          .attr('d', path)
          .attr('fill', '#e8eef2')
          .attr('stroke', '#d1d9e0')
          .attr('stroke-width', 0.5);
      }

      // Pacific region bounding box highlight
      const pacificBounds = [
        [projection([120, 30]), projection([120, -35])],
        [projection([-120, 30]), projection([-120, -35])]
      ];

      // Draw PICT markers
      const markerG = svg.append('g').attr('class', 'markers');

      const markers = markerG.selectAll('g.marker')
        .data(PACIFIC_COUNTRIES)
        .join('g')
        .attr('class', 'marker')
        .attr('transform', d => {
          const [x, y] = projection([d.lon, d.lat]);
          return `translate(${x},${y})`;
        })
        .style('cursor', 'pointer');

      // Ripple ring (animated)
      markers.append('circle')
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', '#0d9488')
        .attr('stroke-width', 1)
        .attr('opacity', 0.25)
        .transition(t).delay((_, i) => i * 60)
        .attr('r', 14);

      // Main dot
      markers.append('circle')
        .attr('r', 0)
        .attr('fill', '#0d9488')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#shadow)')
        .transition(t).delay((_, i) => i * 60 + 200)
        .attr('r', 6);

      // Labels
      markers.append('text')
        .attr('x', 10)
        .attr('y', 4)
        .text(d => d.name.length > 20 ? d.name.substring(0, 18) + '…' : d.name)
        .attr('fill', '#1a1a2e')
        .style('font-size', '9px')
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .transition(t).delay((_, i) => i * 60 + 400)
        .style('opacity', 0.8);

      // Interactions
      markers
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).select('circle:nth-child(2)')
            .transition().duration(200).attr('r', 9).attr('fill', '#0f766e');
          showTooltip(event, `<strong>${d.name}</strong><br/>📍 ${Math.abs(d.lat).toFixed(1)}°${d.lat >= 0 ? 'N' : 'S'}, ${Math.abs(d.lon).toFixed(1)}°${d.lon >= 0 ? 'E' : 'W'}<br/><em style="color:#94a3b8;font-size:0.75rem">Click for details</em>`);
        })
        .on('mousemove', (event) => tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px'))
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).select('circle:nth-child(2)')
            .transition().duration(300).attr('r', 6).attr('fill', '#0d9488');
          hideTooltip();
        })
        .on('click', (event, d) => {
          hideTooltip();
          if (onSelectCountry) onSelectCountry(d.name);
        });

      // Title
      svg.append('text')
        .attr('x', width / 2).attr('y', 24).attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8').style('font-size', '10px')
        .style('font-family', 'Inter, sans-serif').style('letter-spacing', '0.15em').style('text-transform', 'uppercase')
        .text('23 Pacific Island Countries & Territories');

      // Instruction
      svg.append('text')
        .attr('x', width / 2).attr('y', height - 12).attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8').style('font-size', '10px')
        .style('font-family', 'Inter, sans-serif').style('font-style', 'italic')
        .text('Click on a marker to explore country data')
        .style('opacity', 0).transition().delay(1500).duration(600).style('opacity', 0.7);
    }

    // ==========================================
    // STEP 1: BUBBLE PACK — GHG Emissions
    // ==========================================
    else if (currentStep === 1) {
      const ghgData = d3.rollup(
        data.filter(d => d.INDICATOR === 'GHG_EMI_CAPITA'),
        v => d3.mean(v, d => d.OBS_VALUE),
        d => d.GEO_PICT_LABEL
      );
      const dataArr = Array.from(ghgData, ([key, value]) => ({ key, value })).filter(d => d.value > 0);

      const packLayout = d3.pack().size([innerWidth, innerHeight]).padding(8);
      const root = d3.hierarchy({ children: dataArr }).sum(d => d.value);
      const nodes = packLayout(root).leaves();

      const nodeGroups = g.selectAll('g.node')
        .data(nodes).join('g').attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`).style('cursor', 'pointer');

      // Shadow circle
      nodeGroups.append('circle').attr('r', 0).attr('fill', '#d97706').attr('opacity', 0.08)
        .transition(t).attr('r', d => d.r * 1.15);

      // Main bubble
      nodeGroups.append('circle').attr('r', 0)
        .attr('fill', 'rgba(217, 119, 6, 0.1)').attr('stroke', '#d97706').attr('stroke-width', 1.5)
        .transition(t).attr('r', d => d.r);

      // Labels
      nodeGroups.append('text').attr('text-anchor', 'middle').attr('fill', '#1a1a2e').attr('dy', '-0.2em')
        .style('font-size', d => Math.min(d.r / 3.5, 13) + 'px').style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600').style('pointer-events', 'none')
        .text(d => d.r > 22 ? d.data.key : '').style('opacity', 0)
        .transition(t).delay(400).style('opacity', 1);

      nodeGroups.append('text').attr('text-anchor', 'middle').attr('fill', '#d97706').attr('dy', '1em')
        .style('font-size', d => Math.min(d.r / 4, 11) + 'px').style('font-family', 'Inter, sans-serif')
        .style('font-weight', '500').style('pointer-events', 'none')
        .text(d => d.r > 30 ? d.data.value.toFixed(1) : '').style('opacity', 0)
        .transition(t).delay(600).style('opacity', 0.9);

      nodeGroups
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).select('circle:nth-child(2)')
            .transition().duration(200).attr('fill', 'rgba(217,119,6,0.2)').attr('stroke-width', 2.5);
          showTooltip(event, `<strong>${d.data.key}</strong><br/>Avg Emissions: ${d.data.value.toFixed(2)} t CO₂/capita`);
        })
        .on('mousemove', (event) => tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px'))
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).select('circle:nth-child(2)')
            .transition().duration(300).attr('fill', 'rgba(217,119,6,0.1)').attr('stroke-width', 1.5);
          hideTooltip();
        });
    }

    // ==========================================
    // STEP 2: AREA CHART — Sea Level Anomaly
    // ==========================================
    else if (currentStep === 2) {
      const seaData = d3.rollup(
        data.filter(d => d.INDICATOR === 'SEA_LVL'),
        v => d3.mean(v, d => d.OBS_VALUE),
        d => d.TIME_PERIOD
      );
      const dataArr = Array.from(seaData, ([year, value]) => ({ year, value })).sort((a, b) => a.year - b.year);

      const x = d3.scaleLinear().domain(d3.extent(dataArr, d => d.year)).range([0, innerWidth]);
      const yExtent = d3.extent(dataArr, d => d.value);
      const y = d3.scaleLinear().domain([Math.min(yExtent[0], 0), yExtent[1]]).range([innerHeight, 0]).nice();

      g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat('')).call(g => g.select('.domain').remove());

      g.append('line').attr('x1', 0).attr('x2', innerWidth).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', '#e2e8f0').attr('stroke-dasharray', '6 4');

      const areaGen = d3.area().x(d => x(d.year)).y0(y(0)).y1(d => y(d.value)).curve(d3.curveMonotoneX);
      g.append('path').datum(dataArr).attr('fill', 'url(#teal-area-grad)').attr('d', areaGen).style('opacity', 0).transition(t).style('opacity', 1);

      const lineGen = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
      const path = g.append('path').datum(dataArr).attr('fill', 'none').attr('stroke', '#0d9488').attr('stroke-width', 2.5).attr('d', lineGen);
      const pathLength = path.node().getTotalLength();
      path.attr('stroke-dasharray', pathLength).attr('stroke-dashoffset', pathLength).transition(t).duration(1500).attr('stroke-dashoffset', 0);

      const dots = g.selectAll('.sea-dot').data(dataArr.filter((_, i) => i % 4 === 0 || i === dataArr.length - 1))
        .join('circle').attr('class', 'sea-dot').attr('cx', d => x(d.year)).attr('cy', d => y(d.value))
        .attr('r', 0).attr('fill', '#ffffff').attr('stroke', '#0d9488').attr('stroke-width', 2).style('cursor', 'pointer');
      dots.transition(t).delay(800).attr('r', 5);

      dots.on('mouseover', (event, d) => {
          d3.select(event.currentTarget).transition().duration(200).attr('r', 8).attr('fill', '#0d9488').attr('stroke-width', 3);
          showTooltip(event, `<strong>Year: ${d.year}</strong><br/>Sea Level Anomaly: ${d.value.toFixed(3)}m`);
        })
        .on('mousemove', (event) => tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px'))
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).transition().duration(300).attr('r', 5).attr('fill', '#ffffff').attr('stroke-width', 2);
          hideTooltip();
        });

      g.append('g').attr('transform', `translate(0,${innerHeight})`).attr('class', 'axis').call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));
      g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(6));
      g.append('text').attr('transform', 'rotate(-90)').attr('y', -55).attr('x', -innerHeight / 2).attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8').style('font-size', '11px').style('font-family', 'Inter, sans-serif').text('Sea Level Anomaly (m)');
    }

    // ==========================================
    // STEP 3: HORIZONTAL BAR — Economic Losses
    // ==========================================
    else if (currentStep === 3) {
      const lossData = d3.rollup(
        data.filter(d => d.INDICATOR === 'VC_DSR_AALT'),
        v => d3.sum(v, d => d.OBS_VALUE),
        d => d.GEO_PICT_LABEL
      );
      const dataArr = Array.from(lossData, ([key, value]) => ({ key, value }))
        .filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 12);

      const bm = { top: 30, right: 100, bottom: 40, left: 160 };
      const bW = width - bm.left - bm.right;
      const bH = height - bm.top - bm.bottom;
      const bg = svg.append('g').attr('transform', `translate(${bm.left},${bm.top})`);

      const x = d3.scaleLinear().domain([0, d3.max(dataArr, d => d.value)]).range([0, bW]);
      const y = d3.scaleBand().domain(dataArr.map(d => d.key)).range([0, bH]).padding(0.25);

      bg.append('g').attr('class', 'grid').call(d3.axisBottom(x).tickSize(bH).tickFormat('').ticks(5)).call(g => g.select('.domain').remove());

      const barGroups = bg.selectAll('g.bar-group').data(dataArr).join('g').attr('class', 'bar-group')
        .attr('transform', d => `translate(0,${y(d.key)})`).style('cursor', 'pointer');

      barGroups.append('rect').attr('height', y.bandwidth()).attr('fill', 'url(#warm-grad)').attr('rx', 4).attr('width', 0)
        .transition(t).attr('width', d => x(d.value));

      barGroups.append('text').attr('x', 0).attr('y', y.bandwidth() / 2).attr('dy', '0.35em')
        .attr('fill', '#4a5568').style('font-size', '12px').style('font-family', 'Inter, sans-serif').style('font-weight', '600').style('opacity', 0)
        .text(d => '$' + d3.format('.2s')(d.value).replace('G', 'B'))
        .transition(t).delay(600).attr('x', d => x(d.value) + 10).style('opacity', 1);

      bg.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSizeOuter(0))
        .selectAll('text').style('font-size', '12px').style('font-weight', '500');

      barGroups
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).select('rect').transition().duration(200).attr('opacity', 0.85);
          showTooltip(event, `<strong>${d.key}</strong><br/>Total Loss: $${d3.format(',.0f')(d.value)}`);
        })
        .on('mousemove', (event) => tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px'))
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).select('rect').transition().duration(300).attr('opacity', 1);
          hideTooltip();
        });
    }

    // ==========================================
    // STEP 4: HEATMAP — Rainfall Anomaly
    // ==========================================
    else if (currentStep === 4) {
      const rainData = data.filter(d => d.INDICATOR === 'RAIN_ANOM');
      const countries = [...new Set(rainData.map(d => d.GEO_PICT_LABEL))].sort();
      const years = [...new Set(rainData.map(d => d.TIME_PERIOD))].sort((a, b) => a - b);
      const recentYears = years.filter(y => y >= 1990);

      const lookup = new Map();
      rainData.forEach(d => lookup.set(`${d.GEO_PICT_LABEL}-${d.TIME_PERIOD}`, d.OBS_VALUE));

      const hm = { top: 40, right: 20, bottom: 60, left: 150 };
      const hmW = width - hm.left - hm.right;
      const hmH = height - hm.top - hm.bottom;
      const hg = svg.append('g').attr('transform', `translate(${hm.left},${hm.top})`);

      const x = d3.scaleBand().domain(recentYears).range([0, hmW]).padding(0.05);
      const y = d3.scaleBand().domain(countries).range([0, hmH]).padding(0.05);

      const maxAbs = d3.max(rainData.filter(d => recentYears.includes(d.TIME_PERIOD)), d => Math.abs(d.OBS_VALUE)) || 2;
      const colorScale = d3.scaleDiverging().domain([-maxAbs, 0, maxAbs]).interpolator(d3.interpolateRdBu).clamp(true);

      const cells = [];
      countries.forEach(country => {
        recentYears.forEach(year => {
          const val = lookup.get(`${country}-${year}`);
          if (val !== undefined) cells.push({ country, year, value: val });
        });
      });

      hg.selectAll('rect.hm-cell').data(cells).join('rect').attr('class', 'hm-cell')
        .attr('x', d => x(d.year)).attr('y', d => y(d.country)).attr('width', x.bandwidth()).attr('height', y.bandwidth())
        .attr('rx', 1).attr('fill', d => colorScale(d.value)).attr('opacity', 0).style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).attr('stroke', '#1a1a2e').attr('stroke-width', 2);
          showTooltip(event, `<strong>${d.country}</strong><br/>Year: ${d.year}<br/>Anomaly: ${d.value > 0 ? '+' : ''}${d.value.toFixed(2)} (${d.value > 0 ? 'above' : 'below'} avg)`);
        })
        .on('mousemove', (event) => tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px'))
        .on('mouseout', (event) => { d3.select(event.currentTarget).attr('stroke', null); hideTooltip(); })
        .transition(t).delay((_, i) => i * 0.5).attr('opacity', 0.9);

      hg.append('g').attr('transform', `translate(0,${hmH})`).attr('class', 'axis')
        .call(d3.axisBottom(x).tickValues(recentYears.filter(y => y % 5 === 0)).tickFormat(d3.format('d')))
        .selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end');

      hg.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSizeOuter(0)).selectAll('text').style('font-size', '10px');

      // Legend
      const lgW = 200, lgH = 12;
      const lgGrad = defs.append('linearGradient').attr('id', 'hm-lg').attr('x1','0%').attr('x2','100%');
      for (let i = 0; i <= 10; i++) {
        const val = -maxAbs + (2 * maxAbs * i) / 10;
        lgGrad.append('stop').attr('offset', `${i * 10}%`).attr('stop-color', colorScale(val));
      }
      const lgG = svg.append('g').attr('transform', `translate(${width / 2 - lgW / 2},${height - 15})`).style('opacity', 0);
      lgG.append('rect').attr('width', lgW).attr('height', lgH).attr('rx', 3).attr('fill', 'url(#hm-lg)');
      lgG.append('text').attr('x', 0).attr('y', -4).attr('fill', '#94a3b8').style('font-size', '9px').style('font-family', 'Inter').text('Wet ←');
      lgG.append('text').attr('x', lgW).attr('y', -4).attr('text-anchor', 'end').attr('fill', '#94a3b8').style('font-size', '9px').style('font-family', 'Inter').text('→ Dry');
      lgG.transition().delay(800).duration(600).style('opacity', 1);
    }

    // ==========================================
    // STEP 5: DOT MATRIX — Data Completeness
    // ==========================================
    else if (currentStep === 5) {
      const totalPoints = 6440;
      const missing = 3460;
      const real = totalPoints - missing;

      const dm = { top: 30, right: 30, bottom: 80, left: 30 };
      const dmW = width - dm.left - dm.right;
      const dmH = height - dm.top - dm.bottom;
      const dg = svg.append('g').attr('transform', `translate(${dm.left},${dm.top})`);

      const pointSize = 5, gap = 3, totalSize = pointSize + gap;
      const cols = Math.floor(dmW / totalSize);
      const visiblePoints = Math.min(totalPoints, cols * Math.floor(dmH / totalSize));

      const arr = Array(visiblePoints).fill(0).map((_, i) => ({
        type: i < Math.round(real * visiblePoints / totalPoints) ? 'real' : 'imputed',
      }));

      dg.selectAll('rect.dot-cell').data(arr).join('rect').attr('class', 'dot-cell')
        .attr('width', pointSize).attr('height', pointSize).attr('rx', 1.5)
        .attr('x', (_, i) => (i % cols) * totalSize).attr('y', (_, i) => Math.floor(i / cols) * totalSize)
        .attr('fill', d => d.type === 'real' ? '#0d9488' : '#e74c3c').attr('opacity', 0)
        .transition().duration(300).delay((_, i) => (i % cols) * 5 + Math.floor(i / cols) * 15)
        .attr('opacity', d => d.type === 'real' ? 0.75 : 0.3);

      const legend = dg.append('g').attr('transform', `translate(0,${dmH + 20})`).style('opacity', 0);
      legend.append('rect').attr('width', 14).attr('height', 14).attr('rx', 3).attr('fill', '#0d9488');
      legend.append('text').attr('x', 22).attr('y', 11).text(`Reported Data (${real.toLocaleString()})`)
        .attr('fill', '#1a1a2e').style('font-size', '13px').style('font-family', 'Inter, sans-serif').style('font-weight', '600');
      legend.append('rect').attr('x', 250).attr('width', 14).attr('height', 14).attr('rx', 3).attr('fill', '#e74c3c').attr('opacity', 0.5);
      legend.append('text').attr('x', 272).attr('y', 11).text(`Imputed Data (${missing.toLocaleString()})`)
        .attr('fill', '#1a1a2e').style('font-size', '13px').style('font-family', 'Inter, sans-serif').style('font-weight', '600');
      legend.transition().delay(1200).duration(800).style('opacity', 1);
    }

  }, [data, currentStep, worldGeo, onSelectCountry]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => { clearTimeout(timeoutId); timeoutId = setTimeout(draw, 250); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeoutId); d3.select('body').selectAll('.d3-tooltip').remove(); };
  }, [draw]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} id="d3-chart-container" />;
}
