"use client";
import React from 'react';

interface Entry {
  id: string;
  label: string;
  symbol?: string;
}

interface PoolDisplayProps {
  entries: Entry[];
  onRemove?: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  className?: string;
}

export default function PoolDisplay({ entries, onRemove, onSelect, selectedId = null, className = '' }: PoolDisplayProps) {
  return (
    <div className={`flex flex-col gap-3 p-2 ${className}`}>
      {entries.map(entry => {
        const isSelected = selectedId === entry.id;
        return (
          <div key={entry.id} className="w-full">
            {/* Use a div with role=button to avoid nested <button> (outer clickable area) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(entry.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(entry.id);
                }
              }}
              className={`w-full text-left cursor-pointer ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-60 bg-white/10' : ''}`}
            >
              <div className="bg-white/5 px-3 py-2 rounded-md flex items-center justify-between min-h-[36px]">
                <span className="text-sm font-medium truncate">{entry.symbol ? `${entry.symbol} — ${entry.label}` : entry.label}</span>
                <div className="flex items-center">
                  {onRemove ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                      aria-label={`Remove ${entry.label}`}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
