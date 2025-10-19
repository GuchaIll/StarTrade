'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PoolEntryProps {
  id: string;
  label: string;
  onRemove?: (id: string) => void;
}

export default function PoolEntry({ id, label, onRemove }: PoolEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white/5 px-3 py-2 rounded-md flex items-center justify-between cursor-grab active:cursor-grabbing select-none min-h-[36px]`}
    >
      <span className="text-sm font-medium truncate">{label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onRemove) onRemove(id);
        }}
        aria-label={`Remove ${label}`}
        className="ml-2 text-red-400 hover:text-red-300"
      >
        ×
      </button>
    </div>
  );
}