import React, { useState, useEffect } from 'react';

/**
 * Fixed vertical progress indicator — dark mode.
 * Reads section IDs from props and tracks scroll position.
 *
 * Props:
 *   sections: Array of { id, label }
 */
export default function ScrollProgress({ sections = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!sections.length) return;

    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.4;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollY) {
          setActiveIdx(i);
          return;
        }
      }
      setActiveIdx(0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleNavigate = (idx) => {
    const el = document.getElementById(sections[idx].id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!sections.length) return null;

  return (
    <nav className="scroll-progress" aria-label="Story progress">
      {sections.map((section, idx) => (
        <div
          key={section.id}
          className={`progress-dot-wrapper ${activeIdx === idx ? 'active' : ''}`}
          onClick={() => handleNavigate(idx)}
          role="button"
          tabIndex={0}
          aria-label={`Navigate to ${section.label}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigate(idx);
            }
          }}
        >
          <span className="progress-label">{section.label}</span>
          <div className="progress-dot" />
        </div>
      ))}
    </nav>
  );
}
