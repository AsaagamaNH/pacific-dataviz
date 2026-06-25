import React, { createContext, useContext, useMemo } from 'react';
import rawData from '../assets/data_final_imputed.json';

const DataContext = createContext(null);

/**
 * Normalize an array of values to [0, 1] range.
 */
function normalize(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 0);
  return arr.map(v => (v - min) / (max - min));
}

/**
 * Compute top 10 countries by weighted composite score.
 * Weights: Loss (30%), Affected (30%), Sea Level (20%), Rainfall Anomaly (20%)
 */
function computeTopCountries(data) {
  const countries = [...new Set(data.map(r => r.GEO_PICT_LABEL))]
    .filter(c => c !== 'Micronesia, Federated State of'); // Remove duplicate naming

  const metrics = countries.map(c => {
    const rows = data.filter(r => r.GEO_PICT_LABEL === c);

    const lossSum = rows
      .filter(r => r.INDICATOR === 'VC_DSR_AALT')
      .reduce((s, r) => s + r.OBS_VALUE, 0);

    const affSum = rows
      .filter(r => r.INDICATOR === 'VC_DSR_AFFCT')
      .reduce((s, r) => s + r.OBS_VALUE, 0);

    const seaRows = rows.filter(r => r.INDICATOR === 'SEA_LVL');
    const seaAvg = seaRows.length > 0
      ? seaRows.reduce((s, r) => s + r.OBS_VALUE, 0) / seaRows.length
      : 0;

    const rainRows = rows.filter(r => r.INDICATOR === 'RAIN_ANOM');
    const rainAbsAvg = rainRows.length > 0
      ? rainRows.reduce((s, r) => s + Math.abs(r.OBS_VALUE), 0) / rainRows.length
      : 0;

    const emRows = rows.filter(r => r.INDICATOR === 'GHG_EMI_CAPITA');
    const emAvg = emRows.length > 0
      ? emRows.reduce((s, r) => s + r.OBS_VALUE, 0) / emRows.length
      : 0;

    return { country: c, lossSum, affSum, seaAvg, rainAbsAvg, emAvg };
  });

  const nLoss = normalize(metrics.map(m => m.lossSum));
  const nAff = normalize(metrics.map(m => m.affSum));
  const nSea = normalize(metrics.map(m => m.seaAvg));
  const nRain = normalize(metrics.map(m => m.rainAbsAvg));

  const scored = metrics.map((m, i) => ({
    ...m,
    score: +(nLoss[i] * 0.3 + nAff[i] * 0.3 + nSea[i] * 0.2 + nRain[i] * 0.2).toFixed(4),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}

export function DataProvider({ children }) {
  const data = rawData;
  const loading = false;
  const error = null;

  const topCountries = useMemo(() => {
    if (!data) return [];
    return computeTopCountries(data);
  }, [data]);

  const contextValue = useMemo(() => {
    /**
     * Get filtered data for a specific country.
     * Returns object with arrays for each of the 4 detail-page indicators.
     */
    function getCountryData(countryName) {
      if (!data || !countryName) return null;

      // Handle naming inconsistencies
      const names = [countryName];
      if (countryName === 'Micronesia (Federated States of)') {
        names.push('Micronesia, Federated State of');
      }

      const rows = data.filter(d => names.includes(d.GEO_PICT_LABEL));

      const seaLevel = rows
        .filter(d => d.INDICATOR === 'SEA_LVL')
        .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
        .sort((a, b) => a.year - b.year);

      const losses = rows
        .filter(d => d.INDICATOR === 'VC_DSR_AALT')
        .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
        .sort((a, b) => a.year - b.year);

      const affected = rows
        .filter(d => d.INDICATOR === 'VC_DSR_AFFCT')
        .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
        .sort((a, b) => a.year - b.year);

      const rainfall = rows
        .filter(d => d.INDICATOR === 'RAIN_ANOM')
        .map(d => ({ year: d.TIME_PERIOD, value: d.OBS_VALUE }))
        .sort((a, b) => a.year - b.year);

      // Summary stats
      const totalLoss = losses.reduce((s, d) => s + d.value, 0);
      const totalAffected = affected.reduce((s, d) => s + d.value, 0);
      const avgSeaLevel = seaLevel.length > 0
        ? seaLevel.reduce((s, d) => s + d.value, 0) / seaLevel.length
        : 0;
      const avgRainAnomaly = rainfall.length > 0
        ? rainfall.reduce((s, d) => s + Math.abs(d.value), 0) / rainfall.length
        : 0;

      return {
        seaLevel,
        losses,
        affected,
        rainfall,
        totalLoss,
        totalAffected,
        avgSeaLevel,
        avgRainAnomaly,
      };
    }

    /**
     * Get data for a specific indicator, optionally filtered by country.
     */
    function getIndicatorData(indicator, countryName = null) {
      if (!data) return [];
      let rows = data.filter(d => d.INDICATOR === indicator);
      if (countryName) {
        const names = [countryName];
        if (countryName === 'Micronesia (Federated States of)') {
          names.push('Micronesia, Federated State of');
        }
        rows = rows.filter(d => names.includes(d.GEO_PICT_LABEL));
      }
      return rows;
    }

    return {
      data,
      loading,
      error,
      topCountries,
      getCountryData,
      getIndicatorData,
    };
  }, [data, loading, error, topCountries]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
