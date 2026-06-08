import MoodPicker from '../components/MoodPicker';

export default function Mood() {
  return (
    <div className="page-container min-h-screen flex flex-col justify-center">
      <div className="content-container py-16 md:py-24 space-y-12 animate-fade-in">
        {/* Editorial Header */}
        <div className="text-center sm:text-left space-y-4 max-w-2xl">
          <h1 className="font-display italic font-semibold text-5xl sm:text-6xl text-cinema-300 tracking-tight leading-none">
            How are you feeling?
          </h1>
          <p className="text-cinema-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
            Be honest. The films will be better for it.
          </p>
        </div>

        {/* Mood Picker Component */}
        <div className="pt-2">
          <MoodPicker />
        </div>
      </div>
    </div>
  );
}
