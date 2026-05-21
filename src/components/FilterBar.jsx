import { useState } from 'react';

export default function FilterBar({ filters, setFilters, labels }) {
  const [open, setOpen] = useState(false);

  const toggleLabel = (labelId) => {
    setFilters(f => {
      const current = f.labels || [];
      const has = current.includes(labelId);
      return { ...f, labels: has ? current.filter(id => id !== labelId) : [...current, labelId] };
    });
  };

  const activeCount = (filters.labels || []).length;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          activeCount > 0
            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
        Filtrera
        {activeCount > 0 && (
          <span className="bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeCount}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[200px] py-2">
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Etiketter</p>
            {labels.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">Inga etiketter</p>
            ) : (
              labels.map(l => {
                const active = (filters.labels || []).includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors ${active ? 'font-medium' : ''}`}
                  >
                    <div className="w-3.5 h-3.5 rounded-sm shrink-0 border" style={{ background: active ? l.color : 'transparent', borderColor: l.color }} />
                    <span className="text-gray-700 truncate">{l.name}</span>
                    {active && (
                      <svg className="w-4 h-4 text-indigo-500 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    )}
                  </button>
                );
              })
            )}
            {activeCount > 0 && (
              <div className="border-t border-gray-100 mt-1.5 pt-1.5">
                <button
                  onClick={() => { setFilters(f => ({ ...f, labels: [] })); setOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs text-indigo-600 hover:bg-indigo-50 font-medium"
                >
                  Rensa filter
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
