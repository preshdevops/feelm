export default function MoodCard({ mood, isSelected, onClick }) {
  return (
    <button
      id={`mood-${mood.id}`}
      onClick={() => onClick(mood.id)}
      className={`px-5 py-2.5 text-sm font-body font-medium transition-all duration-200 cursor-pointer tracking-wide
        ${isSelected 
          ? 'bg-white text-black border-white' 
          : 'bg-transparent text-cinema-400 border-cinema-700 hover:border-cinema-500 hover:text-white'}`}
    >
      <span className="mr-1.5">{mood.emoji}</span>
      <span>{mood.label}</span>
    </button>
  );
}
