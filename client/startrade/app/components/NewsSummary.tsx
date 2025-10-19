import React from 'react'

type Article = {
  id: string;
  headline: string;
  time: string; // human-readable
  summary: string;
  keywords?: string[];
}

const sampleArticles: Article[] = [
  {
    id: '1',
    headline: 'Global Markets Rally on Tech Earnings',
    time: 'Today • 10:24 UTC',
    summary: 'Major tech firms beat earnings expectations, driving equities higher across multiple regions. Investors cheered robust cloud growth and record subscriptions.',
    keywords: ['tech', 'earnings', 'equities', 'cloud']
  },

];

const highlightKeywords = (text: string, keywords?: string[]) => {
  if (!keywords || keywords.length === 0) return text;
  // Escape regex special chars in keywords
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) => (
    re.test(part) ? <span key={i} className="bg-yellow-300/40 text-yellow-200 px-1 rounded">{part}</span> : <span key={i}>{part}</span>
  ));
}

const NewsSummary: React.FC<{articles?: Article[]}> = ({ articles = sampleArticles }) => {
  return (
    <div className="bg-slate-900/60 p-4 rounded-lg text-slate-100 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Top News — Today</h2>
        <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
      </div>

      <div className="space-y-3">
        {articles.map(article => (
          <article key={article.id} className="p-3 bg-slate-800/60 rounded-md border border-slate-700">
            <div className="flex items-start justify-between">
              <h3 className="font-medium">{article.headline}</h3>
              <span className="text-xs text-slate-400 ml-3">{article.time}</span>
            </div>
            <p className="mt-2 text-sm text-slate-200 leading-5">
              {highlightKeywords(article.summary, article.keywords)}
            </p>
            {article.keywords && article.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.keywords.map(k => (
                  <span key={k} className="text-xs bg-slate-700/50 px-2 py-0.5 rounded text-slate-300">{k}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export default NewsSummary
