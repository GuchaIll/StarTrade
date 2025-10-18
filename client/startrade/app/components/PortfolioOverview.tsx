"use client"
import React from 'react'
import PortfolioValueChart from './Portfolio/PortfolioValueChart'
import PortfolioHealth from './Portfolio/PortfolioHealth'
import PortfolioSector from './Portfolio/PortfolioSector'
import PortfolioComposition from './Portfolio/PortfolioComposition'

const PortfolioOverview = () => {
  return (
    // Limit the overview container to ~30vh so it doesn't dominate the page
    <div className="flex flex-col p-4 border rounded-lg overflow-hidden max-h-30vh">
      <h2 className="mb-2">Portfolio Overview</h2>

      {/* Grid will fill the available height; each card scrolls internally if content overflows */}
      <div className="grid grid-cols-2 gap-2 h-full">
        <div className="col-span-1 p-2 border rounded-lg overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Portfolio Value Chart</h3>
          <div className="h-32">
            <PortfolioValueChart />
          </div>
        </div>
        <div className="col-span-1 p-2 border rounded-lg overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Portfolio Health</h3>
          <div className="h-32">
            <PortfolioHealth />
          </div>
        </div>
        <div className="col-span-1 p-2 border rounded-lg overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Portfolio Sector Distribution</h3>
          <div className="h-32">
            <PortfolioSector />
          </div>
        </div>
        <div className="col-span-1 p-2 border rounded-lg overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Portfolio Composition</h3>
          <div className="h-32">
            <PortfolioComposition />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioOverview
