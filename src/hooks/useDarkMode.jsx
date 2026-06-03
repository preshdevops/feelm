import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('feelm_theme');
      if (stored) return stored === 'dark';
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }
    return true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('feelm_theme', isDark ? 'dark' : 'light');
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle };
}
