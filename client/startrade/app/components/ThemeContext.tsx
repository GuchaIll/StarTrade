'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}

interface ThemeContextProviderProps {
  children: React.ReactNode
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  // Initialize theme synchronously on the first render (client-only).
  // This prevents a flash or sudden flip when returning from an external
  // auth redirect (Auth0) because the initial React render will already
  // reflect the previously persisted theme (from the server-rendered
  // data-theme attribute or localStorage).
  const getInitialTheme = (): ThemeMode => {
    try {
      // Prefer the data-theme attribute if server has provided it
      const attr = typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-theme') as ThemeMode | null) : null
      if (attr === 'light' || attr === 'dark') return attr

      // Then try localStorage
      const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as ThemeMode | null) : null
      if (saved === 'light' || saved === 'dark') return saved

      // Fallback to system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    } catch (e) {
      // ignore and fallback
    }
    return 'light'
  }

  const [mode, setMode] = useState<ThemeMode>(getInitialTheme)

  // Keep a small mounted flag so side-effects run after hydration
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update localStorage, DOM and cookie when mode changes (after mount)
  useEffect(() => {
    if (!isMounted) return

    try {
      localStorage.setItem('theme', mode)
    } catch (e) {
      // ignore
    }

    try {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(mode)
      document.documentElement.setAttribute('data-theme', mode)
    } catch (e) {
      // ignore
    }

    // Persist theme in a cookie so server-side rendering can read it on next request
    try {
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      // Use SameSite=Lax by default; if running on https we can set Secure
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `theme=${mode}; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secure}`
    } catch (e) {
      // ignore
    }
  }, [mode, isMounted])

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}