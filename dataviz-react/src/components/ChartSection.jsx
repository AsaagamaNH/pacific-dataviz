import React from 'react';
import ParallaxSection from './ParallaxSection';

/**
 * ChartSection — Container for narrative text + full-width chart.
 * Chart is NOT wrapped in ParallaxSection to ensure ResizeObserver works.
 */
export default function ChartSection({ label, title, narrative, chart, footer, id }) {
  return (
    <section className="chart-section" id={id}>
      <div className="chart-section-inner">
        <ParallaxSection animation="fadeUp">
          <div className="chart-narrative">
            {label && <div className="chart-narrative-label">{label}</div>}
            {title && <h2>{title}</h2>}
            {narrative && (
              typeof narrative === 'string'
                ? <p>{narrative}</p>
                : <div>{narrative}</div>
            )}
          </div>
        </ParallaxSection>

        {/* Chart rendered WITHOUT ParallaxSection wrapper to ensure
            ResizeObserver can measure container width on mount */}
        <div className="chart-container">
          {chart}
        </div>

        {footer && (
          <div className="chart-footer">{footer}</div>
        )}
      </div>
    </section>
  );
}
