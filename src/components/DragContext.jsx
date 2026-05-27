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
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    startPosRef.current = { x: clientX, y: clientY };
    setGhostSize({ w: rect.width, h: rect.height });
    setGhostPos({ x: clientX, y: clientY });
    setDragging({ type, id, data, title: e.currentTarget.textContent?.substring(0, 40) || '' });
    isDraggingRef.current = true;
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const getXY = (e) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };

    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      if (e.cancelable) e.preventDefault();
      const { x, y } = getXY(e);
      setGhostPos({ x, y });

      // Highlight drop zone under cursor
      dropZonesRef.current.forEach(({ el }) => {
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          el.classList.add('drag-over');
        } else {
          el.classList.remove('drag-over');
        }
      });
    };

    const onUp = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const { x, y } = getXY(e);

      // Check if this was just a click (barely moved)
      const dx = x - startPosRef.current.x;
      const dy = y - startPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Find which drop zone we're over
      let target = null;
      dropZonesRef.current.forEach(({ el, storyId, col }) => {
        el.classList.remove('drag-over');
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
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

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
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
