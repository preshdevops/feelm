import { Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Navbar() {
  const { isDark, toggle } = useDarkMode();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cinema-950 border-b border-white/10 h-14 flex items-center">
      <div className="content-container w-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          id="navbar-logo"
          className="flex items-center"
        >
          <span className="font-display italic font-semibold text-xl text-white tracking-wider">
            Feelm
          </span>
        </Link>

        {/* Dark/Light mode toggle */}
        <button
          id="theme-toggle"
          onClick={toggle}
          className="text-xs text-cinema-500 hover:text-white transition-colors duration-200 uppercase tracking-widest font-mono"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? 'LIGHT' : 'DARK'}
        </button>
      </div>
    </nav>
  );
}
