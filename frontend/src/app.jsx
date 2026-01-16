import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader } from 'lucide-react';
import Navbar from './components/UI/Navbar';
import Footer from './components/Layout/Footer';
import HomePage from './components/Pages/HomePage';
import LoginPage from './components/Pages/LoginPage';
import SignupSelection from './components/Pages/SignupSelection';
import ClientSignup from './components/Pages/ClientSignup';
import CoiffeurSignup from './components/Pages/CoiffeurSignup';
import SearchPage from './components/Pages/SearchPage';
import MapPage from './components/Pages/MapPage';
import ProfilePage from './components/Pages/ProfilePage';
import ReservationPage from './components/Pages/ReservationPage';
import DeplacementRequestPage from './components/Pages/DeplacementRequestPage';
import CoiffeurDashboard from './components/Pages/CoiffeurDashboard';

// Composant principal avec accès au contexte
const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [currentStylistId, setCurrentStylistId] = useState(null);

  const navigate = (page, id = null) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(page);
    if (id) setCurrentStylistId(id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('home');
  };

  // Afficher un loader pendant la vérification de session
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Loader className="w-6 h-6 text-pink-500 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-pink-500/30 selection:text-white overflow-x-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar user={user} onNavigate={navigate} onLogout={handleLogout} />

        <main className="flex-grow pt-20 md:pt-24">
          {/* ROUTER SWITCH */}
          {currentPage === 'home' && <HomePage onNavigate={navigate} />}
          {currentPage === 'login' && <LoginPage onNavigate={navigate} />}
          {currentPage === 'signup' && <SignupSelection onNavigate={navigate} />}
          {currentPage === 'signup-client' && <ClientSignup onNavigate={navigate} />}
          {currentPage === 'signup-coiffeur' && <CoiffeurSignup onNavigate={navigate} />}
          {currentPage === 'search' && <SearchPage onNavigate={navigate} />}
          {currentPage === 'profile' && <ProfilePage stylistId={currentStylistId} onNavigate={navigate} currentUser={user} />}
          {currentPage === 'reservation' && <ReservationPage stylistId={currentStylistId} onNavigate={navigate} currentUser={user} />}
          {currentPage === 'request-mobile' && <DeplacementRequestPage onNavigate={navigate} />}
          {currentPage === 'map' && <MapPage onNavigate={navigate} />}
          {currentPage === 'dashboard' && user?.type === 'coiffeur' && (
            <CoiffeurDashboard user={user} onNavigate={navigate} />
          )}
        </main>

        <Footer />
      </div>

      <style jsx global>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
        @keyframes shine { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-shine { animation: shine 2s infinite; }
        .preserve-3d { transform-style: preserve-3d; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #333; border-radius: 4px; }
      `}</style>
    </div>
  );
};

// Wrapper avec AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;