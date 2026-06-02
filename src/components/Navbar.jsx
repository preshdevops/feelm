import { Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Navbar() {
  const { isDark, toggle } = useDarkMode();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="content-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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

          {/* Right side */}
          <div className="flex items-center gap-4">
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
      </div>
    </nav>
  );
}
