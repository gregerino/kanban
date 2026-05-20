import { PRIORITIES } from '../utils/constants';

export default function FilterBar({ filters, setFilters, labels, columns }) {
  const toggleLabel = (labelId) => {
    setFilters(f => {
      const current = f.labels || [];
      const has = current.includes(labelId);
      return { ...f, labels: has ? current.filter(id => id !== labelId) : [...current, labelId] };
    });
  };

  const hasActiveFilters = filters.status || filters.priority || (filters.labels && filters.labels.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-white border-b border-gray-100">
      <span className="text-xs font-medium text-gray-500 mr-1">Filtrera:</span>
      <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200">
        <option value="">Alla statusar</option>
        {columns.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200">
        <option value="">Alla prioriteringar</option>
        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* Label chips — multi-select */}
      <div className="flex items-center gap-1 ml-1">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
        {labels.map(l => {
          const active = (filters.labels || []).includes(l.id);
          return (
            <button
              key={l.id}
              onClick={() => toggleLabel(l.id)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all border ${
                active
                  ? 'text-white shadow-sm scale-105'
                  : 'text-gray-600 bg-white hover:scale-105 opacity-60 hover:opacity-100'
              }`}
              style={active ? { background: l.color, borderColor: l.color } : { borderColor: l.color }}
              title={l.name}
            >
              {l.name}
            </button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <button onClick={() => setFilters({ status: '', priority: '', labels: [] })} className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Rensa</button>
      )}
    </div>
  );
}
