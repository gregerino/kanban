import { useState, useRef, useEffect } from 'react';
import { uid } from '../utils/helpers';
import EmojiPicker from './EmojiPicker';
import { useDrag } from './DragContext';

export default function BrainDumpPanel({ lists, onSave }) {
  const [activeList, setActiveList] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [nameValue, setNameValue] = useState('');
  const [newItem, setNewItem] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const nameRef = useRef(null);
  const itemRef = useRef(null);
  const { startDrag } = useDrag();

  useEffect(() => {
    if (lists.length > 0 && !activeList) setActiveList(lists[0].id);
  }, [lists]);

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus();
  }, [editingName]);

  const current = lists.find(l => l.id === activeList);

  const addList = () => {
    const nl = { id: uid(), name: 'New List', emoji: '📝', items: [] };
    onSave([...lists, nl]);
    setActiveList(nl.id);
  };

  const deleteList = (id) => {
    const next = lists.filter(l => l.id !== id);
    onSave(next);
    if (activeList === id) setActiveList(next[0]?.id || null);
  };

  const updateList = (id, changes) => {
    onSave(lists.map(l => l.id === id ? { ...l, ...changes } : l));
  };

  const startRename = (list) => {
    setEditingName(list.id);
    setNameValue(list.name);
  };

  const finishRename = () => {
    if (nameValue.trim() && editingName) {
      const match = nameValue.match(/^(\p{Emoji_Presentation}|\p{Emoji}️?)\s*(.*)/u);
      if (match && match[1]) {
        updateList(editingName, { emoji: match[1], name: match[2] || nameValue });
      } else {
        updateList(editingName, { name: nameValue.trim() });
      }
    }
    setEditingName(null);
  };

  const addItem = () => {
    if (!newItem.trim() || !current) return;
    updateList(current.id, { items: [...current.items, { id: uid(), text: newItem.trim(), done: false }] });
    setNewItem('');
    setTimeout(() => itemRef.current?.focus(), 0);
  };

  const toggleItem = (itemId) => {
    if (!current) return;
    updateList(current.id, { items: current.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) });
  };

  const removeItem = (itemId) => {
    if (!current) return;
    updateList(current.id, { items: current.items.filter(i => i.id !== itemId) });
  };

  const setEmoji = (listId, emoji) => {
    updateList(listId, { emoji });
  };

  const handleItemPointerDown = (e, item) => {
    startDrag(e, 'braindump', item.id, { text: item.text, listId: current.id, itemId: item.id });
  };

  // Split items into active vs completed
  const activeItems = current ? current.items.filter(i => !i.done) : [];
  const completedItems = current ? current.items.filter(i => i.done) : [];

  const renderItem = (item, isDone) => (
    <div
      key={item.id}
      className={`flex items-start gap-2 group py-1 ${!isDone ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
      onPointerDown={!isDone ? (e) => handleItemPointerDown(e, item) : undefined}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => toggleItem(item.id)}
        className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-300 cursor-pointer mt-0.5"
      />
      <span className={`text-sm flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
      {!isDone && (
        <svg className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Drag to board to create task">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9h.01M8 15h.01M16 9h.01M16 15h.01" />
        </svg>
      )}
      <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* List tabs */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {lists.map(l => (
          <button
            key={l.id}
            onClick={() => setActiveList(l.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${activeList === l.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {l.emoji && <span className="mr-1">{l.emoji}</span>}{l.name}
          </button>
        ))}
        <button onClick={addList} className="p-1 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-100" title="New list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>

      {current ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* List header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <button onClick={() => setEmojiPickerOpen(o => !o)} className="text-lg hover:bg-gray-100 rounded-lg w-8 h-8 flex items-center justify-center transition-colors" title="Change emoji">{current.emoji || '📝'}</button>
              {emojiPickerOpen && (
                <EmojiPicker
                  onSelect={(e) => setEmoji(current.id, e)}
                  onClose={() => setEmojiPickerOpen(false)}
                />
              )}
            </div>
            {editingName === current.id ? (
              <input
                ref={nameRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={finishRename}
                onKeyDown={e => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') setEditingName(null); }}
                className="flex-1 px-2 py-0.5 border border-indigo-300 rounded text-sm outline-none font-semibold"
              />
            ) : (
              <span className="font-semibold text-gray-800 text-sm flex-1 cursor-pointer" onDoubleClick={() => startRename(current)}>{current.name}</span>
            )}
            <button onClick={() => startRename(current)} className="p-1 rounded hover:bg-gray-100" title="Rename">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button onClick={() => deleteList(current.id)} className="p-1 rounded hover:bg-red-50" title="Delete list">
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>

          {/* Active items */}
          <div className="flex-1 overflow-y-auto mb-3">
            <div className="space-y-0.5">
              {activeItems.map(item => renderItem(item, false))}
              {activeItems.length === 0 && completedItems.length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">No items yet. Start dumping ideas!</p>
              )}
              {activeItems.length === 0 && completedItems.length > 0 && (
                <p className="text-xs text-gray-400 py-2 text-center">All items completed!</p>
              )}
            </div>

            {/* Completed section */}
            {completedItems.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-2">
                <button
                  onClick={() => setCompletedOpen(o => !o)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 mb-1 w-full"
                >
                  <svg className={`w-3 h-3 transition-transform ${completedOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                  Completed ({completedItems.length})
                </button>
                {completedOpen && (
                  <div className="space-y-0.5">
                    {completedItems.map(item => renderItem(item, true))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drag hint */}
          {activeItems.length > 0 && (
            <p className="text-[10px] text-gray-300 text-center mb-1.5">Drag items to the board to create tasks</p>
          )}

          {/* Add item */}
          <div className="flex gap-2 shrink-0">
            <input
              ref={itemRef}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="Add item..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button onClick={addItem} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">Add</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <button onClick={addList} className="text-sm text-indigo-500 hover:text-indigo-700 font-medium">Create your first list</button>
        </div>
      )}
    </div>
  );
}
