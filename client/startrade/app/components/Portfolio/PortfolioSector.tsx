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
      position: 'right',
      horizontalAlign: 'center',
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 220 },
          legend: { position: 'bottom' },
        },
      },
    ],
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 0 }}>
      <div className="w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
        <ReactApexChart options={options} series={sectorSeries} type="pie" height="100%" />
      </div>
    </div>
  )
}

export default PortfolioSector
