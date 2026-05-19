import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function PeopleManagerModal({ open, onClose, people, onSave }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => { if (open) setItems([...people]); }, [open, people]);

  const add = () => { if (!newName.trim() || items.includes(newName.trim())) return; setItems(i => [...i, newName.trim()]); setNewName(''); };
  const remove = (name) => setItems(i => i.filter(x => x !== name));
  const save = () => { onSave(items); onClose(); };

  return (
    <Modal open={open} onClose={onClose} title="Manage Team">
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {items.map(p => (
          <div key={p} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center font-medium">{p.charAt(0)}</div>
            <span className="text-sm flex-1">{p}</span>
            <button onClick={() => remove(p)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Person name..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none" onKeyDown={e => e.key === 'Enter' && add()} />
        <button onClick={add} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Add</button>
      </div>
      <button onClick={save} className="w-full mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">Save Team</button>
    </Modal>
  );
}
