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

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 p-6 ">

        {pools.map(pool => (
          <div key={`wrap-${pool.id}`} className="">
            <SortableContext
              key={pool.id}
              items={pool.entries.map(e => e.id)}
              strategy={rectSortingStrategy}
            >
              <Pool id={pool.id} name={pool.name}>
                {pool.entries.map(entry => (
                  <PoolEntry key={entry.id} id={entry.id} label={entry.label} />
                ))}
              </Pool>
            </SortableContext>
          </div>
        ))}

   
        {/* Bottom full-width pool */}
        <div className="col-span-1 lg:col-span-2">
          <SortableContext
            key={'bottom-pool'}
            items={[]}
            strategy={rectSortingStrategy}
          >
            <Pool id={'recommendations'} name={'Recommendations'}>
              {/* empty on purpose - populate as needed */}
            </Pool>
          </SortableContext>
        </div>

  </div>
      
      {/* Drag overlay - ensures visibility when dragging outside containers */}
      {typeof window !== 'undefined' && createPortal(
        <DragOverlay className="drag-overlay">
          {activeEntry ? (
            <div className="pool-entry rounded-full px-3 py-2 text-sm font-medium min-h-[36px] flex items-center justify-center text-center break-words hyphens-auto">
              {activeEntry.label}
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

