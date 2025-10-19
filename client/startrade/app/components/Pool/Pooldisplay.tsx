"use client";
import React from 'react';

interface Entry {
  id: string;
  label: string;
}

interface PoolDisplayProps {
  entries: Entry[];
  onRemove?: (id: string) => void;
  className?: string;
}

export default function PoolDisplay({ entries, onRemove, className = '' }: PoolDisplayProps) {
  return (
    <div className={`flex flex-col gap-3 p-2 ${className}`}>
      {entries.map(entry => (
        <div key={entry.id} className="w-full">
          <div className="bg-white/5 px-3 py-2 rounded-md flex items-center justify-between min-h-[36px]">
            <span className="text-sm font-medium truncate">{entry.label}</span>
            {onRemove ? (
              <button
                onClick={() => onRemove(entry.id)}
                aria-label={`Remove ${entry.label}`}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
