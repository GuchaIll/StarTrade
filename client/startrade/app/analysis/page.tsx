'use client'
import React from 'react'
import SymbolTechnicalAnalysisPanel from '../components/SymbolTechnicalAnalysisPanel'
import SymbolAnalysisSummaryPanel from '../components/SymbolAnalysisSummaryPanel'
import PoolBoard from '../components/Pool/PoolBoard'

import dynamic from "next/dynamic";

const LiveChart = dynamic(() => import("../components/LiveChart"), { ssr: false });

const AnalysisPage = () => {
  return (
    <div>
      <div className="flex p-4">
        <div className="w-1/3 mr-4">
          <PoolBoard />
        </div>
        <div className="w-2/3">
          <SymbolTechnicalAnalysisPanel />
          <SymbolAnalysisSummaryPanel />
          <LiveChart symbol="AAPL"  />
        </div>
      </div>
    </div>
  )
}

export default AnalysisPage
