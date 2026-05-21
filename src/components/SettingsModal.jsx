import { useState, useEffect } from 'react';
import Modal from './Modal';
import EmojiPicker from './EmojiPicker';
import { useTheme } from './ThemeContext';

const APP_VERSION = __APP_VERSION__;

const PRESET_BACKGROUNDS = [
  { id: 'village', src: '/backgrounds/1.jpg', name: 'By' },
  { id: 'enchanted', src: '/backgrounds/2.jpg', name: 'Förtrollad skog' },
  { id: 'ruins', src: '/backgrounds/3.jpg', name: 'Ruiner' },
  { id: 'hilltop', src: '/backgrounds/4.webp', name: 'Kulltop' },
  { id: 'valley', src: '/backgrounds/5.webp', name: 'Dalgång' },
];

const TABS = [
  { key: 'general', label: 'Allmänt', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { key: 'columns', label: 'Kolumner', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
  { key: 'appearance', label: 'Utseende', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

export default function SettingsModal({ open, onClose, columns, onSave, backgroundImage, onSaveBackground, boardIcon, onSaveBoardIcon }) {
  const [tab, setTab] = useState('general');
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [bgPreview, setBgPreview] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [showIconEmojiPicker, setShowIconEmojiPicker] = useState(false);
  const { theme, setTheme } = useTheme();

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
    <Modal open={open} onClose={onClose} title="Inställningar" wide>
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
              {/* Version */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">QuestLog</p>
                    <p className="text-xs text-gray-400">Version {APP_VERSION}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Board-ikon</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden bg-gray-50">
                    {iconPreview ? (
                      iconPreview.startsWith('data:') ? (
                        <img src={iconPreview} alt="" className="w-10 h-10 object-cover" />
                      ) : (
                        <span className="text-xl">{iconPreview}</span>
                      )
                    ) : (
                      <span className="text-gray-300 text-sm">Ingen</span>
                    )}
                  </div>
                  {iconPreview && (
                    <button onClick={() => setIconPreview('')} className="text-xs text-red-500 hover:text-red-700 font-medium">Ta bort</button>
                  )}
                </div>
                <div className="relative inline-block mb-2">
                  <button
                    onClick={() => setShowIconEmojiPicker(o => !o)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Välj emoji…
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
                  Ladda upp egen bild
                  <input type="file" accept=".webp,.jpg,.jpeg,.png,.svg" onChange={handleIconUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Columns */}
          {tab === 'columns' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Board-kolumner</h3>
              <div className="space-y-2 mb-3">
                {items.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}.</span>
                    <input
                      value={col}
                      onChange={e => rename(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Flytta upp">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" title="Flytta ner">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50" title="Ta bort">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nytt kolumnnamn..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none" onKeyDown={e => e.key === 'Enter' && add()} />
                <button onClick={add} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Lägg till</button>
              </div>
              <p className="text-xs text-gray-400">Att byta namn på en kolumn uppdaterar alla dess uppgifter. Att ta bort en kolumn raderar INTE uppgifter — flytta dem först.</p>
            </div>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Tema</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    <span className="text-sm font-medium">Ljust</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                    <span className="text-sm font-medium">Mörkt</span>
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Bakgrundsbild</h3>
                {bgPreview && (
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-32 rounded-lg bg-cover bg-center border-2 border-indigo-400" style={{ backgroundImage: `url(${bgPreview})` }} />
                    <button onClick={removeBg} className="text-xs text-red-500 hover:text-red-700 font-medium">Ta bort bakgrund</button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mb-2">Förvalda bakgrunder</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_BACKGROUNDS.map(bg => {
                    const isActive = bgPreview === bg.src;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setBgPreview(bg.src)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all h-16 bg-cover bg-center ${isActive ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200 hover:border-gray-300'}`}
                        style={{ backgroundImage: `url(${bg.src})` }}
                        title={bg.name}
                      >
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                          <span className="text-[10px] text-white font-medium">{bg.name}</span>
                        </div>
                      </button>
                    );
                  })}
                  <label className="flex items-center justify-center h-16 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    <div className="text-center">
                      <svg className="w-4 h-4 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      <span className="text-[10px] text-gray-400">Egen bild</span>
                    </div>
                    <input type="file" accept=".webp,.jpg,.jpeg,.png" onChange={handleBgUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save button pinned to bottom */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button onClick={save} className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">Spara inställningar</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
