import { useState, useEffect } from 'react';
import Modal from './Modal';
import { uid } from '../utils/helpers';

const STORY_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];

export default function StoryModal({ story, open, onClose, onSave, onDelete, boxes }) {
  const [form, setForm] = useState({ title: '', description: '', boxId: '', color: 'bg-indigo-500' });

  useEffect(() => {
    if (story) setForm({ title: story.title, description: story.description || '', boxId: story.boxId || '', color: story.color || 'bg-indigo-500' });
    else setForm({ title: '', description: '', boxId: '', color: 'bg-indigo-500' });
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
          <label className="block text-xs font-medium text-gray-500 mb-1">Box / Section</label>
          <select value={form.boxId} onChange={e => setForm(f => ({ ...f, boxId: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">No box</option>
            {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
          <div className="flex gap-2">
            {STORY_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full ${c} ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-800' : ''} hover:scale-110 transition-transform`} />
            ))}
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
