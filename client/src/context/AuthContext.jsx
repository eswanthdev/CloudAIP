import { createContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('cloudaip_token')
      const storedUser = localStorage.getItem('cloudaip_user')

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          // Verify token is still valid
          const { data } = await apiClient.get('/auth/me')
          setUser(data.user)
          localStorage.setItem('cloudaip_user', JSON.stringify(data.user))
        } catch (error) {
          // Token invalid, clean up
          localStorage.removeItem('cloudaip_token')
          localStorage.removeItem('cloudaip_refresh_token')
          localStorage.removeItem('cloudaip_user')
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      localStorage.setItem('cloudaip_token', data.token)
      if (data.refreshToken) {
        localStorage.setItem('cloudaip_refresh_token', data.refreshToken)
      }
      localStorage.setItem('cloudaip_user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success('Welcome back!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
      return { success: false, message }
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    try {
      const { data } = await apiClient.post('/auth/register', { name, email, password })
      localStorage.setItem('cloudaip_token', data.token)
      if (data.refreshToken) {
        localStorage.setItem('cloudaip_refresh_token', data.refreshToken)
      }
      localStorage.setItem('cloudaip_user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(message)
      return { success: false, message }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cloudaip_token')
    localStorage.removeItem('cloudaip_refresh_token')
    localStorage.removeItem('cloudaip_user')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const updateProfile = useCallback(async (profileData) => {
    try {
      const { data } = await apiClient.put('/auth/profile', profileData)
      setUser(data.user)
      localStorage.setItem('cloudaip_user', JSON.stringify(data.user))
      toast.success('Profile updated!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed.'
      toast.error(message)
      return { success: false, message }
    }
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
