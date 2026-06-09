import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { uid } from '../utils/helpers';
import { PRIORITIES, PRIORITY_FLAG_COLORS } from '../utils/constants';

// ─── SVG connection line between two nodes ───
function ConnectionLine({ from, to, nodes, onDelete }) {
  const a = nodes.find(n => n.id === from);
  const b = nodes.find(n => n.id === to);
  if (!a || !b) return null;
  const x1 = a.x + 120, y1 = a.y + 40;
  const x2 = b.x + 120, y2 = b.y + 40;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <g className="group/conn">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a5b4fc" strokeWidth="2" strokeDasharray="6 4" className="transition-colors group-hover/conn:stroke-indigo-500" />
      {onDelete && (
        <g transform={`translate(${mx},${my})`} className="cursor-pointer opacity-0 group-hover/conn:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onDelete(from, to); }}>
          <circle r="10" fill="white" stroke="#e5e7eb" strokeWidth="1" />
          <text textAnchor="middle" dy="4" fontSize="12" fill="#ef4444" fontWeight="bold">×</text>
        </g>
      )}
    </g>
  );
}

// ─── Single node (box) on the whiteboard ───
function WhiteboardNode({ node, selected, onSelect, onMove, onDoubleClick, connecting, onStartConnect, zoom }) {
  const dragRef = useRef(null);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(node.id);
    const startX = e.clientX, startY = e.clientY;
    const origX = node.x, origY = node.y;
    const onMove2 = (ev) => {
      onMove(node.id, origX + (ev.clientX - startX) / zoom, origY + (ev.clientY - startY) / zoom);
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove2); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove2);
    window.addEventListener('pointerup', onUp);
  };

  const color = node.color || '#6366f1';

  return (
    <div
      className={`absolute select-none rounded-xl border-2 shadow-lg bg-white transition-shadow hover:shadow-xl ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
      style={{ left: node.x, top: node.y, width: 240, minHeight: 80, borderColor: color + '60', zIndex: selected ? 10 : 1 }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
      ref={dragRef}
    >
      {/* Color bar */}
      <div className="h-1.5 rounded-t-[10px]" style={{ background: color }} />
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-gray-800 truncate">{node.title || 'Namnlös'}</p>
        {node.text && <p className="text-xs text-gray-500 mt-1 line-clamp-3 whitespace-pre-wrap">{node.text}</p>}
        {node.linkedTasks?.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span className="text-[10px] text-gray-400 font-medium">{node.linkedTasks.length} tasks</span>
          </div>
        )}
      </div>
      {/* Connect handle */}
      <button
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs shadow hover:bg-indigo-600 opacity-0 hover:opacity-100 transition-opacity"
        onPointerDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
        title="Koppla"
      >
        +
      </button>
    </div>
  );
}

// ─── Node detail / edit modal ───
function NodeDetailModal({ node, open, onClose, onSave, onDelete, tasks, columns, onCreateTask, onLinkTask }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [linkSearch, setLinkSearch] = useState('');

  useEffect(() => {
    if (node && open) {
      setTitle(node.title || '');
      setText(node.text || '');
      setNotes(node.notes || '');
      setColor(node.color || '#6366f1');
    }
  }, [node, open]);

  if (!open || !node) return null;

  const linkedTaskIds = node.linkedTasks || [];
  const linkedTasks = tasks.filter(t => linkedTaskIds.includes(t.id));
  const availableTasks = tasks.filter(t => !linkedTaskIds.includes(t.id) && t.title.toLowerCase().includes(linkSearch.toLowerCase()));
  const lastCol = columns[columns.length - 1];

  const save = () => {
    onSave({ ...node, title, text, notes, color });
    onClose();
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-800">Redigera box</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { onDelete(node.id); onClose(); }} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Ta bort</button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Namnge boxen..." />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Färg</label>
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-gray-800' : ''} hover:scale-110 transition-transform`} style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kort beskrivning</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Kort beskrivning som syns på boxen..." />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Detaljerade anteckningar</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Detaljerad information, tankar, processbeskrivning..." />
          </div>

          {/* Linked tasks */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Kopplade tasks</label>
            {linkedTasks.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {linkedTasks.map(t => {
                  const pColor = PRIORITY_FLAG_COLORS[t.priority] || '#9ca3af';
                  const done = t.status === lastCol;
                  return (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 group">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pColor }} />
                      <span className={`text-sm flex-1 truncate ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{t.status}</span>
                      <button onClick={() => onLinkTask(node.id, t.id, false)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Link existing task */}
            <input value={linkSearch} onChange={e => setLinkSearch(e.target.value)} placeholder="Sök och koppla en task..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 mb-1" />
            {linkSearch && availableTasks.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg">
                {availableTasks.slice(0, 8).map(t => (
                  <button key={t.id} onClick={() => { onLinkTask(node.id, t.id, true); setLinkSearch(''); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_FLAG_COLORS[t.priority] || '#9ca3af' }} />
                    <span className="truncate">{t.title}</span>
                    <span className="text-[10px] text-gray-400 ml-auto shrink-0">{t.status}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Create new task */}
            <button onClick={() => onCreateTask(node.id)} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Skapa ny task kopplad till denna box
            </button>
          </div>

          {/* Save */}
          <button onClick={save} className="w-full px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors">Spara</button>
        </div>
      </div>
    </div>
  );
}

// ─── Task side panel ───
function TaskSidePanel({ open, nodes, tasks, columns, onClose }) {
  if (!open) return null;
  const lastCol = columns[columns.length - 1];
  // Gather all linked tasks across all nodes
  const allLinkedIds = new Set();
  nodes.forEach(n => (n.linkedTasks || []).forEach(id => allLinkedIds.add(id)));
  const linkedTasks = tasks.filter(t => allLinkedIds.has(t.id));

  const byStatus = {};
  columns.forEach(c => { byStatus[c] = []; });
  linkedTasks.forEach(t => { if (byStatus[t.status]) byStatus[t.status].push(t); });

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-xl z-30 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
        <h3 className="text-sm font-bold text-gray-800">Kopplade tasks ({linkedTasks.length})</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
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
                    <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pColor }} />
                      <span className={`text-xs flex-1 truncate ${done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>{t.title}</span>
                      {t.priority && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ color: pColor, background: pColor + '18' }}>{t.priority}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {linkedTasks.length === 0 && (
          <p className="text-center text-gray-400 text-xs py-8">Inga tasks kopplade till whiteboard-boxar</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Whiteboard component ───
export default function Whiteboard({ data, updateBoard, onClose }) {
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editNode, setEditNode] = useState(null);
  const [connecting, setConnecting] = useState(null); // node id being connected from
  const [connectLine, setConnectLine] = useState(null); // { x, y } mouse position during connect
  const [taskPanel, setTaskPanel] = useState(false);
  const isPanning = useRef(false);

  const wb = data.whiteboard || { nodes: [], connections: [] };
  const nodes = wb.nodes || [];
  const connections = wb.connections || [];

  const updateWB = useCallback((fn) => {
    updateBoard(d => ({
      ...d,
      whiteboard: fn(d.whiteboard || { nodes: [], connections: [] }),
    }));
  }, [updateBoard]);

  // Pan
  const onCanvasPointerDown = (e) => {
    if (e.target !== canvasRef.current && e.target.tagName !== 'svg' && !e.target.closest('svg.wb-svg')) return;
    if (connecting) {
      // Clicked on empty space while connecting — cancel
      setConnecting(null);
      setConnectLine(null);
      return;
    }
    isPanning.current = true;
    const startX = e.clientX, startY = e.clientY;
    const origPan = { ...pan };
    const onMove = (ev) => {
      if (!isPanning.current) return;
      setPan({ x: origPan.x + (ev.clientX - startX), y: origPan.y + (ev.clientY - startY) });
    };
    const onUp = () => { isPanning.current = false; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Zoom
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.2, Math.min(3, z * delta)));
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Track mouse during connecting
  useEffect(() => {
    if (!connecting) return;
    const onMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      setConnectLine({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [connecting, pan, zoom]);

  // Add node
  const addNode = () => {
    const id = uid();
    const x = (-pan.x + 400) / zoom + Math.random() * 100;
    const y = (-pan.y + 300) / zoom + Math.random() * 100;
    updateWB(wb => ({ ...wb, nodes: [...wb.nodes, { id, title: '', text: '', notes: '', color: '#6366f1', x, y, linkedTasks: [] }] }));
    setSelectedNode(id);
  };

  // Move node
  const moveNode = useCallback((id, x, y) => {
    updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === id ? { ...n, x, y } : n) }));
  }, [updateWB]);

  // Start connecting
  const startConnect = (fromId) => {
    if (connecting) {
      // Complete connection
      if (fromId !== connecting && !connections.some(c => (c.from === connecting && c.to === fromId) || (c.from === fromId && c.to === connecting))) {
        updateWB(wb => ({ ...wb, connections: [...wb.connections, { from: connecting, to: fromId }] }));
      }
      setConnecting(null);
      setConnectLine(null);
    } else {
      setConnecting(fromId);
    }
  };

  // Also complete connection on node click while connecting
  const handleNodeSelect = (id) => {
    if (connecting && id !== connecting) {
      if (!connections.some(c => (c.from === connecting && c.to === id) || (c.from === id && c.to === connecting))) {
        updateWB(wb => ({ ...wb, connections: [...wb.connections, { from: connecting, to: id }] }));
      }
      setConnecting(null);
      setConnectLine(null);
    } else {
      setSelectedNode(id);
    }
  };

  // Delete connection
  const deleteConnection = (from, to) => {
    updateWB(wb => ({ ...wb, connections: wb.connections.filter(c => !(c.from === from && c.to === to)) }));
  };

  // Delete node
  const deleteNode = (id) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.filter(n => n.id !== id),
      connections: wb.connections.filter(c => c.from !== id && c.to !== id),
    }));
    if (selectedNode === id) setSelectedNode(null);
  };

  // Save node
  const saveNode = (updated) => {
    updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === updated.id ? updated : n) }));
  };

  // Link / unlink task
  const linkTask = (nodeId, taskId, add) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.map(n => n.id === nodeId ? {
        ...n,
        linkedTasks: add ? [...(n.linkedTasks || []), taskId] : (n.linkedTasks || []).filter(id => id !== taskId),
      } : n),
    }));
  };

  // Create task linked to node
  const createTaskForNode = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    const firstStory = data.stories[0];
    if (!firstStory) return;
    const taskId = uid();
    const newTask = {
      id: taskId,
      title: node?.title ? `${node.title} — ny task` : 'Ny task',
      status: data.columns[0],
      storyId: firstStory.id,
      priority: '',
      labels: [],
      deadline: '',
      checklist: [],
      notes: '',
      files: [],
      comments: [],
      color: '',
    };
    updateBoard(d => ({
      ...d,
      tasks: [...d.tasks, newTask],
      whiteboard: {
        ...(d.whiteboard || { nodes: [], connections: [] }),
        nodes: (d.whiteboard?.nodes || []).map(n => n.id === nodeId ? { ...n, linkedTasks: [...(n.linkedTasks || []), taskId] } : n),
      },
    }));
  };

  // Fit to view
  const fitView = () => {
    if (nodes.length === 0) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + 240));
    const maxY = Math.max(...nodes.map(n => n.y + 100));
    const w = maxX - minX + 100;
    const h = maxY - minY + 100;
    const newZoom = Math.min(rect.width / w, rect.height / h, 1.5);
    setZoom(Math.max(0.3, newZoom));
    setPan({ x: (rect.width - w * newZoom) / 2 - minX * newZoom + 50 * newZoom, y: (rect.height - h * newZoom) / 2 - minY * newZoom + 50 * newZoom });
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (connecting) { setConnecting(null); setConnectLine(null); }
        else if (editNode) setEditNode(null);
        else onClose();
      }
      if (e.key === 'Delete' && selectedNode && !editNode) deleteNode(selectedNode);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connecting, editNode, selectedNode, onClose]);

  const connectingNode = connecting ? nodes.find(n => n.id === connecting) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Tillbaka
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <h2 className="text-sm font-bold text-gray-800">{data.name} — Whiteboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={addNode} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Ny box
          </button>
          <button onClick={fitView} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Anpassa vy">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          </button>
          <button onClick={() => setTaskPanel(o => !o)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${taskPanel ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Tasks
          </button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.15))} className="px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded">−</button>
            <span className="text-[10px] font-medium text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded">+</button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" ref={canvasRef} onPointerDown={onCanvasPointerDown} style={{ cursor: connecting ? 'crosshair' : isPanning.current ? 'grabbing' : 'grab' }}>
        {/* Connection guide text */}
        {connecting && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow">
            Klicka på en annan box för att koppla, eller på tom yta för att avbryta
          </div>
        )}

        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}>
          {/* SVG connections */}
          <svg className="wb-svg" style={{ position: 'absolute', top: 0, left: 0, width: '10000px', height: '10000px', pointerEvents: 'none', overflow: 'visible' }}>
            <g style={{ pointerEvents: 'auto' }}>
              {connections.map((c, i) => (
                <ConnectionLine key={i} from={c.from} to={c.to} nodes={nodes} onDelete={deleteConnection} />
              ))}
              {/* Active connecting line */}
              {connectingNode && connectLine && (
                <line
                  x1={connectingNode.x + 120} y1={connectingNode.y + 40}
                  x2={connectLine.x} y2={connectLine.y}
                  stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" opacity="0.6"
                />
              )}
            </g>
          </svg>

          {/* Nodes */}
          {nodes.map(n => (
            <WhiteboardNode
              key={n.id}
              node={n}
              selected={selectedNode === n.id}
              onSelect={handleNodeSelect}
              onMove={moveNode}
              onDoubleClick={(n) => setEditNode(n)}
              connecting={!!connecting}
              onStartConnect={startConnect}
              zoom={zoom}
            />
          ))}
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              <p className="text-gray-400 text-sm font-medium">Tom whiteboard</p>
              <p className="text-gray-300 text-xs mt-1">Klicka "Ny box" för att börja</p>
            </div>
          </div>
        )}

        {/* Task side panel */}
        <TaskSidePanel open={taskPanel} nodes={nodes} tasks={data.tasks} columns={data.columns} onClose={() => setTaskPanel(false)} />
      </div>

      {/* Node detail modal */}
      <NodeDetailModal
        node={editNode}
        open={!!editNode}
        onClose={() => setEditNode(null)}
        onSave={saveNode}
        onDelete={deleteNode}
        tasks={data.tasks}
        columns={data.columns}
        onCreateTask={createTaskForNode}
        onLinkTask={linkTask}
      />
    </div>
  );
}
