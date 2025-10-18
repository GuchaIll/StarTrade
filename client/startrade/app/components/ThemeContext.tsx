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
  const [mode, setMode] = useState<ThemeMode>('light')
  const [isInitialized, setIsInitialized] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    // Check if theme is already set by the script
    const currentTheme = document.documentElement.getAttribute('data-theme') as ThemeMode
    if (currentTheme) {
      setMode(currentTheme)
    } else {
      // Fallback if script didn't run
      const savedTheme = localStorage.getItem('theme') as ThemeMode
      if (savedTheme) {
        setMode(savedTheme)
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setMode(prefersDark ? 'dark' : 'light')
      }
    }
    setIsInitialized(true)
  }, [])

  // Update localStorage and document class when mode changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return
    
    localStorage.setItem('theme', mode)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode, isInitialized])

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}