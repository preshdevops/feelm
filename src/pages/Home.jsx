import { Link } from 'react-router-dom';
import { moods } from '../utils/moods';

function getMoodIcon(id) {
  switch (id) {
    case 'happy':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sad':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 16v4M12 18v4M16 16v4" strokeLinecap="round" />
        </svg>
      );
    case 'stressed':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'romantic':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'adventurous':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'bored':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 1v3M10 1v3M14 1v3" strokeLinecap="round" />
        </svg>
      );
    case 'inspired':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 18h6M10 22h4" strokeLinecap="round" />
        </svg>
      );
    case 'scared':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-cinema-950 flex flex-col">
      {/* Hero section */}
      <section className="film-grain min-h-[calc(100vh-3.5rem)] pt-20 flex flex-col justify-between items-center text-center px-6 md:px-8">
        {/* Empty flex spacer for centering */}
        <div className="flex-1"></div>

        {/* Content */}
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in z-10">
          <h1 className="font-display italic text-6xl sm:text-7xl md:text-8xl lg:text-[110px] tracking-tight leading-[0.95] flex flex-col">
            <span className="text-cinema-300">Cinema that</span>
            <span className="text-accent">feels right.</span>
          </h1>

          <p className="text-cinema-400 font-body text-base sm:text-lg max-w-sm mx-auto leading-relaxed font-light">
            Tell us how you're feeling. We'll find the film.
          </p>

          <div className="pt-4">
            <Link
              to="/mood"
              className="inline-flex items-center justify-center px-10 py-4.5
                         bg-accent hover:bg-accent-hover text-cinema-950 font-body font-semibold text-xs
                         uppercase tracking-widest transition-colors duration-200 rounded-lg cursor-pointer hover:scale-[1.02] shadow-sm"
            >
              Find my film
            </Link>
          </div>
        </div>

        {/* Footer spacer/stats */}
        <div className="flex-1 flex flex-col justify-end w-full max-w-6xl mx-auto pb-12 z-10">
          <div className="border-t border-cinema-700/50 pt-8 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono uppercase tracking-widest text-cinema-500">
              <span>10,000+ films</span>
              <span className="hidden sm:inline">·</span>
              <span>Mood-matched</span>
              <span className="hidden sm:inline">·</span>
              <span>No scrolling</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="content-container py-24 space-y-32">
        {/* How it works section */}
        <section id="how-it-works" className="space-y-16 scroll-mt-24">
          <div className="text-center sm:text-left space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-cinema-500 font-mono">
              The Process
            </h2>
            <p className="font-display italic text-3xl sm:text-4xl text-cinema-300">
              How Feelm works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12">
            {[
              {
                num: '01',
                title: 'Tell us your mood',
                body: 'Pick from 8 psychological emotional states.'
              },
              {
                num: '02',
                title: 'Describe your vibe',
                body: 'Optionally say more in your own words.'
              },
              {
                num: '03',
                title: 'Get your film',
                body: 'Personalised recommendations in seconds.'
              }
            ].map((step, idx) => (
              <div key={idx} className="space-y-4 border-l border-cinema-700/30 pl-6 md:pl-0 md:border-l-0 md:border-t md:pt-6">
                <span className="text-4xl sm:text-5xl font-mono font-light text-accent block leading-none">
                  {step.num}
                </span>
                <h3 className="font-display text-lg text-cinema-300 font-semibold tracking-wide">
                  {step.title}
                </h3>
                <p className="text-sm text-cinema-500 leading-relaxed font-light">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample moods preview section */}
        <section className="space-y-8">
          <div className="text-center sm:text-left space-y-3">
            <span className="text-xs uppercase tracking-widest text-cinema-500 font-mono">
              Vibe Library
            </span>
            <h2 className="font-display italic text-3xl sm:text-4xl text-cinema-300">
              Eight moods. Infinite films.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {moods.map((mood) => (
              <div
                key={mood.id}
                className="flex items-center gap-3 px-5 py-3 border border-cinema-700 bg-cinema-900 text-cinema-400 rounded-lg select-none"
              >
                <span className="text-cinema-500">
                  {getMoodIcon(mood.id)}
                </span>
                <span className="font-body text-[13px] font-medium tracking-wide">
                  {mood.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-cinema-700/50 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono uppercase tracking-widest text-cinema-500">
          <span className="font-display italic font-semibold text-sm text-cinema-400 normal-case">
            Feelm
          </span>
          <span>Built with TMDB & Groq</span>
        </footer>
      </main>
    </div>
  );
}
