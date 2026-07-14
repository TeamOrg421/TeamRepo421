import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import MainPage from './components/mainpage'
import Car from './components/Car'
import UserProfile from './components/UserProfile'

import { AuthProvider } from './contexts/AuthContext'


type Page = 'home' | 'login' | 'register' | 'mainpage' | 'car' | 'profile'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)

  const navigate = (page: string, params?: { carId?: number | string }) => {
    setCurrentPage(page as Page)
    if (params && params.carId !== undefined) {
      setSelectedCarId(String(params.carId))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar onNavigate={navigate} />
        <main className="main-content">
          {currentPage === 'home' && <Home onNavigate={navigate} />}
          {currentPage === 'login' && <Login onNavigate={navigate} />}
          {currentPage === 'register' && <Register onNavigate={navigate} />}
          {currentPage === 'mainpage' && <MainPage />}
          {currentPage === 'car' && <Car onNavigate={navigate} carId={selectedCarId} />}
          {currentPage === 'profile' && <UserProfile onNavigate={navigate} />}
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
