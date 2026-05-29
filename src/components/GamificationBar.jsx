import { useGamification } from './GamificationContext';
import AvatarRenderer from './AvatarRenderer';

export default function GamificationBar({ onClick }) {
  const { enabled, levelInfo, state } = useGamification();
  if (!enabled || !levelInfo) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors group"
      title="Gamification"
    >
      {/* Mini avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm border border-gray-200 shrink-0">
        <AvatarRenderer avatar={state.avatar} size={32} showBackground={false} />
      </div>

      {/* Level + XP bar */}
      <div className="hidden md:flex flex-col min-w-[90px]">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold text-gray-700">Lv.{levelInfo.level} {levelInfo.title}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${levelInfo.progress * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-0.5">
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
