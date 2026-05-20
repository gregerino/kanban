import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { PRIORITIES } from '../utils/constants';
import { uid } from '../utils/helpers';

const PRESET_COLORS = ['#fde68a', '#fdba74', '#93c5fd', '#86efac', '#fda4af', '#c4b5fd', '#f87171', '#818cf8', '#2dd4bf', '#a3e635'];
const MAX_FILES_SIZE = 25 * 1024 * 1024; // 25MB

export default function TaskDetailModal({ task, open, onClose, allLabels, columns, customColors = [], onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [fileSizeError, setFileSizeError] = useState('');
  const checkInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (task) {
      const initial = { ...task, checklist: task.checklist || [], files: task.files || [] };
      setForm(initial);
      formRef.current = initial;
      setNewComment('');
      setNewCheckItem('');
      setFileSizeError('');
    }
  }, [task]);

  if (!form) return null;

  const allColors = [...PRESET_COLORS, ...customColors];

  const update = (key, val) => setForm(f => {
    const next = { ...f, [key]: val };
    formRef.current = next;
    return next;
  });
  const toggleLabel = (lid) => {
    const has = form.labels.includes(lid);
    update('labels', has ? form.labels.filter(x => x !== lid) : [...form.labels, lid]);
  };
  const addComment = () => {
    if (!newComment.trim()) return;
    const c = { id: uid(), author: 'Me', text: newComment.trim(), date: new Date().toISOString() };
    update('comments', [...(form.comments || []), c]);
    setNewComment('');
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    update('checklist', [...form.checklist, { id: uid(), text: newCheckItem.trim(), done: false }]);
    setNewCheckItem('');
    setTimeout(() => checkInputRef.current?.focus(), 0);
  };
  const toggleCheckItem = (cid) => {
    update('checklist', form.checklist.map(c => c.id === cid ? { ...c, done: !c.done } : c));
  };
  const removeCheckItem = (cid) => {
    update('checklist', form.checklist.filter(c => c.id !== cid));
  };

  // File handling
  const currentSize = (form.files || []).reduce((sum, f) => sum + (f.size || 0), 0);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setFileSizeError('');
    const newFiles = [];
    let addedSize = 0;

    for (const file of files) {
      if (currentSize + addedSize + file.size > MAX_FILES_SIZE) {
        setFileSizeError('Total file size would exceed 25MB limit');
        break;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const fileObj = {
          id: uid(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: ev.target.result,
          addedAt: new Date().toISOString(),
        };
        setForm(f => ({ ...f, files: [...(f.files || []), fileObj] }));
      };
      reader.readAsDataURL(file);
      addedSize += file.size;
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fid) => {
    update('files', (form.files || []).filter(f => f.id !== fid));
    setFileSizeError('');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const save = () => { onSave(formRef.current || form); onClose(); };
  const handleClose = () => { onSave(formRef.current || form); onClose(); };

  const checkDone = form.checklist.filter(c => c.done).length;
  const checkTotal = form.checklist.length;

  return (
    <Modal open={open} onClose={handleClose} title="Uppgiftsdetaljer" wide>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Färg</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {allColors.map(c => (
                <button key={c} onClick={() => update('color', c)} className={`w-7 h-7 rounded-lg ${form.color === c ? 'ring-2 ring-offset-1 ring-gray-800' : ''} hover:scale-110 transition-transform`} style={{ background: c }} />
              ))}
              <input type="color" value={form.color || '#fde68a'} onChange={e => update('color', e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" title="Custom color" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Etiketter</label>
            <div className="flex flex-wrap gap-2">
              {allLabels.map(l => (
                <button key={l.id} onClick={() => toggleLabel(l.id)} className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${form.labels.includes(l.id) ? 'ring-2 ring-offset-1 ring-gray-800' : 'opacity-50 hover:opacity-80'} transition-all`} style={{ background: l.color }}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">Checklista</label>
              {checkTotal > 0 && (
                <span className={`text-xs ${checkDone === checkTotal ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{checkDone}/{checkTotal}</span>
              )}
            </div>
            {checkTotal > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div className={`h-1.5 rounded-full transition-all ${checkDone === checkTotal ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0}%` }} />
              </div>
            )}
            <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
              {form.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input type="checkbox" checked={item.done} onChange={() => toggleCheckItem(item.id)} className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-300 cursor-pointer" />
                  <span className={`text-sm flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                  <button onClick={() => removeCheckItem(item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input ref={checkInputRef} value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} placeholder="Lägg till punkt..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" onKeyDown={e => e.key === 'Enter' && addCheckItem()} />
              <button onClick={addCheckItem} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">Lägg till</button>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Anteckningar</label>
            <textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} placeholder="Skriv anteckningar..." rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-y" />
          </div>

          {/* Files */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">Bilagor</label>
              <span className="text-xs text-gray-400">{formatFileSize(currentSize)} / 25 MB</span>
            </div>
            {(form.files || []).length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                {form.files.map(f => (
                  <div key={f.id} className="flex items-center gap-2 group bg-gray-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
                    </div>
                    {f.type?.startsWith('image/') && (
                      <img src={f.data} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    )}
                    <button onClick={() => removeFile(f.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fileSizeError && <p className="text-xs text-red-500 mb-2">{fileSizeError}</p>}
            <label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              <span className="text-xs text-gray-500">Lägg till filer</span>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Comments */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Kommentarer</label>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
              {(form.comments || []).map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{c.author}</span>
                    <span className="text-xs text-gray-400">{new Date(c.date).toLocaleString('sv-SE')}</span>
                  </div>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              ))}
              {(!form.comments || form.comments.length === 0) && <p className="text-xs text-gray-400">Inga kommentarer ännu.</p>}
            </div>
            <div className="flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Skriv en kommentar..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" onKeyDown={e => e.key === 'Enter' && addComment()} />
              <button onClick={addComment} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">Skicka</button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={form.status} onChange={e => update('status', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300">
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Prioritet</label>
            <select value={form.priority} onChange={e => update('priority', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">Ingen</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
            <input type="date" value={form.deadline || ''} onChange={e => update('deadline', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <button onClick={save} className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">Spara ändringar</button>
            <button onClick={() => { onDelete(form.id); onClose(); }} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Ta bort uppgift</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
