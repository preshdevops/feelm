import { Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { isTmdbConfigured } from '../utils/tmdb';
import { isGeminiConfigured } from '../utils/gemini';

export default function Navbar() {
  const { isDark, toggle } = useDarkMode();
  const hasAI = isTmdbConfigured() && isGeminiConfigured();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="content-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Status Badge */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              id="navbar-logo"
              className="flex items-center gap-2 group"
            >
              <span className="text-2xl group-hover:animate-float">🎬</span>
              <span className="font-display font-bold text-xl text-gradient tracking-tight">
                Feelm
              </span>
            </Link>

            {hasAI ? (
              <span id="ai-active-badge" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Active
              </span>
            ) : (
              <span id="demo-mode-badge" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/10 text-gold-light border border-gold/20">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Demo Mode
              </span>
            )}
          </div>
          {/* Dark/Light mode toggle */}
          <button
            id="theme-toggle"
            onClick={toggle}
            className="relative w-14 h-7 rounded-full bg-cinema-700 dark:bg-cinema-700 
                       border border-white/10 transition-colors duration-300
                       hover:border-gold/30 focus:outline-none focus:ring-2 focus:ring-gold/20"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center
                          transition-all duration-300 ease-out
                          ${isDark 
                            ? 'left-0.5 bg-cinema-500' 
                            : 'left-[calc(100%-1.625rem)] bg-gold'}`}
            >
              <span className="text-xs">
                {isDark ? '🌙' : '☀️'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
