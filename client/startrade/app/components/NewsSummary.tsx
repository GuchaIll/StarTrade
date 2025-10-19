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
  }
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
  // Combine headlines and summaries into a single paragraph
  const combinedText = (() => {
    if (!articles || articles.length === 0) return '';
    const headlines = articles.map(a => a.headline).join('. ');
    const summaries = articles.map(a => a.summary).join(' ');
    return `${headlines}. ${summaries}`;
  })();

  // Aggregate keywords and pick top ones
  const keywordCounts = articles.reduce<Record<string, number>>((acc, a) => {
    (a.keywords || []).forEach(k => {
      const key = k.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, {});
  const topKeywords = Object.entries(keywordCounts)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 8)
    .map(([k]) => k);

  return (
    <div className="bg-slate-900/60 p-4 rounded-lg text-slate-100 max-h-[48vh] md:max-h-[36vh] lg:max-h-[30vh] overflow-auto mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Today — Summary</h2>
        <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
      </div>

      <p className="text-sm text-slate-200 leading-6">
        {highlightKeywords(combinedText, topKeywords)}
      </p>

      {topKeywords.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs text-slate-400 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(k => (
              <span key={k} className="text-xs bg-slate-700/50 px-2 py-0.5 rounded text-slate-300">{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsSummary
