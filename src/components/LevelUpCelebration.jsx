import { useEffect, useRef, useState } from 'react';
import { useGamification } from './GamificationContext';

const COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#ec4899', '#fbbf24'];

export default function LevelUpCelebration() {
  const { enabled, levelInfo } = useGamification();
  const prevRef = useRef(levelInfo?.level);
  const [show, setShow] = useState(null);

  useEffect(() => {
    if (!enabled || !levelInfo) return;
    const lvl = levelInfo.level;
    if (prevRef.current != null && lvl > prevRef.current) {
      setShow({ level: lvl, title: levelInfo.title });
      prevRef.current = lvl;
      const t = setTimeout(() => setShow(null), 2800);
      return () => clearTimeout(t);
    }
    prevRef.current = lvl;
  }, [levelInfo?.level, levelInfo, enabled]);

  if (!show) return null;

  const pieces = Array.from({ length: 46 });
  return (
    <div className="fixed inset-0 z-[350] pointer-events-none overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const color = COLORS[i % COLORS.length];
        const delay = Math.random() * 0.5;
        const dur = 2 + Math.random() * 1.4;
        const size = 6 + Math.random() * 7;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: '-5%',
              width: size,
              height: size * 0.6,
              background: color,
              borderRadius: 1,
              animation: `confetti-fall ${dur}s ease-in ${delay}s forwards`,
            }}
          />
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-8 py-5 rounded-3xl shadow-2xl text-center"
          style={{ animation: 'levelup-pop 2.8s ease forwards' }}
        >
          <p className="text-xs font-semibold tracking-widest text-indigo-200">LEVEL UP!</p>
          <p className="text-4xl font-black mt-0.5">Level {show.level}</p>
          {show.title && <p className="text-sm font-medium text-indigo-100 mt-1">{show.title}</p>}
        </div>
      </div>
    </div>
  );
}
