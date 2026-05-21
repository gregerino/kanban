import { useState, useEffect, useRef } from 'react';

export default function TaskContextMenu({ position, task, allLabels = [], columns = [], onDelete, onOpen, onToggleLabel, onMoveToColumn, onClose }) {
  const menuRef = useRef(null);
  const [showLabels, setShowLabels] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  const style = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 200,
  };

  const taskLabels = task.labels || [];

  return (
    <div ref={menuRef} style={style} className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[180px] animate-in fade-in">
      <button
        onClick={() => { onOpen(task); onClose(); }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
        Öppna
      </button>

      {/* Labels submenu */}
      <div className="relative"
        onMouseEnter={() => setShowLabels(true)}
        onMouseLeave={() => setShowLabels(false)}
      >
        <button
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          Etiketter
          <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${showLabels ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        {showLabels && (
          <div className="border-t border-gray-50 py-1">
            {allLabels.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-gray-400">Inga etiketter</p>
            ) : (
              allLabels.map(l => {
                const active = taskLabels.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => onToggleLabel(task.id, l.id)}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <div className="w-3.5 h-3.5 rounded-sm shrink-0 border" style={{ background: active ? l.color : 'transparent', borderColor: l.color }} />
                    <span className="text-gray-700 text-xs">{l.name}</span>
                    {active && (
                      <svg className="w-3.5 h-3.5 text-indigo-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Move to column submenu */}
      <div className="relative"
        onMouseEnter={() => setShowMoveMenu(true)}
        onMouseLeave={() => setShowMoveMenu(false)}
      >
        <button
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          Flytta till
          <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${showMoveMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        {showMoveMenu && (
          <div className="border-t border-gray-50 py-1">
            {columns.map(col => (
              <button
                key={col}
                onClick={() => { onMoveToColumn(task.id, col); onClose(); }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${task.status === col ? 'font-medium' : ''}`}
              >
                {task.status === col && (
                  <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                )}
                <span className={`text-xs ${task.status === col ? 'text-indigo-600' : 'text-gray-700'}`}>{col}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 my-0.5" />
      <button
        onClick={() => { onDelete(task.id); onClose(); }}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Ta bort
      </button>
    </div>
  );
}
