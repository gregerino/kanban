import { uid } from './helpers';
import { DEFAULT_COLUMNS } from './constants';

const BOARDS_KEY = 'scrumkanban_boards';
const ACTIVE_KEY = 'scrumkanban_active_board';

const STORY_COLOR_MAP = {
  'bg-indigo-500': '#6366f1', 'bg-emerald-500': '#10b981', 'bg-amber-500': '#f59e0b',
  'bg-rose-500': '#f43f5e', 'bg-cyan-500': '#06b6d4', 'bg-purple-500': '#a855f7',
};

function createSampleBoard() {
  const id = uid();
  const labels = [
    { id: uid(), name: 'Frontend', color: '#60a5fa' },
    { id: uid(), name: 'Backend', color: '#4ade80' },
    { id: uid(), name: 'Bug', color: '#f87171' },
    { id: uid(), name: 'Feature', color: '#c084fc' },
    { id: uid(), name: 'UX', color: '#f472b6' },
  ];

  const stories = [
    { id: uid(), title: 'User Authentication', description: 'Implement login, registration and password reset flows.', color: '#6366f1' },
    { id: uid(), title: 'Dashboard Redesign', description: 'Modernize the main dashboard with new charts and widgets.', color: '#10b981' },
    { id: uid(), title: 'API Integration', description: 'Connect to third-party payment and notification services.', color: '#f59e0b' },
  ];

  const tasks = [
    { id: uid(), storyId: stories[0].id, title: 'Design login page', status: 'Done', priority: 'Epic', labels: [labels[0].id, labels[4].id], deadline: '2026-05-15', color: '#fde68a', comments: [{ id: uid(), author: 'Me', text: 'Looks great! Approved.', date: '2026-05-14T10:30:00' }], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[0].id, title: 'Implement auth API', status: 'In Progress', priority: 'Legendary', labels: [labels[1].id], deadline: '2026-05-20', color: '#fde68a', comments: [], checklist: [{ id: uid(), text: 'Set up JWT tokens', done: true }, { id: uid(), text: 'Create login endpoint', done: false }, { id: uid(), text: 'Create register endpoint', done: false }], notes: '', files: [] },
    { id: uid(), storyId: stories[0].id, title: 'Add password reset flow', status: 'To Do', priority: 'Rare', labels: [labels[0].id, labels[1].id], deadline: '2026-05-25', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[0].id, title: 'Write auth tests', status: 'Backlog', priority: 'Common', labels: [labels[1].id], deadline: '', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[1].id, title: 'Create chart components', status: 'In Progress', priority: 'Epic', labels: [labels[0].id, labels[3].id], deadline: '2026-05-22', color: '#fde68a', comments: [{ id: uid(), author: 'Me', text: 'Use recharts library for this.', date: '2026-05-18T09:00:00' }], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[1].id, title: 'Responsive layout', status: 'To Do', priority: 'Rare', labels: [labels[0].id, labels[4].id], deadline: '2026-05-28', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[1].id, title: 'Fix sidebar navigation bug', status: 'Review', priority: 'Epic', labels: [labels[0].id, labels[2].id], deadline: '2026-05-19', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[2].id, title: 'Stripe payment integration', status: 'Backlog', priority: 'Legendary', labels: [labels[1].id, labels[3].id], deadline: '2026-06-01', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[2].id, title: 'Email notification service', status: 'To Do', priority: 'Rare', labels: [labels[1].id], deadline: '2026-06-05', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] },
    { id: uid(), storyId: stories[2].id, title: 'Webhook endpoints', status: 'Backlog', priority: 'Common', labels: [labels[1].id], deadline: '', color: '#fde68a', comments: [], checklist: [], notes: '', files: [] },
  ];

  return { id, name: 'My Project', icon: '', stories, tasks, labels, columns: DEFAULT_COLUMNS, customColors: [], backgroundImage: '', brainDumpLists: [] };
}

function migrateBoard(d) {
  if (!d.columns) d.columns = DEFAULT_COLUMNS;
  if (!d.customColors) d.customColors = [];
  if (!d.backgroundImage) d.backgroundImage = '';
  if (!d.brainDumpLists) d.brainDumpLists = [];
  if (d.icon === undefined) d.icon = '';
  if (d.deadlineEnabled === undefined) d.deadlineEnabled = false;
  const PRIO_MIGRATE = { Low: 'Common', Medium: 'Rare', High: 'Epic', Critical: 'Legendary' };
  d.tasks = d.tasks.map(t => ({ ...t, priority: PRIO_MIGRATE[t.priority] || t.priority || '', comments: t.comments || [], color: t.color || '#fde68a', checklist: t.checklist || [], notes: t.notes || '', files: t.files || [] }));
  d.labels = (d.labels || []).map(l => {
    if (l.color?.startsWith('bg-')) {
      const map = { 'bg-red-400': '#f87171', 'bg-orange-400': '#fb923c', 'bg-yellow-400': '#facc15', 'bg-green-400': '#4ade80', 'bg-blue-400': '#60a5fa', 'bg-purple-400': '#c084fc', 'bg-pink-400': '#f472b6', 'bg-indigo-400': '#818cf8' };
      return { ...l, color: map[l.color] || '#60a5fa' };
    }
    return l;
  });
  // Migrate story colors from bg- classes to hex
  d.stories = (d.stories || []).map(s => {
    if (s.color?.startsWith('bg-')) {
      return { ...s, color: STORY_COLOR_MAP[s.color] || '#6366f1' };
    }
    return s;
  });
  return d;
}

export function loadBoards() {
  try {
    const raw = localStorage.getItem(BOARDS_KEY);
    if (raw) {
      const boards = JSON.parse(raw);
      return boards.map(b => migrateBoard(b));
    }
    const oldRaw = localStorage.getItem('scrumkanban_data');
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      const board = migrateBoard({ id: uid(), name: 'My Project', ...old });
      localStorage.removeItem('scrumkanban_data');
      return [board];
    }
  } catch { /* ignore */ }
  return [createSampleBoard()];
}

export function loadActiveId() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

export function saveBoards(boards) {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function saveActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function createEmptyBoard(name) {
  return { id: uid(), name, icon: '', stories: [], tasks: [], labels: [], columns: DEFAULT_COLUMNS, customColors: [], backgroundImage: '', brainDumpLists: [], deadlineEnabled: false };
}
