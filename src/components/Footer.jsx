export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="content-container py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎬</span>
            <span className="font-display font-semibold text-gradient">Feelm</span>
          </div>
          <p className="text-sm text-gray-500">
            Mood-based movie recommendations powered by AI.
          </p>
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Feelm. Made with 🍿
          </p>
        </div>
      </div>
    </footer>
  );
}
