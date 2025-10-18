'use client'
import React, { useMemo } from 'react'
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeContextProvider, useTheme } from './ThemeContext'

const MUIThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = useTheme()
  
  const theme = useMemo(() => createTheme({
    palette: {
      mode: mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9',
      },
      secondary: {
        main: mode === 'light' ? '#dc004e' : '#f48fb1',
      },
      background: {
        default: mode === 'light' ? '#ffffff' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#000000' : '#ffffff',
        secondary: mode === 'light' ? '#666666' : '#b3b3b3',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#121212',
            color: mode === 'light' ? '#000000' : '#ffffff',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
    },
  }), [mode])

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}

interface ThemeProviderProps {
  children: React.ReactNode
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContextProvider>
      <MUIThemeWrapper>
        {children}
      </MUIThemeWrapper>
    </ThemeContextProvider>
  )
}

export default ThemeProvider