import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

gsap.registerPlugin(ScrollTrigger);

/**
 * HeroSection — Full-screen dark hero with neon glow title.
 *
 * Props:
 *   totalCountries: number
 *   totalLoss: number (in USD)
 *   totalAffected: number
 */
export default function HeroSection({ totalCountries = 10, totalLoss = 0, totalAffected = 0 }) {
  const heroRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const content = contentRef.current;
    if (!hero || !content) return;

    // Parallax: content fades out and moves up on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });

    tl.to(content, { y: -80, opacity: 0, ease: 'none' });

    return () => {
      ScrollTrigger.getAll()
        .filter(t => t.trigger === hero)
        .forEach(t => t.kill());
    };
  }, []);

  const handleScrollDown = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section className="hero-section" ref={heroRef}>
      <div className="hero-content" ref={contentRef}>
        <div className="hero-eyebrow">Pacific Islands Data Visualization</div>

        <h1 className="hero-title">
          The <span className="accent">Sinking</span>{' '}
          <span className="italic">Voices</span>
          <br />
          of the Pacific
        </h1>

        <p className="hero-subtitle">
          Millions of Pacific Islanders face rising seas, shattered seasons, and
          economic devastation — despite contributing almost nothing to global
          emissions. This is their data, their story.
        </p>

        <div className="hero-divider" />

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">
              <AnimatedCounter end={totalCountries} duration={1500} />
            </div>
            <div className="stat-label">Nations at Risk</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" style={{ color: 'var(--accent-coral)' }}>
              $<AnimatedCounter end={Math.round(totalLoss / 1e6)} duration={2000} />M
            </div>
            <div className="stat-label">Economic Losses</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" style={{ color: 'var(--accent-amber)' }}>
              <AnimatedCounter end={Math.round(totalAffected / 1e3)} duration={2000} />K
            </div>
            <div className="stat-label">People Affected</div>
          </div>
        </div>
      </div>

      <div className="scroll-indicator" onClick={handleScrollDown}>
        <span>Scroll to explore</span>
        <ChevronDown size={20} />
      </div>
    </section>
  );
}
