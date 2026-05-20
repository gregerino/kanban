import { useRef } from 'react';
import { PRIORITY_FLAG_COLORS } from '../utils/constants';
import { today } from '../utils/helpers';
import { useDrag } from './DragContext';

function hexToVividGradient(hex) {
  if (!hex || hex.startsWith('sticky-') || hex.startsWith('bg-')) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const top = `rgba(${r},${g},${b},0.38)`;
  const bottom = `rgba(${r},${g},${b},0.52)`;
  return `linear-gradient(175deg, ${top} 0%, ${bottom} 100%)`;
}

function getRotation(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return ((hash % 5) - 2) * 0.6;
}

function PriorityFlag({ priority }) {
  const color = PRIORITY_FLAG_COLORS[priority];
  if (!color) return null;
  return (
    <div className="flex items-center gap-1" title={priority}>
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5">
        <path d="M4 21V4h16l-4 7 4 7H4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[10px] font-semibold" style={{ color }}>{priority}</span>
    </div>
  );
}

export default function StickyNote({ task, labels, storyColor, onOpen, onToggleCheck, onContextMenu }) {
  const isOverdue = task.deadline && task.deadline < today() && task.status !== 'Done';
  const taskLabels = labels.filter(l => task.labels?.includes(l.id));

  const colorSource = storyColor || task.color || '#fde68a';
  const gradient = hexToVividGradient(colorSource);
  const rotation = getRotation(task.id);

  const checklist = task.checklist || [];
  const checkTotal = checklist.length;
  const hasFiles = (task.files || []).length > 0;
  const hasNotes = !!(task.notes && task.notes.trim());

  const { startDrag, dragging } = useDrag();
  const pointerStartRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.target.tagName === 'INPUT') return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    startDrag(e, 'task', task.id, { taskId: task.id });
  };

  const handleClick = (e) => {
    // Only open if we didn't drag
    if (dragging) return;
    onOpen(task);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, task); }}
      className="sticky-card pt-5 pb-3.5 px-3.5 cursor-grab active:cursor-grabbing select-none w-full relative touch-none min-w-0 overflow-hidden"
      style={{
        background: gradient || '#fde68a',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Tape strip */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 rounded-sm z-10 pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 1px rgba(0,0,0,0.04)' }}
      />
      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {taskLabels.map(l => <div key={l.id} className="w-8 h-1.5 rounded-full" style={{ background: l.color }} title={l.name} />)}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900 leading-snug drop-shadow-[0_0_1px_rgba(255,255,255,0.5)] break-words">{task.title}</p>

      {checkTotal > 0 && (
        <div className="mt-2 space-y-1">
          {checklist.map(item => (
            <div key={item.id} className="flex items-center gap-1.5 cursor-pointer" onClick={e => { e.stopPropagation(); onToggleCheck?.(task.id, item.id); }}>
              <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${item.done ? 'bg-green-500 border-green-500' : 'border-gray-400 bg-white/50'}`}>
                {item.done && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
              </div>
              <span className={`text-[11px] leading-tight ${item.done ? 'line-through text-gray-400' : 'text-gray-600'}`}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          {task.priority && task.priority !== 'Critical' && <PriorityFlag priority={task.priority} />}
        </div>
        <div className="flex items-center gap-2">
          {task.priority === 'Critical' && <PriorityFlag priority={task.priority} />}
          {hasNotes && (
            <span className="text-xs text-gray-500 flex items-center" title="Har anteckningar">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </span>
          )}
          {hasFiles && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5" title="Har bilagor">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
              {task.files.length}
            </span>
          )}
          {task.comments?.length > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              {task.comments.length}
            </span>
          )}
          {isOverdue && <span className="text-xs text-red-600 font-medium">Försenad</span>}
          {task.deadline && !isOverdue && <span className="text-xs text-gray-500">{task.deadline.slice(5)}</span>}
        </div>
      </div>
    </div>
  );
}
