'use client';
import React, { useState } from 'react';
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import Pool from './Pool';
import PoolEntry from './PoolEntry';
import StockDropDownSelection from '../StockDropDownSelection';

interface Entry {
  id: string;
  label: string;
}

interface PoolData {
  id: string;
  name: string;
  entries: Entry[];
}

export default function PoolBoard() {
  const [pools, setPools] = useState<PoolData[]>([
    {
      id: 'portfolio-1',
      name: 'Portfolio',
      entries: [
        { id: 'entry-a-1', label: 'Apple Stock' },
        { id: 'entry-b-1', label: 'Tesla Inc' },
        { id: 'entry-c-1', label: 'Microsoft' },
        { id: 'entry-d-1', label: 'Google' },
        { id: 'entry-e-1', label: 'Amazon' },
        { id: 'entry-f-1', label: 'Meta' },
        { id: 'entry-g-1', label: 'Netflix' },
        { id: 'entry-h-1', label: 'AMD' },
        { id: 'entry-i-1', label: 'Intel' },
      ],
    },
    {
      id: 'watchlist-1',
      name: 'Watchlist',
      entries: [
        { id: 'entry-j-1', label: 'Bitcoin' },
        { id: 'entry-k-1', label: 'Ethereum' },
      ],
    },
  ]);

  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);

   

  const findPool = (entryId: string) => {
    for (const pool of pools) {
      if (pool.entries.some(e => e.id === entryId)) return pool;
    }
    return null;
  };

  const findEntry = (entryId: string): Entry | null => {
    for (const pool of pools) {
      const entry = pool.entries.find(e => e.id === entryId);
      if (entry) return entry;
    }
    return null;
  };

  const handleDragStart = (event:  DragStartEvent) => {
    const entry = findEntry(event.active.id as string);
    setActiveEntry(entry);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEntry(null);
    
    if (!over) return;

    const sourcePool = findPool(active.id as string);
    const destPool = findPool(over.id as string) ?? pools.find(p => p.id === over.id);
    if (!sourcePool || !destPool) return;

    // if same pool → reorder
    if (sourcePool.id === destPool.id) {
      const oldIndex = sourcePool.entries.findIndex(e => e.id === active.id);
      const newIndex = sourcePool.entries.findIndex(e => e.id === over.id);
      const updated = [...pools];
      const poolIdx = pools.findIndex(p => p.id === sourcePool.id);
      updated[poolIdx] = {
        ...sourcePool,
        entries: arrayMove(sourcePool.entries, oldIndex, newIndex),
      };
      setPools(updated);
    } else {
      // move to another pool
      const sourceIdx = sourcePool.entries.findIndex(e => e.id === active.id);
      const movedEntry = sourcePool.entries[sourceIdx];

      const updatedPools = pools.map(p => {
        if (p.id === sourcePool.id)
          return { ...p, entries: p.entries.filter(e => e.id !== active.id) };
        if (p.id === destPool.id)
          return { ...p, entries: [...p.entries, movedEntry] };
        return p;
      });
      setPools(updatedPools);
    }
  };

  const removeEntry = (entryId: string) => {
    const updatedPools = pools.map(p => ({
      ...p,
      entries: p.entries.filter(e => e.id !== entryId),
    }));
    setPools(updatedPools);
  };

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
  {/* stacked vertically; each pool limited to max-height < 200px with scroll when overflow */}
  <div className="flex flex-col gap-2 p-2 w-full ">

        {pools.map(pool => (
          // wrapper enforces vertical stacking and max height per pool
          <div key={`wrap-${pool.id}`} className="w-full ">
            <SortableContext
              key={pool.id}
              items={pool.entries.map(e => e.id)}
              strategy={rectSortingStrategy}
            >
              <Pool id={pool.id} name={pool.name} >
                {/* inner container ensures consistent spacing and fixed entry height.
                    Each entry is rendered directly as a PoolEntry (no extra tile wrapper) */}
                <div className="flex flex-col gap-3 p-2">
                  {pool.entries.map(entry => (
                    <div
                      key={entry.id}
                      className="h-12 min-h-0 flex items-center flex-shrink-0"
                      aria-hidden={false}
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <div className="w-full flex items-center">
                        <PoolEntry id={entry.id} label={entry.label} onRemove={removeEntry} />
                      </div>
                    </div>
                  ))}
                </div>
              </Pool>
            </SortableContext>
          </div>
        ))}

   
        {/* Bottom full-width pool - third pool in the vertical stack */}
  <div className="w-full">
          <SortableContext
            key={'bottom-pool'}
            items={[]}
            strategy={rectSortingStrategy}
          >
            <Pool id={'recommendations'} name={'Recommendations'}>
              <div className="flex flex-col gap-3 p-2">
                {/* empty on purpose - populate as needed */}
              </div>
            </Pool>
          </SortableContext>
        </div>

  </div>
      
      {/* Drag overlay - ensures visibility when dragging outside containers */}
      {typeof window !== 'undefined' && createPortal(
        <DragOverlay className="drag-overlay">
          {activeEntry ? (
            <div className="bg-white/5 px-3 py-2 rounded-md flex items-center justify-between min-h-[36px]">
              <span className="text-sm font-medium truncate">{activeEntry.label}</span>
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}