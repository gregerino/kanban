import { useState, useEffect } from 'react';
import Modal from './Modal';
import { uid } from '../utils/helpers';

const PRESET_HEX = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#84cc16'];
const CUSTOM_COLORS_KEY = 'scrum-custom-story-colors';

function loadCustomColors() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY)) || []; } catch { return []; }
}
function saveCustomColors(colors) {
  localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors.slice(-12)));
}

export default function StoryModal({ story, open, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ title: '', description: '', color: '#6366f1' });
  const [customColors, setCustomColors] = useState(loadCustomColors);

  useEffect(() => {
    if (story) {
      let c = story.color || '#6366f1';
      if (c.startsWith('bg-')) {
        const map = { 'bg-indigo-500': '#6366f1', 'bg-emerald-500': '#10b981', 'bg-amber-500': '#f59e0b', 'bg-rose-500': '#f43f5e', 'bg-cyan-500': '#06b6d4', 'bg-purple-500': '#a855f7' };
        c = map[c] || '#6366f1';
      }
      setForm({ title: story.title, description: story.description || '', color: c });
    } else {
      setForm({ title: '', description: '', color: '#6366f1' });
    }
  }, [story, open]);

  const isCustom = (c) => !PRESET_HEX.includes(c);

  const handleColorPick = (e) => {
    const c = e.target.value;
    setForm(f => ({ ...f, color: c }));
  };

  const handleColorCommit = () => {
    const c = form.color;
    if (isCustom(c) && !customColors.includes(c)) {
      const next = [...customColors, c];
      setCustomColors(next);
      saveCustomColors(next);
    }
  };

  const removeCustomColor = (c, e) => {
    e.stopPropagation();
    const next = customColors.filter(x => x !== c);
    setCustomColors(next);
    saveCustomColors(next);
    if (form.color === c) setForm(f => ({ ...f, color: '#6366f1' }));
  };

  const save = () => {
    if (!form.title.trim()) return;
    // Save custom color if it's new
    if (isCustom(form.color) && !customColors.includes(form.color)) {
      const next = [...customColors, form.color];
      setCustomColors(next);
      saveCustomColors(next);
    }
    onSave(story ? { ...story, ...form } : { id: uid(), ...form });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={story ? 'Redigera story' : 'Ny story'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Storytitel..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Beskrivning</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Beskriv storymålet..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Färg</label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {PRESET_HEX.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-800' : ''} hover:scale-110 transition-transform`} style={{ background: c }} />
            ))}
            <input type="color" value={form.color} onChange={handleColorPick} onBlur={handleColorCommit} className="w-8 h-8 rounded-full cursor-pointer border-0 p-0" title="Välj egen färg" />
          </div>

          {/* Saved custom colors */}
          {customColors.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Sparade färger</span>
              <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                {customColors.map(c => (
                  <div key={c} className="relative group">
                    <button
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-800' : ''} hover:scale-110 transition-transform`}
                      style={{ background: c }}
                    />
                    <button
                      onClick={(e) => removeCustomColor(c, e)}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                      title="Ta bort färg"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
            {story ? 'Spara' : 'Skapa'}
          </button>
          {story && <button onClick={() => { onDelete(story.id); onClose(); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Ta bort</button>}
        </div>
      </div>
    </Modal>
  );
}
