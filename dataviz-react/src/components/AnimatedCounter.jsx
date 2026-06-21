import React, { useState, useEffect, useRef } from 'react';

/**
 * Animated counter that counts up from 0 to a target value.
 * Triggers when scrolled into view using IntersectionObserver.
 */
export default function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  // Start counting when element enters viewport
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasStarted]);

  // Animate count
  useEffect(() => {
    if (!hasStarted) return;

    let startTime = null;
    let frame;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setCount(easedProgress * end);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [hasStarted, end, duration]);

  const displayValue = decimals > 0
    ? count.toFixed(decimals)
    : Math.round(count).toLocaleString();

  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-number">
        {prefix}{displayValue}{suffix}
      </div>
    </div>
  );
}
