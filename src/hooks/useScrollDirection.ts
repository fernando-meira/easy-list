'use client';

import { useRef, useState, useEffect } from 'react';

interface UseScrollDirectionOptions {
  threshold?: number;
  bottomOffset?: number;
}

interface UseScrollDirectionResult {
  isNearBottom: boolean;
  isScrollingDown: boolean;
}

export function useScrollDirection({
  threshold = 15,
  bottomOffset = 0,
}: UseScrollDirectionOptions = {}): UseScrollDirectionResult {
  const tickingRef = useRef(false);
  const lastScrollYRef = useRef(0);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    function measure() {
      const scrollY = window.scrollY;
      const reachedBottom =
        scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - bottomOffset;

      setIsNearBottom(reachedBottom);

      const delta = scrollY - lastScrollYRef.current;

      if (Math.abs(delta) > threshold) {
        setIsScrollingDown(delta > 0);
        lastScrollYRef.current = scrollY;
      }
    }

    function handleScroll() {
      if (tickingRef.current) return;

      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        measure();
        tickingRef.current = false;
      });
    }

    lastScrollYRef.current = window.scrollY;
    measure();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      tickingRef.current = false;
    };
  }, [threshold, bottomOffset]);

  return { isNearBottom, isScrollingDown };
}
