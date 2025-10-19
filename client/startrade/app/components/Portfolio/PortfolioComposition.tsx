"use client"

import React from 'react'
import type { ApexOptions } from 'apexcharts'
import dynamic from 'next/dynamic'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

// Dummy data for stock portfolio composition
const labels = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
const series = [50, 30, 20, 10, 15]

const PortfolioComposition: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
      animations: { enabled: false },
    },
    labels,
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          legend: { position: 'bottom' },
        },
      },
    ],
  }

  // The parent container should control height; set chart height to 100% so it fills available space
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full max-h-full" style={{ minHeight: 0 }}>
        <ReactApexChart options={options} series={series} type="donut" height="100%" />
      </div>
    </div>
  )
}

export default PortfolioComposition
