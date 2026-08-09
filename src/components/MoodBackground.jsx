export default function MoodBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 transition-all duration-700 ease-in-out"
      style={{
        background: 'radial-gradient(circle at 30% 20%, var(--mood-tint, transparent), transparent 70%)',
      }}
    />
  );
}
