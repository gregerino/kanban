import { useEffect, useState, useCallback } from 'react';

const COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#ec4899', '#fbbf24', '#14b8a6', '#f97316'];

export default function TaskConfetti() {
  const [bursts, setBursts] = useState([]);

  const fire = useCallback(() => {
    const id = Date.now() + Math.random();
    setBursts(prev => [...prev, id]);
    setTimeout(() => setBursts(prev => prev.filter(b => b !== id)), 2400);
  }, []);

  useEffect(() => {
    window.addEventListener('task-completed-confetti', fire);
    return () => window.removeEventListener('task-completed-confetti', fire);
  }, [fire]);

  if (bursts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden">
      {bursts.map(burstId => (
        <Burst key={burstId} />
      ))}
    </div>
  );
}

function Burst() {
  const pieces = Array.from({ length: 60 });
  return (
    <>
      {pieces.map((_, i) => {
        const left = 20 + Math.random() * 60;
        const color = COLORS[i % COLORS.length];
        const delay = Math.random() * 0.3;
        const dur = 1.6 + Math.random() * 1.2;
        const size = 5 + Math.random() * 8;
        const rot = Math.random() * 360;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: '-4%',
              width: size,
              height: size * 0.55,
              background: color,
              borderRadius: 2,
              transform: `rotate(${rot}deg)`,
              animation: `confetti-fall ${dur}s ease-in ${delay}s forwards`,
            }}
          />
        );
      })}
    </>
  );
}
