import MoodPicker from '../components/MoodPicker';

export default function Home() {
  return (
    <div className="page-container flex flex-col justify-center min-h-[90vh]">
      <div className="content-container py-16 md:py-24 space-y-12 md:space-y-16">
        {/* Editorial Hero Header */}
        <div className="text-center sm:text-left space-y-6 animate-fade-in max-w-3xl">
          <h1 className="font-display italic font-semibold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-cinema-300 tracking-tight leading-none">
            Your mood.<br className="hidden sm:inline" />
            <span className="text-accent"> Your movie.</span>
          </h1>

          <p className="text-cinema-400 font-body text-base sm:text-lg max-w-md leading-relaxed font-light">
            Select how you are feeling or write your vibe to match with films. A minimalist curation of cinema.
          </p>
        </div>

        {/* Mood Picker Component */}
        <div className="pt-4">
          <MoodPicker />
        </div>
      </div>
    </div>
  );
}
