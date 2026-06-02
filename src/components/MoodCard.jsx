export default function MoodCard({ mood, isSelected, onClick }) {
  return (
    <button
      id={`mood-${mood.id}`}
      onClick={() => onClick(mood.id)}
      className={`mood-card group ${isSelected ? 'selected' : ''}`}
    >
      {/* Gradient glow background on hover */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mood.color} 
                    opacity-0 group-hover:opacity-10 transition-opacity duration-300
                    ${isSelected ? 'opacity-15' : ''}`}
      />

      {/* Emoji */}
      <span className="text-3xl sm:text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300">
        {mood.emoji}
      </span>

      {/* Label */}
      <span className="text-sm sm:text-base font-medium text-gray-300 group-hover:text-white 
                        relative z-10 transition-colors duration-300">
        {mood.label}
      </span>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center animate-scale-in">
          <svg className="w-3 h-3 text-cinema-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
