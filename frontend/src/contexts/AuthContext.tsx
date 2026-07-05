import React, { createContext, useContext, useEffect, useState } from 'react'

/*
  AuthContext
  - Centralized authentication context for the SPA.
  - Stores JWT token in localStorage (for this prototype) and exposes
    `login(token)` and `logout()` helpers.
  - Parses common JWT claims to extract `name` and `email` for UI display.
  - NOTE: For production consider storing tokens in httpOnly cookies
    and using refresh tokens to improve security (avoid localStorage XSS risk).
*/

type User = {
  email?: string
  name?: string
}

type AuthContextType = {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const parseJwt = (token: string) => {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const json = decodeURIComponent(
      decoded
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const getClaim = (payload: any, keys: string[]) => {
  if (!payload) return null
  for (const k of keys) {
    if (payload[k]) return payload[k]
  }
  // also try case-insensitive search
  const lower = Object.keys(payload).reduce((acc: any, key) => {
    acc[key.toLowerCase()] = payload[key]
    return acc
  }, {})
  for (const k of keys) {
    const v = lower[k.toLowerCase()]
    if (v) return v
  }
  return null
}

const getUserFromToken = (token: string): User | null => {
  const payload = parseJwt(token)
  if (!payload) {
    return null
  }

  const name = getClaim(payload, [
    'name',
    'unique_name',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    'Name',
  ])

  const email = getClaim(payload, [
    'email',
    'Email',
    'unique_name',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  ])

  return {
    email: email || undefined,
    name: name || undefined,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      setUser(getUserFromToken(savedToken))
    }
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(getUserFromToken(newToken))
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
