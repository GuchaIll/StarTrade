'user client'
"use client"
import React from 'react'
import type { ApexOptions } from 'apexcharts';
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Dummy data for stock portfolio composition 
const stockPortfolio = {
    'AAPL': 50,
    'MSFT': 30,
    'GOOGL': 20,
    'AMZN': 10,
    'TSLA': 15
}

const PortfolioComposition: React.FC = () => {
  const [state] = React.useState<{
    series: number[];
    options: ApexOptions;
  }>({
    series: [44, 55, 41, 17, 15],
    options: {
      chart: {
        type: 'donut',
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    },
  });

  return (
    <div>
      <div id="chart">
        <ReactApexChart options={state.options} series={state.series} type="donut" />
      </div>
      <div id="html-dist"></div>
    </div>
  );
};

export default PortfolioComposition;
