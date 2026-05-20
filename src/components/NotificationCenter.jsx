import { useState, useEffect, useMemo } from 'react';

function getUpcomingDeadlines(tasks, hoursThreshold = 24) {
  const now = new Date();
  const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);

  return tasks
    .filter(t => {
      if (!t.deadline || t.status === 'Done') return false;
      const dl = new Date(t.deadline + 'T23:59:59');
      return dl <= threshold && dl >= now;
    })
    .map(t => {
      const dl = new Date(t.deadline + 'T23:59:59');
      const hoursLeft = Math.max(0, Math.round((dl - now) / (1000 * 60 * 60)));
      return { ...t, hoursLeft };
    })
    .sort((a, b) => a.hoursLeft - b.hoursLeft);
}

function getOverdueTasks(tasks) {
  const now = new Date();
  return tasks
    .filter(t => {
      if (!t.deadline || t.status === 'Done') return false;
      const dl = new Date(t.deadline + 'T23:59:59');
      return dl < now;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

export default function NotificationCenter({ tasks, onOpenTask }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scrumkanban_dismissed_notifs') || '[]'); } catch { return []; }
  });

  const upcoming = useMemo(() => getUpcomingDeadlines(tasks), [tasks]);
  const overdue = useMemo(() => getOverdueTasks(tasks), [tasks]);
  const allNotifs = useMemo(() => [...overdue.map(t => ({ ...t, type: 'overdue' })), ...upcoming.map(t => ({ ...t, type: 'upcoming' }))], [overdue, upcoming]);
  const unread = allNotifs.filter(n => !dismissed.includes(n.id)).length;

  useEffect(() => {
    localStorage.setItem('scrumkanban_dismissed_notifs', JSON.stringify(dismissed));
  }, [dismissed]);

  const dismiss = (id) => setDismissed(d => [...d, id]);
  const dismissAll = () => setDismissed(allNotifs.map(n => n.id));

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) dismissAll(); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 relative"
        title="Notifikationer"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 bg-white rounded-xl shadow-xl border border-gray-100 w-80 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Notifikationer</span>
              {allNotifs.length > 0 && (
                <button onClick={dismissAll} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Markera alla lästa</button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {allNotifs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <p className="text-xs text-gray-400">Inga notifikationer!</p>
                </div>
              ) : (
                allNotifs.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex items-start gap-3 ${dismissed.includes(n.id) ? 'opacity-50' : ''}`}
                    onClick={() => { onOpenTask(n); setOpen(false); }}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'overdue' ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {n.type === 'overdue'
                          ? `Försenad sedan ${n.deadline}`
                          : n.hoursLeft <= 0
                            ? 'Förfaller idag!'
                            : `Förfaller om ${n.hoursLeft}h — ${n.deadline}`
                        }
                      </p>
                    </div>
                    {!dismissed.includes(n.id) && (
                      <button
                        onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                        className="p-1 rounded hover:bg-gray-200 shrink-0"
                        title="Dismiss"
                      >
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
