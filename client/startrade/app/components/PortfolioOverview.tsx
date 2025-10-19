"use client"

import React, { useState } from 'react'
import PortfolioValueChart from './Portfolio/PortfolioValueChart'
import PortfolioHealth from './Portfolio/PortfolioHealth'
import PortfolioSector from './Portfolio/PortfolioSector'
import PortfolioComposition from './Portfolio/PortfolioComposition'

const PortfolioOverview = () => {
  return (
  <div className="flex flex-col p-4 border rounded-lg overflow-hidden h-full">
      

      {/* Dashboard layout: value on top, below a 2-column layout */}
      <div className="flex flex-col gap-3 h-full">
        {/* Top: full-width value chart set to ~1/3 of viewport height */}
        <div className="border rounded-lg p-3 bg-white/5" style={{ height: '33vh' }}>
          <h3 className="text-lg font-semibold mb-2">Portfolio Value</h3>
          <div className="w-full h-full">
            <PortfolioValueChart />
          </div>
        </div>

        {/* Bottom: two columns on md+, stacked on small screens; flex-grow so it fills remaining space */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
          {/* Left column: Health (takes 1 col on md) */}
          <div className="md:col-span-1 border rounded-lg p-3 bg-white/5 flex items-center justify-center">
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2 text-center">Portfolio Health</h3>
              <div className="h-full flex items-center justify-center">
                <PortfolioHealth />
              </div>
            </div>
          </div>

          {/* Right column: Sector and Composition stacked (take 2 cols combined) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
            <div className="border rounded-lg p-3 bg-white/5">
              <h3 className="text-lg font-semibold mb-2">Sector Distribution</h3>
              <div className="h-full">
                <PortfolioSector />
              </div>
            </div>

            <div className="border rounded-lg p-3 bg-white/5">
              <h3 className="text-lg font-semibold mb-2">Composition</h3>
              <div className="h-full">
                <PortfolioComposition />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioOverview
