'use client'
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
// ...existing code...
interface StockDropDownSelectionProps {
  onStockSelect: (ticker: string) => void
  placeholder?: string
  className?: string
}

const StockDropDownSelection: React.FC<StockDropDownSelectionProps> = ({ 
  onStockSelect, 
  placeholder = "Search for stocks...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStocks, setFilteredStocks] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 })

  // Sample stock data - this would come from an API
  const popularStocks = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 
    'BABA', 'UBER', 'SPOT', 'ZOOM', 'SQ', 'PYPL', 'ROKU', 'TWTR'
  ]

  // Close dropdown when clicking outside (works with portal'd dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter stocks based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStocks(popularStocks.slice(0, 8)) // Show first 8 popular stocks
    } else {
      const filtered = popularStocks.filter(stock =>
        stock.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredStocks(filtered.slice(0, 10)) // Limit to 10 results
    }
  }, [searchQuery])

  // Calculate and set dropdown position so it centers under the button and overlays other content.
  const updatePosition = () => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const left = rect.left + rect.width / 2 + window.scrollX
    const top = rect.bottom + 8 + window.scrollY // 8px gap
    setPosition({ left, top })
  }

  useEffect(() => {
    if (isOpen) {
      updatePosition()
      // update on resize/scroll to keep it aligned
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      // focus the input after portal renders
      setTimeout(() => inputRef.current?.focus(), 50)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [isOpen])

  const handleToggleDropdown = () => {
    setIsOpen(prev => !prev)
    if (!isOpen) {
      // position will be updated by effect
    }
  }

  const handleStockSelect = (ticker: string) => {
    onStockSelect(ticker)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div className={`stock-dropdown-container ${className} z-50 `}>
      {/* Add Stock Button */}
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="add-stock-btn"
        title="Add new stock"
        aria-label="Add new stock to inventory"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Dropdown Menu (rendered into document.body to overlay container and center under button) */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="stock-dropdown"
          role="dialog"
          style={{
            position: 'absolute',
            left: position.left,
            top: position.top,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: 220,
            maxWidth: 360,
          }}
        >
          {/* Search Input */}
          <div className="stock-search-container">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="stock-search-input"
            />
          </div>

          {/* Stock Results */}
          <div className="stock-results">
            {filteredStocks.length > 0 ? (
              filteredStocks.map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => handleStockSelect(ticker)}
                  className="stock-result-item"
                >
                  <span className="stock-ticker">{ticker}</span>
                </button>
              ))
            ) : (
              <div className="stock-no-results">
                No stocks found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default StockDropDownSelection
