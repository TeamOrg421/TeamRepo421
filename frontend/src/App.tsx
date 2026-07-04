import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'

type Page = 'home' | 'login' | 'register'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const navigate = (page: string) => {
    setCurrentPage(page as Page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-container">
      <Navbar currentPage={currentPage} onNavigate={navigate} />
      <main className="main-content">
        {currentPage === 'home' && <Home onNavigate={navigate} />}
        {currentPage === 'login' && <Login onNavigate={navigate} />}
        {currentPage === 'register' && <Register onNavigate={navigate} />}
      </main>
    </div>
  )
}

export default App
