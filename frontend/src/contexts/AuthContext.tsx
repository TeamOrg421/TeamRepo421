import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiCall } from '../services/config'

type User = {
  id: string
  email?: string
  name?: string
  profileImageUrl?: string
  roles?: string[]
}

type AuthContextType = {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  roles: string[]
  login: (token: string) => void
  logout: () => void
  updateUser: (updatedUser: Partial<User>) => void
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

  const roleClaim = getClaim(payload, [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ])
  const roles = Array.isArray(roleClaim) ? roleClaim : roleClaim ? [roleClaim] : []

  return {
    email: email || undefined,
    name: name || undefined,
    // ASP.NET maps ClaimTypes.NameIdentifier to `nameid` in many JWTs, while
    // some issuers use `sub`. Supporting both keeps ownership checks and chat
    // alignment stable across existing and newly issued tokens.
    id: getClaim(payload, [
      'sub',
      'nameid',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    ]) || null,
    roles,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const syncProfileFromBackend = async () => {
    try {
      const res = await apiCall('/users/me')
      if (res.ok) {
        const data = await res.json()
        setUser(prev => {
          const updated: User = {
            ...prev,
            id: data.id || prev?.id || '',
            name: data.name || prev?.name,
            profileImageUrl: data.profileImageUrl || prev?.profileImageUrl,
          }
          localStorage.setItem('user', JSON.stringify(updated))
          return updated
        })
        return true
      }
    } catch {
    }
    return false
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch { localStorage.removeItem('user') }
    }
    syncProfileFromBackend().then((restored) => {
      if (restored) setToken('cookie')
    })

    const handleUnauthorized = () => {
      setToken(null)
      setUser(null)
      localStorage.removeItem('user')
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = (newToken: string) => {
    setToken('cookie')
    const userFromToken = getUserFromToken(newToken)
    setUser(userFromToken)
    if (userFromToken) {
      localStorage.setItem('user', JSON.stringify(userFromToken))
    } else {
      localStorage.removeItem('user')
    }
    syncProfileFromBackend()
  }

  const logout = () => {
    void apiCall('/auth/logout', { method: 'POST' })
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null
      const nextUser: User = { ...prev, ...updatedUser }
      localStorage.setItem('user', JSON.stringify(nextUser))
      return nextUser
    })
  }


  const value: AuthContextType = {
    token,
    user,
    isAuthenticated: Boolean(token),
    roles: user?.roles ?? [],
    login,
    logout,
    updateUser,
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
