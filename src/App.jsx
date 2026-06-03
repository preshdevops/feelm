import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Results from './pages/Results';
import MovieDetail from './pages/MovieDetail';
import Watchlist from './pages/Watchlist';
import AuthModal from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WatchlistProvider } from './context/WatchlistContext';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <WatchlistProvider>

        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-cinema-950">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/results" element={<Results />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <AuthModal />
          </div>
        </BrowserRouter>
      </WatchlistProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
