import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import MainPage from './components/mainpage'
import Car from './components/Car'
import UserProfile from './components/UserProfile'
import AdminCars from './components/AdminCars'
import WatchlistPage from './components/WatchlistPage'
import SettingsPage from './components/SettingsPage'
import SellCar from './components/SellCar'
import SellerDashboard from './components/SellerDashboard'
import ManagerDashboard from './components/ManagerDashboard'
import AuctionReviewPage from './components/AuctionReviewPage'
import PublicUserProfilePage from './components/PublicUserProfilePage'
import Footer from './components/Footer'
import Leaderboard from './components/Leaderboard'
import AccountSidebar from './components/AccountSidebar'

import { AuthProvider } from './contexts/AuthContext'

type Page = 'home' | 'about' | 'leaderboard' | 'login' | 'register' | 'mainpage' | 'car' | 'profile' | 'user-profile' | 'adminCars' | 'watchlist' | 'settings' | 'sellCar' | 'seller' | 'manager' | 'auction-review'
type AuthView = 'login' | 'register-step1' | 'register-step2' | 'forgot' | 'check-email' | 'reset-password' | 'reset-success';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [authView, setAuthView] = useState<AuthView | null>(null)
  const [catalogSearch, setCatalogSearch] = useState<string>('')

  useEffect(() => {
    // Перевіримо URL параметри при завантаженні
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    // Якщо є параметри для скидання пароля, перейдемо на сторінку login
    if (token && email) {
      setCurrentPage('login');
      setAuthView('reset-password');
    }
  }, []);

  const navigate = (page: string, params?: { carId?: number | string; auctionId?: string; userId?: string; authView?: AuthView }) => {
    setCurrentPage(page as Page)
    if (params?.authView) {
      setAuthView(params.authView);
    } else if (page === 'login') {
      setAuthView(null);
    }
    if (params && params.carId !== undefined) {
      setSelectedCarId(String(params.carId))
    }
    if (params?.auctionId !== undefined) {
      setSelectedAuctionId(params.auctionId)
    }
    if (params?.userId !== undefined) {
      setSelectedUserId(params.userId)
    }
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
          {(currentPage === 'mainpage' || currentPage === 'about') && <MainPage onNavigate={navigate} />}
          {currentPage === 'leaderboard' && <section className="account-shell"><AccountSidebar currentPage="leaderboard" onNavigate={navigate} /><div className="account-page-content"><Leaderboard onNavigate={navigate} /></div></section>}
          {currentPage === 'car' && <Car onNavigate={navigate} carId={selectedCarId} />}
          {currentPage === 'profile' && <UserProfile onNavigate={navigate} />}
          {currentPage === 'user-profile' && selectedUserId && (
            <PublicUserProfilePage userId={selectedUserId} onBack={() => navigate('home')} />
          )}
          {currentPage === 'adminCars' && <section className="account-shell"><AccountSidebar currentPage="adminCars" onNavigate={navigate} /><div className="account-page-content"><AdminCars onNavigate={navigate} /></div></section>}
          {currentPage === 'watchlist' && <section className="account-shell"><AccountSidebar currentPage="watchlist" onNavigate={navigate} /><div className="account-page-content"><WatchlistPage onNavigate={navigate} /></div></section>}
          {currentPage === 'settings' && <section className="account-shell"><AccountSidebar currentPage="settings" onNavigate={navigate} /><div className="account-page-content"><SettingsPage onNavigate={navigate} /></div></section>}
          {currentPage === 'sellCar' && <SellCar onNavigate={navigate} />}
          {currentPage === 'seller' && <section className="account-shell"><AccountSidebar currentPage="seller" onNavigate={navigate} /><div className="account-page-content"><SellerDashboard onNavigate={navigate} /></div></section>}
          {currentPage === 'manager' && <section className="account-shell"><AccountSidebar currentPage="manager" onNavigate={navigate} /><div className="account-page-content"><ManagerDashboard onNavigate={navigate} /></div></section>}
          {currentPage === 'auction-review' && selectedAuctionId ? (
            <AuctionReviewPage auctionId={selectedAuctionId} onBack={() => navigate('manager')} onNavigate={navigate} />
          ) : currentPage === 'auction-review' ? (
            <div className="manager-reference-empty">The auction could not be opened because its ID is missing.</div>
          ) : null}
        </main>
        <Footer onNavigate={navigate} />
      </div>
    </AuthProvider>
  )
}

export default App
