export const STORAGE_KEY = 'scrumkanban_data';
export const DEFAULT_COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
export const PRIORITIES = ['Common', 'Rare', 'Epic', 'Legendary'];
export const PRIORITY_COLORS = {
  Common: 'bg-green-100 text-green-700',
  Rare: 'bg-blue-100 text-blue-700',
  Epic: 'bg-purple-100 text-purple-700',
  Legendary: 'bg-red-100 text-red-700',
};
export const PRIORITY_FLAG_COLORS = {
  Common: '#22c55e',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#ef4444',
};
export const STICKY_COLORS = ['sticky-note', 'sticky-orange', 'sticky-blue', 'sticky-green', 'sticky-pink', 'sticky-purple'];
export const STICKY_COLOR_NAMES = ['Yellow', 'Orange', 'Blue', 'Green', 'Pink', 'Purple'];
export const LABEL_COLORS = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-indigo-400'];

export const LABEL_TO_STICKY = {
  'bg-red-400': 'sticky-red',
  'bg-orange-400': 'sticky-orange',
  'bg-yellow-400': 'sticky-note',
  'bg-green-400': 'sticky-green',
  'bg-blue-400': 'sticky-blue',
  'bg-purple-400': 'sticky-purple',
  'bg-pink-400': 'sticky-pink',
  'bg-indigo-400': 'sticky-indigo',
};
