import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { loadBoards, loadActiveId, saveBoards, saveActiveId, createEmptyBoard } from './utils/storage';
import useCloudSync from './utils/useCloudSync';
import { uid } from './utils/helpers';
import StickyNote from './components/StickyNote';
import StoryCard from './components/StoryCard';
import TaskDetailModal from './components/TaskDetailModal';
import StoryModal from './components/StoryModal';
import QuickAddTask from './components/QuickAddTask';
import LabelManagerModal from './components/LabelManagerModal';
import SettingsModal from './components/SettingsModal';
import NotificationCenter from './components/NotificationCenter';
import BrainDumpPanel from './components/BrainDumpPanel';
import AnalyticsModal from './components/AnalyticsModal';
import UpdateChecker from './components/UpdateChecker';
import LoginScreen from './components/LoginScreen';
import AuthProvider, { useAuth } from './components/AuthContext';
import TaskContextMenu from './components/TaskContextMenu';
import DragProvider, { useDrag } from './components/DragContext';

function DropZone({ storyId, col, children }) {
  const ref = useRef(null);
  const { registerDropZone } = useDrag();
  useEffect(() => {
    const key = `${storyId}-${col}`;
    registerDropZone(key, ref.current, storyId, col);
    return () => registerDropZone(key, null);
  }, [storyId, col, registerDropZone]);
  return (
    <div ref={ref} className="w-96 shrink-0 column-drop-zone p-2 border-r border-inherit last:border-r-0">
      {children}
    </div>
  );
}

function AppInner() {
  const { user, signOut, isConfigured } = useAuth();
  const { boards, setBoards, activeId, setActiveId, syncing, syncError } = useCloudSync(user);
  const [filters, setFilters] = useState({ status: '', priority: '', label: '' });

  const [detailTask, setDetailTask] = useState(null);
  const [storyModal, setStoryModal] = useState({ open: false, story: null });
  const [labelModal, setLabelModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const [collapsedStories, setCollapsedStories] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [renamingBoard, setRenamingBoard] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [sidebarTab, setSidebarTab] = useState('stories'); // 'stories' | 'braindump'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, task }

  // Refs for scrolling to stories
  const storyRowRefs = useRef({});
  const mainRef = useRef(null);

  const data = boards.find(b => b.id === activeId) || boards[0];

  const updateBoard = (fn) => setBoards(bs => bs.map(b => b.id === activeId ? fn(b) : b));

  // Board management
  const addBoard = () => {
    const b = createEmptyBoard('New Board');
    setBoards(bs => [...bs, b]);
    setActiveId(b.id);
    setBoardMenuOpen(false);
  };
  const deleteBoard = (id) => {
    if (boards.length <= 1) return;
    setBoards(bs => bs.filter(b => b.id !== id));
    if (activeId === id) setActiveId(boards.find(b => b.id !== id)?.id);
    setBoardMenuOpen(false);
  };
  const startRename = (b) => { setRenamingBoard(b.id); setRenameValue(b.name); };
  const finishRename = () => {
    if (renameValue.trim()) {
      setBoards(bs => bs.map(b => b.id === renamingBoard ? { ...b, name: renameValue.trim() } : b));
    }
    setRenamingBoard(null);
  };

  const switchBoard = (id) => { setActiveId(id); setBoardMenuOpen(false); setFilters({ status: '', priority: '', label: '' }); setCollapsedStories({}); };

  // Story CRUD
  const saveStory = (story) => updateBoard(d => {
    const idx = d.stories.findIndex(s => s.id === story.id);
    const stories = [...d.stories];
    if (idx >= 0) stories[idx] = story; else stories.push(story);
    return { ...d, stories };
  });
  const deleteStory = (id) => updateBoard(d => ({
    ...d,
    stories: d.stories.filter(s => s.id !== id),
    tasks: d.tasks.filter(t => t.storyId !== id),
  }));

  // Task CRUD
  const saveTask = (task) => updateBoard(d => {
    const idx = d.tasks.findIndex(t => t.id === task.id);
    const tasks = [...d.tasks];
    if (idx >= 0) tasks[idx] = task; else tasks.push(task);
    return { ...d, tasks };
  });
  const deleteTask = (id) => updateBoard(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  const addTask = (task) => updateBoard(d => ({ ...d, tasks: [...d.tasks, task] }));
  const toggleCheckItem = (taskId, checkId) => updateBoard(d => ({
    ...d,
    tasks: d.tasks.map(t => t.id === taskId ? { ...t, checklist: (t.checklist || []).map(c => c.id === checkId ? { ...c, done: !c.done } : c) } : t),
  }));

  const saveColumns = (newColumns) => {
    updateBoard(d => {
      const oldCols = d.columns;
      const tasks = d.tasks.map(t => {
        const idx = oldCols.indexOf(t.status);
        if (idx >= 0 && idx < newColumns.length && oldCols[idx] !== newColumns[idx]) {
          return { ...t, status: newColumns[idx] };
        }
        return t;
      });
      return { ...d, columns: newColumns, tasks };
    });
  };

  // Brain dump
  const saveBrainDumpLists = (lists) => updateBoard(d => ({ ...d, brainDumpLists: lists }));

  // Board icon
  const saveBoardIcon = (icon) => updateBoard(d => ({ ...d, icon }));

  // Drag and drop — custom pointer-event system for Tauri/WebKit compatibility
  useEffect(() => {
    const onBoardDrop = (e) => {
      const { drag, target } = e.detail;
      if (!drag || !target) return;
      const { storyId, col: status } = target;

      if (drag.type === 'braindump') {
        const bd = drag.data;
        const newTask = {
          id: uid(),
          title: bd.text,
          status,
          storyId,
          priority: '',
          labels: [],
          deadline: '',
          checklist: [],
          notes: '',
          files: [],
          comments: [],
          color: '',
        };
        updateBoard(d => ({
          ...d,
          tasks: [...d.tasks, newTask],
          brainDumpLists: (d.brainDumpLists || []).map(l =>
            l.id === bd.listId ? { ...l, items: l.items.filter(i => i.id !== bd.itemId) } : l
          ),
        }));
      } else if (drag.type === 'task') {
        const taskId = drag.id;
        updateBoard(d => ({
          ...d,
          tasks: d.tasks.map(t => t.id === taskId ? { ...t, status, storyId } : t),
        }));
      }
    };
    window.addEventListener('board-drop', onBoardDrop);
    return () => window.removeEventListener('board-drop', onBoardDrop);
  }, []);

  const filteredTasks = useMemo(() => {
    return data.tasks.filter(t => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.label && !t.labels?.includes(filters.label)) return false;
      return true;
    });
  }, [data.tasks, filters]);

  // Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return data.tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.notes || '').toLowerCase().includes(q) ||
      (t.checklist || []).some(c => c.text.toLowerCase().includes(q)) ||
      (t.comments || []).some(c => c.text.toLowerCase().includes(q))
    );
  }, [data.tasks, searchQuery]);

  const toggleStoryCollapse = (id) => setCollapsedStories(c => ({ ...c, [id]: !c[id] }));

  // Scroll to story row when clicking in sidebar
  const scrollToStory = useCallback((storyId) => {
    // Uncollapse the story if collapsed
    setCollapsedStories(c => ({ ...c, [storyId]: false }));
    setTimeout(() => {
      const el = storyRowRefs.current[storyId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  // Build story color map for task cards
  const storyColorMap = useMemo(() => {
    const map = {};
    data.stories.forEach(s => {
      if (s.color && !s.color.startsWith('bg-')) map[s.id] = s.color;
    });
    return map;
  }, [data.stories]);

  const STORY_ROW_COLORS = [
    'bg-indigo-50/70 border-indigo-200',
    'bg-emerald-50/70 border-emerald-200',
    'bg-amber-50/70 border-amber-200',
    'bg-rose-50/70 border-rose-200',
    'bg-cyan-50/70 border-cyan-200',
    'bg-purple-50/70 border-purple-200',
  ];

  // Board icon display
  const boardIcon = data.icon || '';
  const isEmojiIcon = boardIcon && !boardIcon.startsWith('data:');

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(s => !s)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-2">
            {/* Board icon — click opens settings on General tab */}
            <button onClick={() => setSettingsModal(true)} className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer" style={!boardIcon ? { background: '#6366f1' } : isEmojiIcon ? { background: '#f3f4f6' } : undefined} title="Change board icon">
              {boardIcon ? (
                isEmojiIcon ? (
                  <span className="text-lg">{boardIcon}</span>
                ) : (
                  <img src={boardIcon} alt="" className="w-8 h-8 object-cover rounded-lg" />
                )
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
              )}
            </button>
            {/* Board switcher */}
            <div className="relative">
              <button onClick={() => setBoardMenuOpen(o => !o)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                <h1 className="text-lg font-bold text-gray-800">{data.name}</h1>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${boardMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {boardMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => { setBoardMenuOpen(false); setRenamingBoard(null); }} />
                  <div className="absolute left-0 top-full mt-1 z-40 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[220px] py-1">
                    {boards.map(b => (
                      <div key={b.id} className={`flex items-center gap-2 px-3 py-2 ${b.id === activeId ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        {b.icon && <span className="text-sm">{b.icon.startsWith('data:') ? '🖼️' : b.icon}</span>}
                        {renamingBoard === b.id ? (
                          <input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={finishRename}
                            onKeyDown={e => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') setRenamingBoard(null); }}
                            className="flex-1 px-2 py-0.5 border border-indigo-300 rounded text-sm outline-none"
                            autoFocus
                          />
                        ) : (
                          <>
                            <button onClick={() => switchBoard(b.id)} className="flex-1 text-left text-sm text-gray-700 font-medium truncate">{b.name}</button>
                            <button onClick={() => startRename(b)} className="p-1 rounded hover:bg-gray-200" title="Rename">
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                            {boards.length > 1 && (
                              <button onClick={() => deleteBoard(b.id)} className="p-1 rounded hover:bg-red-100" title="Delete">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={addBoard} className="w-full px-3 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 text-left flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        New Board
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync indicator */}
          {user && (
            <div className="flex items-center gap-1.5 mr-1">
              {syncing ? (
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Synkar..." />
              ) : syncError ? (
                <div className="w-2 h-2 rounded-full bg-red-400" title={`Synkfel: ${syncError}`} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-green-400" title="Synkad" />
              )}
            </div>
          )}
          {/* Search */}
          <div className="relative">
            <button onClick={() => setSearchOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Search tasks">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
            {searchOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} />
                <div className="absolute right-0 top-full mt-2 z-40 bg-white rounded-xl shadow-xl border border-gray-100 w-80">
                  <div className="p-3">
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                      autoFocus
                    />
                  </div>
                  {searchQuery.trim() && (
                    <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                      {searchResults.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No results found</p>
                      ) : (
                        searchResults.map(t => {
                          const story = data.stories.find(s => s.id === t.storyId);
                          return (
                            <button
                              key={t.id}
                              onClick={() => { setDetailTask(t); setSearchOpen(false); setSearchQuery(''); }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                            >
                              <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{story?.title || 'Unknown story'} · {t.status}</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <NotificationCenter tasks={data.tasks} onOpenTask={setDetailTask} />

          <button onClick={() => setAnalyticsModal(true)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1" title="Analytics">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Analytics
          </button>
          <button onClick={() => setSettingsModal(true)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Settings
          </button>
          <button onClick={() => setLabelModal(true)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            Labels
          </button>

          {/* User avatar / Auth */}
          {user ? (
            <div className="relative group">
              <button className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-indigo-300 transition-colors" title={user.email}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {(user.email || '?')[0].toUpperCase()}
                  </div>
                )}
              </button>
              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-800 truncate">{user.user_metadata?.full_name || user.email}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                </div>
                <button onClick={signOut} className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors">
                  Logga ut
                </button>
              </div>
            </div>
          ) : isConfigured ? (
            <button onClick={() => window.__showLogin?.()} className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
              Logga in
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} shrink-0 bg-white border-r border-gray-100 overflow-y-auto overflow-x-hidden transition-all duration-200 flex flex-col`}>
          <div className="p-4 flex flex-col flex-1" style={{ minWidth: '18rem' }}>
            {/* Sidebar tabs */}
            <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setSidebarTab('stories')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${sidebarTab === 'stories' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Stories
              </button>
              <button
                onClick={() => setSidebarTab('braindump')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${sidebarTab === 'braindump' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Brain Dump
              </button>
            </div>

            {sidebarTab === 'stories' ? (
              <div className="space-y-3 flex-1">
                {data.stories.map(story => (
                  <div key={story.id}>
                    <StoryCard story={story} tasks={data.tasks} onEdit={(s) => setStoryModal({ open: true, story: s })} onDelete={deleteStory} onClick={() => scrollToStory(story.id)} />
                  </div>
                ))}
                <button onClick={() => setStoryModal({ open: true, story: null })} className="w-full py-2.5 text-sm text-indigo-500 font-medium hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-1 border-2 border-dashed border-indigo-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  New Story
                </button>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <BrainDumpPanel lists={data.brainDumpLists || []} onSave={saveBrainDumpLists} />
              </div>
            )}
          </div>
        </aside>

        {/* Board */}
        <main ref={mainRef} className="flex-1 overflow-x-auto overflow-y-auto" style={data.backgroundImage ? { backgroundImage: `url(${data.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <div className="min-w-max p-4">
            <div className="flex gap-0 mb-0">
              {data.columns.map(col => (
                <div key={col} className="w-96 shrink-0 px-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">{col}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {filteredTasks.filter(t => t.status === col).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {data.stories.map((story, storyIdx) => {
              const storyFilteredTasks = filteredTasks.filter(t => t.storyId === story.id);
              const collapsed = collapsedStories[story.id];
              const rowColor = STORY_ROW_COLORS[storyIdx % STORY_ROW_COLORS.length];
              const storyHexColor = storyColorMap[story.id];

              if (filters.status && storyFilteredTasks.length === 0 && !filters.priority && !filters.label) return null;

              return (
                <div
                  key={story.id}
                  ref={el => storyRowRefs.current[story.id] = el}
                  className={`mt-3 rounded-2xl border ${rowColor} overflow-hidden`}
                  style={storyHexColor ? { borderColor: storyHexColor + '40', background: storyHexColor + '0a' } : undefined}
                >
                  <button
                    onClick={() => toggleStoryCollapse(story.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-white/40 transition-colors text-left"
                  >
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    <div className="w-3 h-3 rounded-full shrink-0" style={storyHexColor ? { background: storyHexColor } : undefined} />
                    <span className="text-sm font-semibold text-gray-700">{story.title}</span>
                    <span className="text-xs text-gray-400">({storyFilteredTasks.length} tasks)</span>
                  </button>

                  {!collapsed && (
                    <div className="flex">
                      {data.columns.map(col => {
                        const colTasks = storyFilteredTasks.filter(t => t.status === col);
                        return (
                          <DropZone
                            key={col}
                            storyId={story.id}
                            col={col}
                          >
                            <div className="grid gap-2" style={{ gridTemplateColumns: colTasks.length >= 3 ? 'repeat(3, 1fr)' : colTasks.length === 2 ? 'repeat(2, 1fr)' : '1fr' }}>
                              {colTasks.map(task => (
                                <div key={task.id}>
                                  <StickyNote
                                    task={task}
                                    labels={data.labels}
                                    storyColor={storyHexColor}
                                    onOpen={setDetailTask}
                                    onToggleCheck={toggleCheckItem}
                                    onContextMenu={(e, t) => setContextMenu({ x: e.clientX, y: e.clientY, task: t })}
                                  />
                                </div>
                              ))}
                            </div>
                            <QuickAddTask storyId={story.id} status={col} onAdd={addTask} />
                          </DropZone>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Modals */}
      <TaskDetailModal
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        allLabels={data.labels}
        columns={data.columns}
        customColors={data.customColors || []}
        onSave={saveTask}
        onDelete={deleteTask}
      />
      <StoryModal
        story={storyModal.story}
        open={storyModal.open}
        onClose={() => setStoryModal({ open: false, story: null })}
        onSave={saveStory}
        onDelete={deleteStory}
      />
      <LabelManagerModal
        open={labelModal}
        onClose={() => setLabelModal(false)}
        labels={data.labels}
        customColors={data.customColors || []}
        onSave={(labels) => updateBoard(d => ({ ...d, labels }))}
        onSaveCustomColors={(customColors) => updateBoard(d => ({ ...d, customColors }))}
      />
      <SettingsModal
        open={settingsModal}
        onClose={() => setSettingsModal(false)}
        columns={data.columns}
        onSave={saveColumns}
        backgroundImage={data.backgroundImage || ''}
        onSaveBackground={(img) => updateBoard(d => ({ ...d, backgroundImage: img }))}
        boardIcon={data.icon || ''}
        onSaveBoardIcon={saveBoardIcon}
      />
      <AnalyticsModal
        open={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        tasks={data.tasks}
        labels={data.labels}
        columns={data.columns}
      />
      <UpdateChecker />
      {contextMenu && (
        <TaskContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          task={contextMenu.task}
          onOpen={setDetailTask}
          onDelete={deleteTask}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

function AppShell() {
  const { user, loading, isConfigured } = useAuth();
  const [skippedLogin, setSkippedLogin] = useState(() => {
    return localStorage.getItem('scrum_skipped_login') === 'true';
  });

  // Expose showLogin for the header "Logga in" button
  useEffect(() => {
    window.__showLogin = () => {
      localStorage.removeItem('scrum_skipped_login');
      setSkippedLogin(false);
    };
    return () => { delete window.__showLogin; };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show login screen if Supabase is configured, user not logged in, and hasn't skipped
  if (isConfigured && !user && !skippedLogin) {
    return <LoginScreen onSkip={() => { setSkippedLogin(true); localStorage.setItem('scrum_skipped_login', 'true'); }} />;
  }

  return (
    <DragProvider>
      <AppInner />
    </DragProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
