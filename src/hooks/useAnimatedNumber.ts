import { useState, useEffect, useRef } from 'react';

/**
 * Smoothly animates a number from its previous value to a new target value.
 * Uses ease-out cubic easing for a natural, premium feel.
 * The `metaRef` tracks animation state without causing re-renders,
 * allowing seamless mid-animation direction changes.
 */
export function useAnimatedNumber(target: number, duration = 450): number {
  const [displayed, setDisplayed] = useState(target);
  const rafRef = useRef<number | null>(null);
  const metaRef = useRef({ from: target, current: target, target });

  useEffect(() => {
    if (metaRef.current.target === target) return;

    // Start from the current mid-animation value (handles rapid changes gracefully)
    const from = metaRef.current.current;
    metaRef.current = { from, current: from, target };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const t0 = performance.now();

    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = Math.min(elapsed / duration, 1);
      // Ease-out cubic: decelerate as we approach the target
      const eased = 1 - Math.pow(1 - p, 3);
      const value = from + (target - from) * eased;
      metaRef.current.current = value;
      setDisplayed(value);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        metaRef.current.current = target;
        setDisplayed(target);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return displayed;
}
