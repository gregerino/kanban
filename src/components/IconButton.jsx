export default function IconButton({ onClick, children, className = '', title = '' }) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${className}`}>
      {children}
    </button>
  );
}
