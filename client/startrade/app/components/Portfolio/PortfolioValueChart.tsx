import React from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

const sampleSeries = [
  {
    name: 'Portfolio Value',
    data: [10000, 10250, 10100, 10500, 10750, 11000, 10800],
  },
]

const options: ApexOptions = {
  chart: {
    type: 'line',
    animations: { enabled: false },
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  stroke: { curve: 'smooth' },
  xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  grid: { show: false },
}

const PortfolioValueChart: React.FC = () => {
  return (
    <div className="w-full h-full">
      <ReactApexChart options={options} series={sampleSeries} type="line" height="100%" />
    </div>
  )
}

export default PortfolioValueChart
