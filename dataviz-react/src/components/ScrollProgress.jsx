import React from 'react';

/**
 * Fixed vertical progress indicator on the right side.
 * Shows chapter dots with labels on hover, highlights active chapter.
 * Click-to-navigate to any chapter.
 */

const CHAPTERS = [
  { id: 'paradox', label: 'The Paradox' },
  { id: 'tides', label: 'Rising Tides' },
  { id: 'economic', label: 'Economic Toll' },
  { id: 'rainfall', label: 'Rainfall Shifts' },
  { id: 'data-gaps', label: 'Data Gaps' },
];

export default function ScrollProgress({ activeStep, onNavigate }) {
  return (
    <nav className="scroll-progress" aria-label="Story progress">
      {CHAPTERS.map((chapter, idx) => (
        <div
          key={chapter.id}
          className={`progress-dot-wrapper ${activeStep === idx ? 'active' : ''}`}
          onClick={() => onNavigate && onNavigate(idx)}
          role="button"
          tabIndex={0}
          aria-label={`Navigate to ${chapter.label}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate && onNavigate(idx);
            }
          }}
        >
          <span className="progress-label">{chapter.label}</span>
          <div className="progress-dot" />
        </div>
      ))}
    </nav>
  );
}
