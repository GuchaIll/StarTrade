"use client"

import React, { useState } from 'react'
import PortfolioValueChart from './Portfolio/PortfolioValueChart'
import PortfolioHealth from './Portfolio/PortfolioHealth'
import PortfolioSector from './Portfolio/PortfolioSector'
import PortfolioComposition from './Portfolio/PortfolioComposition'

const tabs = [
  { id: 'value', label: 'Value' },
  { id: 'composition', label: 'Composition' },
  { id: 'health', label: 'Health' },
  { id: 'sector', label: 'Sector' },
]

const PortfolioOverview = () => {
  const [active, setActive] = useState<string>('value')

  return (
    // Limit the overview container to ~30vh so it doesn't dominate the page
    <div className="flex flex-col p-4 border rounded-lg overflow-hidden max-h-30vh">
      <div className="flex items-center justify-between mb-2">
        <h2>Portfolio Overview</h2>
        <div role="tablist" aria-label="Portfolio overview tabs" className="flex space-x-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setActive(t.id)}
              className={`px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                active === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-700 dark:text-gray-200 border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 border rounded-lg overflow-auto h-32">
        {active === 'value' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Value Chart</h3>
            <div className="h-24">
              <PortfolioValueChart />
            </div>
          </div>
        )}

        {active === 'composition' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Composition</h3>
            <div className="h-24">
              <PortfolioComposition />
            </div>
          </div>
        )}

        {active === 'health' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Health</h3>
            <div className="h-24">
              <PortfolioHealth />
            </div>
          </div>
        )}

        {active === 'sector' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Sector Distribution</h3>
            <div className="h-24">
              <PortfolioSector />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PortfolioOverview
