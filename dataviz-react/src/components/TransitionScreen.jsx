import React from 'react';
import ParallaxSection from './ParallaxSection';

/**
 * TransitionScreen — Full-viewport text-only interlude section.
 *
 * Props:
 *   title: string (may contain HTML-like markup)
 *   accentWord: string — word in title to highlight with neon accent
 *   subtitle: string (optional)
 *   id: string (optional, for scroll progress tracking)
 */
export default function TransitionScreen({ title, accentWord, subtitle, id }) {
  // Build title with accent word highlighted
  let titleContent = title;
  if (accentWord && title.includes(accentWord)) {
    const parts = title.split(accentWord);
    titleContent = (
      <>
        {parts[0]}
        <span className="accent">{accentWord}</span>
        {parts[1]}
      </>
    );
  }

  return (
    <section className="transition-screen" id={id}>
      <ParallaxSection animation="fadeUp" duration={1.5}>
        <h2 className="transition-title">
          {typeof titleContent === 'string' ? title : titleContent}
        </h2>
        {subtitle && (
          <p className="transition-subtitle">{subtitle}</p>
        )}
      </ParallaxSection>
    </section>
  );
}
