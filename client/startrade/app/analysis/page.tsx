'use client'
import React from 'react'
import SymbolTechnicalAnalysisPanel from '../components/SymbolTechnicalAnalysisPanel'
import SymbolAnalysisSummaryPanel from '../components/SymbolAnalysisSummaryPanel'
import PoolBoard from '../components/Pool/PoolBoard'



const AnalysisPage = () => {
  return (
   
      <div className="flex p-4 h-full">
        <div className="w-1/3 mr-4">
          <PoolBoard />
        </div>
        <div className="w-2/3 flex flex-col gap-2 h-full">
          <div className="flex-0">
            <SymbolTechnicalAnalysisPanel />
          </div>
          <div className="flex-0">
            <SymbolAnalysisSummaryPanel />
          </div>
          
        </div>
      </div>
  
  )
}

export default AnalysisPage
