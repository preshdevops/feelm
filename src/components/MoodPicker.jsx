import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodCard from './MoodCard';
import { moods } from '../utils/moods';

export default function MoodPicker() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [feelingText, setFeelingText] = useState('');
  const [contentType, setContentType] = useState('movie');
  const [energy, setEnergy] = useState(null);
  const [watching, setWatching] = useState(null);
  const [intent, setIntent] = useState(null);
  const navigate = useNavigate();

  const handleMoodClick = (moodId) => {
    setSelectedMood((prev) => (prev === moodId ? null : moodId));
  };

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (selectedMood) params.set('mood', selectedMood);
    params.set('type', contentType);

    const finalFeeling = feelingText.trim();
    if (finalFeeling.trim()) params.set('feeling', finalFeeling.trim());

    if (selectedMood) {
      if (energy) params.set('energy', energy);
      if (watching) params.set('watching', watching);
      if (intent) params.set('intent', intent);
    }

    sessionStorage.removeItem('feelm_results');
    sessionStorage.removeItem('feelm_results_mood');
    sessionStorage.removeItem('feelm_results_feeling');
    sessionStorage.removeItem('feelm_results_type');
    navigate(`/results?${params.toString()}`);
  };

  const isReady = selectedMood || feelingText.trim();

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-8">
      {/* Mood grid as tag wrap */}
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-widest text-cinema-500 font-mono block text-center sm:text-left">
          Select your mood
        </span>
        <div
          id="mood-grid"
          className="flex flex-wrap gap-2.5 justify-center sm:justify-start"
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
      </div>

      {/* Content Type Toggle */}
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-widest text-cinema-500 font-mono block text-center sm:text-left">
          What are you in the mood for?
        </span>
        <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
          {[
            { value: 'movie', label: 'Films' },
            { value: 'series', label: 'Series' },
            { value: 'both', label: 'Both' }
          ].map((opt) => {
            const isSelected = contentType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentType(opt.value)}
                className={`px-4 py-2 text-xs font-body font-medium transition-all duration-200 border cursor-pointer rounded-lg hover:scale-[1.02]
                  ${isSelected
                    ? 'bg-cinema-800 text-accent border-accent'
                    : 'bg-cinema-900 text-cinema-400 border-cinema-700 hover:border-cinema-600 hover:text-cinema-300'
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input for describing vibe */}
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-widest text-cinema-500 font-mono block text-center sm:text-left">
          Or express your vibe
        </span>
        <div className="relative">
          <input
            id="feeling-input"
            type="text"
            value={feelingText}
            onChange={(e) => setFeelingText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isReady && handleSubmit()}
            placeholder="or just tell us how you're feeling..."
            className="minimal-search rounded-lg"
          />
        </div>
      </div>

      {/* Follow-up inline rows if mood selected */}
      {selectedMood && (
        <div className="space-y-6 pt-6 border-t border-cinema-700/50 animate-fade-in">
          {/* Question 1 — Energy check */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-widest text-cinema-500 font-mono">
              How's your energy right now?
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'low', label: 'Running on empty' },
                { value: 'mid', label: 'Somewhere in between' },
                { value: 'high', label: 'Fully charged' }
              ].map((opt) => {
                const isSelected = energy === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEnergy(isSelected ? null : opt.value)}
                    className={`px-4 py-2 text-xs font-body font-medium transition-all duration-200 border cursor-pointer rounded-lg hover:scale-[1.02]
                      ${isSelected 
                        ? 'bg-cinema-800 text-accent border-accent' 
                        : 'bg-cinema-900 text-cinema-400 border-cinema-700 hover:border-cinema-600 hover:text-cinema-300'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2 — Social context */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-widest text-cinema-500 font-mono">
              Watching with...?
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'alone', label: 'Just me' },
                { value: 'partner', label: 'Someone special' },
                { value: 'group', label: 'The whole squad' }
              ].map((opt) => {
                const isSelected = watching === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWatching(isSelected ? null : opt.value)}
                    className={`px-4 py-2 text-xs font-body font-medium transition-all duration-200 border cursor-pointer rounded-lg hover:scale-[1.02]
                      ${isSelected 
                        ? 'bg-cinema-800 text-accent border-accent' 
                        : 'bg-cinema-900 text-cinema-400 border-cinema-700 hover:border-cinema-600 hover:text-cinema-300'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3 — Emotional intent */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-widest text-cinema-500 font-mono">
              What do you need from this film?
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'escape', label: 'Take me somewhere else' },
                { value: 'relate', label: 'Help me feel understood' },
                { value: 'laugh', label: 'Just make me laugh' },
                { value: 'unsure', label: "I don't know yet" }
              ].map((opt) => {
                const isSelected = intent === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIntent(isSelected ? null : opt.value)}
                    className={`px-4 py-2 text-xs font-body font-medium transition-all duration-200 border cursor-pointer rounded-lg hover:scale-[1.02]
                      ${isSelected 
                        ? 'bg-cinema-800 text-accent border-accent' 
                        : 'bg-cinema-900 text-cinema-400 border-cinema-700 hover:border-cinema-600 hover:text-cinema-300'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      {isReady && (
        <div className="text-center sm:text-left pt-2 animate-fade-in">
          <button
            id="find-movie-btn"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center px-8 py-3.5
                       bg-accent hover:bg-accent-hover text-cinema-950 font-body font-semibold text-xs
                       uppercase tracking-widest transition-colors duration-200 rounded-lg cursor-pointer hover:scale-[1.02]"
          >
            Find my film →
          </button>
        </div>
      )}
    </div>
  );
}
