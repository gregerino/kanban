import IconButton from './IconButton';

function getStoryBarStyle(color) {
  if (!color) return { className: 'bg-gray-400' };
  if (color.startsWith('bg-')) return { className: color };
  return { style: { background: color } };
}

export default function StoryCard({ story, tasks, columns, onEdit, onDelete, onClick }) {
  const bar = getStoryBarStyle(story.color);
  const lastCol = columns[columns.length - 1];
  const storyTasks = tasks.filter(t => t.storyId === story.id);
  const activeTasks = storyTasks.filter(t => t.status !== lastCol);
  const doneTasks = storyTasks.length - activeTasks.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className={`h-2 ${bar.className || ''}`} style={bar.style} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-800">{story.title}</h3>
          <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
            <IconButton onClick={() => onEdit(story)} title="Redigera">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </IconButton>
            <IconButton onClick={() => onDelete(story.id)} title="Ta bort">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </IconButton>
          </div>
        </div>
        {story.description && <p className="text-xs text-gray-500 mb-1 line-clamp-2">{story.description}</p>}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">{activeTasks.length} aktiva</span>
          {doneTasks > 0 && <span className="text-xs text-green-500">{doneTasks} klara</span>}
        </div>
      </div>
    </div>
  );
}
