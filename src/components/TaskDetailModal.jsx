import { useState, useEffect } from 'react';
import Modal from './Modal';
import { PRIORITIES, STICKY_COLORS, STICKY_COLOR_NAMES } from '../utils/constants';
import { uid } from '../utils/helpers';

export default function TaskDetailModal({ task, open, onClose, allLabels, people, columns, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  useEffect(() => {
    if (task) {
      setForm({ ...task });
      setNewComment('');
      if (!commentAuthor && people.length > 0) setCommentAuthor(people[0]);
    }
  }, [task]);

  if (!form) return null;

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleLabel = (lid) => {
    const has = form.labels.includes(lid);
    update('labels', has ? form.labels.filter(x => x !== lid) : [...form.labels, lid]);
  };
  const addComment = () => {
    if (!newComment.trim()) return;
    const c = { id: uid(), author: commentAuthor || 'Anonymous', text: newComment.trim(), date: new Date().toISOString() };
    update('comments', [...(form.comments || []), c]);
    setNewComment('');
  };
  const save = () => { onSave(form); onClose(); };

  return (
    <Modal open={open} onClose={onClose} title="Task Details" wide>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
            <div className="flex gap-2">
              {STICKY_COLORS.map((c, i) => (
                <button key={c} onClick={() => update('color', c)} className={`${c} w-8 h-8 rounded-lg border-2 ${form.color === c ? 'border-gray-800' : 'border-transparent'} hover:scale-110 transition-transform`} title={STICKY_COLOR_NAMES[i]} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Labels</label>
            <div className="flex flex-wrap gap-2">
              {allLabels.map(l => (
                <button key={l.id} onClick={() => toggleLabel(l.id)} className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${l.color} ${form.labels.includes(l.id) ? 'ring-2 ring-offset-1 ring-gray-800' : 'opacity-50 hover:opacity-80'} transition-all`}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Comments</label>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
              {(form.comments || []).map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{c.author}</span>
                    <span className="text-xs text-gray-400">{new Date(c.date).toLocaleString('sv-SE')}</span>
                  </div>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              ))}
              {(!form.comments || form.comments.length === 0) && <p className="text-xs text-gray-400">No comments yet.</p>}
            </div>
            <div className="flex gap-2">
              <select value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none">
                {people.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="Anonymous">Anonymous</option>
              </select>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" onKeyDown={e => e.key === 'Enter' && addComment()} />
              <button onClick={addComment} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">Send</button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={form.status} onChange={e => update('status', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300">
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select value={form.priority} onChange={e => update('priority', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">None</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
            <select value={form.assignee} onChange={e => update('assignee', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">Unassigned</option>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
            <input type="date" value={form.deadline || ''} onChange={e => update('deadline', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <button onClick={save} className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">Save Changes</button>
            <button onClick={() => { onDelete(form.id); onClose(); }} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Delete Task</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
