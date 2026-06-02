import MoodPicker from '../components/MoodPicker';

export default function Home() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial gradient from center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[800px] h-[800px] rounded-full
                          bg-gradient-radial from-gold/5 via-transparent to-transparent" />
          {/* Ambient orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full
                          bg-purple-500/5 blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full
                          bg-gold/5 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 content-container py-24 sm:py-32">
          {/* Hero text */}
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6
                            rounded-full glass text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gold animate-glow" />
              <span>AI-Powered Movie Recommendations</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                           text-white mb-6 text-balance leading-tight">
              Your mood.{' '}
              <span className="text-gradient">Your movie.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Tell us how you feel, and we&apos;ll recommend the perfect film to match your vibe. 
              No more scrolling — just pure, mood-matched cinema.
            </p>
          </div>

          {/* Mood Picker */}
          <MoodPicker />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-gold animate-pulse-soft" />
          </div>
        </div>
      </section>
    </div>
  );
}
