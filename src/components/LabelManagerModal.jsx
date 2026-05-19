import { useState, useEffect } from 'react';
import Modal from './Modal';
import { uid } from '../utils/helpers';
import { LABEL_COLORS } from '../utils/constants';

export default function LabelManagerModal({ open, onClose, labels, onSave }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('bg-blue-400');

  useEffect(() => { if (open) setItems([...labels]); }, [open, labels]);

  const add = () => {
    if (!newName.trim()) return;
    setItems(i => [...i, { id: uid(), name: newName.trim(), color: newColor }]);
    setNewName('');
  };
  const remove = (id) => setItems(i => i.filter(x => x.id !== id));
  const save = () => { onSave(items); onClose(); };

  return (
    <Modal open={open} onClose={onClose} title="Manage Labels">
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {items.map(l => (
          <div key={l.id} className="flex items-center gap-2">
            <div className={`${l.color} w-4 h-4 rounded-full`} />
            <span className="text-sm flex-1">{l.name}</span>
            <button onClick={() => remove(l.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Label name..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none" onKeyDown={e => e.key === 'Enter' && add()} />
        <div className="flex gap-1">
          {LABEL_COLORS.map(c => (
            <button key={c} onClick={() => setNewColor(c)} className={`${c} w-5 h-5 rounded-full ${newColor === c ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`} />
          ))}
        </div>
        <button onClick={add} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Add</button>
      </div>
      <button onClick={save} className="w-full mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">Save Labels</button>
    </Modal>
  );
}
