import { useState, useEffect } from 'react';

const backdropCache = {};

/**
 * Custom hook to dynamically apply mood color variables and fetch/rotate mood backdrops.
 * @param {Object|null} activeMood - Active mood object from moods array, or null.
 * @returns {{ backdropUrls: string[], currentBackdropUrl: string|null }}
 */
export default function useMoodBackground(activeMood) {
  const [loadedUrls, setLoadedUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Instantly and synchronously set CSS variables on document root
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

  // 2. Fetch, cache, and preload backdrops for active mood
  useEffect(() => {
    if (!activeMood || !activeMood.id) {
      setLoadedUrls([]);
      setCurrentIndex(0);
      return;
    }

    const moodId = activeMood.id;
    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const handleBackdropItems = (items) => {
      if (isCancelled || !items || items.length === 0) {
        setLoadedUrls([]);
        setCurrentIndex(0);
        return;
      }

      setLoadedUrls([]);
      setCurrentIndex(0);

      const urls = items.map((b) => (typeof b === 'string' ? b : b.url)).filter(Boolean);

      urls.forEach((url) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          if (isCancelled) return;
          setLoadedUrls((prev) => {
            if (prev.includes(url)) return prev;
            return [...prev, url];
          });
        };
        img.onerror = () => {
          // Ignore image load failures
        };
      });
    };

    if (backdropCache[moodId]) {
      clearTimeout(timeoutId);
      handleBackdropItems(backdropCache[moodId]);
    } else {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${API_BASE}/movies/mood-backdrop?mood=${encodeURIComponent(moodId)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          clearTimeout(timeoutId);
          if (!res.ok) return { backdrops: [] };
          return res.json();
        })
        .then((data) => {
          if (isCancelled) return;
          const backdrops = data?.backdrops || [];
          backdropCache[moodId] = backdrops;
          handleBackdropItems(backdrops);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          if (!isCancelled) {
            setLoadedUrls([]);
            setCurrentIndex(0);
          }
        });
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeMood?.id]);

  // 3. Rotate backdrops every 7000ms once at least 1 image is loaded
  useEffect(() => {
    if (loadedUrls.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % loadedUrls.length);
    }, 7000);

    return () => clearInterval(intervalId);
  }, [loadedUrls.length]);

  const currentBackdropUrl = loadedUrls.length > 0 ? loadedUrls[currentIndex % loadedUrls.length] : null;

  return {
    backdropUrls: loadedUrls,
    currentBackdropUrl,
  };
}
