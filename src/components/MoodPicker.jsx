import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodCard from './MoodCard';
import { moods } from '../utils/moods';

export default function MoodPicker() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [feelingText, setFeelingText] = useState('');
  const navigate = useNavigate();

  const handleMoodClick = (moodId) => {
    setSelectedMood((prev) => (prev === moodId ? null : moodId));
  };

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (selectedMood) params.set('mood', selectedMood);
    if (feelingText.trim()) params.set('feeling', feelingText.trim());
    navigate(`/results?${params.toString()}`);
  };

  const isReady = selectedMood || feelingText.trim();

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      {/* Section header */}
      <div className="text-center mb-8">
        <h2 className="section-title mb-3">How are you feeling?</h2>
        <p className="text-gray-400 text-lg font-light">
          Pick a mood or describe your vibe — we'll find the perfect film.
        </p>
      </div>

      {/* Mood grid */}
      <div
        id="mood-grid"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
      >
        {moods.map((mood) => (
          <MoodCard
            key={mood.id}
            mood={mood}
            isSelected={selectedMood === mood.id}
            onClick={handleMoodClick}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Text input */}
      <div className="mb-8">
        <label htmlFor="feeling-input" className="sr-only">
          Describe how you're feeling
        </label>
        <div className="relative">
          <input
            id="feeling-input"
            type="text"
            value={feelingText}
            onChange={(e) => setFeelingText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isReady && handleSubmit()}
            placeholder="Or just tell us how you're feeling..."
            className="input-field pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            💬
          </div>
        </div>
      </div>

      {/* CTA button */}
      <div className="text-center">
        <button
          id="find-movie-btn"
          onClick={handleSubmit}
          disabled={!isReady}
          className={`btn-primary text-base sm:text-lg px-10 py-4
                     ${!isReady 
                       ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-none' 
                       : ''}`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span>🎬</span>
            <span>Find My Movie</span>
          </span>
        </button>
      </div>
    </div>
  );
}
