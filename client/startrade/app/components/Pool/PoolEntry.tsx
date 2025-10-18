'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PoolEntryProps {
  id: string;
  label: string;
}

export default function PoolEntry({ id, label }: PoolEntryProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`pool-entry rounded-full px-3 py-2 text-sm font-medium cursor-grab active:cursor-grabbing select-none min-h-[36px] flex items-center justify-center text-center break-words hyphens-auto ${
        isDragging ? 'dragging' : ''
      }`}
    >
      {label}
    </button>
  );
}