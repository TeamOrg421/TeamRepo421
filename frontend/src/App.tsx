import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import AboutPage from './components/AboutPage'
import Car from './components/Car'
import UserProfile from './components/UserProfile'
import AdminCars from './components/AdminCars'
import WatchlistPage from './components/WatchlistPage'
import SettingsPage from './components/SettingsPage'
import SellCar from './components/SellCar'
import SellerDashboard from './components/SellerDashboard'
import ManagerDashboard from './components/ManagerDashboard'
import PublicUserProfilePage from './components/PublicUserProfilePage'
import Footer from './components/Footer'
import Leaderboard from './components/Leaderboard'
import AccountSidebar from './components/AccountSidebar'
import NotFoundPage from './components/NotFoundPage'
import ChatsPage from './components/ChatsPage'
import ManagerListingEditor from './components/ManagerListingEditor'
import ToastHost from './components/ToastHost'

import { AuthProvider } from './contexts/AuthContext'

type Page = 'home' | 'about' | 'leaderboard' | 'login' | 'register' | 'mainpage' | 'car' | 'profile' | 'user-profile' | 'adminCars' | 'watchlist' | 'settings' | 'sellCar' | 'seller' | 'manager' | 'manager-edit-listing' | 'chats' | '404' | 'not-found'
type AuthView = 'login' | 'register-step1' | 'register-step2' | 'forgot' | 'check-email' | 'reset-password' | 'reset-success';
const pageValues = new Set<Page>(['home', 'about', 'leaderboard', 'login', 'register', 'mainpage', 'car', 'profile', 'user-profile', 'adminCars', 'watchlist', 'settings', 'sellCar', 'seller', 'manager', 'manager-edit-listing', 'chats', '404', 'not-found']);

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [authView, setAuthView] = useState<AuthView | null>(null)
  const [catalogSearch, setCatalogSearch] = useState<string>('')
  const [selectedChatListingId, setSelectedChatListingId] = useState<string | null>(null)
  const [selectedManagerListingId, setSelectedManagerListingId] = useState<string | null>(null)

  useEffect(() => {
    const restoreLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const email = params.get('email');
      if (token && email) {
        setCurrentPage('login');
        setAuthView('reset-password');
        return;
      }

      const pageParam = params.get('page');
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const candidate = pageParam || path;
      if (pageValues.has(candidate as Page)) setCurrentPage(candidate as Page);
      const carId = params.get('carId');
      const userId = params.get('userId');
      if (carId) setSelectedCarId(carId);
      if (userId) setSelectedUserId(userId);
    };

    restoreLocation();
    window.addEventListener('popstate', restoreLocation);
    return () => window.removeEventListener('popstate', restoreLocation);
  }, []);

  const navigate = (page: string, params?: { carId?: number | string; userId?: string; auctionId?: string; listingId?: string; authView?: AuthView }) => {
    setCurrentPage(page as Page)
    if (params?.authView) {
      setAuthView(params.authView);
    } else if (page === 'login') {
      setAuthView(null);
    }
    if (params && params.carId !== undefined) {
      setSelectedCarId(String(params.carId))
    }
    if (params?.userId !== undefined) {
      setSelectedUserId(params.userId)
    }
    if (params?.auctionId !== undefined) setSelectedChatListingId(params.auctionId)
    if (params?.listingId !== undefined) setSelectedManagerListingId(params.listingId)
    const query = new URLSearchParams({ page });
    if (params?.carId !== undefined) query.set('carId', String(params.carId));
    if (params?.userId !== undefined) query.set('userId', params.userId);
    window.history.pushState(null, '', `?${query.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar onNavigate={navigate} searchValue={catalogSearch} onSearchChange={setCatalogSearch} currentPage={currentPage} />
        <main className="main-content">
          {currentPage === 'home' && (
            <Home onNavigate={navigate} searchQuery={catalogSearch} />
          )}
          {currentPage === 'login' && <Login onNavigate={navigate} initialAuthView={authView} />}
          {currentPage === 'register' && <Register onNavigate={navigate} />}
          {(currentPage === 'mainpage' || currentPage === 'about') && <AboutPage onNavigate={navigate} />}
          {currentPage === 'leaderboard' && <section className="account-shell"><AccountSidebar currentPage="leaderboard" onNavigate={navigate} /><div className="account-page-content"><Leaderboard onNavigate={navigate} /></div></section>}
          {currentPage === 'car' && <Car onNavigate={navigate} carId={selectedCarId} />}
          {currentPage === 'profile' && <section className="account-shell"><AccountSidebar currentPage="profile" onNavigate={navigate} /><div className="account-page-content"><UserProfile onNavigate={navigate} /></div></section>}
          {currentPage === 'user-profile' && selectedUserId && (
            <PublicUserProfilePage userId={selectedUserId} onBack={() => navigate('leaderboard')} />
          )}
          {currentPage === 'adminCars' && <section className="account-shell"><AccountSidebar currentPage="adminCars" onNavigate={navigate} /><div className="account-page-content"><AdminCars onNavigate={navigate} /></div></section>}
          {currentPage === 'watchlist' && <section className="account-shell"><AccountSidebar currentPage="watchlist" onNavigate={navigate} /><div className="account-page-content"><WatchlistPage onNavigate={navigate} /></div></section>}
          {currentPage === 'settings' && <section className="account-shell"><AccountSidebar currentPage="settings" onNavigate={navigate} /><div className="account-page-content"><SettingsPage onNavigate={navigate} /></div></section>}
          {currentPage === 'sellCar' && <SellCar onNavigate={navigate} />}
          {currentPage === 'seller' && <section className="account-shell"><AccountSidebar currentPage="seller" onNavigate={navigate} /><div className="account-page-content"><SellerDashboard onNavigate={navigate} /></div></section>}
          {currentPage === 'manager' && <section className="account-shell"><AccountSidebar currentPage="manager" onNavigate={navigate} /><div className="account-page-content"><ManagerDashboard onNavigate={navigate} /></div></section>}
          {currentPage === 'manager-edit-listing' && <section className="account-shell"><AccountSidebar currentPage="manager" onNavigate={navigate} /><div className="account-page-content"><ManagerListingEditor listingId={selectedManagerListingId} onBack={() => navigate('manager')} /></div></section>}
          {currentPage === 'chats' && <section className="account-shell"><AccountSidebar currentPage="chats" onNavigate={navigate} /><div className="account-page-content"><ChatsPage initialListingId={selectedChatListingId} /></div></section>}
          {(currentPage === '404' || currentPage === 'not-found') && (
            <NotFoundPage onNavigate={navigate} />
          )}
        </main>
        <Footer onNavigate={navigate} />
        <ToastHost />
      </div>
    </AuthProvider>
  )
}

export default App
