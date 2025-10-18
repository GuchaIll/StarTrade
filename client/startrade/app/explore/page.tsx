import React from 'react'
import Headlines from '../components/Headlines'
import NewsSummary from '../components/NewsSummary'
import SentimentVisualization from '../components/SentimentVisualization'
import SentimentAnalysisSummary from '../components/SentimentAnalysisSummary'
  
const ExplorePage = () => {
  return (
    <div className = "flex p-4">
      <div className = "flex-1 mr-4 flex flex-col">
        <h1 className = "font-bold text-2xl mb-4">Explore Page</h1>
        <Headlines />
        <NewsSummary />
      </div>
      <div className = "flex-3 mr-4 flex flex-col justify-between space-between">
        <SentimentVisualization />
        <SentimentAnalysisSummary />  
      </div>
        
    </div>
  )
}

export default ExplorePage



