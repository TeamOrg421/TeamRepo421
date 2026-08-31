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
import Footer from './components/Footer'
import Leaderboard from './components/Leaderboard' // Убедитесь, что путь к файлу верный

import { AuthProvider } from './contexts/AuthContext'


type Page = 'home' | "leaderboard" | 'login' | 'register' | 'mainpage' | 'car' | 'profile' | 'adminCars' | 'watchlist' | 'settings' | 'sellCar' | 'seller'
type AuthView = 'login' | 'register-step1' | 'register-step2' | 'forgot' | 'check-email' | 'reset-password' | 'reset-success';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
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

  const navigate = (page: string, params?: { carId?: number | string; authView?: AuthView }) => {
    setCurrentPage(page as Page)
    if (params?.authView) {
      setAuthView(params.authView);
    } else if (page === 'login') {
      setAuthView(null); // Reset authView при переходе на login без специфічного view
    }
    if (params && params.carId !== undefined) {
      setSelectedCarId(String(params.carId))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar onNavigate={navigate} searchValue={catalogSearch} onSearchChange={setCatalogSearch} />
        <main className="main-content">
          {currentPage === 'home' && (
            <Home onNavigate={navigate} searchQuery={catalogSearch} />
          )}
          {currentPage === 'login' && <Login onNavigate={navigate} initialAuthView={authView} />}
          {currentPage === 'register' && <Register onNavigate={navigate} />}
          {currentPage === 'mainpage' && <MainPage />}
          {currentPage === 'leaderboard' && <Leaderboard onNavigate={navigate} />}
          {currentPage === 'car' && <Car onNavigate={navigate} carId={selectedCarId} />}
          {currentPage === 'profile' && <UserProfile onNavigate={navigate} />}
          {currentPage === 'adminCars' && <AdminCars onNavigate={navigate} />}
          {currentPage === 'watchlist' && <WatchlistPage onNavigate={navigate} />}
          {currentPage === 'settings' && <SettingsPage onNavigate={navigate} />}
          {currentPage === 'sellCar' && <SellCar onNavigate={navigate} />}
          {currentPage === 'seller' && <SellerDashboard onNavigate={navigate} />}
        </main>
        <Footer onNavigate={navigate} />
      </div>
    </AuthProvider>
  )
}

export default App
