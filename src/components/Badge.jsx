export default function Badge({ children, className = '' }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;
}
