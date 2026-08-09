import MoodPicker from '../components/MoodPicker';
import MoodBackground from '../components/MoodBackground';
import { MoodProvider, useMood } from '../context/MoodContext';
import useMoodBackground from '../hooks/useMoodBackground';

function MoodContent() {
  const { activeMood } = useMood();
  const { currentBackdropUrl } = useMoodBackground(activeMood);

  return (
    <div className="page-container bg-transparent min-h-screen flex flex-col justify-center relative">
      <MoodBackground backdropUrl={currentBackdropUrl} />
      <div className="content-container py-16 md:py-24 space-y-12 animate-fade-in relative z-10">
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

export default function Mood() {
  return (
    <MoodProvider>
      <MoodContent />
    </MoodProvider>
  );
}
