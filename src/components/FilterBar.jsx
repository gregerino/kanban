import { PRIORITIES } from '../utils/constants';

export default function FilterBar({ filters, setFilters, labels, columns }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-white border-b border-gray-100">
      <span className="text-xs font-medium text-gray-500 mr-1">Filter:</span>
      <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200">
        <option value="">All statuses</option>
        {columns.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200">
        <option value="">All priorities</option>
        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={filters.label} onChange={e => setFilters(f => ({ ...f, label: e.target.value }))} className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200">
        <option value="">All labels</option>
        {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      {(filters.status || filters.priority || filters.label) && (
        <button onClick={() => setFilters({ status: '', priority: '', label: '' })} className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Clear</button>
      )}
    </div>
  );
}
