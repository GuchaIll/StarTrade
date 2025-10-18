"use client"
import React from 'react'
import PoolBoard from '../components/Pool/PoolBoard'
import PortfolioOverview from '../components/PortfolioOverview'

const PortfolioPage = () => {
  return (
    <div>
      <h1 className = "flex-col text-center text-xl font-bold">Portfolio Page</h1>
      <PortfolioOverview />
      <PoolBoard />
    </div>
  )
}

export default PortfolioPage
