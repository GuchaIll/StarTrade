'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useTheme } from './ThemeContext'
import { useAuth0 } from '@auth0/auth0-react'

const Navbar = () => {
  const { mode } = useTheme()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Persist theme synchronously: localStorage, DOM and cookie
  const persistTheme = (themeMode: 'light' | 'dark') => {
    try {
      localStorage.setItem('theme', themeMode)
    } catch (e) {
      // ignore
    }
    try {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(themeMode)
      document.documentElement.setAttribute('data-theme', themeMode)
    } catch (e) {
      // ignore
    }
    try {
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `theme=${themeMode}; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secure}`
    } catch (e) {
      // ignore
    }
  }

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu)
  }
  return (
    <div>
      <div className={`navbar relative flex h-[calc(100vh-2rem)] w-full max-w-[20rem] flex-col rounded-xl bg-clip-border p-4 shadow-xl ${mode === 'dark' ? 'dark' : 'light'}`}>
        <div className="p-4 mb-2">
          <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal">
            OrbitalPortfolio
          </h5>
        </div>
        <nav className="flex min-w-[240px] flex-col gap-1 p-2 font-sans text-base font-normal">
    <div className="relative block w-full">
      <Link href="/home">
        <div role="button"
          className="navbar-section flex items-center w-full p-0 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer">
          <button type="button"
            className="flex items-center justify-between w-full p-3 font-sans text-xl antialiased font-semibold leading-snug text-left transition-colors border-b-0 select-none cursor-pointer">
            <div className="grid mr-4 place-items-center">
              
            </div>
            <p className="block mr-auto font-sans text-base antialiased font-normal leading-relaxed">
              Home
            </p>
            <span className="ml-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5"
                stroke="currentColor" aria-hidden="true" className="w-4 h-4 mx-auto transition-transform rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path>
              </svg>
            </span>
          </button>
        </div>
      </Link>
      <Link href="/agent">
        <div role="button"
          className="navbar-section flex items-center w-full p-0 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer">
          <button type="button"
            className="flex items-center justify-between w-full p-3 font-sans text-xl antialiased font-semibold leading-snug text-left transition-colors border-b-0 select-none cursor-pointer">
            <div className="grid mr-4 place-items-center">
             
            </div>
            <p className="block mr-auto font-sans text-base antialiased font-normal leading-relaxed">
              Agent
            </p>
            <span className="ml-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5"
                stroke="currentColor" aria-hidden="true" className="w-4 h-4 mx-auto transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path>
              </svg>
            </span>
          </button>
        </div>
      </Link>
      <div className="overflow-hidden">
        <div className="block w-full py-1 font-sans text-sm antialiased font-light leading-normal">
          <nav className="flex min-w-[240px] flex-col gap-1 p-0 font-sans text-base font-normal">
            
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => toggleDropdown('analytics')}
                  aria-expanded={openDropdown === 'analytics'}
                  className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer"
                >
                  <div className="grid mr-4 place-items-center">
                    
                  </div>
                  Analytics
                  <span className="ml-auto">
                    <svg
                      className={`w-4 h-4 transform transition-transform ${openDropdown === 'analytics' ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>

                {openDropdown === 'analytics' && (
                  <div className="ml-8 mt-1 flex flex-col space-y-1">
                    <Link href="/analysis" className="pl-2 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800">Analysis</Link>
                    <Link href="/analysis/graph" className="pl-2 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800">Graph</Link>
                  </div>
                )}
              </div>
            
           
            
          </nav>
        </div>
      </div>
    </div>
    <div className="relative block w-full">
      
      <div className="overflow-hidden">
        <div className="block w-full py-1 font-sans text-sm antialiased font-light leading-normal">
          <nav className="flex min-w-[240px] flex-col gap-1 p-0 font-sans text-base font-normal">
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => toggleDropdown('portfolio')}
                aria-expanded={openDropdown === 'portfolio'}
                className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer"
              >
                <div className="grid mr-4 place-items-center">
                  
                </div>
                Portfolio
                <span className="ml-auto">
                  <svg
                    className={`w-4 h-4 transform transition-transform ${openDropdown === 'portfolio' ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              {openDropdown === 'portfolio' && (
                <div className="ml-8 mt-1 flex flex-col space-y-1">
                  <Link href="/portfolio/overview" className="pl-2 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800">Overview</Link>
                  <Link href="/portfolio/inventory" className="pl-2 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800">Inventory</Link>
                </div>
              )}
            </div>
            <Link href="/explore">
              <div role="button"
                className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer">
                <div className="grid mr-4 place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3"
                    stroke="currentColor" aria-hidden="true" className="w-5 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path>
                  </svg>
                </div>
                Explore
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </div>
    
    <Link href="/profile">
      <div role="button"
        className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer">
        <div className="grid mr-4 place-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
            className="w-5 h-5">
            <path fillRule="evenodd"
              d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
              clipRule="evenodd"></path>
          </svg>
        </div>
        Profile
      </div>
    </Link>
    <Link href="/preference">
      <div role="button"
        className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer">
        <div className="grid mr-4 place-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
            className="w-5 h-5">
            <path fillRule="evenodd"
              d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
              clipRule="evenodd"></path>
          </svg>
        </div>
        Settings
      </div>
    </Link>
    {/* Auth button: show Log In when unauthenticated, Log Out when authenticated */}
    {(() => {
      try {
        const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
        if (!isAuthenticated) {
          return (
            <button
              onClick={() => {
                persistTheme(mode)
                loginWithRedirect()
              }}
              className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer"
            >
              <div className="grid mr-4 place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                  className="w-5 h-5">
                  <path d="M12 2.25a.75.75 0 01.75.75v9a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z" />
                </svg>
              </div>
              Log In
            </button>
          )
        }

        return (
          <button
            onClick={() => {
              persistTheme(mode)
              logout({ logoutParams: { returnTo: window.location.origin } })
            }}
            className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer"
          >
            <div className="grid mr-4 place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                className="w-5 h-5">
                <path fillRule="evenodd"
                  d="M12 2.25a.75.75 0 01.75.75v9a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM6.166 5.106a.75.75 0 010 1.06 8.25 8.25 0 1011.668 0 .75.75 0 111.06-1.06c3.808 3.807 3.808 9.98 0 13.788-3.807 3.808-9.98 3.808-13.788 0-3.808-3.807-3.808-9.98 0-13.788a.75.75 0 011.06 0z"
                  clipRule="evenodd"></path>
              </svg>
            </div>
            Log Out
          </button>
        )
      } catch (e) {
        // If auth context is not available, show a fallback static link
        return (
          <div role="button"
            className="navbar-item flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer">
            <div className="grid mr-4 place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                className="w-5 h-5">
                <path fillRule="evenodd"
                  d="M12 2.25a.75.75 0 01.75.75v9a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM6.166 5.106a.75.75 0 010 1.06 8.25 8.25 0 1011.668 0 .75.75 0 111.06-1.06c3.808 3.807 3.808 9.98 0 13.788-3.807 3.808-9.98 3.808-13.788 0-3.808-3.807-3.808-9.98 0-13.788a.75.75 0 011.06 0z"
                  clipRule="evenodd"></path>
              </svg>
            </div>
            Log Out
          </div>
        )
      }
    })()}
  </nav>
</div>
    </div>
  )
}

export default Navbar
