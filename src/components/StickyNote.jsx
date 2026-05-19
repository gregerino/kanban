import Badge from './Badge';
import { PRIORITY_COLORS } from '../utils/constants';
import { today } from '../utils/helpers';

export default function StickyNote({ task, labels, onOpen, onDragStart, onDragEnd }) {
  const isOverdue = task.deadline && task.deadline < today() && task.status !== 'Done';
  const taskLabels = labels.filter(l => task.labels?.includes(l.id));

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(task.id); }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      className={`${task.color || 'sticky-note'} rounded-xl p-3.5 cursor-grab active:cursor-grabbing select-none`}
    >
      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {taskLabels.map(l => <div key={l.id} className={`${l.color} w-8 h-1.5 rounded-full`} title={l.name} />)}
        </div>
      )}
      <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          {task.priority && <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>}
        </div>
        <div className="flex items-center gap-1.5">
          {task.comments?.length > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              {task.comments.length}
            </span>
          )}
          {isOverdue && <span className="text-xs text-red-600 font-medium">Overdue</span>}
          {task.deadline && !isOverdue && <span className="text-xs text-gray-500">{task.deadline.slice(5)}</span>}
        </div>
      </div>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gray-600 text-white text-[10px] flex items-center justify-center font-medium">
            {task.assignee.charAt(0)}
          </div>
          <span className="text-xs text-gray-600">{task.assignee}</span>
        </div>
      )}
    </div>
  );
}
