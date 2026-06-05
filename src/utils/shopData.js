/**
 * Shop catalog, avatar data, and coin economy for QuestLog.
 */

// ─── COIN REWARDS ───────────────────────────────────────────────
export const COIN_REWARDS = {
  levelUp: 50,
  achievementUnlock: 25,
  dailyQuestComplete: 10,
  streakMilestone: 20,   // every 5 days
  storyComplete: 30,
  dungeonClear: 5,
  taskComplete: 2,
};

// ─── ITEM RARITIES ──────────────────────────────────────────────
export const RARITIES = {
  common:    { label: 'Common',    color: '#9ca3af', bgColor: '#f3f4f6' },
  rare:      { label: 'Rare',      color: '#3b82f6', bgColor: '#eff6ff' },
  epic:      { label: 'Epic',      color: '#a855f7', bgColor: '#faf5ff' },
  legendary: { label: 'Legendary', color: '#f59e0b', bgColor: '#fffbeb' },
  mythic:    { label: 'Mythic',    color: '#ef4444', bgColor: '#fef2f2' },
};

// ─── CHARACTER CLASSES ──────────────────────────────────────────
export const CHARACTER_CLASSES = [
  { id: 'warrior',   name: 'Warrior',   icon: '⚔️', desc: 'Modig frontlinjekämpe', unlockLevel: 1 },
  { id: 'ranger',    name: 'Ranger',    icon: '🏹', desc: 'Skicklig spårare och skytt', unlockLevel: 1 },
  { id: 'wizard',    name: 'Wizard',    icon: '🧙', desc: 'Mästare av arkan magi', unlockLevel: 3 },
  { id: 'rogue',     name: 'Rogue',     icon: '🗡️', desc: 'Smidig och snabb skuggvarelse', unlockLevel: 5 },
  { id: 'paladin',   name: 'Paladin',   icon: '🛡️', desc: 'Helig riddare av ljuset', unlockLevel: 7 },
  { id: 'bard',      name: 'Bard',      icon: '🎵', desc: 'Inspirerande musiker och poet', unlockLevel: 10 },
  { id: 'druid',     name: 'Druid',     icon: '🌿', desc: 'Naturens väktare', unlockLevel: 13 },
  { id: 'artificer', name: 'Artificer', icon: '⚙️', desc: 'Uppfinnare och mekaniker', unlockLevel: 16 },
];

// ─── AVATAR OPTIONS ─────────────────────────────────────────────
export const AVATAR_OPTIONS = {
  skinTones: ['#fde2c4', '#f5c7a1', '#d4a373', '#a67c52', '#6b4423', '#3d2b1f'],
  hairColors: ['#2c1810', '#5a3825', '#8b6914', '#d4a017', '#c0392b', '#2980b9', '#8e44ad', '#ecf0f1'],
  hairStyles: [
    { id: 'short', label: 'Kort' },
    { id: 'medium', label: 'Medium' },
    { id: 'long', label: 'Långt' },
    { id: 'ponytail', label: 'Hästsvans' },
    { id: 'mohawk', label: 'Mohawk' },
    { id: 'bald', label: 'Kal' },
  ],
  eyeColors: ['#4a3728', '#2e86ab', '#28965a', '#7b68ee', '#8b0000'],
  faceTypes: [
    { id: 'round', label: 'Rund' },
    { id: 'oval', label: 'Oval' },
    { id: 'square', label: 'Fyrkantig' },
  ],
  expressions: [
    { id: 'neutral', label: '😐', name: 'Neutral' },
    { id: 'happy', label: '😊', name: 'Glad' },
    { id: 'determined', label: '😤', name: 'Bestämd' },
    { id: 'cool', label: '😎', name: 'Cool' },
    { id: 'fierce', label: '😠', name: 'Stridbar' },
  ],
};

// ─── SHOP ITEMS ─────────────────────────────────────────────────
export const SHOP_CATEGORIES = [
  { id: 'perks', name: 'Drycker & Perks', icon: '🧪', iconFile: 'fc50.png' },
  { id: 'titles', name: 'Titlar', icon: '📛', iconFile: 'fc15.png' },
];

export const SHOP_ITEMS = [
  // ── Perks (temporary boosts) ──
  { id: 'potion_focus',    name: 'Fokuspotion',           desc: '+10% XP i 24 timmar',              category: 'perks', rarity: 'common',    cost: 100, icon: '🧪', iconFile: 'fc50.png',    perkType: 'xp_boost',       perkValue: 0.10, perkDuration: 24 },
  { id: 'elixir_power',    name: 'Kraftelixir',           desc: '+25% XP i 24 timmar',              category: 'perks', rarity: 'rare',      cost: 250, icon: '⚗️', iconFile: 'fc280.png',  perkType: 'xp_boost',       perkValue: 0.25, perkDuration: 24 },
  { id: 'potion_luck',     name: 'Lerkrus med tur',       desc: '+15% coins i 24 timmar',           category: 'perks', rarity: 'rare',      cost: 200, icon: '🏺', iconFile: 'fc1.png',    perkType: 'coin_boost',     perkValue: 0.15, perkDuration: 24 },
  { id: 'scroll_wisdom',   name: 'Visdomens bokrulle',    desc: 'Låser upp en extra Daily Quest',   category: 'perks', rarity: 'rare',      cost: 150, icon: '📜', iconFile: 'fc300.png',  perkType: 'extra_quest',    perkValue: 1 },
  { id: 'double_xp_scroll',name: 'XP-pergament',          desc: 'Dubbel XP på nästa uppgift',       category: 'perks', rarity: 'epic',      cost: 200, icon: '📋', iconFile: 'fc305.png',  perkType: 'double_xp_next', perkValue: 1 },
  { id: 'ring_consistency',name: 'Smaragdring',            desc: 'Skyddar mot en streak-förlust',    category: 'perks', rarity: 'epic',      cost: 300, icon: '💍', iconFile: 'fc1310.png', perkType: 'streak_shield',  perkValue: 1 },

  // ── Titles ──
  { id: 'title_adventurer',    name: 'Adventurer',          desc: 'En nybörjartitel',                category: 'titles', rarity: 'common',    cost: 200,  icon: '📛', iconFile: 'fc15.png' },
  { id: 'title_taskconqueror',  name: 'Task Conqueror',      desc: 'Mästare på att slutföra',         category: 'titles', rarity: 'rare',      cost: 500,  icon: '📛', iconFile: 'fc15.png' },
  { id: 'title_sprintslayer',   name: 'Sprint Slayer',       desc: 'Sprinthastigheten personifierad', category: 'titles', rarity: 'rare',      cost: 500,  icon: '📛', iconFile: 'fc15.png' },
  { id: 'title_bughunter',     name: 'Bug Hunter',          desc: 'Felfinnare extraordinär',         category: 'titles', rarity: 'rare',      cost: 500,  icon: '📛', iconFile: 'fc15.png' },
  { id: 'title_epicfinisher',   name: 'Epic Finisher',       desc: 'Slutför det omöjliga',            category: 'titles', rarity: 'epic',      cost: 1000, icon: '📛', iconFile: 'fc15.png' },
  { id: 'title_dungeondelver',  name: 'Dungeon Delver',      desc: 'Utforskare av djupen',            category: 'titles', rarity: 'epic',      cost: 800,  icon: '📛', iconFile: 'fc15.png' },
  { id: 'title_guildmaster',    name: 'Guild Master',        desc: 'Prestigetitel',                   category: 'titles', rarity: 'legendary', cost: 3000, icon: '👑', iconFile: 'fc15.png' },
  { id: 'title_dragonrider',    name: 'Dragon Rider',        desc: 'Legendarisk prestigetitel',        category: 'titles', rarity: 'mythic',    cost: 5000, icon: '🐉', iconFile: 'fc140.png' },

];

// ─── DEFAULT AVATAR ─────────────────────────────────────────────
export function createDefaultAvatar() {
  return {
    class: 'warrior',
    skinTone: '#fde2c4',
    hairColor: '#2c1810',
    hairStyle: 'short',
    eyeColor: '#4a3728',
    faceType: 'oval',
    expression: 'neutral',
    equippedTitle: null,
  };
}
