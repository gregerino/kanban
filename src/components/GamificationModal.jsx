import { useState } from 'react';
import Modal from './Modal';
import { useGamification } from './GamificationContext';
const TABS = [
  { key: 'overview', label: 'Översikt', icon: '⚔️' },
  { key: 'achievements', label: 'Achievements', icon: '🏆' },
  { key: 'quests', label: 'Daily Quests', icon: '📜' },
  { key: 'stats', label: 'Statistik', icon: '📊' },
];

export default function GamificationModal({ open, onClose, onOpenShop, onOpenDungeon }) {
  const { levelInfo, state, achievements, dailyQuests } = useGamification();
  const [tab, setTab] = useState('overview');

  if (!levelInfo) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Active bonuses (active potion perks)
  const now = Date.now();
  const bonuses = [];
  (state.activePerks || []).forEach(p => {
    if (p.type === 'xp_boost' && (p.expiresAt > now || p.expiresAt === Infinity)) {
      bonuses.push({ icon: '🧪', label: 'XP-dryck', value: `+${Math.round(p.value * 100)}% XP` });
    }
  });

  return (
    <Modal open={open} onClose={onClose} title="Gamification" wide>
      <div className="flex gap-4 min-h-[400px]">
        {/* Sidebar */}
        <nav className="w-36 shrink-0 space-y-1 border-r border-gray-100 pr-3">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === t.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="border-t border-gray-100 my-2 pt-2 space-y-1">
            <button onClick={onOpenShop} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors text-left">
              <span className="text-base">🛒</span>Shop
            </button>
            <button onClick={onOpenDungeon} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors text-left">
              <span className="text-base">🏰</span>Dungeon
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Level card */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-indigo-200 font-medium">Level {levelInfo.level}</p>
                    <p className="text-2xl font-black">{levelInfo.title}</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl font-black">{levelInfo.level}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-indigo-200">
                    <span>{state.totalXP} XP</span>
                    {!levelInfo.isMaxLevel && <span>{levelInfo.xpInLevel} / {levelInfo.xpForNextLevel} XP till nästa level</span>}
                    {levelInfo.isMaxLevel && <span>Max level!</span>}
                  </div>
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Active bonuses */}
              {bonuses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Aktiva bonusar:</span>
                  {bonuses.map((b, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5" title={b.label}>
                      <span>{b.icon}</span>{b.value}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{state.tasksCompleted}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Uppgifter klara</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">🔥 {state.currentStreak}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Dagars streak</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{unlockedCount}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Achievements</p>
                </div>
              </div>

              {/* Daily quests preview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">📜 Dagens quests</h3>
                <div className="space-y-1.5">
                  {dailyQuests.map(q => (
                    <div key={q.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${q.completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <span className={`text-sm ${q.completed ? 'text-green-500' : 'text-gray-300'}`}>
                        {q.completed ? '✓' : '○'}
                      </span>
                      <span className={`text-xs flex-1 ${q.completed ? 'text-green-700 line-through' : 'text-gray-700'}`}>{q.text}</span>
                      <span className="text-[10px] text-gray-400">{Math.min(q.current, q.target)}/{q.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'achievements' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-3">{unlockedCount} / {achievements.length} achievements upplåsta</p>
              <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto">
                {achievements.map(a => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      a.unlocked ? 'bg-white border-amber-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-50'
                    }`}
                  >
                    <span className={`text-2xl ${a.unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${a.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{a.name}</p>
                      <p className="text-[10px] text-gray-400">{a.desc}</p>
                    </div>
                    {a.unlocked && (
                      <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'quests' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dagens uppdrag</h3>
                <div className="space-y-2">
                  {dailyQuests.map(q => (
                    <div key={q.id} className={`px-4 py-3 rounded-xl border ${q.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm font-medium ${q.completed ? 'text-green-700' : 'text-gray-800'}`}>{q.text}</span>
                        <span className="text-xs font-bold text-indigo-500">+25 XP</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${q.completed ? 'bg-green-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min((q.current / q.target) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{Math.min(q.current, q.target)} / {q.target}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400">Nya quests genereras varje dag vid midnatt.</p>
            </div>
          )}

          {tab === 'stats' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">All-time statistik</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Totalt XP', value: state.totalXP.toLocaleString(), icon: '⚡' },
                  { label: 'Level', value: `${levelInfo.level} — ${levelInfo.title}`, icon: '🎖️' },
                  { label: 'Uppgifter klara', value: state.tasksCompleted, icon: '✅' },
                  { label: 'Stories klara', value: state.storiesCompleted, icon: '📖' },
                  { label: 'Bästa streak', value: `${state.bestStreak} dagar`, icon: '🔥' },
                  { label: 'Nuvarande streak', value: `${state.currentStreak} dagar`, icon: '💪' },
                  { label: 'Legendary-uppgifter', value: state.legendaryCompleted, icon: '🐉' },
                  { label: 'Epic-uppgifter', value: state.epicCompleted, icon: '💜' },
                  { label: 'Dungeon Runs', value: state.dungeonsCleared, icon: '🏰' },
                  { label: 'Daily Quests klara', value: state.dailyQuestsCompleted, icon: '📜' },
                  { label: 'Max uppgifter/dag', value: state.maxTasksInDay, icon: '⚡' },
                  { label: 'Achievements', value: `${unlockedCount}/${achievements.length}`, icon: '🏆' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                    <span className="text-lg">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
