'use client'
import React, { useState } from 'react'
import SymbolTechnicalAnalysisPanel from '../components/SymbolTechnicalAnalysisPanel'
import SymbolAnalysisSummaryPanel from '../components/SymbolAnalysisSummaryPanel'
import VerticalPool from '../components/Pool/VerticalPool'

const AnalysisPage = () => {
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    return (
        <div className="flex p-4 h-full overflow-auto">
            <div className="w-1/3 mr-4">
                <VerticalPool onSymbolSelect={setSelectedSymbol} />
            </div>
            <div className="w-2/3 flex flex-col gap-2 h-full">
                <div className="flex-0">
                    <SymbolTechnicalAnalysisPanel symbol={selectedSymbol} />
                </div>
                <div className="flex-0">
                    <SymbolAnalysisSummaryPanel symbol={selectedSymbol}  />
                </div>
            </div>
        </div>
    )
}

export default AnalysisPage