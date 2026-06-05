import { useState } from 'react';
import Modal from './Modal';
import { useGamification } from './GamificationContext';
import { AVATAR_OPTIONS, CHARACTER_CLASSES, SHOP_ITEMS, RARITIES, STARTER_GEAR } from '../utils/shopData';
import { getLevelInfo } from '../utils/gamification';
import AvatarRenderer from './AvatarRenderer';
import RavenIcon from './RavenIcon';

const EQUIP_SLOTS_LEFT = [
  { key: 'equippedHead', label: 'Hjälm / Mask', icon: '⛑️', iconFile: 'pixel-weapons/pw_r2_c7.png', filter: i => i.slot === 'head' },
  { key: 'equippedArmor', label: 'Överkropp', icon: '🛡️', iconFile: 'fc1860.png', filter: i => i.slot === 'armor' },
  { key: 'equippedWeapon', label: 'Vapen', icon: '⚔️', iconFile: 'pixel-weapons/pw_r2_c0.png', filter: i => i.category === 'equipment' && i.slot === 'weapon' },
  { key: 'equippedBack', label: 'Sköld / Mantel', icon: '🛡️', iconFile: 'pixel-weapons/pw_r2_c4.png', filter: i => i.slot === 'back' },
];

const EQUIP_SLOTS_RIGHT = [
  { key: 'equippedAura', label: 'Aura', icon: '✨', iconFile: 'fc385.png', filter: i => i.category === 'auras' },
  { key: 'equippedTitle', label: 'Titel', icon: '📛', iconFile: 'fc15.png', filter: i => i.category === 'titles' },
  { key: 'equippedBackground', label: 'Bakgrund', icon: '🏞️', iconFile: 'fc22.png', filter: i => i.category === 'backgrounds' },
];

export default function AvatarModal({ open, onClose, onBack }) {
  const { state, dispatch, levelInfo } = useGamification();
  const [tab, setTab] = useState('equip');
  const [activeSlot, setActiveSlot] = useState(null);
  const avatar = state.avatar || {};
  const owned = state.inventory || [];

  const updateAvatar = (changes) => dispatch('UPDATE_AVATAR', changes);
  const cls = CHARACTER_CLASSES.find(c => c.id === avatar.class) || CHARACTER_CLASSES[0];
  const equippedTitle = avatar.equippedTitle ? SHOP_ITEMS.find(i => i.id === avatar.equippedTitle) : null;

  const ownedForSlot = (slot) => {
    return SHOP_ITEMS.filter(i => owned.includes(i.id) && slot.filter(i));
  };

  const tabs = [
    { key: 'equip', label: 'Utrustning', icon: '⚔️' },
    { key: 'customize', label: 'Utseende', icon: '🎨' },
    { key: 'class', label: 'Klass', icon: '🏹' },
  ];

  return (
    <Modal open={open} onClose={onClose} onBack={onBack} title="Min Avatar" wide>
      {/* Subtitle */}
      <p className="text-xs text-gray-400 -mt-2 mb-3">Få ny utrustning genom att gå upp i Level, låsa upp Achievements eller besöka Shopen.</p>

      {/* Tab nav */}
      <div className="flex gap-1 mb-4 border-b border-gray-100 pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setActiveSlot(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'equip' && (
        <div className="flex items-start gap-3 min-h-[340px]">
          {/* Left equipment slots */}
          <div className="space-y-2 w-[130px] shrink-0">
            {EQUIP_SLOTS_LEFT.map(slot => {
              const equipped = avatar[slot.key];
              const item = equipped ? (SHOP_ITEMS.find(i => i.id === equipped) || (STARTER_GEAR[equipped] && { id: equipped, ...STARTER_GEAR[equipped] })) : null;
              const isActive = activeSlot === slot.key;
              return (
                <button
                  key={slot.key}
                  onClick={() => setActiveSlot(isActive ? null : slot.key)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border text-left transition-all ${
                    isActive ? 'border-indigo-400 bg-indigo-50' :
                    item ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${item ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <RavenIcon iconFile={item?.iconFile || slot.iconFile} itemId={item?.id} size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-500 leading-tight">{slot.label}</p>
                    {item ? (
                      <p className="text-[10px] font-bold text-gray-800 truncate">{item.name}</p>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">Tom</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Center: Avatar preview */}
          <div className="flex-1 flex flex-col items-center">
            <AvatarRenderer avatar={avatar} size={200} showBackground={true} />
            <div className="mt-2 text-center">
              {equippedTitle && <p className="text-xs font-bold text-indigo-600">"{equippedTitle.name}"</p>}
              <p className="text-sm font-bold text-gray-700">Lv. {levelInfo?.level} {cls.name}</p>
            </div>
          </div>

          {/* Right equipment slots */}
          <div className="space-y-2 w-[130px] shrink-0">
            {EQUIP_SLOTS_RIGHT.map(slot => {
              const equipped = avatar[slot.key];
              const item = equipped ? (SHOP_ITEMS.find(i => i.id === equipped) || (STARTER_GEAR[equipped] && { id: equipped, ...STARTER_GEAR[equipped] })) : null;
              const isActive = activeSlot === slot.key;
              return (
                <button
                  key={slot.key}
                  onClick={() => setActiveSlot(isActive ? null : slot.key)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border text-left transition-all ${
                    isActive ? 'border-indigo-400 bg-indigo-50' :
                    item ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${item ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <RavenIcon iconFile={item?.iconFile || slot.iconFile} itemId={item?.id} size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-500 leading-tight">{slot.label}</p>
                    {item ? (
                      <p className="text-[10px] font-bold text-gray-800 truncate">{item.name}</p>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">Tom</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Slot picker drawer */}
      {tab === 'equip' && activeSlot && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">
              Välj {[...EQUIP_SLOTS_LEFT, ...EQUIP_SLOTS_RIGHT].find(s => s.key === activeSlot)?.label}
            </p>
            {avatar[activeSlot] && (
              <button
                onClick={() => { updateAvatar({ [activeSlot]: null }); setActiveSlot(null); }}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium"
              >
                Ta av
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const slotDef = [...EQUIP_SLOTS_LEFT, ...EQUIP_SLOTS_RIGHT].find(s => s.key === activeSlot);
              if (!slotDef) return null;
              const available = SHOP_ITEMS.filter(i => owned.includes(i.id) && slotDef.filter(i));
              if (available.length === 0) return <p className="text-xs text-gray-400">Inga ägda föremål — besök Shopen!</p>;
              return available.map(item => {
                const r = RARITIES[item.rarity] || RARITIES.common;
                const isEquipped = avatar[activeSlot] === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { updateAvatar({ [activeSlot]: item.id }); setActiveSlot(null); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isEquipped ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <RavenIcon iconFile={item.iconFile} itemId={item.id} size={24} />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{item.name}</p>
                      <span className="text-[9px] font-bold" style={{ color: r.color }}>{r.label}</span>
                    </div>
                    {isEquipped && <span className="text-green-500 text-xs ml-1">✓</span>}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {tab === 'customize' && (
        <div className="flex gap-4 min-h-[340px]">
          {/* Small avatar preview */}
          <div className="flex flex-col items-center shrink-0">
            <AvatarRenderer avatar={avatar} size={140} showBackground={false} />
          </div>
          {/* Customization options */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px]">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Hudfärg</label>
              <div className="flex gap-2">{AVATAR_OPTIONS.skinTones.map(c => (
                <button key={c} onClick={() => updateAvatar({ skinTone: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${avatar.skinTone === c ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
              ))}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Hårfärg</label>
              <div className="flex gap-2">{AVATAR_OPTIONS.hairColors.map(c => (
                <button key={c} onClick={() => updateAvatar({ hairColor: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${avatar.hairColor === c ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
              ))}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Frisyr</label>
              <div className="flex flex-wrap gap-2">{AVATAR_OPTIONS.hairStyles.map(h => (
                <button key={h.id} onClick={() => updateAvatar({ hairStyle: h.id })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${avatar.hairStyle === h.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{h.label}</button>
              ))}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Ögonfärg</label>
              <div className="flex gap-2">{AVATAR_OPTIONS.eyeColors.map(c => (
                <button key={c} onClick={() => updateAvatar({ eyeColor: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${avatar.eyeColor === c ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
              ))}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Uttryck</label>
              <div className="flex flex-wrap gap-2">{AVATAR_OPTIONS.expressions.map(e => (
                <button key={e.id} onClick={() => updateAvatar({ expression: e.id })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${avatar.expression === e.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{e.name}</button>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'class' && (
        <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto">
          {CHARACTER_CLASSES.map(c => {
            const level = levelInfo?.level || 1;
            const locked = level < c.unlockLevel;
            return (
              <button
                key={c.id}
                onClick={() => !locked && updateAvatar({ class: c.id })}
                disabled={locked}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                  avatar.class === c.id ? 'bg-indigo-50 border-indigo-300' :
                  locked ? 'bg-gray-50 border-gray-100 opacity-50' :
                  'bg-white border-gray-100 hover:border-indigo-200'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{c.name}</p>
                  <p className="text-[10px] text-gray-500">{c.desc}</p>
                </div>
                {locked && <span className="text-[10px] text-gray-400 shrink-0">🔒 Lv.{c.unlockLevel}</span>}
                {avatar.class === c.id && <span className="text-green-500 shrink-0">✓</span>}
              </button>
            );
          })}
          <p className="col-span-2 text-[10px] text-gray-400 text-center mt-1">Klasser är kosmetiska och ger inga gameplay-fördelar.</p>
        </div>
      )}
    </Modal>
  );
}
