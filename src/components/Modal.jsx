export default function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center modal-overlay" onClick={onClose}>
      <div className={`bg-white rounded-t-2xl md:rounded-2xl shadow-2xl ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'} max-h-[92vh] md:max-h-[90vh] overflow-y-auto mx-0 md:mx-4`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl md:rounded-t-2xl">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}
