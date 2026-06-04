import { useGamification } from './GamificationContext';
import AvatarRenderer from './AvatarRenderer';
import { SHOP_ITEMS } from '../utils/shopData';

export default function GamificationBar({ onClick }) {
  const { enabled, levelInfo, state } = useGamification();
  if (!enabled || !levelInfo) return null;

  const R = 16;
  const CIRC = 2 * Math.PI * R;
  const equippedArmor = state.avatar?.equippedArmor;
  const armorItem = equippedArmor ? SHOP_ITEMS.find(i => i.id === equippedArmor) : null;
  const armorPerkPct = armorItem?.armorPerk?.type === 'xp_boost' ? Math.round(armorItem.armorPerk.value * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors group"
      title="Gamification"
    >
      {/* Mini avatar with XP level-ring */}
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
        <div className="absolute inset-[3.5px] rounded-full overflow-hidden bg-white">
          <AvatarRenderer avatar={state.avatar} size={29} showBackground={false} />
        </div>
        <span className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center ring-2 ring-white">
          {levelInfo.level}
        </span>
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
            {armorPerkPct > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-500" title={`${armorItem.name}: +${armorPerkPct}% XP`}>
                <span className="text-[10px]">🛡️</span>
                <span className="text-[9px] font-bold">+{armorPerkPct}%</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
