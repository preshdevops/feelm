import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodCard from './MoodCard';
import { moods } from '../utils/moods';

export default function MoodPicker() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [feelingText, setFeelingText] = useState('');
  const [avoidFilters, setAvoidFilters] = useState([]);
  const [eraFilter, setEraFilter] = useState('Either');
  const navigate = useNavigate();

  const handleMoodClick = (moodId) => {
    setSelectedMood((prev) => (prev === moodId ? null : moodId));
  };

  const toggleAvoidFilter = (filter) => {
    setAvoidFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((item) => item !== filter)
        : [...prev, filter]
    );
  };

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (selectedMood) params.set('mood', selectedMood);

    // Dynamic prompt construction to pass selections cleanly to Gemini/TMDB
    let finalFeeling = feelingText.trim();
    if (avoidFilters.length > 0) {
      finalFeeling += `${finalFeeling ? '. ' : ''}Strictly avoid these elements: ${avoidFilters.join(', ')}`;
    }
    if (eraFilter !== 'Either') {
      finalFeeling += `${finalFeeling ? '. ' : ''}Only recommend films that are: ${
        eraFilter === 'New' ? 'released after 2015 (Modern)' : 'released before 2000 (Classic)'
      }`;
    }

    if (finalFeeling.trim()) params.set('feeling', finalFeeling.trim());
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
            className="minimal-search"
          />
        </div>
      </div>

      {/* Follow-up inline rows if mood selected */}
      {selectedMood && (
        <div className="space-y-6 pt-2 border-t border-white/5 animate-fade-in">
          {/* Avoid row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-widest text-cinema-400 font-mono">
              Anything to avoid?
            </span>
            <div className="flex flex-wrap gap-2">
              {['Violence', 'Romance', 'Horror', 'Animation'].map((filter) => {
                const isSelected = avoidFilters.includes(filter);
                return (
                  <button
                    key={filter}
                    onClick={() => toggleAvoidFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-body font-medium transition-all duration-200 border cursor-pointer
                      ${isSelected 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-cinema-400 border-cinema-700 hover:border-cinema-500 hover:text-white'}`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Era row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-widest text-cinema-400 font-mono">
              New or classic?
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'New', label: 'New (post 2015)' },
                { value: 'Classic', label: 'Classic (pre 2000)' },
                { value: 'Either', label: 'Either' }
              ].map((opt) => {
                const isSelected = eraFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setEraFilter(opt.value)}
                    className={`px-3 py-1.5 text-xs font-body font-medium transition-all duration-200 border cursor-pointer
                      ${isSelected 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-cinema-400 border-cinema-700 hover:border-cinema-500 hover:text-white'}`}
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
                       bg-accent hover:bg-accent-hover text-black font-body font-semibold text-sm
                       uppercase tracking-widest transition-colors duration-300"
          >
            Find my film →
          </button>
        </div>
      )}
    </div>
  );
}
