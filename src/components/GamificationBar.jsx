import { useGamification } from './GamificationContext';

export default function GamificationBar({ onClick }) {
  const { enabled, levelInfo, state } = useGamification();
  if (!enabled || !levelInfo) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-white/20 transition-colors group"
      title="Gamification"
    >
      {/* Level badge */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
        <span className="text-[10px] font-black text-white">{levelInfo.level}</span>
      </div>

      {/* XP bar */}
      <div className="hidden md:flex flex-col min-w-[100px]">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold text-gray-600">{levelInfo.title}</span>
          <span className="text-[9px] text-gray-400">{state.totalXP} XP</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${levelInfo.progress * 100}%` }}
          />
        </div>
      </div>

      {/* Coins */}
      <div className="hidden md:flex items-center gap-0.5 text-amber-600" title={`${state.coins} coins`}>
        <span className="text-sm">🪙</span>
        <span className="text-[10px] font-bold">{state.coins}</span>
      </div>

      {/* Streak */}
      {state.currentStreak > 0 && (
        <div className="flex items-center gap-0.5 text-orange-500" title={`${state.currentStreak} dagars streak`}>
          <span className="text-sm">🔥</span>
          <span className="text-[10px] font-bold">{state.currentStreak}</span>
        </div>
      )}
    </button>
  );
}
