import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ParallaxSection — GSAP ScrollTrigger wrapper for scroll-driven animations.
 *
 * Props:
 *   animation: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideLeft' | 'slideRight'
 *   delay: number (seconds)
 *   duration: number (seconds)
 *   scrub: boolean | number — if true, animation is tied to scroll position
 *   className: string
 *   style: object
 *   children: ReactNode
 *
 * Fix (2.0): Uses gsap.fromTo() with explicit from/to states and
 * ScrollTrigger.refresh() to prevent narrative text from disappearing
 * after layout changes.
 */

const ANIMATION_PRESETS = {
  fadeUp: { from: { y: 60, opacity: 0 }, to: { y: 0, opacity: 1 } },
  fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
  scaleIn: { from: { scale: 0.92, opacity: 0 }, to: { scale: 1, opacity: 1 } },
  slideLeft: { from: { x: -80, opacity: 0 }, to: { x: 0, opacity: 1 } },
  slideRight: { from: { x: 80, opacity: 0 }, to: { x: 0, opacity: 1 } },
};

export default function ParallaxSection({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 1.2,
  scrub = false,
  className = '',
  style = {},
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const preset = ANIMATION_PRESETS[animation] || ANIMATION_PRESETS.fadeUp;

    // Set explicit initial state immediately so content is hidden before scroll
    gsap.set(el, preset.from);

    const tween = gsap.fromTo(el, preset.from, {
      ...preset.to,
      delay,
      duration,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 35%',
        scrub: scrub === true ? 1 : scrub || false,
        toggleActions: scrub ? undefined : 'play none none none',
        invalidateOnRefresh: true,
      },
    });

    // Refresh ScrollTrigger after a short delay to account for layout shifts
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      tween.kill();
      ScrollTrigger.getAll()
        .filter(t => t.trigger === el)
        .forEach(t => t.kill());
    };
  }, [animation, delay, duration, scrub]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
