import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setError('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      handleClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      {/* Modal Card */}
      <div 
        className="w-full max-w-sm bg-cinema-800 border border-cinema-700 p-8 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close trigger top-right */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-xs font-mono text-cinema-500 hover:text-white uppercase tracking-widest transition-colors"
        >
          ✕
        </button>

        {/* Title */}
        <div className="space-y-1.5 text-center sm:text-left">
          <h2 className="font-display italic text-2xl sm:text-3xl text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-xs font-mono text-cinema-500 uppercase tracking-widest">
            to save watchlist & sync vibe
          </p>
        </div>

        {/* Inline Error messages */}
        {error && (
          <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-mono tracking-wide leading-relaxed">
            ✕ {error}
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-cinema-400 block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2.5 bg-cinema-950 border border-cinema-700 text-white placeholder-cinema-600 font-body text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="name@email.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-cinema-400 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="w-full pl-3.5 pr-10 py-2.5 bg-cinema-950 border border-cinema-700 text-white placeholder-cinema-600 font-body text-sm focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cinema-500 hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  // Closed eye SVG
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  // Open eye SVG
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-accent hover:bg-accent-hover text-black font-body font-semibold text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Toggle Form type link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setShowPassword(false);
            }}
            disabled={submitting}
            className="text-xs font-mono text-cinema-400 hover:text-white uppercase tracking-widest transition-colors decoration-dotted underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New to Feelm? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
