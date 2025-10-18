import React from 'react'

const SymbolAnalysisSummaryPanel: React.FC = () => {
  const summary = `AAPL outlook: bearish. Next-week estimate: $181.25 (last $181.71).

Current momentum appears bearish. Near-term risk is moderate. Model suggests downside potential into next week.`

  const indicators = new Map<string, string | number>([
    ['RSI (14)', 41.4],
    ['SMA (5)', '$189.10'],
    ['EMA (12)', '$189.26'],
    ['MACD hist', '-'],
  ])

  return (
    <div className="p-4">
      <div className="w-full max-w-lg bg-white/5 p-3 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Analysis Summary</h2>
      <p className="text-sm text-neutral-300 whitespace-pre-line">{summary}</p>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Supporting indicators</h3>
        <ul className="flex flex-col gap-2 text-sm">
          {Array.from(indicators.entries()).map(([label, value], idx) => (
            <li key={`${label}-${idx}`} className="flex items-center justify-between py-1 border-b border-neutral-800 last:border-b-0">
              <span className="text-neutral-300">{label}</span>
              <span className="font-semibold">{String(value)}</span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  )
}

export default SymbolAnalysisSummaryPanel
