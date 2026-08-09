import { useState, useEffect } from 'react';

/**
 * MoodBackground component that always renders instant --mood-tint color gradient base layer
 * and smoothly crossfades backdrop image layers when available.
 * @param {string|null} backdropUrl - Currently active rotated backdrop URL or null
 */
export default function MoodBackground({ backdropUrl = null }) {
  const [currentUrl, setCurrentUrl] = useState(backdropUrl);
  const [prevUrl, setPrevUrl] = useState(null);
  const [isCrossfading, setIsCrossfading] = useState(false);

  useEffect(() => {
    if (backdropUrl !== currentUrl) {
      setPrevUrl(currentUrl);
      setCurrentUrl(backdropUrl);
      setIsCrossfading(true);

      const timer = setTimeout(() => {
        setIsCrossfading(false);
        setPrevUrl(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [backdropUrl, currentUrl]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 1. Instant flat color / ambient tint base layer */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          background: 'radial-gradient(circle at 30% 20%, var(--mood-tint, transparent), transparent 70%)',
        }}
      />

      {/* 2. Blurred image double-buffer crossfade layers (only rendered when image layer is present) */}
      {(currentUrl || prevUrl) && (
        <div className="absolute inset-0 transition-opacity duration-1000">
          {/* Previous image (fading out) */}
          {prevUrl && (
            <div
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-115 filter blur-[60px] ${
                isCrossfading ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ backgroundImage: `url("${prevUrl}")` }}
            />
          )}

          {/* Current image (fading in) */}
          {currentUrl && (
            <div
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-115 filter blur-[60px] ${
                isCrossfading ? 'opacity-100' : 'opacity-100'
              }`}
              style={{ backgroundImage: `url("${currentUrl}")` }}
            />
          )}

          {/* Dark scrim + soft-light color overlay */}
          <div className="absolute inset-0 bg-cinema-950/65 mix-blend-multiply" />
          <div
            className="absolute inset-0 mix-blend-soft-light opacity-50"
            style={{
              background: 'radial-gradient(circle at 50% 30%, var(--mood-tint, transparent), transparent 80%)',
            }}
          />
        </div>
      )}
    </div>
  );
}
