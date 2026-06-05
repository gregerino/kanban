import { useGamification } from './GamificationContext';

export default function GamificationBar({ onClick }) {
  const { enabled, levelInfo, state } = useGamification();
  if (!enabled || !levelInfo) return null;

  const R = 16;
  const CIRC = 2 * Math.PI * R;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
      title="Gamification"
    >
      {/* Level ring with class icon */}
      <div className="relative w-9 h-9 shrink-0">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(120,120,130,0.25)" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r={R} fill="none" stroke="url(#lvlgrad)" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - levelInfo.progress)}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <defs>
            <linearGradient id="lvlgrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-[3.5px] rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-sm font-black">{levelInfo.level}</span>
        </div>
      </div>

      {/* Level + stats */}
      <div className="hidden md:flex flex-col min-w-[90px] gap-0.5">
        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">Lv.{levelInfo.level} {levelInfo.title}</span>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-400">{state.totalXP} XP</span>
          <div className="flex items-center gap-1.5">
            {/* Gold coin */}
            <span className="flex items-center gap-0.5 text-amber-600">
              <svg className="w-3 h-3" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="1"/><circle cx="8" cy="8" r="5" fill="#fbbf24"/><text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#92400e">$</text></svg>
              <span className="text-[9px] font-bold">{state.coins}</span>
            </span>
            {state.currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-orange-500">
                <span className="text-[10px]">🔥</span>
                <span className="text-[9px] font-bold">{state.currentStreak}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
