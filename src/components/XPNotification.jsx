import { useGamification } from './GamificationContext';

export default function XPNotification() {
  const { notifications, dismissNotification, enabled } = useGamification();
  if (!enabled || notifications.length === 0) return null;

  const n = notifications[0];

  return (
    <div className="fixed top-4 right-4 z-[300] animate-in slide-in-from-top fade-in duration-300 pointer-events-auto">
      <div
        onClick={dismissNotification}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border cursor-pointer transition-all hover:scale-[1.02] ${
          n.type === 'achievement' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' :
          n.type === 'streak' ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200' :
          n.type === 'quest' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' :
          n.type === 'coins' ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' :
          n.type === 'shop' ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200' :
          'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
        }`}
      >
        <div className="text-2xl">
          {n.type === 'achievement' ? n.icon :
           n.type === 'streak' ? '🔥' :
           n.type === 'quest' ? '📜' :
           n.type === 'coins' ? '💰' :
           n.type === 'shop' ? (n.icon || '🛒') :
           '⚡'}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${
            n.type === 'achievement' ? 'text-amber-800' :
            n.type === 'streak' ? 'text-orange-800' :
            n.type === 'quest' ? 'text-emerald-800' :
            n.type === 'coins' ? 'text-amber-700' :
            n.type === 'shop' ? 'text-pink-800' :
            'text-indigo-800'
          }`}>
            {n.type === 'achievement' ? 'Achievement Unlocked!' :
             n.type === 'streak' ? 'Streak Bonus!' :
             n.type === 'quest' ? 'Quest Complete!' :
             n.type === 'coins' ? `+${n.coins} Coins` :
             n.type === 'shop' ? 'Föremål!' :
             `+${n.xp} XP`}
          </p>
          <p className="text-xs text-gray-600 truncate max-w-[200px]">{n.text}</p>
        </div>
        {n.xp && n.type !== 'achievement' && (
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">+{n.xp} XP</span>
        )}
      </div>
    </div>
  );
}
