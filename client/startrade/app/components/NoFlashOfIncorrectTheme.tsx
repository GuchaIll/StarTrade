'use client'
import { useEffect } from 'react'

export const NoFlashOfIncorrectTheme = () => {
  useEffect(() => {
    // Remove transition suppression class after hydration
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition-disable')
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}

export default NoFlashOfIncorrectTheme