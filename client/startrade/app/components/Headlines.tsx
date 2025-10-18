import React from 'react'
   

const TopArticles =  new Map<string, string>([
    ['Market rallies as tech stocks soar.', 'https://news.example.com/article1'],
    ['Federal Reserve signals potential rate hike.', 'https://news.example.com/article2'],
    ['Global economic outlook remains uncertain.', 'https://news.example.com/article3'],
    ['Market rallies as tech stocks soar.', 'https://news.example.com/article1'],
    ['Federal Reserve signals potential rate hike.', 'https://news.example.com/article2'],
    ['Global economic outlook remains uncertain.', 'https://news.example.com/article3'],
    ['Market rallies as tech stocks soar.', 'https://news.example.com/article1'],
    ['Federal Reserve signals potential rate hike.', 'https://news.example.com/article2'],
    ['Global economic outlook remains uncertain.', 'https://news.example.com/article3'],
])

const Headlines = () => {
  return (
    <div className = "flex flex-col p-4 overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-96  rounded-lg shadow-sm">
        <h1 className = "font-bold text-xl mb-4">Top Articles of the day</h1>
      {Array.from(TopArticles.entries()).map(([headline, url], idx) => (
        <div key={idx} className="mb-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {headline}
          </a>
        </div>
      ))}
    </div>
  )
}

export default Headlines
