import React, { useEffect, useRef } from 'react';

/**
 * Canvas-based subtle floating dots — white minimalist theme.
 * Barely perceptible — adds gentle life without distracting.
 */
export default function ParticleBackground({ scrollProgress = 0 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const scrollRef = useRef(scrollProgress);

  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = Math.min(50, Math.floor(width * height / 30000));
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speedY: -(Math.random() * 0.12 + 0.04),
        speedX: (Math.random() - 0.5) * 0.08,
        opacity: Math.random() * 0.06 + 0.02,
        hue: 174 + Math.random() * 20,
        sat: 15 + Math.random() * 25,
        light: 65 + Math.random() * 20,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const progress = scrollRef.current;
      const speedMultiplier = 1 + progress * 1.2;
      const sway = Math.sin(Date.now() * 0.0008) * (0.3 + progress * 0.5);

      for (const p of particles) {
        p.y += p.speedY * speedMultiplier;
        p.x += (p.speedX + sway * 0.02) * speedMultiplier;

        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const alpha = Math.min(p.opacity * (1 + progress * 0.3), 0.12);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}
