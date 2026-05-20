import { useState, useEffect, useRef } from 'react';
import { uid } from '../utils/helpers';

export default function QuickAddTask({ storyId, status, onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const add = () => {
    if (!title.trim()) return;
    onAdd({ id: uid(), storyId, title: title.trim(), status, priority: '', labels: [], deadline: '', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] });
    setTitle('');
    setOpen(false);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
      Lägg till uppgift
    </button>
  );

  return (
    <div className="sticky-note rounded-xl p-3">
      <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Uppgiftstitel..." className="w-full bg-transparent text-sm outline-none placeholder-gray-400" onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setOpen(false); }} />
      <div className="flex gap-2 mt-2">
        <button onClick={add} className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Lägg till</button>
        <button onClick={() => setOpen(false)} className="px-3 py-1 text-gray-500 text-xs hover:text-gray-700">Avbryt</button>
      </div>
    </div>
  );
}
