"use client"
import React from 'react'
import VerticalPool from "../../components/Pool/VerticalPool";
import dynamic from "next/dynamic";

const LiveChart = dynamic(() => import("../../components/LiveChart"), { ssr: false });

const AnalysisGraphPage = () => {
  return (

     <div className="flex p-4 h-full">
            <div className="w-1/3 mr-4">
              <VerticalPool />
            </div>
            <div className="w-2/3 flex flex-col gap-2 h-full">        
                    <LiveChart symbol="AAPL" />
            </div>
          </div>
  )
}

export default AnalysisGraphPage
