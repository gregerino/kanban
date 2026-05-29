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
  { id: 'warrior',   name: 'Warrior',   icon: '⚔️', desc: 'Modig frontlinjekämpe', unlockLevel: 1,  startGear: { armor: 'starter_chain',   weapon: 'starter_sword',  back: null } },
  { id: 'ranger',    name: 'Ranger',    icon: '🏹', desc: 'Skicklig spårare och skytt', unlockLevel: 1,  startGear: { armor: 'starter_leather', weapon: 'starter_bow',    back: 'starter_cloak' } },
  { id: 'wizard',    name: 'Wizard',    icon: '🧙', desc: 'Mästare av arkan magi', unlockLevel: 3,  startGear: { armor: 'starter_robe',    weapon: 'starter_staff',  head: 'starter_wizard_hat' } },
  { id: 'rogue',     name: 'Rogue',     icon: '🗡️', desc: 'Smidig och snabb skuggvarelse', unlockLevel: 5,  startGear: { armor: 'starter_leather', weapon: 'starter_dagger', back: 'starter_hood' } },
  { id: 'paladin',   name: 'Paladin',   icon: '🛡️', desc: 'Helig riddare av ljuset', unlockLevel: 7,  startGear: { armor: 'starter_plate',   weapon: 'starter_sword',  head: 'starter_helm' } },
  { id: 'bard',      name: 'Bard',      icon: '🎵', desc: 'Inspirerande musiker och poet', unlockLevel: 10, startGear: { armor: 'starter_tunic',   weapon: 'starter_lute',   back: 'starter_cloak' } },
  { id: 'druid',     name: 'Druid',     icon: '🌿', desc: 'Naturens väktare', unlockLevel: 13, startGear: { armor: 'starter_robe',    weapon: 'starter_staff',  back: null } },
  { id: 'artificer', name: 'Artificer', icon: '⚙️', desc: 'Uppfinnare och mekaniker', unlockLevel: 16, startGear: { armor: 'starter_leather', weapon: 'starter_wrench', head: 'starter_goggles' } },
];

// Starting gear definitions (free, not in shop — auto-applied when choosing class)
export const STARTER_GEAR = {
  starter_sword:      { name: 'Rostig klinga',     slot: 'weapon', icon: '🗡️' },
  starter_bow:        { name: 'Enkel båge',        slot: 'weapon', icon: '🏹' },
  starter_staff:      { name: 'Trästav',           slot: 'weapon', icon: '🪄' },
  starter_dagger:     { name: 'Dolkpar',           slot: 'weapon', icon: '🔪' },
  starter_lute:       { name: 'Gammal luta',       slot: 'weapon', icon: '🎸' },
  starter_wrench:     { name: 'Skiftnyckel',       slot: 'weapon', icon: '🔧' },
  starter_chain:      { name: 'Ringbrynja',        slot: 'armor',  icon: '⛓️' },
  starter_leather:    { name: 'Läderkorsett',      slot: 'armor',  icon: '🦺' },
  starter_robe:       { name: 'Enkel klädnad',     slot: 'armor',  icon: '👘' },
  starter_plate:      { name: 'Plåtrustning',      slot: 'armor',  icon: '🛡️' },
  starter_tunic:      { name: 'Bardens tunika',    slot: 'armor',  icon: '👕' },
  starter_cloak:      { name: 'Resemantel',        slot: 'back',   icon: '🧥' },
  starter_hood:       { name: 'Skugghuva',         slot: 'back',   icon: '🥷' },
  starter_wizard_hat: { name: 'Lärlingsshatt',     slot: 'head',   icon: '🎩' },
  starter_helm:       { name: 'Järnhjälm',         slot: 'head',   icon: '⛑️' },
  starter_goggles:    { name: 'Mekanikglasögon',   slot: 'head',   icon: '🥽' },
};

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
  { id: 'perks', name: 'Drycker & Perks', icon: '🧪' },
  { id: 'titles', name: 'Titlar', icon: '📛' },
  { id: 'companions', name: 'Följeslagare', icon: '🐾' },
  { id: 'equipment', name: 'Utrustning', icon: '⚔️' },
  { id: 'auras', name: 'Auror & Effekter', icon: '✨' },
  { id: 'backgrounds', name: 'Bakgrunder', icon: '🏞️' },
  { id: 'chests', name: 'Skattekistor', icon: '📦' },
];

export const SHOP_ITEMS = [
  // ── Perks (temporary boosts) ──
  { id: 'potion_focus',    name: 'Potion of Focus',       desc: '+10% XP i 24 timmar',              category: 'perks', rarity: 'common',    cost: 100, icon: '🧪', perkType: 'xp_boost',       perkValue: 0.10, perkDuration: 24 },
  { id: 'elixir_power',    name: 'Elixir of Power',       desc: '+25% XP i 24 timmar',              category: 'perks', rarity: 'rare',      cost: 250, icon: '⚗️', perkType: 'xp_boost',       perkValue: 0.25, perkDuration: 24 },
  { id: 'scroll_wisdom',   name: 'Scroll of Wisdom',      desc: 'Låser upp en extra Daily Quest',   category: 'perks', rarity: 'rare',      cost: 150, icon: '📜', perkType: 'extra_quest',    perkValue: 1 },
  { id: 'ring_consistency',name: 'Ring of Consistency',    desc: 'Skyddar mot en streak-förlust',    category: 'perks', rarity: 'epic',      cost: 300, icon: '💍', perkType: 'streak_shield',  perkValue: 1 },
  { id: 'double_xp_scroll',name: 'Double XP Scroll',      desc: 'Dubbel XP på nästa uppgift',       category: 'perks', rarity: 'epic',      cost: 200, icon: '📋', perkType: 'double_xp_next', perkValue: 1 },
  { id: 'quest_reroll',    name: 'Quest Reroll',           desc: 'Slumpa nya daily quests',          category: 'perks', rarity: 'common',    cost: 75,  icon: '🎲', perkType: 'quest_reroll',   perkValue: 1 },

  // ── Titles ──
  { id: 'title_adventurer',   name: 'Adventurer',         desc: 'Cosmetic titel',                   category: 'titles', rarity: 'common',    cost: 200,  icon: '📛' },
  { id: 'title_taskconqueror', name: 'Task Conqueror',     desc: 'Cosmetic titel',                   category: 'titles', rarity: 'rare',      cost: 500,  icon: '📛' },
  { id: 'title_sprintslayer',  name: 'Sprint Slayer',      desc: 'Cosmetic titel',                   category: 'titles', rarity: 'rare',      cost: 500,  icon: '📛' },
  { id: 'title_bughunter',    name: 'Bug Hunter',          desc: 'Cosmetic titel',                   category: 'titles', rarity: 'rare',      cost: 500,  icon: '📛' },
  { id: 'title_epicfinisher',  name: 'Epic Finisher',      desc: 'Cosmetic titel',                   category: 'titles', rarity: 'epic',      cost: 1000, icon: '📛' },
  { id: 'title_guildmaster',   name: 'Golden Guild Master',desc: 'Prestigetitel',                    category: 'titles', rarity: 'legendary', cost: 3000, icon: '👑' },
  { id: 'title_dungeondelver', name: 'Dungeon Delver',     desc: 'Cosmetic titel',                   category: 'titles', rarity: 'epic',      cost: 800,  icon: '📛' },
  { id: 'title_dragonrider',   name: 'Dragon Rider',       desc: 'Prestigetitel',                    category: 'titles', rarity: 'mythic',    cost: 5000, icon: '🐉' },

  // ── Companions ──
  { id: 'pet_owl',       name: 'Uggla',             desc: 'En vis följeslagare',              category: 'companions', rarity: 'common',    cost: 300,  icon: '🦉' },
  { id: 'pet_fox',       name: 'Räv',               desc: 'En smart och snabb vän',           category: 'companions', rarity: 'common',    cost: 300,  icon: '🦊' },
  { id: 'pet_wolf',      name: 'Varg',              desc: 'En lojal följeslagare',            category: 'companions', rarity: 'rare',      cost: 600,  icon: '🐺' },
  { id: 'pet_dragon',    name: 'Drake',              desc: 'En liten drakunge',                category: 'companions', rarity: 'epic',      cost: 1500, icon: '🐉' },
  { id: 'pet_raven',     name: 'Korp',               desc: 'Mystisk och klok',                 category: 'companions', rarity: 'rare',      cost: 500,  icon: '🐦‍⬛' },
  { id: 'pet_fairy',     name: 'Älva',               desc: 'Magisk lysande följeslagare',      category: 'companions', rarity: 'epic',      cost: 1200, icon: '🧚' },
  { id: 'pet_golem',     name: 'Golem',              desc: 'Tålmodig stenbeskyddare',          category: 'companions', rarity: 'legendary', cost: 2500, icon: '🗿' },
  { id: 'pet_phoenix',   name: 'Fenix',              desc: 'Odödlig eldfågel',                 category: 'companions', rarity: 'mythic',    cost: 5000, icon: '🔥' },

  // ── Equipment ──
  { id: 'eq_wooden_sword',  name: 'Träsvärd',          desc: 'Ett enkelt nybörjarvapen',         category: 'equipment', rarity: 'common',    cost: 100,  icon: '🗡️', slot: 'weapon' },
  { id: 'eq_iron_armor',    name: 'Järnrustning',      desc: 'Solid standardrustning',           category: 'equipment', rarity: 'common',    cost: 200,  icon: '🛡️', slot: 'armor' },
  { id: 'eq_leather_cloak', name: 'Lädermantel',       desc: 'Enkel resemantel',                 category: 'equipment', rarity: 'common',    cost: 150,  icon: '🧥', slot: 'back' },
  { id: 'eq_wizard_hat',    name: 'Trollkarlshatt',    desc: 'Magisk huvudbonad',                category: 'equipment', rarity: 'rare',      cost: 400,  icon: '🎩', slot: 'head' },
  { id: 'eq_fire_sword',    name: 'Eldklinga',         desc: 'Svärd höljet i eld',               category: 'equipment', rarity: 'epic',      cost: 1200, icon: '🔥', slot: 'weapon' },
  { id: 'eq_dragon_cloak',  name: 'Drake-mantel',      desc: 'Legendarisk drakmantell',          category: 'equipment', rarity: 'legendary', cost: 2000, icon: '🐲', slot: 'back' },
  { id: 'eq_golden_crown',  name: 'Gyllene krona',     desc: 'Kronan för en sann mästare',       category: 'equipment', rarity: 'legendary', cost: 3000, icon: '👑', slot: 'head' },
  { id: 'eq_staff_wisdom',  name: 'Visdomens stav',    desc: 'Arkan kraftkälla',                 category: 'equipment', rarity: 'epic',      cost: 1500, icon: '🪄', slot: 'weapon' },
  { id: 'eq_guild_banner',  name: 'Gildbanér',         desc: 'Stolt gildssymbol',                category: 'equipment', rarity: 'legendary', cost: 2500, icon: '🏴', slot: 'back' },
  { id: 'eq_mythic_helm',   name: 'Mytisk hjälm',      desc: 'Odödlig beskyddares hjälm',        category: 'equipment', rarity: 'mythic',    cost: 5000, icon: '⛑️', slot: 'head' },

  // ── Auras & Effects ──
  { id: 'aura_fire',      name: 'Eldaura',            desc: 'Flammor omger din avatar',         category: 'auras', rarity: 'rare',      cost: 600,  icon: '🔥' },
  { id: 'aura_arcane',    name: 'Arkan energi',       desc: 'Mystiska runer flyter runt dig',   category: 'auras', rarity: 'epic',      cost: 1000, icon: '💜' },
  { id: 'aura_lightning', name: 'Blixteffekt',        desc: 'Elektriska gnistor',               category: 'auras', rarity: 'epic',      cost: 1200, icon: '⚡' },
  { id: 'aura_golden',    name: 'Gyllene glöd',       desc: 'Ett gudomligt guldljus',           category: 'auras', rarity: 'legendary', cost: 2000, icon: '✨' },
  { id: 'aura_shadow',    name: 'Skuggdimma',         desc: 'Mörka skuggor virvlar',            category: 'auras', rarity: 'rare',      cost: 700,  icon: '🌑' },
  { id: 'aura_runes',     name: 'Svävande runor',     desc: 'Urgamla runor kretsar',            category: 'auras', rarity: 'mythic',    cost: 4000, icon: '🔮' },

  // ── Backgrounds ──
  { id: 'bg_forest',      name: 'Skogsläger',         desc: 'Lugnt läger i skogen',             category: 'backgrounds', rarity: 'common',    cost: 200,  icon: '🌲' },
  { id: 'bg_guild_hall',  name: 'Gildhall',           desc: 'Storslagen gildhall',              category: 'backgrounds', rarity: 'rare',      cost: 500,  icon: '🏛️' },
  { id: 'bg_castle',      name: 'Slottsgård',         desc: 'Kunglig slottsgård',               category: 'backgrounds', rarity: 'rare',      cost: 600,  icon: '🏰' },
  { id: 'bg_dungeon',     name: 'Dungeon-entré',      desc: 'Mörk dungeon-ingång',              category: 'backgrounds', rarity: 'epic',      cost: 1000, icon: '🗝️' },
  { id: 'bg_dragon_lair', name: 'Drakens håla',       desc: 'Skattkammare av guld',             category: 'backgrounds', rarity: 'legendary', cost: 2500, icon: '🐉' },
  { id: 'bg_sky_kingdom', name: 'Himmelriket',        desc: 'Svävande kungarike i skyarna',     category: 'backgrounds', rarity: 'mythic',    cost: 4000, icon: '☁️' },

  // ── Loot Chests ──
  { id: 'chest_common',   name: 'Vanlig kista',       desc: 'Kan innehålla vanliga föremål',    category: 'chests', rarity: 'common',    cost: 50,   icon: '📦' },
  { id: 'chest_rare',     name: 'Sällsynt kista',     desc: 'Chans på sällsynta föremål',       category: 'chests', rarity: 'rare',      cost: 150,  icon: '📦' },
  { id: 'chest_epic',     name: 'Episk kista',        desc: 'Innehåller episka belöningar',     category: 'chests', rarity: 'epic',      cost: 400,  icon: '📦' },
  { id: 'chest_legendary',name: 'Legendarisk kista',  desc: 'Extremt sällsynt innehåll',        category: 'chests', rarity: 'legendary', cost: 1000, icon: '📦' },
];

// ─── CHEST LOOT TABLES ──────────────────────────────────────────
export const CHEST_LOOT = {
  chest_common: [
    { type: 'coins', amount: 25, weight: 40 },
    { type: 'coins', amount: 50, weight: 20 },
    { type: 'item', pool: ['eq_wooden_sword', 'eq_iron_armor', 'eq_leather_cloak', 'pet_owl', 'pet_fox', 'bg_forest'], weight: 35 },
    { type: 'item', pool: ['title_adventurer'], weight: 5 },
  ],
  chest_rare: [
    { type: 'coins', amount: 75, weight: 25 },
    { type: 'coins', amount: 150, weight: 10 },
    { type: 'item', pool: ['eq_wizard_hat', 'pet_wolf', 'pet_raven', 'aura_fire', 'aura_shadow', 'bg_guild_hall', 'bg_castle'], weight: 50 },
    { type: 'item', pool: ['title_taskconqueror', 'title_sprintslayer', 'title_bughunter'], weight: 15 },
  ],
  chest_epic: [
    { type: 'coins', amount: 200, weight: 15 },
    { type: 'item', pool: ['eq_fire_sword', 'eq_staff_wisdom', 'pet_dragon', 'pet_fairy', 'aura_arcane', 'aura_lightning', 'bg_dungeon'], weight: 55 },
    { type: 'item', pool: ['title_epicfinisher', 'title_dungeondelver'], weight: 20 },
    { type: 'item', pool: ['eq_dragon_cloak', 'eq_golden_crown', 'aura_golden'], weight: 10 },
  ],
  chest_legendary: [
    { type: 'coins', amount: 500, weight: 10 },
    { type: 'item', pool: ['eq_dragon_cloak', 'eq_golden_crown', 'eq_guild_banner', 'pet_golem', 'aura_golden', 'bg_dragon_lair'], weight: 40 },
    { type: 'item', pool: ['title_guildmaster', 'title_dragonrider'], weight: 20 },
    { type: 'item', pool: ['eq_mythic_helm', 'pet_phoenix', 'aura_runes', 'bg_sky_kingdom'], weight: 25 },
    { type: 'coins', amount: 1000, weight: 5 },
  ],
};

export function openChest(chestId, ownedItems = []) {
  const table = CHEST_LOOT[chestId];
  if (!table) return null;

  // Weighted random selection
  const totalWeight = table.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  let entry = table[table.length - 1];
  for (const e of table) {
    roll -= e.weight;
    if (roll <= 0) { entry = e; break; }
  }

  if (entry.type === 'coins') {
    return { type: 'coins', amount: entry.amount };
  }

  // Pick random item from pool, prefer unowned (duplicate protection)
  const unowned = entry.pool.filter(id => !ownedItems.includes(id));
  const pool = unowned.length > 0 ? unowned : entry.pool;
  const itemId = pool[Math.floor(Math.random() * pool.length)];
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  return { type: 'item', itemId, item };
}

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
    equippedCompanion: null,
    equippedAura: null,
    equippedBackground: null,
    equippedHead: null,
    equippedArmor: null,
    equippedWeapon: null,
    equippedBack: null,
  };
}
