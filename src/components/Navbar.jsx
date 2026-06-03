import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isDark, toggle } = useDarkMode();
  const { user, logout, setAuthModalOpen } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cinema-950 border-b border-cinema-700 h-14 flex items-center">
      <div className="content-container w-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          id="navbar-logo"
          className="flex items-center"
        >
          <span className="font-display italic font-semibold text-xl text-cinema-300 tracking-wider">
            Feelm
          </span>
        </Link>

        {/* Right side container */}
        <div className="flex items-center gap-6">
          {/* Watchlist/Auth Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-8 h-8 rounded-full border border-cinema-700 bg-cinema-800 text-cinema-300 flex items-center justify-center font-mono text-sm hover:border-cinema-300 transition-colors cursor-pointer"
                aria-label="User menu"
              >
                {initial}
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-cinema-800 border border-cinema-700 z-20 py-1 font-mono text-xs uppercase tracking-wider">
                    <Link
                      to="/watchlist"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-cinema-400 hover:text-cinema-300 hover:bg-cinema-900 transition-colors"
                    >
                      My Watchlist
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2.5 text-cinema-400 hover:text-cinema-300 hover:bg-cinema-900 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-xs text-accent hover:text-accent-hover transition-colors font-mono uppercase tracking-widest font-semibold cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Dark/Light mode toggle */}
          <button
            id="theme-toggle"
            onClick={toggle}
            className="text-cinema-400 hover:text-white transition-colors duration-200 cursor-pointer p-1"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              // Sun icon for dark mode (click to switch to light)
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // Moon icon for light mode (click to switch to dark)
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
