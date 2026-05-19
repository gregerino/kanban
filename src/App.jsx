import { useState, useEffect, useMemo } from 'react';
import { loadData, saveData } from './utils/storage';
import { uid } from './utils/helpers';
import StickyNote from './components/StickyNote';
import StoryCard from './components/StoryCard';
import TaskDetailModal from './components/TaskDetailModal';
import StoryModal from './components/StoryModal';
import BoxModal from './components/BoxModal';
import QuickAddTask from './components/QuickAddTask';
import FilterBar from './components/FilterBar';
import LabelManagerModal from './components/LabelManagerModal';
import PeopleManagerModal from './components/PeopleManagerModal';
import IconButton from './components/IconButton';

export default function App() {
  const [data, setData] = useState(loadData);
  const [filters, setFilters] = useState({ assignee: '', status: '', priority: '', label: '' });
  const [draggingId, setDraggingId] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [storyModal, setStoryModal] = useState({ open: false, story: null });
  const [boxModal, setBoxModal] = useState({ open: false, box: null });
  const [labelModal, setLabelModal] = useState(false);
  const [peopleModal, setPeopleModal] = useState(false);
  const [collapsedStories, setCollapsedStories] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { saveData(data); }, [data]);

  const updateData = (fn) => setData(d => fn(d));

  const saveStory = (story) => updateData(d => {
    const idx = d.stories.findIndex(s => s.id === story.id);
    const stories = [...d.stories];
    if (idx >= 0) stories[idx] = story; else stories.push(story);
    return { ...d, stories };
  });
  const deleteStory = (id) => updateData(d => ({
    ...d,
    stories: d.stories.filter(s => s.id !== id),
    tasks: d.tasks.filter(t => t.storyId !== id),
  }));

  const saveTask = (task) => updateData(d => {
    const idx = d.tasks.findIndex(t => t.id === task.id);
    const tasks = [...d.tasks];
    if (idx >= 0) tasks[idx] = task; else tasks.push(task);
    return { ...d, tasks };
  });
  const deleteTask = (id) => updateData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  const addTask = (task) => updateData(d => ({ ...d, tasks: [...d.tasks, task] }));

  const saveBox = (box) => updateData(d => {
    const idx = d.boxes.findIndex(b => b.id === box.id);
    const boxes = [...d.boxes];
    if (idx >= 0) boxes[idx] = box; else boxes.push(box);
    return { ...d, boxes };
  });
  const deleteBox = (id) => updateData(d => ({
    ...d,
    boxes: d.boxes.filter(b => b.id !== id),
    stories: d.stories.map(s => s.boxId === id ? { ...s, boxId: '' } : s),
  }));

  const handleDrop = (e, storyId, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    updateData(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId ? { ...t, status, storyId } : t),
    }));
    setDraggingId(null);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const handleDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };

  const filteredTasks = useMemo(() => {
    return data.tasks.filter(t => {
      if (filters.assignee && t.assignee !== filters.assignee) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.label && !t.labels?.includes(filters.label)) return false;
      return true;
    });
  }, [data.tasks, filters]);

  const storiesByBox = useMemo(() => {
    const groups = {};
    const noBox = data.stories.filter(s => !s.boxId);
    if (noBox.length > 0) groups['__none__'] = noBox;
    data.boxes.forEach(b => {
      const stories = data.stories.filter(s => s.boxId === b.id);
      groups[b.id] = stories;
    });
    return groups;
  }, [data.stories, data.boxes]);

  const toggleStoryCollapse = (id) => setCollapsedStories(c => ({ ...c, [id]: !c[id] }));

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(s => !s)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
            </div>
            <h1 className="text-lg font-bold text-gray-800">Scrum Board</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPeopleModal(true)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            Team
          </button>
          <button onClick={() => setLabelModal(true)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            Labels
          </button>
        </div>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} people={data.people} labels={data.labels} columns={data.columns} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} shrink-0 bg-white border-r border-gray-100 overflow-y-auto overflow-x-hidden transition-all duration-200`}>
          <div className="p-4 space-y-4" style={{ minWidth: '18rem' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Boxes / Sections</span>
              <button onClick={() => setBoxModal({ open: true, box: null })} className="p-1 rounded hover:bg-gray-100">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
            {data.boxes.map(box => (
              <div key={box.id} className="rounded-xl border-2 p-3 mb-3" style={{ borderColor: box.color }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: box.color }}>{box.name}</span>
                  <IconButton onClick={() => setBoxModal({ open: true, box })} title="Edit box">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </IconButton>
                </div>
                {(storiesByBox[box.id] || []).map(story => (
                  <div key={story.id} className="mb-2">
                    <StoryCard story={story} tasks={data.tasks} onEdit={(s) => setStoryModal({ open: true, story: s })} onDelete={deleteStory} />
                  </div>
                ))}
                <button onClick={() => setStoryModal({ open: true, story: { _preset: box.id } })} className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">+ Add Story</button>
              </div>
            ))}

            {storiesByBox['__none__'] && (
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stories</span>
                {storiesByBox['__none__'].map(story => (
                  <div key={story.id} className="mt-2">
                    <StoryCard story={story} tasks={data.tasks} onEdit={(s) => setStoryModal({ open: true, story: s })} onDelete={deleteStory} />
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setStoryModal({ open: true, story: null })} className="w-full py-2.5 text-sm text-indigo-500 font-medium hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-1 border-2 border-dashed border-indigo-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              New Story
            </button>
          </div>
        </aside>

        {/* Board */}
        <main className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="min-w-max p-4">
            <div className="flex gap-4 mb-4">
              {data.columns.map(col => (
                <div key={col} className="w-64 shrink-0">
                  <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">{col}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {filteredTasks.filter(t => t.status === col).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {data.stories.map(story => {
              const storyFilteredTasks = filteredTasks.filter(t => t.storyId === story.id);
              const collapsed = collapsedStories[story.id];

              if (filters.status && storyFilteredTasks.length === 0 && !filters.assignee && !filters.priority && !filters.label) return null;

              return (
                <div key={story.id} className="mb-3">
                  <button
                    onClick={() => toggleStoryCollapse(story.id)}
                    className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg hover:bg-white/60 transition-colors group"
                  >
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    <div className={`w-3 h-3 rounded-full ${story.color}`} />
                    <span className="text-sm font-medium text-gray-700">{story.title}</span>
                    <span className="text-xs text-gray-400">({storyFilteredTasks.length} tasks)</span>
                  </button>

                  {!collapsed && (
                    <div className="flex gap-4">
                      {data.columns.map(col => {
                        const colTasks = storyFilteredTasks.filter(t => t.status === col);
                        return (
                          <div
                            key={col}
                            className="w-64 shrink-0 column-drop-zone rounded-xl p-2"
                            onDrop={e => handleDrop(e, story.id, col)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                          >
                            <div className="space-y-2">
                              {colTasks.map(task => (
                                <StickyNote
                                  key={task.id}
                                  task={task}
                                  labels={data.labels}
                                  onOpen={setDetailTask}
                                  onDragStart={setDraggingId}
                                  onDragEnd={() => setDraggingId(null)}
                                />
                              ))}
                            </div>
                            <QuickAddTask storyId={story.id} status={col} onAdd={addTask} />
                          </div>
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
        people={data.people}
        columns={data.columns}
        onSave={saveTask}
        onDelete={deleteTask}
      />
      <StoryModal
        story={storyModal.story && !storyModal.story._preset ? storyModal.story : null}
        open={storyModal.open}
        onClose={() => setStoryModal({ open: false, story: null })}
        onSave={(s) => {
          if (storyModal.story?._preset) s.boxId = storyModal.story._preset;
          saveStory(s);
        }}
        onDelete={deleteStory}
        boxes={data.boxes}
      />
      <BoxModal
        box={boxModal.box}
        open={boxModal.open}
        onClose={() => setBoxModal({ open: false, box: null })}
        onSave={saveBox}
        onDelete={deleteBox}
      />
      <LabelManagerModal open={labelModal} onClose={() => setLabelModal(false)} labels={data.labels} onSave={(labels) => updateData(d => ({ ...d, labels }))} />
      <PeopleManagerModal open={peopleModal} onClose={() => setPeopleModal(false)} people={data.people} onSave={(people) => updateData(d => ({ ...d, people }))} />
    </div>
  );
}
