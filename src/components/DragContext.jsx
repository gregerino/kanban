import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const DragCtx = createContext(null);

export function useDrag() { return useContext(DragCtx); }

export default function DragProvider({ children }) {
  const [dragging, setDragging] = useState(null); // { type: 'task'|'braindump', id, data, el }
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [ghostSize, setGhostSize] = useState({ w: 0, h: 0 });
  const dropZonesRef = useRef(new Map()); // key -> { el, storyId, col }
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const registerDropZone = useCallback((key, el, storyId, col) => {
    if (el) dropZonesRef.current.set(key, { el, storyId, col });
    else dropZonesRef.current.delete(key);
  }, []);

  const startDrag = useCallback((e, type, id, data) => {
    // Prevent starting drag on checkbox clicks
    if (e.target.tagName === 'INPUT') return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setGhostSize({ w: rect.width, h: rect.height });
    setGhostPos({ x: e.clientX, y: e.clientY });
    setDragging({ type, id, data, title: e.currentTarget.textContent?.substring(0, 40) || '' });
    isDraggingRef.current = true;
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      setGhostPos({ x: e.clientX, y: e.clientY });

      // Highlight drop zone under cursor
      dropZonesRef.current.forEach(({ el }) => {
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          el.classList.add('drag-over');
        } else {
          el.classList.remove('drag-over');
        }
      });
    };

    const onUp = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      // Check if this was just a click (barely moved)
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Find which drop zone we're over
      let target = null;
      dropZonesRef.current.forEach(({ el, storyId, col }) => {
        el.classList.remove('drag-over');
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          target = { storyId, col };
        }
      });

      const currentDrag = dragging;
      setDragging(null);

      // If barely moved, treat as click (will be handled by onClick)
      if (dist < 5) return;

      // Fire drop callback
      if (target && currentDrag) {
        window.dispatchEvent(new CustomEvent('board-drop', {
          detail: { drag: currentDrag, target }
        }));
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // Clean up highlights
      dropZonesRef.current.forEach(({ el }) => el.classList.remove('drag-over'));
    };
  }, [dragging]);

  return (
    <DragCtx.Provider value={{ dragging, startDrag, registerDropZone }}>
      {children}
      {dragging && (
        <div
          className="fixed pointer-events-none z-[100] opacity-75 rotate-2"
          style={{
            left: ghostPos.x - ghostSize.w / 2,
            top: ghostPos.y - 20,
            width: ghostSize.w,
          }}
        >
          <div className="bg-yellow-200 px-3 py-2 rounded shadow-lg text-sm font-semibold text-gray-800 truncate">
            {dragging.title}
          </div>
        </div>
      )}
    </DragCtx.Provider>
  );
}
