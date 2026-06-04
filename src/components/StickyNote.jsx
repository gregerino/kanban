import { useRef, useState, useEffect } from 'react';
import { PRIORITY_FLAG_COLORS } from '../utils/constants';
import { today } from '../utils/helpers';
import { useDrag } from './DragContext';

// Returns urgency info for a deadline: { label, cls } or null
function deadlineInfo(deadline, status) {
  if (!deadline) return null;
  const d = new Date(deadline + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d - t) / 86400000);
  const done = status === 'Done';
  if (done) return { label: deadline.slice(5), cls: 'text-gray-400', overdue: false };
  if (diffDays < 0) return { label: 'Försenad', cls: 'text-red-600 font-semibold', overdue: true };
  if (diffDays === 0) return { label: 'Idag', cls: 'text-orange-600 font-semibold', overdue: false };
  if (diffDays === 1) return { label: 'Imorgon', cls: 'text-amber-600 font-medium', overdue: false };
  if (diffDays <= 3) return { label: deadline.slice(5), cls: 'text-amber-600', overdue: false };
  return { label: deadline.slice(5), cls: 'text-gray-500', overdue: false };
}

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

export default function StickyNote({ task, labels, storyColor, onOpen, onToggleCheck, onContextMenu, onRename, deadlineEnabled }) {
  const dl = deadlineEnabled ? deadlineInfo(task.deadline, task.status) : null;
  const taskLabels = labels.filter(l => task.labels?.includes(l.id));

  const colorSource = storyColor || task.color || '#fde68a';
  const gradient = hexToVividGradient(colorSource);
  const rotation = getRotation(task.id);

  const checklist = task.checklist || [];
  const checkTotal = checklist.length;
  const checkDone = checklist.filter(c => c.done).length;
  const hasFiles = (task.files || []).length > 0;
  const hasNotes = !!(task.notes && task.notes.trim());

  const { startDrag, dragging } = useDrag();
  const pointerStartRef = useRef(null);

  // Inline title editing
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef(null);
  useEffect(() => { if (editing) { setDraft(task.title); requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select(); }); } }, [editing, task.title]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.title) onRename?.(task.id, trimmed);
    setEditing(false);
  };

  const handlePointerDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (editing) return;
    // Skip pointer events on touch devices — handled by onTouchStart
    if (e.pointerType === 'touch') return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    startDrag(e, 'task', task.id, { taskId: task.id });
  };

  const handleTouchStart = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (editing) return;
    startDrag(e, 'task', task.id, { taskId: task.id });
  };

  const handleClick = (e) => {
    // Only open if we didn't drag
    if (dragging || editing) return;
    onOpen(task);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, task); }}
      className="sticky-card pt-5 pb-3.5 px-3.5 cursor-grab active:cursor-grabbing select-none w-full relative min-w-0 overflow-hidden"
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
          {taskLabels.map(l => (
            <span key={l.id} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white leading-none" style={{ background: l.color }}>{l.name}</span>
          ))}
        </div>
      )}
      {editing ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitRename(); }
            if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
          }}
          rows={2}
          className="w-full text-sm font-semibold text-gray-900 leading-snug bg-white/80 rounded-md px-1.5 py-1 resize-none outline-none ring-2 ring-indigo-400"
        />
      ) : (
        <p
          onDoubleClick={(e) => { e.stopPropagation(); if (onRename) setEditing(true); }}
          title={onRename ? 'Dubbelklicka för att byta namn' : undefined}
          className="text-sm font-semibold text-gray-900 leading-snug drop-shadow-[0_0_1px_rgba(255,255,255,0.5)] break-words"
        >
          {task.title}
        </p>
      )}

      {checkTotal > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-semibold text-gray-500 shrink-0">{checkDone}/{checkTotal}</span>
            <div className="h-1.5 flex-1 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${checkTotal ? (checkDone / checkTotal) * 100 : 0}%` }} />
            </div>
          </div>
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
          {task.priority && task.priority !== 'Legendary' && <PriorityFlag priority={task.priority} />}
        </div>
        <div className="flex items-center gap-2">
          {task.priority === 'Legendary' && <PriorityFlag priority={task.priority} />}
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
          {dl && (
            <span className={`text-xs flex items-center gap-0.5 ${dl.cls}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {dl.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
