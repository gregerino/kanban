import { useState, useEffect } from 'react';
import Modal from './Modal';
import EmojiPicker from './EmojiPicker';

const TABS = [
  { key: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { key: 'columns', label: 'Columns', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
  { key: 'appearance', label: 'Appearance', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

export default function SettingsModal({ open, onClose, columns, onSave, backgroundImage, onSaveBackground, boardIcon, onSaveBoardIcon }) {
  const [tab, setTab] = useState('general');
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [bgPreview, setBgPreview] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [showIconEmojiPicker, setShowIconEmojiPicker] = useState(false);

  useEffect(() => {
    if (open) {
      setItems([...columns]);
      setBgPreview(backgroundImage || '');
      setIconPreview(boardIcon || '');
      setTab('general');
    }
  }, [open, columns, backgroundImage, boardIcon]);

  const rename = (idx, val) => setItems(i => i.map((c, j) => j === idx ? val : c));
  const remove = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const add = () => {
    if (!newName.trim() || items.includes(newName.trim())) return;
    setItems(i => [...i, newName.trim()]);
    setNewName('');
  };
  const moveUp = (idx) => {
    if (idx === 0) return;
    setItems(i => { const n = [...i]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; });
  };
  const moveDown = (idx) => {
    if (idx === items.length - 1) return;
    setItems(i => { const n = [...i]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n; });
  };

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/webp', 'image/jpeg', 'image/png'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgPreview(ev.target.result);
    reader.readAsDataURL(file);
  };
  const removeBg = () => setBgPreview('');

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = (ev) => setIconPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = () => {
    const cleaned = items.map(s => s.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    onSave(cleaned);
    onSaveBackground(bgPreview);
    onSaveBoardIcon(iconPreview);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" wide>
      <div className="flex gap-6 min-h-[380px]">
        {/* Sidebar tabs */}
        <nav className="w-40 shrink-0 space-y-1 border-r border-gray-100 pr-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${tab === t.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={t.icon} /></svg>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* General */}
          {tab === 'general' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Board Icon</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden bg-gray-50">
                    {iconPreview ? (
                      iconPreview.startsWith('data:') ? (
                        <img src={iconPreview} alt="" className="w-10 h-10 object-cover" />
                      ) : (
                        <span className="text-xl">{iconPreview}</span>
                      )
                    ) : (
                      <span className="text-gray-300 text-sm">None</span>
                    )}
                  </div>
                  {iconPreview && (
                    <button onClick={() => setIconPreview('')} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                  )}
                </div>
                <div className="relative inline-block mb-2">
                  <button
                    onClick={() => setShowIconEmojiPicker(o => !o)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Choose emoji…
                  </button>
                  {showIconEmojiPicker && (
                    <EmojiPicker
                      onSelect={(e) => setIconPreview(e)}
                      onClose={() => setShowIconEmojiPicker(false)}
                    />
                  )}
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Upload custom image
                  <input type="file" accept=".webp,.jpg,.jpeg,.png,.svg" onChange={handleIconUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Columns */}
          {tab === 'columns' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Board Columns</h3>
              <div className="space-y-2 mb-3">
                {items.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}.</span>
                    <input
                      value={col}
                      onChange={e => rename(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Move up">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Move down">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50" title="Remove">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New column name..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none" onKeyDown={e => e.key === 'Enter' && add()} />
                <button onClick={add} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Add</button>
              </div>
              <p className="text-xs text-gray-400">Renaming a column updates all its tasks. Removing one will NOT delete tasks — move them first.</p>
            </div>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Background Image</h3>
                {bgPreview ? (
                  <div className="space-y-2">
                    <div className="w-full h-36 rounded-lg bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url(${bgPreview})` }} />
                    <button onClick={removeBg} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove background</button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    <div className="text-center">
                      <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-xs text-gray-500">Upload image (webp, jpg, png)</span>
                    </div>
                    <input type="file" accept=".webp,.jpg,.jpeg,.png" onChange={handleBgUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Save button pinned to bottom */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button onClick={save} className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">Save Settings</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
