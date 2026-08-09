import { useEffect } from 'react';

/**
 * Custom hook to dynamically apply mood color custom properties to the document root element.
 * @param {Object|null} activeMood - The active mood object from moods array, or null.
 */
export default function useMoodBackground(activeMood) {
  useEffect(() => {
    const root = document.documentElement;

    if (activeMood) {
      root.style.setProperty('--mood-tint', activeMood.ambientTint || 'transparent');
      root.style.setProperty('--mood-accent', activeMood.accentColor || '#e50914');
    } else {
      root.style.setProperty('--mood-tint', 'transparent');
      root.style.setProperty('--mood-accent', '#e50914');
    }
  }, [activeMood]);
}
