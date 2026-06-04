import { useState } from 'react';
import Modal from './Modal';
import { useGamification } from './GamificationContext';
import { SHOP_ITEMS, SHOP_CATEGORIES, RARITIES, openChest as rollChest } from '../utils/shopData';

function GoldCoin({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="inline-block shrink-0">
      <circle cx="8" cy="8" r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="1"/>
      <circle cx="8" cy="8" r="5" fill="#fbbf24"/>
      <text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#92400e">$</text>
    </svg>
  );
}

export default function ShopModal({ open, onClose, onBack }) {
  const { state, dispatch } = useGamification();
  const [category, setCategory] = useState('perks');
  const [chestReward, setChestReward] = useState(null);

  const owned = state.inventory || [];
  const items = SHOP_ITEMS.filter(i => i.category === category);

  // Count affordable items in a category that the user doesn't already own
  const dealCount = (catId) => SHOP_ITEMS.filter(i =>
    i.category === catId &&
    state.coins >= i.cost &&
    !(owned.includes(i.id) && !i.perkType && i.category !== 'chests')
  ).length;

  const handleBuy = (item) => {
    if (state.coins < item.cost) return;
    if (item.category === 'chests') {
      // Roll reward locally so we can show it immediately
      const reward = rollChest(item.id, owned);
      if (!reward) return;
      dispatch('OPEN_CHEST', { chestId: item.id, cost: item.cost });
      setChestReward(reward);
      return;
    }
    if (item.perkType) {
      dispatch('PURCHASE_PERK', { perk: item, cost: item.cost });
    } else {
      if (owned.includes(item.id)) return;
      dispatch('PURCHASE_ITEM', { itemId: item.id, cost: item.cost });
    }
  };

  return (
    <Modal open={open} onClose={onClose} onBack={onBack} title="Shop" wide>
      <div className="flex gap-4 min-h-[420px]">
        {/* Sidebar categories */}
        <nav className="w-40 shrink-0 space-y-1 border-r border-gray-100 pr-3">
          {/* Coin balance */}
          <div className="bg-amber-50 rounded-xl px-3 py-2.5 mb-3 text-center">
            <GoldCoin size={24} />
            <p className="text-lg font-black text-amber-700">{state.coins}</p>
            <p className="text-[10px] text-amber-500 font-medium">Coins</p>
          </div>
          {SHOP_CATEGORIES.map(c => {
            const deals = dealCount(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  category === c.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{c.icon}</span>
                <span className="truncate flex-1">{c.name}</span>
                {deals > 0 && (
                  <span className="shrink-0 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5" title={`${deals} föremål du har råd med`}>
                    {deals}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Items grid */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[420px]">
          <div className="grid grid-cols-2 gap-2">
            {items.map(item => {
              const r = RARITIES[item.rarity] || RARITIES.common;
              const isOwned = owned.includes(item.id) && !item.perkType && item.category !== 'chests';
              const canAfford = state.coins >= item.cost;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-3 flex flex-col gap-2 transition-all hover:shadow-md"
                  style={{ borderColor: r.color + '40', background: r.bgColor }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: r.color, background: r.color + '20' }}>{r.label}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5"><GoldCoin size={12} /> {item.cost}</span>
                    {isOwned ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Ägd</span>
                    ) : (
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          canAfford ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {item.category === 'chests' ? 'Öppna' : 'Köp'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {items.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">Inga föremål i denna kategori</p>
          )}
        </div>
      </div>

      {/* Chest reward popup */}
      {chestReward && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50" onClick={() => setChestReward(null)}>
          <div className="bg-white rounded-2xl p-6 text-center shadow-2xl animate-in zoom-in max-w-xs" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">{chestReward.type === 'coins' ? '💰' : chestReward.item?.icon || '📦'}</p>
            <p className="text-lg font-bold text-gray-800">
              {chestReward.type === 'coins' ? `${chestReward.amount} Coins!` : chestReward.item?.name || 'Föremål'}
            </p>
            {chestReward.item && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{
                color: RARITIES[chestReward.item.rarity]?.color,
                background: RARITIES[chestReward.item.rarity]?.color + '20'
              }}>{RARITIES[chestReward.item.rarity]?.label}</span>
            )}
            <button onClick={() => setChestReward(null)} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium w-full">Stäng</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
