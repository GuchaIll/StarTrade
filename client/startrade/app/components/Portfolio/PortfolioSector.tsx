"use client"

import React from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

const sectorLabels = ['Technology', 'Healthcare', 'Finance', 'Consumer', 'Energy']
const sectorSeries = [40, 20, 15, 15, 10]

const PortfolioSector: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false },
    },
    labels: sectorLabels,
    legend: {
      position: 'bottom',
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 200 },
          legend: { position: 'bottom' },
        },
      },
    ],
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full" style={{ minHeight: 0 }}>
        <ReactApexChart options={options} series={sectorSeries} type="pie" height="100%" />
      </div>
    </div>
  )
}

export default PortfolioSector
