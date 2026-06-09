import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { uid } from '../utils/helpers';
import { PRIORITIES, PRIORITY_FLAG_COLORS } from '../utils/constants';

/* ─── helpers ─── */
const DOT_BG_LIGHT = {
  backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};
const DOT_BG_DARK = {
  backgroundImage: 'radial-gradient(circle, #4b5563 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

function compressImage(dataUrl, maxDim = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxDim || h > maxDim) {
        const r = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
const LABEL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4'];
const STICKY_COLORS = ['#fde68a', '#fed7aa', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#99f6e4', '#fecaca'];
const STICKY_COLOR_NAMES = ['Gul', 'Orange', 'Blå', 'Grön', 'Rosa', 'Lila', 'Turkos', 'Röd'];
const RELATION_TYPES = ['relates', 'parent', 'child', 'blocks', 'blocked-by'];
const RELATION_LABELS = { relates: 'Relaterad', parent: 'Förälder', child: 'Barn', blocks: 'Blockerar', 'blocked-by': 'Blockerad av' };
const RELATION_STYLES = {
  relates: { stroke: '#a5b4fc', dash: '' },
  parent: { stroke: '#6366f1', dash: '' },
  child: { stroke: '#6366f1', dash: '6 3' },
  blocks: { stroke: '#ef4444', dash: '' },
  'blocked-by': { stroke: '#f97316', dash: '6 3' },
};

/* ─── SVG connection line with label & relation type ─── */
function ConnectionLine({ conn, nodes, onDelete, onEditLabel, dark }) {
  const { from, to, label, relationType } = conn;
  const a = nodes.find(n => n.id === from);
  const b = nodes.find(n => n.id === to);
  if (!a || !b) return null;
  const getWH = (n) => {
    const w = n.w || (n.type === 'image' ? 200 : n.type === 'freetext' ? 100 : n.type === 'sticky' ? 160 : 240);
    const h = n.h || (n.type === 'image' ? 100 : n.type === 'freetext' ? 20 : n.type === 'sticky' ? 120 : 80);
    return { w, h };
  };
  const ad = getWH(a), bd = getWH(b);
  const x1 = a.x + ad.w / 2, y1 = a.y + ad.h;
  const x2 = b.x + bd.w / 2, y2 = b.y + bd.h;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const cx = mx + dy * 0.15, cy = my - dx * 0.15;
  const style = RELATION_STYLES[relationType] || RELATION_STYLES.relates;
  const isBlocking = relationType === 'blocks' || relationType === 'blocked-by';
  return (
    <g className="group/conn">
      <path d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`} fill="none" stroke={style.stroke} strokeWidth="2.5" strokeDasharray={style.dash} className="transition-colors group-hover/conn:stroke-indigo-500" />
      {isBlocking ? (
        <rect x={x2 - 5} y={y2 - 5} width="10" height="10" fill={style.stroke} className="transition-colors group-hover/conn:fill-indigo-500" />
      ) : (
        <circle cx={x2} cy={y2} r="4" fill={style.stroke} className="transition-colors group-hover/conn:fill-indigo-500" />
      )}
      {relationType === 'parent' && <circle cx={x1} cy={y1} r="3" fill={style.stroke} stroke="white" strokeWidth="1" />}
      {/* Label on connection */}
      {label && (
        <g transform={`translate(${mx + dy * 0.07},${my - dx * 0.07 - 12})`}>
          <rect x="-30" y="-8" width="60" height="16" rx="4" fill={dark ? '#25262b' : 'white'} stroke={dark ? '#4b5563' : '#e5e7eb'} strokeWidth="1" />
          <text textAnchor="middle" dy="4" fontSize="10" fill={dark ? '#e4e4e7' : '#6b7280'} fontWeight="500">{label.length > 10 ? label.slice(0, 10) + '…' : label}</text>
        </g>
      )}
      {/* Edit label + delete buttons */}
      <g transform={`translate(${mx},${my})`} className="cursor-pointer opacity-0 group-hover/conn:opacity-100 transition-opacity">
        {onEditLabel && (
          <g transform="translate(-14, 0)" onClick={e => { e.stopPropagation(); onEditLabel(conn); }}>
            <circle r="10" fill={dark ? '#35363c' : 'white'} stroke={dark ? '#4b5563' : '#e5e7eb'} strokeWidth="1.5" />
            <text textAnchor="middle" dy="3.5" fontSize="10" fill="#6366f1" fontWeight="bold">✎</text>
          </g>
        )}
        {onDelete && (
          <g transform="translate(14, 0)" onClick={e => { e.stopPropagation(); onDelete(from, to); }}>
            <circle r="10" fill={dark ? '#35363c' : 'white'} stroke={dark ? '#4b5563' : '#e5e7eb'} strokeWidth="1.5" />
            <text textAnchor="middle" dy="4.5" fontSize="13" fill="#ef4444" fontWeight="bold">×</text>
          </g>
        )}
      </g>
    </g>
  );
}

/* ─── Resize handle ─── */
function ResizeHandle({ nodeId, side, zoom, onResize }) {
  const cursors = { se: 'nwse-resize', sw: 'nesw-resize', ne: 'nesw-resize', nw: 'nwse-resize', e: 'ew-resize', s: 'ns-resize' };
  const posClass = {
    se: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    e: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
    s: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
  };
  const onDown = (e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const onMv = (ev) => onResize(nodeId, side, (ev.clientX - startX) / zoom, (ev.clientY - startY) / zoom);
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv);
    window.addEventListener('pointerup', onUp);
  };
  return (
    <div
      className={`absolute w-3 h-3 bg-indigo-500 rounded-full opacity-0 group-hover/node:opacity-60 hover:!opacity-100 z-20 ${posClass[side] || ''}`}
      style={{ cursor: cursors[side] || 'nwse-resize' }}
      onPointerDown={onDown}
    />
  );
}

/* ─── Inline editable text ─── */
function InlineEdit({ value, onChange, placeholder, className, multiline, style }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select?.(); } }, [editing]);
  const commit = () => { setEditing(false); if (draft !== value) onChange(draft); };
  if (editing) {
    if (multiline) {
      return <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} className={`${className} bg-white/80 dark:bg-gray-700/80 border border-indigo-300 rounded px-1 py-0.5 outline-none resize-none`} style={style} rows={3} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} />;
    }
    return <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} className={`${className} bg-white/80 dark:bg-gray-700/80 border border-indigo-300 rounded px-1 py-0.5 outline-none`} style={style} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} />;
  }
  return (
    <div className={`${className} cursor-text rounded px-1 py-0.5 hover:bg-gray-50/60 dark:hover:bg-gray-600/30 transition-colors`} style={style} onClick={e => { e.stopPropagation(); setEditing(true); }} onPointerDown={e => e.stopPropagation()}>
      {value || <span className="text-gray-300 dark:text-gray-500 italic">{placeholder}</span>}
    </div>
  );
}

/* ─── Lock indicator ─── */
function LockBadge({ locked }) {
  if (!locked) return null;
  return (
    <div className="absolute top-1 right-1 z-30 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center" title="Låst">
      <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
    </div>
  );
}

/* ─── Node context menu ─── */
function NodeContextMenu({ pos, node, onClose, onEdit, onDelete, onDuplicate, onChangeColor, onToggleLock, onAddChild, groups, onAddToGroup, onRemoveFromGroup }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', h); window.addEventListener('keydown', k);
    return () => { window.removeEventListener('mousedown', h); window.removeEventListener('keydown', k); };
  }, [onClose]);
  return (
    <div ref={ref} className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1 min-w-[170px] z-[250] animate-in fade-in" style={{ left: pos.x, top: pos.y }}>
      <button onClick={() => { onEdit(node); onClose(); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        Redigera
      </button>
      <button onClick={() => { onDuplicate(node); onClose(); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Duplicera
      </button>
      {onAddChild && (
        <button onClick={() => { onAddChild(node.id); onClose(); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Lägg till undernod
        </button>
      )}
      <button onClick={() => { onToggleLock(node.id); onClose(); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        {node.locked ? 'Lås upp' : 'Lås'}
      </button>
      <div className="px-3 py-2">
        <p className="text-[10px] font-medium text-gray-400 mb-1.5">Färg</p>
        <div className="flex flex-wrap gap-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => { onChangeColor(node.id, c); onClose(); }} className={`w-5 h-5 rounded-full hover:scale-125 transition-transform ${node.color === c ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      {groups && groups.length > 0 && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
          <div className="px-3 py-1">
            <p className="text-[10px] font-medium text-gray-400 mb-1">Grupp</p>
            {node.groupId ? (
              <button onClick={() => { onRemoveFromGroup(node.id); onClose(); }} className="text-xs text-red-500 hover:text-red-700">Ta bort från grupp</button>
            ) : (
              groups.map(g => (
                <button key={g.id} onClick={() => { onAddToGroup(node.id, g.id); onClose(); }} className="w-full text-left text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-1 py-1 rounded">{g.title || 'Namnlös grupp'}</button>
              ))
            )}
          </div>
        </>
      )}
      <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
      <button onClick={() => { onDelete(node.id); onClose(); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Ta bort
      </button>
    </div>
  );
}

/* ─── Box node ─── */
function BoxNode({ node, selected, onSelect, onMove, onDoubleClick, connecting, onStartConnect, zoom, onResize, onInlineChange, onContextMenu, onToggleCollapse, childCount }) {
  const startRef = useRef(null);
  const onPointerDown = (e) => {
    if (e.button !== 0 || node.locked) return;
    e.stopPropagation();
    onSelect(node.id);
    startRef.current = { x: e.clientX, y: e.clientY, ox: node.x, oy: node.y };
    const onMv = (ev) => {
      const s = startRef.current;
      onMove(node.id, s.ox + (ev.clientX - s.x) / zoom, s.oy + (ev.clientY - s.y) / zoom);
    };
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv); window.addEventListener('pointerup', onUp);
  };
  const color = node.color || '#6366f1';
  const w = node.w || 240;
  const collapsed = node.collapsed && childCount > 0;
  return (
    <div
      className={`group/node absolute select-none rounded-xl border-2 shadow-lg bg-white dark:bg-gray-800 transition-shadow hover:shadow-xl ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''} ${node.locked ? 'opacity-90' : ''}`}
      style={{ left: node.x, top: node.y, width: w, minHeight: 80, borderColor: color + '60', zIndex: selected ? 10 : 1 }}
      onPointerDown={onPointerDown}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node); }}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
    >
      <LockBadge locked={node.locked} />
      <div className="h-1.5 rounded-t-[10px]" style={{ background: color }} />
      <div className="px-3 py-2">
        <div className="flex items-center gap-1">
          {childCount > 0 && (
            <button onClick={e => { e.stopPropagation(); onToggleCollapse(node.id); }} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
              <svg className={`w-3 h-3 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          )}
          <InlineEdit value={node.title || ''} onChange={v => onInlineChange(node.id, 'title', v)} placeholder="Namnlös" className="text-sm font-semibold text-gray-800 dark:text-gray-100 w-full truncate" />
        </div>
        {!collapsed && (
          <>
            <InlineEdit value={node.text || ''} onChange={v => onInlineChange(node.id, 'text', v)} placeholder="Lägg till beskrivning..." className="text-xs text-gray-500 dark:text-gray-400 mt-1 w-full line-clamp-3 whitespace-pre-wrap" multiline />
            {node.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {node.labels.map(l => <span key={l.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: l.color }}>{l.name}</span>)}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              {node.linkedTasks?.length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  {node.linkedTasks.length}
                </span>
              )}
              {(node.files || []).length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                  {node.files.length}
                </span>
              )}
              {childCount > 0 && collapsed && (
                <span className="text-[10px] text-indigo-500 font-medium">{childCount} undernoder</span>
              )}
            </div>
          </>
        )}
      </div>
      <button className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-indigo-600 transition-all hover:scale-110" style={{ opacity: selected || connecting ? 1 : 0 }} onPointerDown={e => { e.stopPropagation(); onStartConnect(node.id); }} title="Koppla">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </button>
      {!node.locked && <><ResizeHandle nodeId={node.id} side="se" zoom={zoom} onResize={onResize} /><ResizeHandle nodeId={node.id} side="e" zoom={zoom} onResize={onResize} /><ResizeHandle nodeId={node.id} side="s" zoom={zoom} onResize={onResize} /></>}
    </div>
  );
}

/* ─── Freetext node ─── */
function FreetextNode({ node, selected, onSelect, onMove, onDoubleClick, zoom, onInlineChange, onContextMenu }) {
  const onPointerDown = (e) => {
    if (e.button !== 0 || node.locked) return;
    e.stopPropagation(); onSelect(node.id);
    const startX = e.clientX, startY = e.clientY, ox = node.x, oy = node.y;
    const onMv = (ev) => onMove(node.id, ox + (ev.clientX - startX) / zoom, oy + (ev.clientY - startY) / zoom);
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv); window.addEventListener('pointerup', onUp);
  };
  return (
    <div className={`group/node absolute select-none cursor-move ${selected ? 'ring-2 ring-indigo-400 ring-offset-2 rounded-lg' : ''}`} style={{ left: node.x, top: node.y, zIndex: selected ? 10 : 1 }} onPointerDown={onPointerDown} onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node); }} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}>
      <LockBadge locked={node.locked} />
      <InlineEdit value={node.text || ''} onChange={v => onInlineChange(node.id, 'text', v)} placeholder="Dubbelklicka för att skriva..." className="whitespace-pre-wrap font-medium" style={{ fontSize: node.fontSize || 16, color: node.color || '#374151', maxWidth: 400 }} multiline />
    </div>
  );
}

/* ─── Image node ─── */
function ImageNode({ node, selected, onSelect, onMove, onDoubleClick, onStartConnect, connecting, zoom, onResize, onContextMenu }) {
  const onPointerDown = (e) => {
    if (e.button !== 0 || node.locked) return;
    e.stopPropagation(); onSelect(node.id);
    const startX = e.clientX, startY = e.clientY, ox = node.x, oy = node.y;
    const onMv = (ev) => onMove(node.id, ox + (ev.clientX - startX) / zoom, oy + (ev.clientY - startY) / zoom);
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv); window.addEventListener('pointerup', onUp);
  };
  return (
    <div className={`group/node absolute select-none rounded-xl overflow-hidden shadow-lg border-2 border-white dark:border-gray-700 hover:shadow-xl transition-shadow ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`} style={{ left: node.x, top: node.y, zIndex: selected ? 10 : 1, width: node.w || 200 }} onPointerDown={onPointerDown} onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node); }} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}>
      <LockBadge locked={node.locked} />
      {node.image ? <img src={node.image} alt={node.title || ''} className="block w-full object-contain" style={{ maxHeight: 400 }} draggable={false} /> : <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs">Ingen bild</div>}
      {node.title && <div className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{node.title}</div>}
      <button className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-indigo-600" style={{ opacity: selected || connecting ? 1 : 0 }} onPointerDown={e => { e.stopPropagation(); onStartConnect(node.id); }} title="Koppla">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </button>
      {!node.locked && <><ResizeHandle nodeId={node.id} side="se" zoom={zoom} onResize={onResize} /><ResizeHandle nodeId={node.id} side="e" zoom={zoom} onResize={onResize} /></>}
    </div>
  );
}

/* ─── Sticky / Post-it node ─── */
function StickyNode({ node, selected, onSelect, onMove, onDoubleClick, zoom, onInlineChange, onContextMenu, onStartConnect, connecting }) {
  const onPointerDown = (e) => {
    if (e.button !== 0 || node.locked) return;
    e.stopPropagation(); onSelect(node.id);
    const startX = e.clientX, startY = e.clientY, ox = node.x, oy = node.y;
    const onMv = (ev) => onMove(node.id, ox + (ev.clientX - startX) / zoom, oy + (ev.clientY - startY) / zoom);
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv); window.addEventListener('pointerup', onUp);
  };
  const bg = node.stickyColor || '#fde68a';
  const w = node.w || 160;
  const h = node.h || 120;
  const hash = node.id ? node.id.charCodeAt(0) + node.id.charCodeAt(node.id.length - 1) : 0;
  const rotation = ((hash % 5) - 2) * 0.8;
  return (
    <div
      className={`group/node absolute select-none cursor-grab active:cursor-grabbing ${selected ? 'ring-2 ring-indigo-400 ring-offset-2 rounded' : ''}`}
      style={{ left: node.x, top: node.y, width: w, height: h, zIndex: selected ? 10 : 1, transform: `rotate(${rotation}deg)` }}
      onPointerDown={onPointerDown}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node); }}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
    >
      <LockBadge locked={node.locked} />
      <div className="w-full h-full relative p-3 shadow-md" style={{ background: `linear-gradient(175deg, ${bg}cc 0%, ${bg} 100%)`, boxShadow: '2px 3px 8px rgba(0,0,0,0.15)' }}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.06)' }} />
        <InlineEdit value={node.text || ''} onChange={v => onInlineChange(node.id, 'text', v)} placeholder="Skriv här..." className="text-sm font-medium text-gray-800 w-full h-full whitespace-pre-wrap" multiline />
      </div>
      <button className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] shadow-md hover:bg-indigo-600" style={{ opacity: selected || connecting ? 1 : 0 }} onPointerDown={e => { e.stopPropagation(); onStartConnect(node.id); }} title="Koppla">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </button>
      {!node.locked && <ResizeHandle nodeId={node.id} side="se" zoom={zoom} onResize={(id, side, dx, dy) => onInlineChange(id, '_resize', { dx, dy })} />}
    </div>
  );
}

/* ─── Frame (section) ─── */
function FrameNode({ node, selected, onSelect, onMove, zoom, onResize, onInlineChange, onContextMenu, onDoubleClick, children }) {
  const startRef = useRef(null);
  const onPointerDown = (e) => {
    if (e.button !== 0 || node.locked) return;
    if (e.target.closest('.frame-inner-content')) return;
    e.stopPropagation(); onSelect(node.id);
    startRef.current = { x: e.clientX, y: e.clientY, ox: node.x, oy: node.y };
    const onMv = (ev) => {
      const s = startRef.current;
      onMove(node.id, s.ox + (ev.clientX - s.x) / zoom, s.oy + (ev.clientY - s.y) / zoom, true);
    };
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv); window.addEventListener('pointerup', onUp);
  };
  const color = node.color || '#6366f1';
  const w = node.w || 500;
  const h = node.h || 400;
  return (
    <div
      className={`group/node absolute select-none rounded-2xl border-2 border-dashed ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
      style={{ left: node.x, top: node.y, width: w, height: h, borderColor: color + '60', background: color + '08', zIndex: 0 }}
      onPointerDown={onPointerDown}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node); }}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
    >
      <LockBadge locked={node.locked} />
      <div className="px-3 py-1.5 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <InlineEdit value={node.title || ''} onChange={v => onInlineChange(node.id, 'title', v)} placeholder="Frame-titel" className="text-sm font-bold" style={{ color }} />
      </div>
      {node.description && <p className="px-3 text-[10px] text-gray-400 dark:text-gray-500">{node.description}</p>}
      <div className="frame-inner-content absolute inset-0 top-8 pointer-events-none" />
      {!node.locked && (
        <>
          <ResizeHandle nodeId={node.id} side="se" zoom={zoom} onResize={onResize} />
          <ResizeHandle nodeId={node.id} side="e" zoom={zoom} onResize={onResize} />
          <ResizeHandle nodeId={node.id} side="s" zoom={zoom} onResize={onResize} />
        </>
      )}
    </div>
  );
}

/* ─── Group visual wrapper ─── */
function GroupOverlay({ group, nodes, selected, onSelect, onToggleCollapse, onContextMenu, zoom, onMove }) {
  const groupNodes = nodes.filter(n => n.groupId === group.id);
  if (groupNodes.length === 0) return null;
  const collapsed = group.collapsed;
  const padding = 20;
  const minX = Math.min(...groupNodes.map(n => n.x)) - padding;
  const minY = Math.min(...groupNodes.map(n => n.y)) - padding - 24;
  const maxX = Math.max(...groupNodes.map(n => n.x + (n.w || 240))) + padding;
  const maxY = Math.max(...groupNodes.map(n => n.y + (n.h || 100))) + padding;
  const color = group.color || '#6366f1';
  const startRef = useRef(null);
  const onPointerDown = (e) => {
    if (e.button !== 0 || group.locked) return;
    if (e.target.closest('.group-child')) return;
    e.stopPropagation(); onSelect(group.id);
    startRef.current = { x: e.clientX, y: e.clientY, nodes: groupNodes.map(n => ({ id: n.id, x: n.x, y: n.y })) };
    const onMv = (ev) => {
      const s = startRef.current;
      const dx = (ev.clientX - s.x) / zoom;
      const dy = (ev.clientY - s.y) / zoom;
      onMove(group.id, dx, dy, s.nodes);
    };
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv); window.addEventListener('pointerup', onUp);
  };
  return (
    <div
      className={`absolute rounded-xl border-2 ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
      style={{ left: minX, top: minY, width: maxX - minX, height: collapsed ? 32 : maxY - minY, borderColor: color + '40', background: color + '06', zIndex: 0, pointerEvents: 'none' }}
    >
      <div className="flex items-center gap-2 px-3 py-1" style={{ pointerEvents: 'auto' }} onPointerDown={onPointerDown} onContextMenu={e => { e.preventDefault(); onContextMenu(e, group); }}>
        <button onClick={e => { e.stopPropagation(); onToggleCollapse(group.id); }} className="p-0.5">
          <svg className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-90'}`} style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <span className="text-xs font-bold" style={{ color }}>{group.title || 'Grupp'}</span>
        <span className="text-[10px] text-gray-400">({groupNodes.length})</span>
        {group.locked && <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>}
      </div>
    </div>
  );
}

/* ─── Dispatch node type ─── */
function WhiteboardNode(props) {
  const { node } = props;
  if (node.type === 'frame') return <FrameNode {...props} />;
  if (node.type === 'freetext') return <FreetextNode {...props} />;
  if (node.type === 'image') return <ImageNode {...props} />;
  if (node.type === 'sticky') return <StickyNode {...props} />;
  return <BoxNode {...props} />;
}

/* ─── Mini-map ─── */
function MiniMap({ nodes, pan, zoom, canvasRect, onNavigate, visible }) {
  if (!visible || nodes.length === 0) return null;
  const allX = nodes.map(n => n.x);
  const allY = nodes.map(n => n.y);
  const allXe = nodes.map(n => n.x + (n.w || 240));
  const allYe = nodes.map(n => n.y + (n.h || 100));
  const worldMinX = Math.min(...allX) - 100;
  const worldMinY = Math.min(...allY) - 100;
  const worldMaxX = Math.max(...allXe) + 100;
  const worldMaxY = Math.max(...allYe) + 100;
  const worldW = worldMaxX - worldMinX;
  const worldH = worldMaxY - worldMinY;
  const mapW = 200, mapH = 140;
  const scale = Math.min(mapW / worldW, mapH / worldH);
  const vpX = canvasRect ? (-pan.x / zoom - worldMinX) * scale : 0;
  const vpY = canvasRect ? (-pan.y / zoom - worldMinY) * scale : 0;
  const vpW = canvasRect ? (canvasRect.width / zoom) * scale : 50;
  const vpH = canvasRect ? (canvasRect.height / zoom) * scale : 50;
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / scale + worldMinX;
    const my = (e.clientY - rect.top) / scale + worldMinY;
    onNavigate(mx, my);
  };
  return (
    <div className="absolute bottom-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-1.5 cursor-pointer" style={{ width: mapW + 12, height: mapH + 12 }} onClick={handleClick}>
      <svg width={mapW} height={mapH} className="block">
        {nodes.map(n => {
          const nx = (n.x - worldMinX) * scale;
          const ny = (n.y - worldMinY) * scale;
          const nw = Math.max(4, (n.w || 240) * scale);
          const nh = Math.max(3, (n.h || 80) * scale);
          const fill = n.type === 'frame' ? (n.color || '#6366f1') + '30' : (n.color || '#6366f1');
          return <rect key={n.id} x={nx} y={ny} width={nw} height={nh} rx="1" fill={fill} opacity={n.type === 'frame' ? 0.5 : 0.7} />;
        })}
        <rect x={vpX} y={vpY} width={Math.max(10, vpW)} height={Math.max(8, vpH)} fill="none" stroke="#6366f1" strokeWidth="1.5" rx="2" opacity="0.8" />
      </svg>
    </div>
  );
}

/* ─── Global search ─── */
function WhiteboardSearch({ open, onClose, nodes, onNavigateTo, tasks }) {
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => { if (open && ref.current) ref.current.focus(); }, [open]);
  if (!open) return null;
  const query = q.toLowerCase();
  const results = query ? nodes.filter(n => {
    if ((n.title || '').toLowerCase().includes(query)) return true;
    if ((n.text || '').toLowerCase().includes(query)) return true;
    if ((n.notes || '').toLowerCase().includes(query)) return true;
    if ((n.labels || []).some(l => l.name.toLowerCase().includes(query))) return true;
    if ((n.linkedTasks || []).some(tid => {
      const t = tasks.find(x => x.id === tid);
      return t && t.title.toLowerCase().includes(query);
    })) return true;
    return false;
  }).slice(0, 20) : [];
  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[200] w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Sök noder, anteckningar, etiketter, tasks..." className="flex-1 text-sm outline-none bg-transparent text-gray-800 dark:text-gray-200" onKeyDown={e => { if (e.key === 'Escape') onClose(); }} />
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>
      {query && (
        <div className="max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Inga resultat</p>
          ) : results.map(n => (
            <button key={n.id} onClick={() => { onNavigateTo(n); onClose(); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{n.title || n.text || 'Namnlös'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.type || 'box'}{n.labels?.length ? ` · ${n.labels.map(l => l.name).join(', ')}` : ''}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Template library ─── */
const TEMPLATES = [
  { id: 'empty', name: 'Tom', icon: '📄', nodes: [], connections: [] },
  { id: 'brainstorm', name: 'Brainstorming', icon: '💡', generate: () => {
    const center = { id: uid(), type: 'box', x: 400, y: 300, title: 'Huvudidé', text: 'Beskriv ämnet här', color: '#6366f1', w: 240 };
    const ideas = ['Idé 1', 'Idé 2', 'Idé 3', 'Idé 4', 'Idé 5'].map((t, i) => {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return { id: uid(), type: 'sticky', x: 400 + Math.cos(angle) * 300, y: 300 + Math.sin(angle) * 250, text: t, stickyColor: STICKY_COLORS[i % STICKY_COLORS.length], w: 140, h: 100 };
    });
    return { nodes: [center, ...ideas], connections: ideas.map(n => ({ from: center.id, to: n.id, relationType: 'relates' })) };
  }},
  { id: 'project', name: 'Projektplan', icon: '📋', generate: () => {
    const phases = ['Planering', 'Design', 'Utveckling', 'Test', 'Lansering'];
    const nodes = phases.map((t, i) => ({ id: uid(), type: 'box', x: 100 + i * 280, y: 200, title: t, text: `Fas ${i + 1}`, color: COLORS[i], w: 220 }));
    const conns = nodes.slice(0, -1).map((n, i) => ({ from: n.id, to: nodes[i + 1].id, relationType: 'relates', label: 'Nästa' }));
    return { nodes, connections: conns };
  }},
  { id: 'roadmap', name: 'Roadmap', icon: '🗺️', generate: () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const frames = quarters.map((q, i) => ({ id: uid(), type: 'frame', x: 50 + i * 350, y: 50, title: q, color: COLORS[i], w: 320, h: 400 }));
    const items = quarters.flatMap((q, qi) => [1, 2, 3].map((n, ni) => ({ id: uid(), type: 'box', x: 70 + qi * 350, y: 100 + ni * 110, title: `${q} - Mål ${n}`, text: '', color: COLORS[qi], w: 280 })));
    return { nodes: [...frames, ...items], connections: [] };
  }},
  { id: 'swot', name: 'SWOT', icon: '📊', generate: () => {
    const cats = [
      { title: 'Styrkor', color: '#10b981', x: 50, y: 50 },
      { title: 'Svagheter', color: '#ef4444', x: 350, y: 50 },
      { title: 'Möjligheter', color: '#3b82f6', x: 50, y: 320 },
      { title: 'Hot', color: '#f97316', x: 350, y: 320 },
    ];
    const frames = cats.map(c => ({ id: uid(), type: 'frame', ...c, w: 280, h: 250, description: '' }));
    const stickies = cats.map((c, i) => ({ id: uid(), type: 'sticky', x: c.x + 20, y: c.y + 40, text: `Ange ${c.title.toLowerCase()}...`, stickyColor: STICKY_COLORS[i], w: 120, h: 80 }));
    return { nodes: [...frames, ...stickies], connections: [] };
  }},
  { id: 'journey', name: 'Kundresa', icon: '🧭', generate: () => {
    const steps = ['Medvetenhet', 'Övervägande', 'Beslut', 'Köp', 'Lojalitet'];
    const nodes = steps.map((s, i) => ({ id: uid(), type: 'box', x: 100 + i * 250, y: 200, title: s, text: 'Beskriv steg...', color: COLORS[i], w: 200 }));
    const conns = nodes.slice(0, -1).map((n, i) => ({ from: n.id, to: nodes[i + 1].id, relationType: 'relates', label: '→' }));
    return { nodes, connections: conns };
  }},
  { id: 'orgchart', name: 'Organisationskarta', icon: '🏢', generate: () => {
    const ceo = { id: uid(), type: 'box', x: 350, y: 50, title: 'VD', text: '', color: '#6366f1', w: 200 };
    const depts = ['Teknik', 'Marknadsföring', 'Försäljning'].map((t, i) => ({ id: uid(), type: 'box', x: 100 + i * 300, y: 200, title: t, text: '', color: COLORS[i + 1], w: 200 }));
    const conns = depts.map(d => ({ from: ceo.id, to: d.id, relationType: 'parent' }));
    return { nodes: [ceo, ...depts], connections: conns };
  }},
];

function TemplateModal({ open, onClose, onApply }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Mallbibliotek</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => { onApply(t); onClose(); }} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left">
              <span className="text-2xl block mb-2">{t.icon}</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Connection label edit modal ─── */
function ConnectionEditModal({ conn, open, onClose, onSave }) {
  const [label, setLabel] = useState('');
  const [relType, setRelType] = useState('relates');
  useEffect(() => {
    if (conn && open) { setLabel(conn.label || ''); setRelType(conn.relationType || 'relates'); }
  }, [conn, open]);
  if (!open || !conn) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Redigera koppling</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Etikett</label>
            <input value={label} onChange={e => setLabel(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" placeholder="Beskrivning av relationen..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Relationstyp</label>
            <div className="flex flex-wrap gap-1.5">
              {RELATION_TYPES.map(rt => (
                <button key={rt} onClick={() => setRelType(rt)} className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${relType === rt ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {RELATION_LABELS[rt]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600">Avbryt</button>
          <button onClick={() => { onSave({ ...conn, label, relationType: relType }); onClose(); }} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600">Spara</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Node detail modal ─── */
function NodeDetailModal({ node, open, onClose, onSave, onDelete, tasks, columns, onCreateTask, onLinkTask, wbLabels, onUpdateLabels }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [fontSize, setFontSize] = useState(16);
  const [labels, setLabels] = useState([]);
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState('');
  const [stickyColor, setStickyColor] = useState('#fde68a');
  const [description, setDescription] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');

  useEffect(() => {
    if (node && open) {
      setTitle(node.title || ''); setText(node.text || ''); setNotes(node.notes || '');
      setColor(node.color || '#6366f1'); setFontSize(node.fontSize || 16);
      setLabels(node.labels || []); setFiles(node.files || []); setImage(node.image || '');
      setStickyColor(node.stickyColor || '#fde68a'); setDescription(node.description || '');
    }
  }, [node?.id, open]);

  if (!open || !node) return null;
  const isBox = !node.type || node.type === 'box';
  const isFreetext = node.type === 'freetext';
  const isImage = node.type === 'image';
  const isSticky = node.type === 'sticky';
  const isFrame = node.type === 'frame';
  const linkedTaskIds = node.linkedTasks || [];
  const linkedTasks = tasks.filter(t => linkedTaskIds.includes(t.id));
  const availableTasks = tasks.filter(t => !linkedTaskIds.includes(t.id) && t.title.toLowerCase().includes(linkSearch.toLowerCase()));
  const lastCol = columns[columns.length - 1];

  const save = () => {
    onSave({ ...node, title, text, notes, color, fontSize, labels, files, image, stickyColor, description });
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Max filstorlek: 10 MB'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target.result;
      if (file.type?.startsWith('image/')) {
        const compressed = await compressImage(raw, 800, 0.7);
        if (isImage) setImage(compressed);
        else setFiles(f => [...f, { id: uid(), name: file.name, type: file.type, data: compressed, size: file.size }]);
      } else {
        if (raw.length > 2 * 1024 * 1024) { alert('Filen är för stor (max ~2 MB)'); return; }
        setFiles(f => [...f, { id: uid(), name: file.name, type: file.type, data: raw, size: file.size }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    const nl = { id: uid(), name: newLabelName.trim(), color: newLabelColor };
    setLabels(l => [...l, nl]);
    if (!wbLabels.some(l => l.name === nl.name && l.color === nl.color)) onUpdateLabels([...wbLabels, nl]);
    setNewLabelName('');
  };

  const toggleWbLabel = (l) => setLabels(prev => prev.some(x => x.id === l.id) ? prev.filter(x => x.id !== l.id) : [...prev, l]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isFrame ? 'Redigera frame' : isSticky ? 'Redigera post-it' : isFreetext ? 'Redigera text' : isImage ? 'Redigera bild' : 'Redigera box'}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { onDelete(node.id); onClose(); }} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg">Ta bort</button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {isImage && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Bild</label>
              {image && <img src={image} alt="" className="max-h-48 rounded-lg mb-2 object-contain" />}
              <label className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {image ? 'Byt bild' : 'Ladda upp bild'}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
          {!isFreetext && <div><label className="block text-xs font-medium text-gray-500 mb-1">Titel</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-300" placeholder="Namnge..." /></div>}
          {isFrame && <div><label className="block text-xs font-medium text-gray-500 mb-1">Beskrivning</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" placeholder="Beskriv sektionen..." /></div>}
          {isSticky && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Post-it färg</label>
              <div className="flex gap-2">
                {STICKY_COLORS.map((c, i) => (
                  <button key={c} onClick={() => setStickyColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all ${stickyColor === c ? 'border-gray-800 dark:border-gray-200 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} title={STICKY_COLOR_NAMES[i]} />
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Färg</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-gray-800' : ''} hover:scale-110 transition-transform`} style={{ background: c }} />)}
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border-0 p-0" />
            </div>
          </div>
          {!isFrame && <div><label className="block text-xs font-medium text-gray-500 mb-1">{isFreetext || isSticky ? 'Text' : 'Kort beskrivning'}</label><textarea value={text} onChange={e => setText(e.target.value)} rows={isFreetext || isSticky ? 4 : 3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-300" /></div>}
          {isFreetext && (
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Textstorlek</label>
              <div className="flex items-center gap-2"><input type="range" min="10" max="48" value={fontSize} onChange={e => setFontSize(+e.target.value)} className="flex-1" /><span className="text-xs text-gray-500 w-8 text-right">{fontSize}px</span></div>
            </div>
          )}
          {isBox && <div><label className="block text-xs font-medium text-gray-500 mb-1">Detaljerade anteckningar</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-300" /></div>}
          {isBox && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Etiketter</label>
              {wbLabels.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">{wbLabels.map(l => { const active = labels.some(x => x.id === l.id); return <button key={l.id} onClick={() => toggleWbLabel(l)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${active ? 'text-white ring-1 ring-offset-1 ring-gray-400' : 'text-white opacity-50 hover:opacity-80'}`} style={{ background: l.color }}>{l.name}</button>; })}</div>}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">{LABEL_COLORS.map(c => <button key={c} onClick={() => setNewLabelColor(c)} className={`w-5 h-5 rounded-full ${newLabelColor === c ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`} style={{ background: c }} />)}</div>
                <input value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="Ny etikett..." className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" onKeyDown={e => e.key === 'Enter' && addLabel()} />
                <button onClick={addLabel} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0">Lägg till</button>
              </div>
            </div>
          )}
          {isBox && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Filer & bilder</label>
              {files.length > 0 && <div className="space-y-1.5 mb-2">{files.map(f => (
                <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 group">
                  {f.type?.startsWith('image/') ? <img src={f.data} alt="" className="w-10 h-10 rounded object-cover shrink-0" /> : <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>}
                  <span className="text-xs text-gray-700 dark:text-gray-200 flex-1 truncate">{f.name}</span>
                  <span className="text-[10px] text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => setFiles(ff => ff.filter(x => x.id !== f.id))} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 shrink-0"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              ))}</div>}
              <label className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>Ladda upp<input type="file" onChange={handleFileUpload} className="hidden" /></label>
            </div>
          )}
          {isBox && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Kopplade tasks</label>
              {linkedTasks.length > 0 && <div className="space-y-1.5 mb-3">{linkedTasks.map(t => {
                const pColor = PRIORITY_FLAG_COLORS[t.priority] || '#9ca3af';
                const done = t.status === lastCol;
                return (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 group">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pColor }} />
                    <span className={`text-sm flex-1 truncate ${done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{t.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{t.status}</span>
                    <button onClick={() => onLinkTask(node.id, t.id, false)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 shrink-0"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                  </div>
                );
              })}</div>}
              <input value={linkSearch} onChange={e => setLinkSearch(e.target.value)} placeholder="Sök och koppla en task..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-300 mb-1" />
              {linkSearch && availableTasks.length > 0 && <div className="max-h-32 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg">{availableTasks.slice(0, 8).map(t => <button key={t.id} onClick={() => { onLinkTask(node.id, t.id, true); setLinkSearch(''); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_FLAG_COLORS[t.priority] || '#9ca3af' }} /><span className="truncate">{t.title}</span><span className="text-[10px] text-gray-400 ml-auto shrink-0">{t.status}</span></button>)}</div>}
              <button onClick={() => onCreateTask(node.id)} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>Skapa ny task kopplad till denna box</button>
            </div>
          )}
          <button onClick={save} className="w-full px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors">Spara</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Task side panel ─── */
function TaskSidePanel({ open, nodes, tasks, columns, onClose, onOpenTask }) {
  if (!open) return null;
  const lastCol = columns[columns.length - 1];
  const allLinkedIds = new Set();
  nodes.forEach(n => (n.linkedTasks || []).forEach(id => allLinkedIds.add(id)));
  const linkedTasks = tasks.filter(t => allLinkedIds.has(t.id));
  const byStatus = {};
  columns.forEach(c => { byStatus[c] = []; });
  linkedTasks.forEach(t => { if (byStatus[t.status]) byStatus[t.status].push(t); });
  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-30 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Kopplade tasks ({linkedTasks.length})</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>
      <div className="p-3 space-y-3">
        {columns.map(col => {
          const ct = byStatus[col] || [];
          if (ct.length === 0) return null;
          return (
            <div key={col}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{col} ({ct.length})</p>
              <div className="space-y-1">
                {ct.map(t => {
                  const pColor = PRIORITY_FLAG_COLORS[t.priority] || '#9ca3af';
                  const done = t.status === lastCol;
                  return (
                    <button key={t.id} onClick={() => onOpenTask?.(t)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-left transition-colors">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pColor }} />
                      <span className={`text-xs flex-1 truncate ${done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200 font-medium'}`}>{t.title}</span>
                      {t.priority && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ color: pColor, background: pColor + '18' }}>{t.priority}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {linkedTasks.length === 0 && <p className="text-center text-gray-400 text-xs py-8">Inga tasks kopplade</p>}
      </div>
    </div>
  );
}

/* ─── Zoom control ─── */
function ZoomControl({ zoom, setZoom }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const pct = Math.round(zoom * 100);
  const presets = [25, 50, 75, 100, 150, 200];
  const commit = () => { const n = parseInt(val, 10); if (n >= 10 && n <= 400) setZoom(n / 100); setEditing(false); };
  return (
    <div className="relative flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-1 py-0.5">
      <button onClick={() => setZoom(z => Math.max(0.1, z - 0.15))} className="px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">−</button>
      {editing ? (
        <input autoFocus value={val} onChange={e => setVal(e.target.value.replace(/\D/g, ''))} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className="w-12 text-center text-[10px] font-medium bg-white dark:bg-gray-600 border border-indigo-300 rounded px-1 py-0.5 outline-none" />
      ) : (
        <button onClick={() => { setEditing(true); setVal(String(pct)); }} className="text-[10px] font-medium text-gray-500 w-12 text-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded py-0.5">{pct}%</button>
      )}
      <button onClick={() => setZoom(z => Math.min(4, z + 0.15))} className="px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">+</button>
      <div className="relative group">
        <button className="px-1.5 py-1 text-xs text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg></button>
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[80px] hidden group-hover:block z-50">
          {presets.map(p => <button key={p} onClick={() => setZoom(p / 100)} className={`w-full px-3 py-1.5 text-xs text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${pct === p ? 'font-bold text-indigo-600' : 'text-gray-600 dark:text-gray-300'}`}>{p}%</button>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Whiteboard component
   ═══════════════════════════════════════════ */
export default function Whiteboard({ data, updateBoard, onClose }) {
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [editNode, setEditNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [connectLine, setConnectLine] = useState(null);
  const [taskPanel, setTaskPanel] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [miniMapVisible, setMiniMapVisible] = useState(true);
  const [templateModal, setTemplateModal] = useState(false);
  const [editingConn, setEditingConn] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const isPanning = useRef(false);
  const resizeRef = useRef(null);
  const isDark = useIsDark();

  const wb = data.whiteboard || { nodes: [], connections: [], labels: [], groups: [] };
  const nodes = wb.nodes || [];
  const connections = wb.connections || [];
  const wbLabels = wb.labels || [];
  const groups = wb.groups || [];

  const updateWB = useCallback((fn) => {
    updateBoard(d => ({
      ...d,
      whiteboard: fn(d.whiteboard || { nodes: [], connections: [], labels: [], groups: [] }),
    }));
  }, [updateBoard]);

  // Child count for collapsible nodes
  const childCounts = useMemo(() => {
    const counts = {};
    connections.forEach(c => {
      if (c.relationType === 'parent') {
        counts[c.from] = (counts[c.from] || 0) + 1;
      }
    });
    return counts;
  }, [connections]);

  // Nodes inside frames
  const nodesInFrame = useMemo(() => {
    const map = {};
    const frames = nodes.filter(n => n.type === 'frame');
    nodes.forEach(n => {
      if (n.type === 'frame') return;
      for (const f of frames) {
        const fw = f.w || 500, fh = f.h || 400;
        if (n.x >= f.x && n.y >= f.y && n.x <= f.x + fw && n.y <= f.y + fh) {
          if (!map[f.id]) map[f.id] = [];
          map[f.id].push(n.id);
          break;
        }
      }
    });
    return map;
  }, [nodes]);

  // Pan
  const onCanvasPointerDown = (e) => {
    if (e.target !== canvasRef.current && !e.target.classList?.contains('wb-bg')) return;
    if (connecting) { setConnecting(null); setConnectLine(null); return; }
    setCtxMenu(null);

    // Multi-select with shift
    if (e.shiftKey) {
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      setSelectionBox({ x1: startX - rect.left, y1: startY - rect.top, x2: startX - rect.left, y2: startY - rect.top });
      const onMv = (ev) => {
        setSelectionBox(s => s ? { ...s, x2: ev.clientX - rect.left, y2: ev.clientY - rect.top } : s);
      };
      const onUp = (ev) => {
        window.removeEventListener('pointermove', onMv);
        window.removeEventListener('pointerup', onUp);
        setSelectionBox(sb => {
          if (!sb) return null;
          const bx1 = (Math.min(sb.x1, sb.x2) - pan.x) / zoom;
          const by1 = (Math.min(sb.y1, sb.y2) - pan.y) / zoom;
          const bx2 = (Math.max(sb.x1, sb.x2) - pan.x) / zoom;
          const by2 = (Math.max(sb.y1, sb.y2) - pan.y) / zoom;
          const sel = new Set();
          nodes.forEach(n => {
            const nw = n.w || 240, nh = n.h || 100;
            if (n.x + nw > bx1 && n.x < bx2 && n.y + nh > by1 && n.y < by2) sel.add(n.id);
          });
          setSelectedNodes(sel);
          return null;
        });
      };
      window.addEventListener('pointermove', onMv);
      window.addEventListener('pointerup', onUp);
      return;
    }

    setSelectedNodes(new Set());
    isPanning.current = true;
    const startX = e.clientX, startY = e.clientY;
    const origPan = { ...pan };
    const onMove = (ev) => {
      if (!isPanning.current) return;
      setPan({ x: origPan.x + (ev.clientX - startX), y: origPan.y + (ev.clientY - startY) });
    };
    const onUp = () => { isPanning.current = false; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  };

  // Wheel zoom/pan
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        setZoom(z => {
          const nz = Math.max(0.1, Math.min(4, z * delta));
          setPan(p => ({ x: mx - (mx - p.x) * (nz / z), y: my - (my - p.y) * (nz / z) }));
          return nz;
        });
      } else {
        setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Connect line tracking
  useEffect(() => {
    if (!connecting) return;
    const onMove = (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setConnectLine({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [connecting, pan, zoom]);

  // Node CRUD
  const addNode = (type = 'box') => {
    const id = uid();
    const rect = canvasRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 400;
    const cy = rect ? rect.height / 2 : 300;
    const x = (cx - pan.x) / zoom + (Math.random() - 0.5) * 100;
    const y = (cy - pan.y) / zoom + (Math.random() - 0.5) * 100;
    const base = { id, x, y, color: '#6366f1' };
    let newNode;
    if (type === 'freetext') newNode = { ...base, type: 'freetext', text: '', fontSize: 16 };
    else if (type === 'image') newNode = { ...base, type: 'image', title: '', image: '', w: 200 };
    else if (type === 'sticky') newNode = { ...base, type: 'sticky', text: '', stickyColor: '#fde68a', w: 160, h: 120 };
    else if (type === 'frame') newNode = { ...base, type: 'frame', title: '', description: '', w: 500, h: 400 };
    else newNode = { ...base, type: 'box', title: '', text: '', notes: '', linkedTasks: [], files: [], labels: [], w: 240 };
    updateWB(wb => ({ ...wb, nodes: [...wb.nodes, newNode] }));
    setSelectedNode(id);
    if (type !== 'frame') setTimeout(() => setEditNode(newNode), 50);
  };

  const moveNode = useCallback((id, x, y, isFrame) => {
    updateWB(wb => {
      const node = wb.nodes.find(n => n.id === id);
      if (!node) return wb;
      if (node.locked) return wb;
      const dx = x - node.x, dy = y - node.y;
      let updatedNodes = wb.nodes.map(n => n.id === id ? { ...n, x, y } : n);
      // If frame, move contained nodes
      if (isFrame && node.type === 'frame') {
        const contained = [];
        wb.nodes.forEach(n => {
          if (n.id === id || n.type === 'frame') return;
          const fw = node.w || 500, fh = node.h || 400;
          if (n.x >= node.x && n.y >= node.y && n.x <= node.x + fw && n.y <= node.y + fh) {
            contained.push(n.id);
          }
        });
        updatedNodes = updatedNodes.map(n => contained.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n);
      }
      return { ...wb, nodes: updatedNodes };
    });
  }, [updateWB]);

  const moveGroup = useCallback((groupId, dx, dy, startNodes) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.map(n => {
        const sn = startNodes.find(s => s.id === n.id);
        if (sn) return { ...n, x: sn.x + dx, y: sn.y + dy };
        return n;
      }),
    }));
  }, [updateWB]);

  const handleResize = useCallback((id, side, dx, dy) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.map(n => {
        if (n.id !== id) return n;
        if (!resizeRef.current || resizeRef.current.id !== id) {
          resizeRef.current = { id, w: n.w || (n.type === 'frame' ? 500 : n.type === 'image' ? 200 : n.type === 'sticky' ? 160 : 240), h: n.h || (n.type === 'frame' ? 400 : n.type === 'sticky' ? 120 : 0) };
        }
        const base = resizeRef.current;
        let w = n.w || base.w, h = n.h || base.h;
        if (side === 'se' || side === 'e') w = Math.max(100, base.w + dx);
        if (side === 'se' || side === 's') h = Math.max(60, base.h + dy);
        const updates = { w };
        if (side === 'se' || side === 's') updates.h = h;
        return { ...n, ...updates };
      }),
    }));
  }, [updateWB]);

  useEffect(() => {
    const onUp = () => { resizeRef.current = null; };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, []);

  const handleInlineChange = useCallback((id, field, value) => {
    if (field === '_resize') {
      handleResize(id, 'se', value.dx, value.dy);
      return;
    }
    updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === id ? { ...n, [field]: value } : n) }));
  }, [updateWB, handleResize]);

  const startConnect = (fromId) => {
    if (connecting) {
      if (fromId !== connecting && !connections.some(c => (c.from === connecting && c.to === fromId) || (c.from === fromId && c.to === connecting))) {
        updateWB(wb => ({ ...wb, connections: [...wb.connections, { from: connecting, to: fromId, label: '', relationType: 'relates' }] }));
      }
      setConnecting(null); setConnectLine(null);
    } else {
      setConnecting(fromId);
    }
  };

  const handleNodeSelect = (id) => {
    setCtxMenu(null);
    if (connecting && id !== connecting) {
      if (!connections.some(c => (c.from === connecting && c.to === id) || (c.from === id && c.to === connecting))) {
        updateWB(wb => ({ ...wb, connections: [...wb.connections, { from: connecting, to: id, label: '', relationType: 'relates' }] }));
      }
      setConnecting(null); setConnectLine(null);
    } else {
      setSelectedNode(id);
    }
  };

  const deleteConnection = (from, to) => {
    updateWB(wb => ({ ...wb, connections: wb.connections.filter(c => !(c.from === from && c.to === to)) }));
  };

  const updateConnection = (updatedConn) => {
    updateWB(wb => ({
      ...wb,
      connections: wb.connections.map(c => (c.from === updatedConn.from && c.to === updatedConn.to) ? updatedConn : c),
    }));
  };

  const deleteNode = (id) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.filter(n => n.id !== id),
      connections: wb.connections.filter(c => c.from !== id && c.to !== id),
    }));
    if (selectedNode === id) setSelectedNode(null);
  };

  const duplicateNode = (node) => {
    const id = uid();
    const copy = { ...node, id, x: node.x + 30, y: node.y + 30, linkedTasks: [], locked: false };
    updateWB(wb => ({ ...wb, nodes: [...wb.nodes, copy] }));
    setSelectedNode(id);
  };

  const changeNodeColor = (id, color) => updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === id ? { ...n, color } : n) }));

  const toggleLock = (id) => updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === id ? { ...n, locked: !n.locked } : n) }));

  const toggleCollapse = (id) => updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === id ? { ...n, collapsed: !n.collapsed } : n) }));

  const addChildNode = (parentId) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;
    const childId = uid();
    const child = { id: childId, type: 'box', x: parent.x + 50, y: parent.y + 150, title: '', text: '', color: parent.color || '#6366f1', w: 200, notes: '', linkedTasks: [], files: [], labels: [] };
    updateWB(wb => ({
      ...wb,
      nodes: [...wb.nodes, child],
      connections: [...wb.connections, { from: parentId, to: childId, relationType: 'parent', label: '' }],
    }));
    setSelectedNode(childId);
  };

  const saveNode = (updated) => updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === updated.id ? updated : n) }));

  const linkTask = (nodeId, taskId, add) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.map(n => n.id === nodeId ? { ...n, linkedTasks: add ? [...(n.linkedTasks || []), taskId] : (n.linkedTasks || []).filter(id => id !== taskId) } : n),
    }));
    if (editNode && editNode.id === nodeId) {
      setEditNode(prev => ({ ...prev, linkedTasks: add ? [...(prev.linkedTasks || []), taskId] : (prev.linkedTasks || []).filter(id => id !== taskId) }));
    }
  };

  const createTaskForNode = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    const firstStory = data.stories[0];
    if (!firstStory) return;
    const taskId = uid();
    const newTask = { id: taskId, title: node?.title ? `${node.title} — ny task` : 'Ny task', status: data.columns[0], storyId: firstStory.id, priority: '', labels: [], deadline: '', checklist: [], notes: '', files: [], comments: [], color: '' };
    updateBoard(d => ({
      ...d,
      tasks: [...d.tasks, newTask],
      whiteboard: {
        ...(d.whiteboard || { nodes: [], connections: [], labels: [], groups: [] }),
        nodes: (d.whiteboard?.nodes || []).map(n => n.id === nodeId ? { ...n, linkedTasks: [...(n.linkedTasks || []), taskId] } : n),
      },
    }));
    if (editNode && editNode.id === nodeId) setEditNode(prev => ({ ...prev, linkedTasks: [...(prev.linkedTasks || []), taskId] }));
  };

  const updateWbLabels = (newLabels) => updateWB(wb => ({ ...wb, labels: newLabels }));

  // Groups
  const createGroup = () => {
    if (selectedNodes.size < 2) return;
    const groupId = uid();
    const group = { id: groupId, title: 'Ny grupp', color: '#6366f1', collapsed: false, locked: false };
    updateWB(wb => ({
      ...wb,
      groups: [...(wb.groups || []), group],
      nodes: wb.nodes.map(n => selectedNodes.has(n.id) ? { ...n, groupId } : n),
    }));
    setSelectedNodes(new Set());
  };

  const addToGroup = (nodeId, groupId) => updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === nodeId ? { ...n, groupId } : n) }));
  const removeFromGroup = (nodeId) => updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === nodeId ? { ...n, groupId: undefined } : n) }));

  const toggleGroupCollapse = (groupId) => {
    updateWB(wb => ({
      ...wb,
      groups: (wb.groups || []).map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g),
    }));
  };

  const toggleGroupLock = (groupId) => {
    updateWB(wb => ({
      ...wb,
      groups: (wb.groups || []).map(g => g.id === groupId ? { ...g, locked: !g.locked } : g),
    }));
  };

  const deleteGroup = (groupId) => {
    updateWB(wb => ({
      ...wb,
      groups: (wb.groups || []).filter(g => g.id !== groupId),
      nodes: wb.nodes.map(n => n.groupId === groupId ? { ...n, groupId: undefined } : n),
    }));
  };

  // Apply template
  const applyTemplate = (template) => {
    const result = template.generate ? template.generate() : { nodes: [], connections: [] };
    updateWB(wb => ({
      ...wb,
      nodes: [...wb.nodes, ...result.nodes],
      connections: [...wb.connections, ...result.connections],
    }));
  };

  const fitView = () => {
    if (nodes.length === 0) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + (n.w || 260)));
    const maxY = Math.max(...nodes.map(n => n.y + (n.h || 120)));
    const w = maxX - minX + 100, h = maxY - minY + 100;
    const nz = Math.min(rect.width / w, rect.height / h, 1.5);
    setZoom(Math.max(0.2, nz));
    setPan({ x: (rect.width - w * nz) / 2 - minX * nz + 50 * nz, y: (rect.height - h * nz) / 2 - minY * nz + 50 * nz });
  };

  const navigateToNode = (node) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nw = node.w || 240, nh = node.h || 100;
    const targetZoom = 1;
    setZoom(targetZoom);
    setPan({ x: rect.width / 2 - (node.x + nw / 2) * targetZoom, y: rect.height / 2 - (node.y + nh / 2) * targetZoom });
    setSelectedNode(node.id);
  };

  const navigateToPoint = (worldX, worldY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPan({ x: rect.width / 2 - worldX * zoom, y: rect.height / 2 - worldY * zoom });
  };

  const handleNodeContextMenu = (e, node) => {
    setCtxMenu({ x: e.clientX, y: e.clientY, node });
    setSelectedNode(node.id);
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (ctxMenu) setCtxMenu(null);
        else if (searchOpen) setSearchOpen(false);
        else if (connecting) { setConnecting(null); setConnectLine(null); }
        else if (editNode) setEditNode(null);
        else onClose();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode && !editNode) deleteNode(selectedNode);
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setSearchOpen(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && selectedNodes.size >= 2) { e.preventDefault(); createGroup(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connecting, editNode, selectedNode, ctxMenu, searchOpen, selectedNodes, onClose]);

  // Two-way task sync: update whiteboard nodes when tasks change
  useEffect(() => {
    const taskMap = {};
    data.tasks.forEach(t => { taskMap[t.id] = t; });
    let needsUpdate = false;
    const updated = nodes.map(n => {
      if (!n.linkedTasks?.length) return n;
      const validIds = n.linkedTasks.filter(id => taskMap[id]);
      if (validIds.length !== n.linkedTasks.length) { needsUpdate = true; return { ...n, linkedTasks: validIds }; }
      return n;
    });
    if (needsUpdate) updateWB(wb => ({ ...wb, nodes: updated }));
  }, [data.tasks]);

  const connectingNode = connecting ? nodes.find(n => n.id === connecting) : null;
  const canvasRect = canvasRef.current?.getBoundingClientRect();

  // Determine which nodes are visible (hidden by collapsed groups)
  const collapsedGroupIds = new Set((groups || []).filter(g => g.collapsed).map(g => g.id));
  const visibleNodes = nodes.filter(n => {
    if (n.groupId && collapsedGroupIds.has(n.groupId)) return false;
    // Hide children of collapsed parent nodes
    if (n.type !== 'frame') {
      const parentConn = connections.find(c => c.to === n.id && c.relationType === 'parent');
      if (parentConn) {
        const parent = nodes.find(p => p.id === parentConn.from);
        if (parent?.collapsed) return false;
      }
    }
    return true;
  });

  // Frames first, then other nodes
  const frames = visibleNodes.filter(n => n.type === 'frame');
  const nonFrames = visibleNodes.filter(n => n.type !== 'frame');

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Tillbaka
          </button>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{data.name} — Whiteboard</h2>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Add menu */}
          <div className="relative group">
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Lägg till
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[180px] hidden group-hover:block z-50">
              <button onClick={() => addNode('box')} className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"/></svg>
                Ny box
              </button>
              <button onClick={() => addNode('sticky')} className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center text-sm">📌</span>
                Post-it
              </button>
              <button onClick={() => addNode('freetext')} className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Fritext
              </button>
              <button onClick={() => addNode('image')} className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Bild
              </button>
              <button onClick={() => addNode('frame')} className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"/></svg>
                Frame (sektion)
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
              <button onClick={() => setTemplateModal(true)} className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center text-sm">📚</span>
                Mallar...
              </button>
            </div>
          </div>

          {/* Group selected */}
          {selectedNodes.size >= 2 && (
            <button onClick={createGroup} className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors flex items-center gap-1" title="Gruppera markerade (⌘G)">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"/></svg>
              Gruppera ({selectedNodes.size})
            </button>
          )}

          <button onClick={() => setSearchOpen(true)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Sök (⌘F)">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </button>

          <button onClick={fitView} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Anpassa vy">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          </button>

          <button onClick={() => setMiniMapVisible(v => !v)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${miniMapVisible ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`} title="Mini-map">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          </button>

          <button onClick={() => setTaskPanel(o => !o)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${taskPanel ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Tasks
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <ZoomControl zoom={zoom} setZoom={setZoom} />
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 relative overflow-hidden wb-bg"
        ref={canvasRef}
        onPointerDown={onCanvasPointerDown}
        style={{ ...(isDark ? DOT_BG_DARK : DOT_BG_LIGHT), cursor: connecting ? 'crosshair' : 'grab' }}
      >
        {connecting && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg">
            Klicka på en annan nod för att koppla, eller tom yta för att avbryta
          </div>
        )}

        {/* Selection box */}
        {selectionBox && (
          <div className="absolute border-2 border-indigo-400 bg-indigo-100/20 rounded pointer-events-none z-20" style={{
            left: Math.min(selectionBox.x1, selectionBox.x2),
            top: Math.min(selectionBox.y1, selectionBox.y2),
            width: Math.abs(selectionBox.x2 - selectionBox.x1),
            height: Math.abs(selectionBox.y2 - selectionBox.y1),
          }} />
        )}

        <WhiteboardSearch open={searchOpen} onClose={() => setSearchOpen(false)} nodes={nodes} onNavigateTo={navigateToNode} tasks={data.tasks} />

        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '20000px', height: '20000px', pointerEvents: 'none', overflow: 'visible' }}>
            <g style={{ pointerEvents: 'auto' }}>
              {connections.map(c => (
                <ConnectionLine key={`${c.from}-${c.to}`} conn={c} nodes={nodes} onDelete={deleteConnection} onEditLabel={setEditingConn} dark={isDark} />
              ))}
              {connectingNode && connectLine && (
                <line x1={connectingNode.x + (connectingNode.w || 240) / 2} y1={connectingNode.y + 40} x2={connectLine.x} y2={connectLine.y} stroke="#6366f1" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
              )}
            </g>
          </svg>

          {/* Group overlays */}
          {(groups || []).map(g => (
            <GroupOverlay
              key={g.id} group={g} nodes={nodes}
              selected={selectedNode === g.id}
              onSelect={setSelectedNode}
              onToggleCollapse={toggleGroupCollapse}
              onContextMenu={(e, grp) => setCtxMenu({ x: e.clientX, y: e.clientY, node: { ...grp, _isGroup: true } })}
              zoom={zoom}
              onMove={moveGroup}
            />
          ))}

          {/* Frames first */}
          {frames.map(n => (
            <WhiteboardNode
              key={n.id} node={n}
              selected={selectedNode === n.id || selectedNodes.has(n.id)}
              onSelect={handleNodeSelect} onMove={moveNode}
              onDoubleClick={n => setEditNode(n)}
              connecting={!!connecting} onStartConnect={startConnect}
              zoom={zoom} onResize={handleResize}
              onInlineChange={handleInlineChange}
              onContextMenu={handleNodeContextMenu}
              onToggleCollapse={toggleCollapse}
              childCount={0}
            />
          ))}

          {/* Non-frame nodes */}
          {nonFrames.map(n => (
            <WhiteboardNode
              key={n.id} node={n}
              selected={selectedNode === n.id || selectedNodes.has(n.id)}
              onSelect={handleNodeSelect} onMove={moveNode}
              onDoubleClick={n => setEditNode(n)}
              connecting={!!connecting} onStartConnect={startConnect}
              zoom={zoom} onResize={handleResize}
              onInlineChange={handleInlineChange}
              onContextMenu={handleNodeContextMenu}
              onToggleCollapse={toggleCollapse}
              childCount={childCounts[n.id] || 0}
            />
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              <p className="text-gray-400 text-sm font-medium">Tom whiteboard</p>
              <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Använd "Lägg till" för att skapa noder, post-its eller frames</p>
              <button onClick={() => setTemplateModal(true)} className="mt-3 text-xs text-indigo-500 hover:text-indigo-600 font-medium">Eller välj en mall →</button>
            </div>
          </div>
        )}

        <MiniMap nodes={nodes} pan={pan} zoom={zoom} canvasRect={canvasRect} onNavigate={navigateToPoint} visible={miniMapVisible} />

        <TaskSidePanel open={taskPanel} nodes={nodes} tasks={data.tasks} columns={data.columns} onClose={() => setTaskPanel(false)} />
      </div>

      {/* Context menu */}
      {ctxMenu && !ctxMenu.node._isGroup && (
        <NodeContextMenu
          pos={{ x: ctxMenu.x, y: ctxMenu.y }} node={ctxMenu.node}
          onClose={() => setCtxMenu(null)} onEdit={n => setEditNode(n)} onDelete={deleteNode}
          onDuplicate={duplicateNode} onChangeColor={changeNodeColor} onToggleLock={toggleLock}
          onAddChild={ctxMenu.node.type !== 'frame' ? addChildNode : undefined}
          groups={groups}
          onAddToGroup={addToGroup}
          onRemoveFromGroup={removeFromGroup}
        />
      )}
      {ctxMenu && ctxMenu.node._isGroup && (
        <div className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1 min-w-[160px] z-[250]" style={{ left: ctxMenu.x, top: ctxMenu.y }}>
          <button onClick={() => { toggleGroupCollapse(ctxMenu.node.id); setCtxMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">{ctxMenu.node.collapsed ? 'Expandera' : 'Fäll ihop'}</button>
          <button onClick={() => { toggleGroupLock(ctxMenu.node.id); setCtxMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">{ctxMenu.node.locked ? 'Lås upp' : 'Lås'}</button>
          <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
          <button onClick={() => { deleteGroup(ctxMenu.node.id); setCtxMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Ta bort grupp</button>
        </div>
      )}

      <NodeDetailModal
        node={editNode} open={!!editNode} onClose={() => setEditNode(null)} onSave={saveNode} onDelete={deleteNode}
        tasks={data.tasks} columns={data.columns} onCreateTask={createTaskForNode} onLinkTask={linkTask}
        wbLabels={wbLabels} onUpdateLabels={updateWbLabels}
      />
      <TemplateModal open={templateModal} onClose={() => setTemplateModal(false)} onApply={applyTemplate} />
      <ConnectionEditModal conn={editingConn} open={!!editingConn} onClose={() => setEditingConn(null)} onSave={updateConnection} />
    </div>
  );
}
