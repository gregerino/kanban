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

  // On mobile, we delay drag start until the finger moves enough (to avoid blocking taps/scrolls)
  const pendingDragRef = useRef(null);

  const startDrag = useCallback((e, type, id, data) => {
    // Prevent starting drag on checkbox clicks
    if (e.target.tagName === 'INPUT') return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const rect = e.currentTarget.getBoundingClientRect();
    const title = e.currentTarget.textContent?.substring(0, 40) || '';

    if (e.type === 'touchstart') {
      // On touch, defer actual drag start until movement threshold is met
      pendingDragRef.current = { type, id, data, title, startX: clientX, startY: clientY, w: rect.width, h: rect.height };
      startPosRef.current = { x: clientX, y: clientY };
    } else {
      e.preventDefault();
      startPosRef.current = { x: clientX, y: clientY };
      setGhostSize({ w: rect.width, h: rect.height });
      setGhostPos({ x: clientX, y: clientY });
      setDragging({ type, id, data, title });
      isDraggingRef.current = true;
    }
  }, []);

  // Global touch listeners for pending drag (fires before dragging state is set)
  useEffect(() => {
    const getXY = (e) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };

    const onTouchMove = (e) => {
      const pending = pendingDragRef.current;
      if (pending && !isDraggingRef.current) {
        const { x, y } = getXY(e);
        const dx = x - pending.startX;
        const dy = y - pending.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          // Threshold met — start the actual drag
          if (e.cancelable) e.preventDefault();
          isDraggingRef.current = true;
          setGhostSize({ w: pending.w, h: pending.h });
          setGhostPos({ x, y });
          setDragging({ type: pending.type, id: pending.id, data: pending.data, title: pending.title });
          pendingDragRef.current = null;
        }
        return;
      }
      // Already dragging
      if (!isDraggingRef.current) return;
      if (e.cancelable) e.preventDefault();
      const { x, y } = getXY(e);
      setGhostPos({ x, y });
      dropZonesRef.current.forEach(({ el }) => {
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          el.classList.add('drag-over');
        } else {
          el.classList.remove('drag-over');
        }
      });
    };

    const onTouchEnd = (e) => {
      // Cancel pending drag if finger released before threshold
      if (pendingDragRef.current) {
        pendingDragRef.current = null;
        return;
      }
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const { x, y } = getXY(e);
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
      if (target && currentDrag) {
        window.dispatchEvent(new CustomEvent('board-drop', {
          detail: { drag: currentDrag, target }
        }));
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging]);

  // Pointer (mouse) drag listeners
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      if (e.cancelable) e.preventDefault();
      const x = e.clientX, y = e.clientY;
      setGhostPos({ x, y });

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
      const x = e.clientX, y = e.clientY;

      const dx = x - startPosRef.current.x;
      const dy = y - startPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

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

      if (dist < 5) return;

      if (target && currentDrag) {
        window.dispatchEvent(new CustomEvent('board-drop', {
          detail: { drag: currentDrag, target }
        }));
      }
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
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
