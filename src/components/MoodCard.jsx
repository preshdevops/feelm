function getMoodIcon(id) {
  switch (id) {
    case 'happy':
      // Sun icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sad':
      // Cloud-rain icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 16v4M12 18v4M16 16v4" strokeLinecap="round" />
        </svg>
      );
    case 'stressed':
      // Zap/lightning icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'romantic':
      // Heart icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'adventurous':
      // Compass icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'bored':
      // Coffee cup icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 1v3M10 1v3M14 1v3" stroke-linecap="round" />
        </svg>
      );
    case 'inspired':
      // Lightbulb icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 18h6M10 22h4" stroke-linecap="round" />
        </svg>
      );
    case 'scared':
      // Moon/crescent icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function MoodCard({ mood, isSelected, onClick }) {
  return (
    <button
      id={`mood-${mood.id}`}
      onClick={() => onClick(mood.id)}
      className={`flex items-center gap-3 px-5 py-3 border transition-all duration-200 cursor-pointer rounded-none
        ${isSelected 
          ? 'bg-cinema-300 text-cinema-950 border-cinema-300' 
          : 'bg-transparent text-cinema-400 border-cinema-700 hover:border-cinema-500 hover:text-cinema-300'}`}
    >
      <span className={isSelected ? 'text-accent' : 'text-current'}>
        {getMoodIcon(mood.id)}
      </span>
      <span className="font-body text-sm font-medium tracking-wide">{mood.label}</span>
    </button>
  );
}
