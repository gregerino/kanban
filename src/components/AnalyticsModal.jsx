import { useState, useMemo } from 'react';
import Modal from './Modal';

const PERIOD_OPTIONS = [
  { label: 'Current work week', days: 7, key: 'week' },
  { label: 'Last 7 days', days: 7, key: '7d' },
  { label: 'Last 14 days', days: 14, key: '14d' },
  { label: 'Last month', days: 30, key: 'month' },
  { label: 'Last 3 months', days: 90, key: '3m' },
];

function getDaysInRange(days) {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export default function AnalyticsModal({ open, onClose, tasks, labels, columns }) {
  const [period, setPeriod] = useState('week');

  const periodDays = PERIOD_OPTIONS.find(p => p.key === period)?.days || 7;
  const dateRange = useMemo(() => getDaysInRange(periodDays), [periodDays]);
  const startDate = dateRange[0];

  // Completed tasks in period (tasks in the last column = Done)
  const lastCol = columns[columns.length - 1];
  const completedTasks = useMemo(() =>
    tasks.filter(t => t.status === lastCol),
    [tasks, lastCol]
  );
  const completedCount = completedTasks.length;

  // Overdue tasks
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = useMemo(() =>
    tasks.filter(t => t.deadline && t.deadline < today && t.status !== lastCol),
    [tasks, today, lastCol]
  );

  // Tasks by status
  const statusCounts = useMemo(() => {
    const counts = {};
    columns.forEach(c => { counts[c] = 0; });
    tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return counts;
  }, [tasks, columns]);

  // Tasks by priority
  const priorityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, None: 0 };
    tasks.forEach(t => {
      if (t.priority && counts[t.priority] !== undefined) counts[t.priority]++;
      else counts.None++;
    });
    return counts;
  }, [tasks]);

  const priorityColors = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#3b82f6', None: '#9ca3af' };

  // Tasks by label
  const labelStats = useMemo(() => {
    return labels.map(l => {
      const tagged = tasks.filter(t => t.labels?.includes(l.id));
      const done = tagged.filter(t => t.status === lastCol).length;
      return { ...l, total: tagged.length, done };
    }).filter(l => l.total > 0).sort((a, b) => b.total - a.total);
  }, [tasks, labels, lastCol]);

  const totalTasks = tasks.length;
  const maxStatus = Math.max(...Object.values(statusCounts), 1);

  // Average task age (days since deadline for incomplete tasks)
  const avgAge = useMemo(() => {
    const incomplete = tasks.filter(t => t.deadline && t.status !== lastCol);
    if (incomplete.length === 0) return null;
    const now = new Date();
    const totalDays = incomplete.reduce((sum, t) => {
      const created = new Date(t.deadline);
      return sum + Math.max(0, Math.round((now - created) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Math.round(totalDays / incomplete.length);
  }, [tasks, lastCol]);

  return (
    <Modal open={open} onClose={onClose} title="Analytics" wide>
      <div className="space-y-6">
        {/* Period selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p.key ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span className="text-xs text-gray-500 font-medium">Tasks completed</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{completedCount}</p>
            <p className="text-xs text-green-600 mt-1">of {totalTasks} total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span className="text-xs text-gray-500 font-medium">Overdue tasks</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{overdueTasks.length}</p>
            <p className="text-xs text-red-500 mt-1">{overdueTasks.length > 0 ? 'Need attention' : 'All on track'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              <span className="text-xs text-gray-500 font-medium">Average task age</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{avgAge !== null ? `${avgAge} days` : 'N/A'}</p>
            <p className="text-xs text-gray-400 mt-1">{avgAge !== null && avgAge <= 7 ? 'Average' : avgAge !== null ? 'Consider prioritizing' : 'No deadlines set'}</p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tasks by Status - bar chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Status</h3>
            <div className="space-y-3">
              {columns.map(col => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 truncate">{col}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                    <div
                      className="h-5 rounded-full bg-indigo-500 transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((statusCounts[col] / maxStatus) * 100, statusCounts[col] > 0 ? 15 : 0)}%` }}
                    >
                      {statusCounts[col] > 0 && <span className="text-[10px] text-white font-medium">{statusCounts[col]}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks by Priority */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Priority</h3>
            <div className="flex items-end gap-3 h-32 mt-2">
              {Object.entries(priorityCounts).map(([p, count]) => {
                const maxP = Math.max(...Object.values(priorityCounts), 1);
                const height = (count / maxP) * 100;
                return (
                  <div key={p} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">{count}</span>
                    <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(height, count > 0 ? 8 : 2)}%`, background: priorityColors[p] }} />
                    <span className="text-[10px] text-gray-500 mt-1">{p}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks by Label */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Label</h3>
          {labelStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">Label</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">Distribution</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-medium">Tasks</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {labelStats.map(l => (
                    <tr key={l.id} className="border-b border-gray-50">
                      <td className="py-2.5 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
                        <span className="text-gray-700">{l.name}</span>
                      </td>
                      <td className="py-2.5">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${totalTasks > 0 ? (l.total / totalTasks) * 100 : 0}%`, background: l.color }} />
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-gray-700 font-medium">{l.total}</td>
                      <td className="py-2.5 text-right text-gray-700 font-medium">{l.done}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 font-semibold">
                    <td className="py-2.5 text-gray-800">Total</td>
                    <td />
                    <td className="py-2.5 text-right text-gray-800">{totalTasks}</td>
                    <td className="py-2.5 text-right text-gray-800">{completedCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">No labels assigned yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
