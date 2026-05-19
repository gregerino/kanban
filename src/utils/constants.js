export const STORAGE_KEY = 'scrumkanban_data';
export const DEFAULT_COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const PRIORITY_COLORS = {
  Low: 'bg-blue-100 text-blue-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};
export const PRIORITY_FLAG_COLORS = {
  Low: '#3b82f6',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
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
