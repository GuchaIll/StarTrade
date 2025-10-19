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
      position: 'right',
      horizontalAlign: 'center',
      floating: false,
      labels: { useSeriesColors: true },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          legend: { position: 'bottom' },
          chart: { height: 220 },
        },
      },
    ],
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 0 }}>
      <div className="w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
        <ReactApexChart options={options} series={series} type="donut" height="100%" />
      </div>
    </div>
  )
}

export default PortfolioComposition
