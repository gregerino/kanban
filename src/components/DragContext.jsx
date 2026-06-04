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

  // On mobile, we use a long-press to start the drag (so normal scrolling is not hijacked)
  const pendingDragRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const startDrag = useCallback((e, type, id, data) => {
    // Prevent starting drag on checkbox clicks
    if (e.target.tagName === 'INPUT') return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const rect = e.currentTarget.getBoundingClientRect();
    const title = e.currentTarget.textContent?.substring(0, 40) || '';

    if (e.type === 'touchstart') {
      // On touch, arm a long-press: drag begins after holding still ~250ms.
      // This lets the user scroll the board normally without triggering a drag.
      pendingDragRef.current = { type, id, data, title, startX: clientX, startY: clientY, w: rect.width, h: rect.height };
      startPosRef.current = { x: clientX, y: clientY };
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        const pending = pendingDragRef.current;
        if (pending && !isDraggingRef.current) {
          isDraggingRef.current = true;
          pendingDragRef.current = null;
          if (navigator.vibrate) { try { navigator.vibrate(15); } catch { /* ignore */ } }
          setGhostSize({ w: pending.w, h: pending.h });
          setGhostPos({ x: pending.startX, y: pending.startY });
          setDragging({ type: pending.type, id: pending.id, data: pending.data, title: pending.title });
        }
      }, 250);
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

    // Auto-scroll the nearest vertically-scrollable container when dragging near an edge
    const autoScroll = (x, y) => {
      const EDGE = 80, SPEED = 12;
      let el = document.elementFromPoint(Math.min(Math.max(x, 1), window.innerWidth - 1), Math.min(Math.max(y, 1), window.innerHeight - 1));
      while (el && el !== document.body) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
          const r = el.getBoundingClientRect();
          if (y < r.top + EDGE && el.scrollTop > 0) { el.scrollTop -= SPEED; return; }
          if (y > r.bottom - EDGE && el.scrollTop + el.clientHeight < el.scrollHeight) { el.scrollTop += SPEED; return; }
        }
        el = el.parentElement;
      }
    };

    const onTouchMove = (e) => {
      const pending = pendingDragRef.current;
      if (pending && !isDraggingRef.current) {
        // Before long-press fires: if the finger moves much, treat it as a scroll and cancel.
        const { x, y } = getXY(e);
        const dx = x - pending.startX;
        const dy = y - pending.startY;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          clearTimeout(longPressTimerRef.current);
          pendingDragRef.current = null;
        }
        return;
      }
      // Already dragging
      if (!isDraggingRef.current) return;
      if (e.cancelable) e.preventDefault();
      const { x, y } = getXY(e);
      setGhostPos({ x, y });
      autoScroll(x, y);
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
      clearTimeout(longPressTimerRef.current);
      // Cancel pending drag if finger released before long-press armed
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

    const onTouchCancel = () => {
      clearTimeout(longPressTimerRef.current);
      pendingDragRef.current = null;
      if (isDraggingRef.current) { isDraggingRef.current = false; setDragging(null); }
      dropZonesRef.current.forEach(({ el }) => el.classList.remove('drag-over'));
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      clearTimeout(longPressTimerRef.current);
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
          className="fixed pointer-events-none z-[100] rotate-3 scale-105 transition-transform"
          style={{
            left: ghostPos.x - ghostSize.w / 2,
            top: ghostPos.y - 20,
            width: ghostSize.w,
          }}
        >
          <div className="bg-yellow-200 px-3 py-2 rounded-lg shadow-2xl ring-2 ring-indigo-400/40 text-sm font-semibold text-gray-800 truncate opacity-95">
            {dragging.title}
          </div>
        </div>
      )}
    </DragCtx.Provider>
  );
}
