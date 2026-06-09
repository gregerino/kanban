import { useState, useEffect, useRef } from 'react';
import { PRIORITIES, PRIORITY_FLAG_COLORS } from '../utils/constants';

export default function TaskContextMenu({ position, task, allLabels = [], columns = [], boards = [], onDelete, onOpen, onToggleLabel, onMoveToColumn, onMoveToBoard, onSetPriority, onClose }) {
  const menuRef = useRef(null);
  const labelBtnRef = useRef(null);
  const moveBtnRef = useRef(null);
  const prioBtnRef = useRef(null);
  const boardBtnRef = useRef(null);
  const [showLabels, setShowLabels] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPrio, setShowPrio] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const labelTimerRef = useRef(null);
  const moveTimerRef = useRef(null);
  const prioTimerRef = useRef(null);
  const boardTimerRef = useRef(null);

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
      clearTimeout(labelTimerRef.current);
      clearTimeout(moveTimerRef.current);
      clearTimeout(prioTimerRef.current);
      clearTimeout(boardTimerRef.current);
    };
  }, [onClose]);

  const closeAll = () => { setShowLabels(false); setShowMoveMenu(false); setShowPrio(false); setShowBoardMenu(false); };
  const openLabels = () => { clearTimeout(labelTimerRef.current); closeAll(); labelTimerRef.current = setTimeout(() => setShowLabels(true), 250); };
  const closeLabels = () => { clearTimeout(labelTimerRef.current); labelTimerRef.current = setTimeout(() => setShowLabels(false), 150); };
  const openMove = () => { clearTimeout(moveTimerRef.current); closeAll(); moveTimerRef.current = setTimeout(() => setShowMoveMenu(true), 250); };
  const closeMove = () => { clearTimeout(moveTimerRef.current); moveTimerRef.current = setTimeout(() => setShowMoveMenu(false), 150); };
  const openPrio = () => { clearTimeout(prioTimerRef.current); closeAll(); prioTimerRef.current = setTimeout(() => setShowPrio(true), 250); };
  const closePrio = () => { clearTimeout(prioTimerRef.current); prioTimerRef.current = setTimeout(() => setShowPrio(false), 150); };
  const openBoard = () => { clearTimeout(boardTimerRef.current); closeAll(); boardTimerRef.current = setTimeout(() => setShowBoardMenu(true), 250); };
  const closeBoard = () => { clearTimeout(boardTimerRef.current); boardTimerRef.current = setTimeout(() => setShowBoardMenu(false), 150); };

  // Position the main menu, with max height for scrollability
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x + 8, y: position.y - 8 });
  const [openDir, setOpenDir] = useState('right');
  const [maxH, setMaxH] = useState(undefined);
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = position.x + 8;
    let y = position.y - 8;
    if (x + rect.width > vw - 8) x = position.x - rect.width - 8;
    if (y + rect.height > vh - 8) y = vh - rect.height - 8;
    if (y < 8) y = 8;
    if (x < 8) x = 8;
    setAdjustedPos({ x, y });
    setMaxH(vh - y - 8);
    setOpenDir(x + rect.width + 180 < vw ? 'right' : 'left');
  }, [position.x, position.y]);

  // Compute fixed submenu position from trigger button ref
  const getSubmenuPos = (btnRef) => {
    if (!btnRef.current || !menuRef.current) return {};
    const btnRect = btnRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    let top = btnRect.top;
    if (openDir === 'right') {
      let left = menuRect.right + 4;
      if (top + 200 > vh) top = Math.max(8, vh - 200);
      return { position: 'fixed', left, top, zIndex: 210 };
    } else {
      let right = window.innerWidth - menuRect.left + 4;
      if (top + 200 > vh) top = Math.max(8, vh - 200);
      return { position: 'fixed', right, top, zIndex: 210 };
    }
  };

  const style = {
    position: 'fixed',
    left: adjustedPos.x,
    top: adjustedPos.y,
    zIndex: 200,
    maxHeight: maxH,
    overflowY: 'auto',
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

      {/* Priority submenu */}
      <div
        ref={prioBtnRef}
        onMouseEnter={openPrio}
        onMouseLeave={closePrio}
      >
        <button
          onClick={() => { setShowPrio(s => !s); setShowLabels(false); setShowMoveMenu(false); }}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          Prioritet
          {task.priority && (
            <span className="ml-1 w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_FLAG_COLORS[task.priority] }} />
          )}
          <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${showPrio ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      {showPrio && (
        <div
          style={getSubmenuPos(prioBtnRef)}
          className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[150px]"
          onMouseEnter={() => { clearTimeout(prioTimerRef.current); }}
          onMouseLeave={closePrio}
        >
          {PRIORITIES.map(p => {
            const active = task.priority === p;
            return (
              <button
                key={p}
                onClick={() => { onSetPriority(task.id, p); onClose(); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PRIORITY_FLAG_COLORS[p] }} />
                <span className={`text-xs ${active ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{p}</span>
                {active && (
                  <svg className="w-3.5 h-3.5 text-indigo-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                )}
              </button>
            );
          })}
          {task.priority && (
            <>
              <div className="border-t border-gray-100 my-0.5" />
              <button
                onClick={() => { onSetPriority(task.id, ''); onClose(); }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="w-3 h-3 rounded-full shrink-0 border border-gray-300" />
                Ingen prioritet
              </button>
            </>
          )}
        </div>
      )}

      {/* Labels submenu */}
      <div
        ref={labelBtnRef}
        onMouseEnter={openLabels}
        onMouseLeave={closeLabels}
      >
        <button
          onClick={() => { setShowLabels(s => !s); setShowMoveMenu(false); }}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          Etiketter
          <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${showLabels ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      {showLabels && (
        <div
          style={getSubmenuPos(labelBtnRef)}
          className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[160px] max-h-[60vh] overflow-y-auto"
          onMouseEnter={() => { clearTimeout(labelTimerRef.current); }}
          onMouseLeave={closeLabels}
        >
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

      {/* Move to column submenu */}
      <div
        ref={moveBtnRef}
        onMouseEnter={openMove}
        onMouseLeave={closeMove}
      >
        <button
          onClick={() => { setShowMoveMenu(s => !s); setShowLabels(false); }}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          Flytta till
          <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${showMoveMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      {showMoveMenu && (
        <div
          style={getSubmenuPos(moveBtnRef)}
          className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px] max-h-[60vh] overflow-y-auto"
          onMouseEnter={() => { clearTimeout(moveTimerRef.current); }}
          onMouseLeave={closeMove}
        >
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

      {/* Move to board submenu */}
      {boards.length > 0 && onMoveToBoard && (
        <>
          <div
            ref={boardBtnRef}
            onMouseEnter={openBoard}
            onMouseLeave={closeBoard}
          >
            <button
              onClick={() => { setShowBoardMenu(s => !s); setShowLabels(false); setShowMoveMenu(false); setShowPrio(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
              Flytta till board
              <svg className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${showBoardMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          {showBoardMenu && (
            <div
              style={getSubmenuPos(boardBtnRef)}
              className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[160px] max-h-[60vh] overflow-y-auto"
              onMouseEnter={() => { clearTimeout(boardTimerRef.current); }}
              onMouseLeave={closeBoard}
            >
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => { onMoveToBoard(task.id, b.id); onClose(); }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  {b.icon && <span className="text-sm">{b.icon}</span>}
                  <span className="text-xs truncate">{b.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

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
