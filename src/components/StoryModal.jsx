import { useState, useEffect } from 'react';
import Modal from './Modal';
import { uid } from '../utils/helpers';

const PRESET_HEX = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#84cc16'];

export default function StoryModal({ story, open, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ title: '', description: '', color: '#6366f1' });

  useEffect(() => {
    if (story) {
      let c = story.color || '#6366f1';
      // Migrate old bg- class colors
      if (c.startsWith('bg-')) {
        const map = { 'bg-indigo-500': '#6366f1', 'bg-emerald-500': '#10b981', 'bg-amber-500': '#f59e0b', 'bg-rose-500': '#f43f5e', 'bg-cyan-500': '#06b6d4', 'bg-purple-500': '#a855f7' };
        c = map[c] || '#6366f1';
      }
      setForm({ title: story.title, description: story.description || '', color: c });
    } else {
      setForm({ title: '', description: '', color: '#6366f1' });
    }
  }, [story, open]);

  const save = () => {
    if (!form.title.trim()) return;
    onSave(story ? { ...story, ...form } : { id: uid(), ...form });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={story ? 'Edit Story' : 'New Story'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Story title..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Describe the story goal..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {PRESET_HEX.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-800' : ''} hover:scale-110 transition-transform`} style={{ background: c }} />
            ))}
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded-full cursor-pointer border-0 p-0" title="Custom color" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
            {story ? 'Save' : 'Create'}
          </button>
          {story && <button onClick={() => { onDelete(story.id); onClose(); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Delete</button>}
        </div>
      </div>
    </Modal>
  );
}
