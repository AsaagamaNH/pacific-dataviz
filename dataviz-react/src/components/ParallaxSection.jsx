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
 */

const ANIMATION_PRESETS = {
  fadeUp: { y: 60, opacity: 0 },
  fadeIn: { opacity: 0 },
  scaleIn: { scale: 0.92, opacity: 0 },
  slideLeft: { x: -80, opacity: 0 },
  slideRight: { x: 80, opacity: 0 },
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

    const fromVars = ANIMATION_PRESETS[animation] || ANIMATION_PRESETS.fadeUp;

    const tween = gsap.from(el, {
      ...fromVars,
      delay,
      duration,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 35%',
        scrub: scrub === true ? 1 : scrub || false,
        toggleActions: scrub ? undefined : 'play none none none',
      },
    });

    return () => {
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
