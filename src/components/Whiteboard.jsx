import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { uid } from '../utils/helpers';
import { PRIORITIES, PRIORITY_FLAG_COLORS } from '../utils/constants';

// ─── Dot pattern background ───
const DOT_BG = {
  backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

// ─── SVG connection line between two nodes ───
function ConnectionLine({ from, to, nodes, onDelete }) {
  const a = nodes.find(n => n.id === from);
  const b = nodes.find(n => n.id === to);
  if (!a || !b) return null;
  const aw = a.type === 'image' ? 200 : a.type === 'freetext' ? 100 : 240;
  const bw = b.type === 'image' ? 200 : b.type === 'freetext' ? 100 : 240;
  const ah = a.type === 'image' ? 100 : a.type === 'freetext' ? 20 : 50;
  const bh = b.type === 'image' ? 100 : b.type === 'freetext' ? 20 : 50;
  const x1 = a.x + aw / 2, y1 = a.y + ah;
  const x2 = b.x + bw / 2, y2 = b.y + bh;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  // Curved line
  const dx = x2 - x1, dy = y2 - y1;
  const cx = mx + dy * 0.15, cy = my - dx * 0.15;
  return (
    <g className="group/conn">
      <path d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`} fill="none" stroke="#a5b4fc" strokeWidth="2.5" className="transition-colors group-hover/conn:stroke-indigo-500" />
      {/* Arrow head */}
      <circle cx={x2} cy={y2} r="4" fill="#a5b4fc" className="transition-colors group-hover/conn:fill-indigo-500" />
      {onDelete && (
        <g transform={`translate(${mx},${my})`} className="cursor-pointer opacity-0 group-hover/conn:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onDelete(from, to); }}>
          <circle r="11" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
          <text textAnchor="middle" dy="4.5" fontSize="13" fill="#ef4444" fontWeight="bold">×</text>
        </g>
      )}
    </g>
  );
}

// ─── Node types on the whiteboard ───

// Standard box node
function BoxNode({ node, selected, onSelect, onMove, onDoubleClick, connecting, onStartConnect, zoom }) {
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(node.id);
    const startX = e.clientX, startY = e.clientY;
    const origX = node.x, origY = node.y;
    const onMv = (ev) => { onMove(node.id, origX + (ev.clientX - startX) / zoom, origY + (ev.clientY - startY) / zoom); };
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv);
    window.addEventListener('pointerup', onUp);
  };

  const color = node.color || '#6366f1';
  const hasFiles = (node.files || []).length > 0;

  return (
    <div
      className={`absolute select-none rounded-xl border-2 shadow-lg bg-white transition-shadow hover:shadow-xl ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
      style={{ left: node.x, top: node.y, width: 240, minHeight: 80, borderColor: color + '60', zIndex: selected ? 10 : 1 }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
    >
      <div className="h-1.5 rounded-t-[10px]" style={{ background: color }} />
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-gray-800 truncate">{node.title || 'Namnlös'}</p>
        {node.text && <p className="text-xs text-gray-500 mt-1 line-clamp-3 whitespace-pre-wrap">{node.text}</p>}
        {/* Labels */}
        {node.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {node.labels.map(l => (
              <span key={l.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: l.color }}>{l.name}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {node.linkedTasks?.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              {node.linkedTasks.length}
            </span>
          )}
          {hasFiles && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
              {node.files.length}
            </span>
          )}
        </div>
      </div>
      {/* Connect handles */}
      <button className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-indigo-600 transition-all hover:scale-110" style={{ opacity: selected || connecting ? 1 : 0 }} onPointerDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }} title="Koppla">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </button>
    </div>
  );
}

// Freetext node
function FreetextNode({ node, selected, onSelect, onMove, onDoubleClick, zoom }) {
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(node.id);
    const startX = e.clientX, startY = e.clientY;
    const origX = node.x, origY = node.y;
    const onMv = (ev) => { onMove(node.id, origX + (ev.clientX - startX) / zoom, origY + (ev.clientY - startY) / zoom); };
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv);
    window.addEventListener('pointerup', onUp);
  };
  const fontSize = node.fontSize || 16;
  return (
    <div
      className={`absolute select-none cursor-move ${selected ? 'ring-2 ring-indigo-400 ring-offset-2 rounded-lg' : ''}`}
      style={{ left: node.x, top: node.y, zIndex: selected ? 10 : 1 }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
    >
      <p className="whitespace-pre-wrap font-medium" style={{ fontSize, color: node.color || '#374151', maxWidth: 400 }}>{node.text || 'Dubbelklicka för att skriva...'}</p>
    </div>
  );
}

// Image-only node
function ImageNode({ node, selected, onSelect, onMove, onDoubleClick, onStartConnect, connecting, zoom }) {
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(node.id);
    const startX = e.clientX, startY = e.clientY;
    const origX = node.x, origY = node.y;
    const onMv = (ev) => { onMove(node.id, origX + (ev.clientX - startX) / zoom, origY + (ev.clientY - startY) / zoom); };
    const onUp = () => { window.removeEventListener('pointermove', onMv); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMv);
    window.addEventListener('pointerup', onUp);
  };
  return (
    <div
      className={`absolute select-none rounded-xl overflow-hidden shadow-lg border-2 border-white hover:shadow-xl transition-shadow ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
      style={{ left: node.x, top: node.y, zIndex: selected ? 10 : 1, maxWidth: 400 }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
    >
      {node.image ? (
        <img src={node.image} alt={node.title || ''} className="block max-w-[400px] max-h-[300px] object-contain" draggable={false} />
      ) : (
        <div className="w-48 h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Ingen bild</div>
      )}
      {node.title && <div className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 truncate">{node.title}</div>}
      <button className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-indigo-600" style={{ opacity: selected || connecting ? 1 : 0 }} onPointerDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }} title="Koppla">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </button>
    </div>
  );
}

// Render any node type
function WhiteboardNode(props) {
  const { node } = props;
  if (node.type === 'freetext') return <FreetextNode {...props} />;
  if (node.type === 'image') return <ImageNode {...props} />;
  return <BoxNode {...props} />;
}

// ─── Node detail / edit modal ───
function NodeDetailModal({ node, open, onClose, onSave, onDelete, tasks, columns, onCreateTask, onLinkTask, wbLabels, onUpdateLabels }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [fontSize, setFontSize] = useState(16);
  const [labels, setLabels] = useState([]);
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');

  useEffect(() => {
    if (node && open) {
      setTitle(node.title || '');
      setText(node.text || '');
      setNotes(node.notes || '');
      setColor(node.color || '#6366f1');
      setFontSize(node.fontSize || 16);
      setLabels(node.labels || []);
      setFiles(node.files || []);
      setImage(node.image || '');
    }
  }, [node?.id, open]);

  if (!open || !node) return null;

  const isBox = !node.type || node.type === 'box';
  const isFreetext = node.type === 'freetext';
  const isImage = node.type === 'image';
  const linkedTaskIds = node.linkedTasks || [];
  const linkedTasks = tasks.filter(t => linkedTaskIds.includes(t.id));
  const availableTasks = tasks.filter(t => !linkedTaskIds.includes(t.id) && t.title.toLowerCase().includes(linkSearch.toLowerCase()));
  const lastCol = columns[columns.length - 1];

  const save = () => {
    onSave({ ...node, title, text, notes, color, fontSize, labels, files, image });
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max filstorlek: 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (isImage) {
        setImage(ev.target.result);
      } else {
        setFiles(f => [...f, { id: uid(), name: file.name, type: file.type, data: ev.target.result, size: file.size }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fid) => setFiles(f => f.filter(x => x.id !== fid));

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    const nl = { id: uid(), name: newLabelName.trim(), color: newLabelColor };
    setLabels(l => [...l, nl]);
    // Also add to whiteboard-level labels if not already exists
    if (!wbLabels.some(l => l.name === nl.name && l.color === nl.color)) {
      onUpdateLabels([...wbLabels, nl]);
    }
    setNewLabelName('');
  };

  const toggleWbLabel = (l) => {
    setLabels(prev => prev.some(x => x.id === l.id) ? prev.filter(x => x.id !== l.id) : [...prev, l]);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
  const LABEL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {isFreetext ? 'Redigera text' : isImage ? 'Redigera bild' : 'Redigera box'}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { onDelete(node.id); onClose(); }} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Ta bort</button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Image upload for image nodes */}
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

          {/* Title */}
          {!isFreetext && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Namnge..." />
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Färg</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-gray-800' : ''} hover:scale-110 transition-transform`} style={{ background: c }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border-0 p-0" />
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{isFreetext ? 'Text' : 'Kort beskrivning'}</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={isFreetext ? 4 : 3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder={isFreetext ? 'Skriv din text...' : 'Kort beskrivning...'} />
          </div>

          {/* Font size for freetext */}
          {isFreetext && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Textstorlek</label>
              <div className="flex items-center gap-2">
                <input type="range" min="10" max="48" value={fontSize} onChange={e => setFontSize(+e.target.value)} className="flex-1" />
                <span className="text-xs text-gray-500 w-8 text-right">{fontSize}px</span>
              </div>
            </div>
          )}

          {/* Notes (box only) */}
          {isBox && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Detaljerade anteckningar</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Detaljerad information..." />
            </div>
          )}

          {/* Labels (box only) */}
          {isBox && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Etiketter</label>
              {/* Existing whiteboard labels */}
              {wbLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {wbLabels.map(l => {
                    const active = labels.some(x => x.id === l.id);
                    return (
                      <button key={l.id} onClick={() => toggleWbLabel(l)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${active ? 'text-white ring-1 ring-offset-1 ring-gray-400' : 'text-white opacity-50 hover:opacity-80'}`} style={{ background: l.color }}>
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Add new label */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {LABEL_COLORS.map(c => (
                    <button key={c} onClick={() => setNewLabelColor(c)} className={`w-5 h-5 rounded-full ${newLabelColor === c ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`} style={{ background: c }} />
                  ))}
                </div>
                <input value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="Ny etikett..." className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none" onKeyDown={e => e.key === 'Enter' && addLabel()} />
                <button onClick={addLabel} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0">Lägg till</button>
              </div>
            </div>
          )}

          {/* File attachments (box only) */}
          {isBox && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Filer & bilder</label>
              {files.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 group">
                      {f.type?.startsWith('image/') ? (
                        <img src={f.data} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                      )}
                      <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                      <span className="text-[10px] text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                      <button onClick={() => removeFile(f.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                Ladda upp fil eller bild
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Linked tasks (box only) */}
          {isBox && (
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
              <button onClick={() => onCreateTask(node.id)} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                Skapa ny task kopplad till denna box
              </button>
            </div>
          )}

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
        {linkedTasks.length === 0 && <p className="text-center text-gray-400 text-xs py-8">Inga tasks kopplade</p>}
      </div>
    </div>
  );
}

// ─── Zoom input with presets ───
function ZoomControl({ zoom, setZoom }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const pct = Math.round(zoom * 100);
  const presets = [25, 50, 75, 100, 150, 200];

  const commit = () => {
    const n = parseInt(val, 10);
    if (n >= 10 && n <= 400) setZoom(n / 100);
    setEditing(false);
  };

  return (
    <div className="relative flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
      <button onClick={() => setZoom(z => Math.max(0.1, z - 0.15))} className="px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded">−</button>
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-12 text-center text-[10px] font-medium bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none"
        />
      ) : (
        <button onClick={() => { setEditing(true); setVal(String(pct)); }} className="text-[10px] font-medium text-gray-500 w-12 text-center hover:bg-gray-200 rounded py-0.5" title="Klicka för att ange zoom %">
          {pct}%
        </button>
      )}
      <button onClick={() => setZoom(z => Math.min(4, z + 0.15))} className="px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded">+</button>
      {/* Preset dropdown */}
      <div className="relative group">
        <button className="px-1.5 py-1 text-xs text-gray-400 hover:bg-gray-200 rounded">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[80px] hidden group-hover:block z-50">
          {presets.map(p => (
            <button key={p} onClick={() => setZoom(p / 100)} className={`w-full px-3 py-1.5 text-xs text-left hover:bg-indigo-50 ${pct === p ? 'font-bold text-indigo-600' : 'text-gray-600'}`}>{p}%</button>
          ))}
        </div>
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
  const [connecting, setConnecting] = useState(null);
  const [connectLine, setConnectLine] = useState(null);
  const [taskPanel, setTaskPanel] = useState(false);
  const isPanning = useRef(false);

  const wb = data.whiteboard || { nodes: [], connections: [], labels: [] };
  const nodes = wb.nodes || [];
  const connections = wb.connections || [];
  const wbLabels = wb.labels || [];

  const updateWB = useCallback((fn) => {
    updateBoard(d => ({
      ...d,
      whiteboard: fn(d.whiteboard || { nodes: [], connections: [], labels: [] }),
    }));
  }, [updateBoard]);

  // Pan — pointer drag on empty space
  const onCanvasPointerDown = (e) => {
    if (e.target !== canvasRef.current && !e.target.classList?.contains('wb-bg')) return;
    if (connecting) { setConnecting(null); setConnectLine(null); return; }
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

  // Wheel: two-finger trackpad pan + pinch zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom (ctrl+scroll = trackpad pinch)
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        setZoom(z => {
          const nz = Math.max(0.1, Math.min(4, z * delta));
          // Zoom toward cursor
          setPan(p => ({
            x: mx - (mx - p.x) * (nz / z),
            y: my - (my - p.y) * (nz / z),
          }));
          return nz;
        });
      } else {
        // Two-finger pan (regular scroll = trackpad two-finger)
        setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Track mouse during connecting
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

  // Add nodes
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
    else if (type === 'image') newNode = { ...base, type: 'image', title: '', image: '' };
    else newNode = { ...base, type: 'box', title: '', text: '', notes: '', linkedTasks: [], files: [], labels: [] };
    updateWB(wb => ({ ...wb, nodes: [...wb.nodes, newNode] }));
    setSelectedNode(id);
    if (type === 'freetext' || type === 'image') {
      // Open edit immediately for freetext and image
      setTimeout(() => setEditNode(newNode), 50);
    }
  };

  const moveNode = useCallback((id, x, y) => {
    updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === id ? { ...n, x, y } : n) }));
  }, [updateWB]);

  const startConnect = (fromId) => {
    if (connecting) {
      if (fromId !== connecting && !connections.some(c => (c.from === connecting && c.to === fromId) || (c.from === fromId && c.to === connecting))) {
        updateWB(wb => ({ ...wb, connections: [...wb.connections, { from: connecting, to: fromId }] }));
      }
      setConnecting(null);
      setConnectLine(null);
    } else {
      setConnecting(fromId);
    }
  };

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

  const deleteConnection = (from, to) => {
    updateWB(wb => ({ ...wb, connections: wb.connections.filter(c => !(c.from === from && c.to === to)) }));
  };

  const deleteNode = (id) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.filter(n => n.id !== id),
      connections: wb.connections.filter(c => c.from !== id && c.to !== id),
    }));
    if (selectedNode === id) setSelectedNode(null);
  };

  // Save node — also update editNode ref so task linking sees fresh data
  const saveNode = (updated) => {
    updateWB(wb => ({ ...wb, nodes: wb.nodes.map(n => n.id === updated.id ? updated : n) }));
  };

  // Link / unlink task — works on the live data so modal sees changes
  const linkTask = (nodeId, taskId, add) => {
    updateWB(wb => ({
      ...wb,
      nodes: wb.nodes.map(n => n.id === nodeId ? {
        ...n,
        linkedTasks: add ? [...(n.linkedTasks || []), taskId] : (n.linkedTasks || []).filter(id => id !== taskId),
      } : n),
    }));
    // Also update local editNode so the modal reflects the change immediately
    if (editNode && editNode.id === nodeId) {
      setEditNode(prev => ({
        ...prev,
        linkedTasks: add ? [...(prev.linkedTasks || []), taskId] : (prev.linkedTasks || []).filter(id => id !== taskId),
      }));
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
        ...(d.whiteboard || { nodes: [], connections: [], labels: [] }),
        nodes: (d.whiteboard?.nodes || []).map(n => n.id === nodeId ? { ...n, linkedTasks: [...(n.linkedTasks || []), taskId] } : n),
      },
    }));
    // Update editNode too
    if (editNode && editNode.id === nodeId) {
      setEditNode(prev => ({ ...prev, linkedTasks: [...(prev.linkedTasks || []), taskId] }));
    }
  };

  const updateWbLabels = (newLabels) => {
    updateWB(wb => ({ ...wb, labels: newLabels }));
  };

  const fitView = () => {
    if (nodes.length === 0) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + 260));
    const maxY = Math.max(...nodes.map(n => n.y + 120));
    const w = maxX - minX + 100, h = maxY - minY + 100;
    const newZoom = Math.min(rect.width / w, rect.height / h, 1.5);
    setZoom(Math.max(0.2, newZoom));
    setPan({ x: (rect.width - w * newZoom) / 2 - minX * newZoom + 50 * newZoom, y: (rect.height - h * newZoom) / 2 - minY * newZoom + 50 * newZoom });
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (connecting) { setConnecting(null); setConnectLine(null); }
        else if (editNode) setEditNode(null);
        else onClose();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode && !editNode) deleteNode(selectedNode);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connecting, editNode, selectedNode, onClose]);

  const connectingNode = connecting ? nodes.find(n => n.id === connecting) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col">
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
        <div className="flex items-center gap-1.5">
          {/* Add menu */}
          <div className="relative group">
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Lägg till
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[160px] hidden group-hover:block z-50">
              <button onClick={() => addNode('box')} className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"/></svg>
                Ny box
              </button>
              <button onClick={() => addNode('freetext')} className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Fritext
              </button>
              <button onClick={() => addNode('image')} className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Bild
              </button>
            </div>
          </div>

          <button onClick={fitView} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Anpassa vy">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          </button>
          <button onClick={() => setTaskPanel(o => !o)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${taskPanel ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Tasks
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <ZoomControl zoom={zoom} setZoom={setZoom} />
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 relative overflow-hidden wb-bg"
        ref={canvasRef}
        onPointerDown={onCanvasPointerDown}
        style={{ ...DOT_BG, cursor: connecting ? 'crosshair' : 'grab' }}
      >
        {connecting && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg">
            Klicka på en annan box för att koppla, eller tom yta för att avbryta
          </div>
        )}

        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}>
          <svg className="wb-svg" style={{ position: 'absolute', top: 0, left: 0, width: '20000px', height: '20000px', pointerEvents: 'none', overflow: 'visible' }}>
            <g style={{ pointerEvents: 'auto' }}>
              {connections.map((c, i) => (
                <ConnectionLine key={`${c.from}-${c.to}`} from={c.from} to={c.to} nodes={nodes} onDelete={deleteConnection} />
              ))}
              {connectingNode && connectLine && (
                <line x1={connectingNode.x + 120} y1={connectingNode.y + 40} x2={connectLine.x} y2={connectLine.y} stroke="#6366f1" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
              )}
            </g>
          </svg>

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

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              <p className="text-gray-400 text-sm font-medium">Tom whiteboard</p>
              <p className="text-gray-300 text-xs mt-1">Använd "Lägg till" för att skapa boxar, fritext eller bilder</p>
            </div>
          </div>
        )}

        <TaskSidePanel open={taskPanel} nodes={nodes} tasks={data.tasks} columns={data.columns} onClose={() => setTaskPanel(false)} />
      </div>

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
        wbLabels={wbLabels}
        onUpdateLabels={updateWbLabels}
      />
    </div>
  );
}
