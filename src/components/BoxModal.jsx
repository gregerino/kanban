import { useState, useEffect } from 'react';
import Modal from './Modal';
import { uid } from '../utils/helpers';

export default function BoxModal({ box, open, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ name: '', color: '#6366f1' });

  useEffect(() => {
    if (box) setForm({ name: box.name, color: box.color || '#6366f1' });
    else setForm({ name: '', color: '#6366f1' });
  }, [box, open]);

  const save = () => {
    if (!form.name.trim()) return;
    onSave(box ? { ...box, ...form } : { id: uid(), ...form });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={box ? 'Edit Box' : 'New Box'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. Sprint 1, Team Frontend, Epic..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
          <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-12 h-8 rounded cursor-pointer border-0" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
            {box ? 'Save' : 'Create'}
          </button>
          {box && <button onClick={() => { onDelete(box.id); onClose(); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Delete</button>}
        </div>
      </div>
    </Modal>
  );
}
