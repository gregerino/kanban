import { uid } from './helpers';
import { STORAGE_KEY, DEFAULT_COLUMNS } from './constants';

function createSampleData() {
  const labels = [
    { id: uid(), name: 'Frontend', color: 'bg-blue-400' },
    { id: uid(), name: 'Backend', color: 'bg-green-400' },
    { id: uid(), name: 'Bug', color: 'bg-red-400' },
    { id: uid(), name: 'Feature', color: 'bg-purple-400' },
    { id: uid(), name: 'UX', color: 'bg-pink-400' },
  ];
  const people = ['Alice', 'Bob', 'Charlie', 'Diana'];
  const boxes = [
    { id: uid(), name: 'Sprint 1', color: '#6366f1' },
    { id: uid(), name: 'Sprint 2', color: '#8b5cf6' },
  ];

  const stories = [
    { id: uid(), title: 'User Authentication', description: 'Implement login, registration and password reset flows.', boxId: boxes[0].id, color: 'bg-indigo-500' },
    { id: uid(), title: 'Dashboard Redesign', description: 'Modernize the main dashboard with new charts and widgets.', boxId: boxes[0].id, color: 'bg-emerald-500' },
    { id: uid(), title: 'API Integration', description: 'Connect to third-party payment and notification services.', boxId: boxes[1].id, color: 'bg-amber-500' },
  ];

  const tasks = [
    { id: uid(), storyId: stories[0].id, title: 'Design login page', status: 'Done', priority: 'High', assignee: 'Alice', labels: [labels[0].id, labels[4].id], deadline: '2026-05-15', color: 'sticky-blue', comments: [{ id: uid(), author: 'Bob', text: 'Looks great! Approved.', date: '2026-05-14T10:30:00' }] },
    { id: uid(), storyId: stories[0].id, title: 'Implement auth API', status: 'In Progress', priority: 'Critical', assignee: 'Bob', labels: [labels[1].id], deadline: '2026-05-20', color: 'sticky-orange', comments: [] },
    { id: uid(), storyId: stories[0].id, title: 'Add password reset flow', status: 'To Do', priority: 'Medium', assignee: 'Charlie', labels: [labels[0].id, labels[1].id], deadline: '2026-05-25', color: 'sticky-note', comments: [] },
    { id: uid(), storyId: stories[0].id, title: 'Write auth tests', status: 'Backlog', priority: 'Low', assignee: '', labels: [labels[1].id], deadline: '', color: 'sticky-green', comments: [] },
    { id: uid(), storyId: stories[1].id, title: 'Create chart components', status: 'In Progress', priority: 'High', assignee: 'Diana', labels: [labels[0].id, labels[3].id], deadline: '2026-05-22', color: 'sticky-pink', comments: [{ id: uid(), author: 'Alice', text: 'Use recharts library for this.', date: '2026-05-18T09:00:00' }] },
    { id: uid(), storyId: stories[1].id, title: 'Responsive layout', status: 'To Do', priority: 'Medium', assignee: 'Alice', labels: [labels[0].id, labels[4].id], deadline: '2026-05-28', color: 'sticky-purple', comments: [] },
    { id: uid(), storyId: stories[1].id, title: 'Fix sidebar navigation bug', status: 'Review', priority: 'High', assignee: 'Bob', labels: [labels[0].id, labels[2].id], deadline: '2026-05-19', color: 'sticky-orange', comments: [] },
    { id: uid(), storyId: stories[2].id, title: 'Stripe payment integration', status: 'Backlog', priority: 'Critical', assignee: 'Charlie', labels: [labels[1].id, labels[3].id], deadline: '2026-06-01', color: 'sticky-note', comments: [] },
    { id: uid(), storyId: stories[2].id, title: 'Email notification service', status: 'To Do', priority: 'Medium', assignee: 'Diana', labels: [labels[1].id], deadline: '2026-06-05', color: 'sticky-blue', comments: [] },
    { id: uid(), storyId: stories[2].id, title: 'Webhook endpoints', status: 'Backlog', priority: 'Low', assignee: '', labels: [labels[1].id], deadline: '', color: 'sticky-green', comments: [] },
  ];

  return { stories, tasks, labels, people, boxes, columns: DEFAULT_COLUMNS };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (!d.boxes) d.boxes = [];
      if (!d.columns) d.columns = DEFAULT_COLUMNS;
      d.tasks = d.tasks.map(t => ({ ...t, comments: t.comments || [], color: t.color || 'sticky-note' }));
      d.stories = d.stories.map(s => ({ ...s, boxId: s.boxId || '' }));
      return d;
    }
  } catch { /* ignore */ }
  return createSampleData();
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
