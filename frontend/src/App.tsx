import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import MainPage from './components/mainpage'
import { AuthProvider } from './contexts/AuthContext'

/*
  App
  - Root application component. Wrapped with `AuthProvider` so any component
    can access authentication state via `useAuth()`.
  - Uses simple internal page switching (prototype router). Replace with
    a real router (react-router) in larger apps.
*/

type Page = 'home' | 'login' | 'register' | 'mainpage'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const navigate = (page: string) => {
    setCurrentPage(page as Page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar currentPage={currentPage} onNavigate={navigate} />
        <main className="main-content">
          {currentPage === 'home' && <Home onNavigate={navigate} />}
          {currentPage === 'login' && <Login onNavigate={navigate} />}
          {currentPage === 'register' && <Register onNavigate={navigate} />}
          {currentPage === 'mainpage' && <MainPage />}
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
