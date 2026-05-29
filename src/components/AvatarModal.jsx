import { useState } from 'react';
import Modal from './Modal';
import { useGamification } from './GamificationContext';
import { AVATAR_OPTIONS, CHARACTER_CLASSES, SHOP_ITEMS, RARITIES } from '../utils/shopData';
import { getLevelInfo } from '../utils/gamification';

function AvatarPreview({ avatar, size = 'lg' }) {
  const cls = CHARACTER_CLASSES.find(c => c.id === avatar.class) || CHARACTER_CLASSES[0];
  const expr = AVATAR_OPTIONS.expressions.find(e => e.id === avatar.expression) || AVATAR_OPTIONS.expressions[0];
  const companion = avatar.equippedCompanion ? SHOP_ITEMS.find(i => i.id === avatar.equippedCompanion) : null;
  const aura = avatar.equippedAura ? SHOP_ITEMS.find(i => i.id === avatar.equippedAura) : null;
  const head = avatar.equippedHead ? SHOP_ITEMS.find(i => i.id === avatar.equippedHead) : null;
  const weapon = avatar.equippedWeapon ? SHOP_ITEMS.find(i => i.id === avatar.equippedWeapon) : null;

  const s = size === 'lg' ? 'w-28 h-28' : 'w-16 h-16';
  const textS = size === 'lg' ? 'text-5xl' : 'text-2xl';

  return (
    <div className="relative inline-flex flex-col items-center">
      {aura && <span className="absolute -top-2 -right-2 text-xl animate-pulse">{aura.icon}</span>}
      <div className={`${s} rounded-full flex items-center justify-center relative overflow-hidden shadow-lg`} style={{ background: avatar.skinTone }}>
        {/* Hair */}
        <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-full" style={{ background: avatar.hairColor, opacity: avatar.hairStyle === 'bald' ? 0 : 0.85 }} />
        {/* Face expression */}
        <span className={`${textS} relative z-10`}>{expr.label}</span>
        {head && <span className="absolute top-0 left-1/2 -translate-x-1/2 text-lg z-20">{head.icon}</span>}
      </div>
      {weapon && <span className="absolute -bottom-1 -right-1 text-lg">{weapon.icon}</span>}
      {companion && <span className="absolute -bottom-1 -left-1 text-lg">{companion.icon}</span>}
      <span className="text-xs mt-1">{cls.icon} {cls.name}</span>
    </div>
  );
}

export default function AvatarModal({ open, onClose }) {
  const { state, dispatch, levelInfo } = useGamification();
  const [tab, setTab] = useState('customize');
  const avatar = state.avatar || {};
  const owned = state.inventory || [];

  const updateAvatar = (changes) => dispatch('UPDATE_AVATAR', changes);

  const ownedItems = (cat) => SHOP_ITEMS.filter(i => i.category === cat && owned.includes(i.id));
  const equippedTitle = avatar.equippedTitle ? SHOP_ITEMS.find(i => i.id === avatar.equippedTitle) : null;

  const tabs = [
    { key: 'customize', label: 'Utseende', icon: '🎨' },
    { key: 'class', label: 'Klass', icon: '⚔️' },
    { key: 'equipment', label: 'Utrustning', icon: '🛡️' },
    { key: 'profile', label: 'Profilkort', icon: '📋' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Avatar" wide>
      <div className="flex gap-4 min-h-[420px]">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-gray-100 pr-3">
          {/* Avatar preview */}
          <div className="flex flex-col items-center mb-4 py-3 bg-gray-50 rounded-xl">
            <AvatarPreview avatar={avatar} />
            {equippedTitle && <span className="text-[10px] font-bold text-indigo-600 mt-1">"{equippedTitle.name}"</span>}
          </div>
          <nav className="space-y-1">
            {tabs.map(t => (
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
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[420px]">
          {tab === 'customize' && (
            <div className="space-y-4">
              {/* Skin tone */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Hudfärg</label>
                <div className="flex gap-2">{AVATAR_OPTIONS.skinTones.map(c => (
                  <button key={c} onClick={() => updateAvatar({ skinTone: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${avatar.skinTone === c ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
                ))}</div>
              </div>
              {/* Hair color */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Hårfärg</label>
                <div className="flex gap-2">{AVATAR_OPTIONS.hairColors.map(c => (
                  <button key={c} onClick={() => updateAvatar({ hairColor: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${avatar.hairColor === c ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
                ))}</div>
              </div>
              {/* Hair style */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Frisyr</label>
                <div className="flex flex-wrap gap-2">{AVATAR_OPTIONS.hairStyles.map(h => (
                  <button key={h.id} onClick={() => updateAvatar({ hairStyle: h.id })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${avatar.hairStyle === h.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{h.label}</button>
                ))}</div>
              </div>
              {/* Eye color */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ögonfärg</label>
                <div className="flex gap-2">{AVATAR_OPTIONS.eyeColors.map(c => (
                  <button key={c} onClick={() => updateAvatar({ eyeColor: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${avatar.eyeColor === c ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
                ))}</div>
              </div>
              {/* Expression */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Uttryck</label>
                <div className="flex gap-2">{AVATAR_OPTIONS.expressions.map(e => (
                  <button key={e.id} onClick={() => updateAvatar({ expression: e.id })} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${avatar.expression === e.id ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-50 hover:bg-gray-100'}`} title={e.name}>{e.label}</button>
                ))}</div>
              </div>
            </div>
          )}

          {tab === 'class' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3">Klasser är kosmetiska och ger inga gameplay-fördelar.</p>
              {CHARACTER_CLASSES.map(cls => {
                const level = levelInfo?.level || 1;
                const locked = level < cls.unlockLevel;
                return (
                  <button
                    key={cls.id}
                    onClick={() => !locked && updateAvatar({ class: cls.id })}
                    disabled={locked}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      avatar.class === cls.id ? 'bg-indigo-50 border-indigo-300' :
                      locked ? 'bg-gray-50 border-gray-100 opacity-50' :
                      'bg-white border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-2xl">{cls.icon}</span>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-gray-800">{cls.name}</p>
                      <p className="text-[10px] text-gray-500">{cls.desc}</p>
                    </div>
                    {locked && <span className="text-[10px] text-gray-400">🔒 Level {cls.unlockLevel}</span>}
                    {avatar.class === cls.id && <span className="text-green-500">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'equipment' && (
            <div className="space-y-4">
              {/* Titles */}
              <EquipSection label="Titel" items={ownedItems('titles')} equipped={avatar.equippedTitle} onEquip={id => updateAvatar({ equippedTitle: id })} onUnequip={() => updateAvatar({ equippedTitle: null })} />
              {/* Companions */}
              <EquipSection label="Följeslagare" items={ownedItems('companions')} equipped={avatar.equippedCompanion} onEquip={id => updateAvatar({ equippedCompanion: id })} onUnequip={() => updateAvatar({ equippedCompanion: null })} />
              {/* Head */}
              <EquipSection label="Huvudbonad" items={ownedItems('equipment').filter(i => i.slot === 'head')} equipped={avatar.equippedHead} onEquip={id => updateAvatar({ equippedHead: id })} onUnequip={() => updateAvatar({ equippedHead: null })} />
              {/* Weapon */}
              <EquipSection label="Vapen" items={ownedItems('equipment').filter(i => i.slot === 'weapon')} equipped={avatar.equippedWeapon} onEquip={id => updateAvatar({ equippedWeapon: id })} onUnequip={() => updateAvatar({ equippedWeapon: null })} />
              {/* Back */}
              <EquipSection label="Mantel / Rygg" items={ownedItems('equipment').filter(i => i.slot === 'back')} equipped={avatar.equippedBack} onEquip={id => updateAvatar({ equippedBack: id })} onUnequip={() => updateAvatar({ equippedBack: null })} />
              {/* Auras */}
              <EquipSection label="Aura" items={ownedItems('auras')} equipped={avatar.equippedAura} onEquip={id => updateAvatar({ equippedAura: id })} onUnequip={() => updateAvatar({ equippedAura: null })} />
              {/* Backgrounds */}
              <EquipSection label="Bakgrund" items={ownedItems('backgrounds')} equipped={avatar.equippedBackground} onEquip={id => updateAvatar({ equippedBackground: id })} onUnequip={() => updateAvatar({ equippedBackground: null })} />
            </div>
          )}

          {tab === 'profile' && (
            <div className="flex flex-col items-center py-4">
              {/* Profile card */}
              <div className="w-full max-w-xs bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <AvatarPreview avatar={avatar} size="sm" />
                  <div>
                    <p className="text-lg font-black">Marcus</p>
                    {equippedTitle && <p className="text-xs text-indigo-200">"{equippedTitle.name}"</p>}
                    <p className="text-xs text-indigo-200 mt-0.5">Level {levelInfo?.level} {levelInfo?.title}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Klass</span>
                    <span className="font-medium">{CHARACTER_CLASSES.find(c => c.id === avatar.class)?.name || 'Warrior'}</span>
                  </div>
                  {avatar.equippedCompanion && (
                    <div className="flex justify-between">
                      <span className="text-indigo-200">Följeslagare</span>
                      <span className="font-medium">{SHOP_ITEMS.find(i => i.id === avatar.equippedCompanion)?.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-indigo-200">XP</span>
                    <span className="font-medium">{state.totalXP.toLocaleString()} / {levelInfo?.isMaxLevel ? 'MAX' : (levelInfo?.xpInLevel + levelInfo?.xpForNextLevel || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-white rounded-full" style={{ width: `${(levelInfo?.progress || 0) * 100}%` }} />
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-indigo-200">🪙 Coins</span>
                    <span className="font-medium">{state.coins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">🔥 Streak</span>
                    <span className="font-medium">{state.currentStreak} dagar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">🏆 Achievements</span>
                    <span className="font-medium">{state.unlockedAchievements.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function EquipSection({ label, items, equipped, onEquip, onUnequip }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
      {items.length === 0 ? (
        <p className="text-[10px] text-gray-400">Inga ägda — köp i butiken!</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => {
            const r = RARITIES[item.rarity] || RARITIES.common;
            const isEquipped = equipped === item.id;
            return (
              <button
                key={item.id}
                onClick={() => isEquipped ? onUnequip() : onEquip(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isEquipped ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                }`}
                title={item.desc}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                {isEquipped && <span className="text-green-500 text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
