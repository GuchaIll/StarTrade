import React from 'react'

const PortfolioHealth: React.FC = () => {
  const score = 78 // placeholder out-of-100 score
  const details = [
    'Diversification: Good',
    'Risk level: Moderate',
    'Top holding concentration: 18%',
    'Trailing volatility: 12%'
  ]

  return (
    <div className="flex w-full h-full flex-col items-center justify-center text-center">
      <div className="flex-shrink-0 w-28 h-28 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
        {score}
      </div>
      <div className="mt-3">
        <ul className="mt-2 text-sm space-y-1">
          {details.map((d, i) => (
            <li key={i} className="text-gray-700 dark:text-gray-200">{d}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PortfolioHealth
