import { useState, useEffect } from 'react';
import Modal from './Modal';
import { uid } from '../utils/helpers';

const PRESET_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f472b6', '#818cf8', '#2dd4bf', '#a3e635'];

export default function LabelManagerModal({ open, onClose, labels, customColors = [], onSave, onSaveCustomColors }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#60a5fa');
  const [customs, setCustoms] = useState([]);

  useEffect(() => {
    if (open) {
      setItems([...labels]);
      setCustoms([...customColors]);
    }
  }, [open, labels, customColors]);

  const allColors = [...PRESET_COLORS, ...customs];

  const add = () => {
    if (!newName.trim()) return;
    setItems(i => [...i, { id: uid(), name: newName.trim(), color: newColor }]);
    setNewName('');
  };
  const remove = (id) => setItems(i => i.filter(x => x.id !== id));
  const addCustomColor = () => {
    if (!customs.includes(newColor) && !PRESET_COLORS.includes(newColor)) {
      setCustoms(c => [...c, newColor]);
    }
  };
  const save = () => {
    onSave(items);
    onSaveCustomColors(customs);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Labels">
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {items.map(l => (
          <div key={l.id} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ background: l.color }} />
            <span className="text-sm flex-1">{l.name}</span>
            <button onClick={() => remove(l.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Label name..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none" onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Add</button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Color</label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {allColors.map(c => (
              <button key={c} onClick={() => setNewColor(c)} className={`w-6 h-6 rounded-full ${newColor === c ? 'ring-2 ring-offset-1 ring-gray-800' : ''} hover:scale-110 transition-transform`} style={{ background: c }} />
            ))}
            <div className="flex items-center gap-1 ml-1">
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
              <button onClick={addCustomColor} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap">+ Save color</button>
            </div>
          </div>
        </div>
      </div>
      <button onClick={save} className="w-full mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">Save Labels</button>
    </Modal>
  );
}
