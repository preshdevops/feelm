import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setError('');
    setEmail('');
    setPassword('');
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2.5 bg-cinema-950 border border-cinema-700 text-white placeholder-cinema-600 font-body text-sm focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
              required
            />
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
