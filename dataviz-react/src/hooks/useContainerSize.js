import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that observes a container's size using ResizeObserver.
 * Returns [ref callback, { width, height }]
 */
export default function useContainerSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [node, setNode] = useState(null);

  const ref = useCallback((el) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize(prev => {
          if (prev.width === Math.round(width) && prev.height === Math.round(height)) return prev;
          return { width: Math.round(width), height: Math.round(height) };
        });
      }
    });

    observer.observe(node);

    // Get initial size
    const rect = node.getBoundingClientRect();
    setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });

    return () => observer.disconnect();
  }, [node]);

  return [ref, size];
}
