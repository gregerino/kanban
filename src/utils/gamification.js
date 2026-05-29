/**
 * Gamification engine for QuestLog.
 * Handles XP, levels, coins, achievements, streaks, daily quests, avatar, inventory, and perks.
 * State is persisted to localStorage per-user.
 */

import { COIN_REWARDS, createDefaultAvatar } from './shopData';

const STORAGE_KEY = 'questlog_gamification';

// ─── LEVEL SYSTEM ───────────────────────────────────────────────
export const LEVELS = [
  { level: 1,  title: 'Novice',         xpRequired: 0 },
  { level: 2,  title: 'Apprentice',     xpRequired: 100 },
  { level: 3,  title: 'Journeyman',     xpRequired: 250 },
  { level: 4,  title: 'Scout',          xpRequired: 450 },
  { level: 5,  title: 'Adventurer',     xpRequired: 700 },
  { level: 6,  title: 'Warrior',        xpRequired: 1000 },
  { level: 7,  title: 'Veteran',        xpRequired: 1400 },
  { level: 8,  title: 'Champion',       xpRequired: 1900 },
  { level: 9,  title: 'Hero',           xpRequired: 2500 },
  { level: 10, title: 'Ranger',         xpRequired: 3200 },
  { level: 11, title: 'Elite',          xpRequired: 4000 },
  { level: 12, title: 'Knight',         xpRequired: 5000 },
  { level: 13, title: 'Commander',      xpRequired: 6200 },
  { level: 14, title: 'Warlord',        xpRequired: 7600 },
  { level: 15, title: 'Legend',          xpRequired: 9200 },
  { level: 16, title: 'Mythic',         xpRequired: 11000 },
  { level: 17, title: 'Ascendant',      xpRequired: 13000 },
  { level: 18, title: 'Demigod',        xpRequired: 15500 },
  { level: 19, title: 'Titan',          xpRequired: 18500 },
  { level: 20, title: 'Guild Master',   xpRequired: 22000 },
];

export function getLevelInfo(totalXP) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const xpInLevel = totalXP - current.xpRequired;
  const xpForNextLevel = next ? next.xpRequired - current.xpRequired : 0;
  const progress = next ? Math.min(xpInLevel / xpForNextLevel, 1) : 1;
  return { ...current, xpInLevel, xpForNextLevel, progress, totalXP, isMaxLevel: !next };
}

// ─── XP REWARDS ─────────────────────────────────────────────────
export const XP_REWARDS = {
  taskComplete: 10,
  taskCompletePriorityBonus: { Common: 0, Rare: 5, Epic: 15, Legendary: 30 },
  taskMove: 3,
  storyComplete: 50,
  dailyQuestComplete: 25,
  dungeonClear: 20,
  streakBonus: 10, // per streak day milestone (5, 10, 15...)
};

// ─── ACHIEVEMENTS ───────────────────────────────────────────────
export const ACHIEVEMENTS = [
  // Task milestones
  { id: 'first_quest',      name: 'First Quest',        desc: 'Slutför din första uppgift',             icon: '⚔️', cat: 'tasks', condition: s => s.tasksCompleted >= 1 },
  { id: 'task_10',          name: 'Getting Started',     desc: 'Slutför 10 uppgifter',                  icon: '🗡️', cat: 'tasks', condition: s => s.tasksCompleted >= 10 },
  { id: 'task_50',          name: 'Quest Veteran',       desc: 'Slutför 50 uppgifter',                  icon: '🛡️', cat: 'tasks', condition: s => s.tasksCompleted >= 50 },
  { id: 'task_100',         name: 'Centurion',           desc: 'Slutför 100 uppgifter',                 icon: '👑', cat: 'tasks', condition: s => s.tasksCompleted >= 100 },
  { id: 'task_250',         name: 'Warlord',             desc: 'Slutför 250 uppgifter',                 icon: '🦅', cat: 'tasks', condition: s => s.tasksCompleted >= 250 },
  { id: 'task_500',         name: 'Legendary Slayer',    desc: 'Slutför 500 uppgifter',                 icon: '🏆', cat: 'tasks', condition: s => s.tasksCompleted >= 500 },
  { id: 'task_1000',        name: 'Mythic Hero',         desc: 'Slutför 1000 uppgifter',                icon: '💎', cat: 'tasks', condition: s => s.tasksCompleted >= 1000 },
  // Story milestones
  { id: 'story_complete',   name: 'Story Finisher',      desc: 'Slutför alla uppgifter i en story',     icon: '📖', cat: 'tasks', condition: s => s.storiesCompleted >= 1 },
  { id: 'story_5',          name: 'Chapter Master',      desc: 'Slutför 5 stories',                     icon: '📚', cat: 'tasks', condition: s => s.storiesCompleted >= 5 },
  { id: 'story_20',         name: 'Saga Writer',         desc: 'Slutför 20 stories',                    icon: '🖋️', cat: 'tasks', condition: s => s.storiesCompleted >= 20 },
  // Priority tasks
  { id: 'legendary_task',   name: 'Dragon Slayer',       desc: 'Slutför en Legendary-uppgift',          icon: '🐉', cat: 'tasks', condition: s => s.legendaryCompleted >= 1 },
  { id: 'legendary_10',     name: 'Dragon Lord',         desc: 'Slutför 10 Legendary-uppgifter',        icon: '🐲', cat: 'tasks', condition: s => s.legendaryCompleted >= 10 },
  { id: 'epic_task_10',     name: 'Epic Hunter',         desc: 'Slutför 10 Epic-uppgifter',             icon: '💜', cat: 'tasks', condition: s => s.epicCompleted >= 10 },
  { id: 'epic_task_50',     name: 'Epic Conqueror',      desc: 'Slutför 50 Epic-uppgifter',             icon: '🔮', cat: 'tasks', condition: s => s.epicCompleted >= 50 },
  // Daily productivity
  { id: 'sprint_slayer',    name: 'Sprint Slayer',       desc: 'Slutför 10 uppgifter på en dag',        icon: '⚡', cat: 'daily', condition: s => s.maxTasksInDay >= 10 },
  { id: 'sprint_legend',    name: 'Speed Demon',         desc: 'Slutför 20 uppgifter på en dag',        icon: '💨', cat: 'daily', condition: s => s.maxTasksInDay >= 20 },
  { id: 'no_tasks_left',    name: 'No Tasks Left Behind',desc: 'Töm alla kolumner utom Done',           icon: '✨', cat: 'daily', condition: s => s.boardsCleared >= 1 },
  // Streaks
  { id: 'streak_3',         name: 'Warming Up',          desc: '3 dagars aktivitetsstreak',              icon: '🕯️', cat: 'streaks', condition: s => s.bestStreak >= 3 },
  { id: 'streak_5',         name: 'On Fire',             desc: '5 dagars aktivitetsstreak',              icon: '🔥', cat: 'streaks', condition: s => s.bestStreak >= 5 },
  { id: 'streak_10',        name: 'Unstoppable',         desc: '10 dagars aktivitetsstreak',             icon: '💥', cat: 'streaks', condition: s => s.bestStreak >= 10 },
  { id: 'streak_30',        name: 'Iron Will',           desc: '30 dagars aktivitetsstreak',             icon: '🏅', cat: 'streaks', condition: s => s.bestStreak >= 30 },
  { id: 'streak_100',       name: 'Eternal Flame',       desc: '100 dagars aktivitetsstreak',            icon: '☀️', cat: 'streaks', condition: s => s.bestStreak >= 100 },
  // Dungeon runs
  { id: 'dungeon_1',        name: 'Dungeon Runner',      desc: 'Slutför din första Dungeon Run',        icon: '🏰', cat: 'dungeon', condition: s => s.dungeonsCleared >= 1 },
  { id: 'dungeon_10',       name: 'Dungeon Master',      desc: 'Slutför 10 Dungeon Runs',               icon: '🗝️', cat: 'dungeon', condition: s => s.dungeonsCleared >= 10 },
  { id: 'dungeon_50',       name: 'Dungeon Legend',       desc: 'Slutför 50 Dungeon Runs',               icon: '🏯', cat: 'dungeon', condition: s => s.dungeonsCleared >= 50 },
  { id: 'dungeon_100',      name: 'Dungeon Overlord',     desc: 'Slutför 100 Dungeon Runs',              icon: '👹', cat: 'dungeon', condition: s => s.dungeonsCleared >= 100 },
  // Levels
  { id: 'level_3',          name: 'Journeyman',          desc: 'Nå level 3',                            icon: '🌱', cat: 'level', condition: s => getLevelInfo(s.totalXP).level >= 3 },
  { id: 'level_5',          name: 'Adventurer',          desc: 'Nå level 5',                            icon: '🌟', cat: 'level', condition: s => getLevelInfo(s.totalXP).level >= 5 },
  { id: 'level_10',         name: 'Ranger',              desc: 'Nå level 10',                           icon: '⭐', cat: 'level', condition: s => getLevelInfo(s.totalXP).level >= 10 },
  { id: 'level_15',         name: 'Legend',               desc: 'Nå level 15',                           icon: '🌠', cat: 'level', condition: s => getLevelInfo(s.totalXP).level >= 15 },
  { id: 'level_20',         name: 'Guild Master',        desc: 'Nå level 20',                           icon: '👸', cat: 'level', condition: s => getLevelInfo(s.totalXP).level >= 20 },
  // Daily quests
  { id: 'daily_quest_3',    name: 'Quest Seeker',        desc: 'Slutför 3 daily quests',                icon: '📜', cat: 'quests', condition: s => s.dailyQuestsCompleted >= 3 },
  { id: 'daily_quest_20',   name: 'Quest Addict',        desc: 'Slutför 20 daily quests',               icon: '🧭', cat: 'quests', condition: s => s.dailyQuestsCompleted >= 20 },
  { id: 'daily_quest_100',  name: 'Quest Overlord',      desc: 'Slutför 100 daily quests',              icon: '🗺️', cat: 'quests', condition: s => s.dailyQuestsCompleted >= 100 },
  // Shop & economy
  { id: 'first_purchase',   name: 'First Purchase',      desc: 'Köp ditt första föremål i shopen',      icon: '🛒', cat: 'shop', condition: s => s.totalPurchases >= 1 },
  { id: 'big_spender',      name: 'Big Spender',         desc: 'Spendera 1000 coins totalt',            icon: '💰', cat: 'shop', condition: s => s.totalCoinsSpent >= 1000 },
  { id: 'whale',            name: 'Whale',               desc: 'Spendera 10000 coins totalt',           icon: '🐋', cat: 'shop', condition: s => s.totalCoinsSpent >= 10000 },
  { id: 'collector_10',     name: 'Collector',            desc: 'Äg 10 föremål i inventariet',           icon: '🎒', cat: 'shop', condition: s => (s.inventory || []).length >= 10 },
  { id: 'collector_30',     name: 'Hoarder',              desc: 'Äg 30 föremål i inventariet',           icon: '🏪', cat: 'shop', condition: s => (s.inventory || []).length >= 30 },
  { id: 'chest_opener',     name: 'Treasure Hunter',      desc: 'Öppna 10 skattekistor',                icon: '📦', cat: 'shop', condition: s => s.chestsOpened >= 10 },
  { id: 'chest_master',     name: 'Loot Goblin',          desc: 'Öppna 50 skattekistor',                icon: '👺', cat: 'shop', condition: s => s.chestsOpened >= 50 },
  // Avatar
  { id: 'customize_avatar', name: 'Identity',             desc: 'Anpassa din avatar för första gången', icon: '🎭', cat: 'avatar', condition: s => s.avatarCustomized >= 1 },
  { id: 'equip_companion',  name: 'Best Friend',          desc: 'Utrusta en följeslagare',              icon: '🐾', cat: 'avatar', condition: s => s.companionsEquipped >= 1 },
  { id: 'equip_title',      name: 'Named Hero',           desc: 'Utrusta en titel',                     icon: '📛', cat: 'avatar', condition: s => s.titlesEquipped >= 1 },
  { id: 'equip_aura',       name: 'Radiant',              desc: 'Utrusta en aura',                      icon: '✨', cat: 'avatar', condition: s => s.aurasEquipped >= 1 },
  { id: 'full_outfit',      name: 'Fashion Master',       desc: 'Ha utrustning i alla slots samtidigt', icon: '👗', cat: 'avatar', condition: s => s.fullOutfitEquipped >= 1 },
  // Coin milestones
  { id: 'coins_500',        name: 'Pouch of Gold',        desc: 'Samla 500 coins totalt',               icon: '💰', cat: 'economy', condition: s => s.totalCoinsEarned >= 500 },
  { id: 'coins_5000',       name: 'Treasure Vault',       desc: 'Samla 5000 coins totalt',              icon: '🏦', cat: 'economy', condition: s => s.totalCoinsEarned >= 5000 },
  { id: 'coins_20000',      name: "Dragon's Hoard",       desc: 'Samla 20000 coins totalt',             icon: '💎', cat: 'economy', condition: s => s.totalCoinsEarned >= 20000 },
];

// ─── DAILY QUESTS ───────────────────────────────────────────────
const DAILY_QUEST_POOL = [
  { id: 'complete_3',      text: 'Slutför 3 uppgifter idag',          target: 3, stat: 'tasksToday' },
  { id: 'complete_5',      text: 'Slutför 5 uppgifter idag',          target: 5, stat: 'tasksToday' },
  { id: 'move_task',       text: 'Flytta en uppgift till nästa kolumn',target: 1, stat: 'movesToday' },
  { id: 'move_3',          text: 'Flytta 3 uppgifter idag',           target: 3, stat: 'movesToday' },
  { id: 'dungeon_1',       text: 'Kör en Dungeon Run (fokuspass)',    target: 1, stat: 'dungeonsToday' },
  { id: 'comment_1',       text: 'Skriv en kommentar på en uppgift',  target: 1, stat: 'commentsToday' },
];

function pickDailyQuests(seed) {
  // Deterministic shuffle based on date seed
  const shuffled = [...DAILY_QUEST_POOL];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

// ─── STATE MANAGEMENT ───────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

export function createInitialState() {
  return {
    totalXP: 0,
    tasksCompleted: 0,
    storiesCompleted: 0,
    legendaryCompleted: 0,
    epicCompleted: 0,
    dungeonsCleared: 0,
    boardsCleared: 0,
    dailyQuestsCompleted: 0,
    maxTasksInDay: 0,
    bestStreak: 0,
    currentStreak: 0,
    lastActiveDate: '',
    unlockedAchievements: [],
    // Coins & economy
    coins: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    totalPurchases: 0,
    chestsOpened: 0,
    // Inventory & avatar
    inventory: [],        // item ids owned
    avatar: createDefaultAvatar(),
    avatarCustomized: 0,
    companionsEquipped: 0,
    titlesEquipped: 0,
    aurasEquipped: 0,
    fullOutfitEquipped: 0,
    // Active perks: [{ id, type, value, expiresAt }]
    activePerks: [],
    // Daily tracking
    todayDate: today(),
    tasksToday: 0,
    movesToday: 0,
    dungeonsToday: 0,
    commentsToday: 0,
    dailyQuestIds: [],
    dailyQuestsCompletedToday: [],
    // XP notification queue
    pendingNotifications: [],
  };
}

function ensureToday(state) {
  const t = today();
  if (state.todayDate === t) return state;
  // New day — update streak, reset daily counters
  const wasYesterday = (() => {
    const d = new Date(state.lastActiveDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10) === t;
  })();
  const newStreak = wasYesterday ? state.currentStreak : 0;
  const quests = pickDailyQuests(parseInt(t.replace(/-/g, ''), 10));
  return {
    ...state,
    todayDate: t,
    tasksToday: 0,
    movesToday: 0,
    dungeonsToday: 0,
    commentsToday: 0,
    dailyQuestIds: quests.map(q => q.id),
    dailyQuestsCompletedToday: [],
    currentStreak: newStreak,
  };
}

export function getDailyQuests(state) {
  const s = ensureToday(state);
  const quests = pickDailyQuests(parseInt(s.todayDate.replace(/-/g, ''), 10));
  return quests.map(q => ({
    ...q,
    current: s[q.stat] || 0,
    completed: s.dailyQuestsCompletedToday?.includes(q.id),
  }));
}

function checkDailyQuests(state) {
  const quests = pickDailyQuests(parseInt(state.todayDate.replace(/-/g, ''), 10));
  let s = { ...state };
  for (const q of quests) {
    if ((s[q.stat] || 0) >= q.target && !s.dailyQuestsCompletedToday?.includes(q.id)) {
      s = {
        ...s,
        totalXP: s.totalXP + XP_REWARDS.dailyQuestComplete,
        dailyQuestsCompleted: s.dailyQuestsCompleted + 1,
        dailyQuestsCompletedToday: [...(s.dailyQuestsCompletedToday || []), q.id],
        pendingNotifications: [...s.pendingNotifications, { type: 'quest', text: q.text, xp: XP_REWARDS.dailyQuestComplete }],
      };
      s = addCoins(s, COIN_REWARDS.dailyQuestComplete, 'Daily Quest klar');
    }
  }
  return s;
}

function checkAchievements(state) {
  let s = { ...state };
  for (const a of ACHIEVEMENTS) {
    if (!s.unlockedAchievements.includes(a.id) && a.condition(s)) {
      s = {
        ...s,
        unlockedAchievements: [...s.unlockedAchievements, a.id],
        pendingNotifications: [...s.pendingNotifications, { type: 'achievement', text: a.name, icon: a.icon }],
      };
      s = addCoins(s, COIN_REWARDS.achievementUnlock, `Achievement: ${a.name}`);
    }
  }
  return s;
}

function updateStreak(state) {
  const t = today();
  let s = { ...state, lastActiveDate: t };
  if (state.lastActiveDate !== t) {
    s.currentStreak = s.currentStreak + 1;
    if (s.currentStreak > s.bestStreak) {
      s.bestStreak = s.currentStreak;
    }
    // Streak milestone bonus every 5 days
    if (s.currentStreak > 0 && s.currentStreak % 5 === 0) {
      const bonus = XP_REWARDS.streakBonus * (s.currentStreak / 5);
      s.totalXP += bonus;
      s.pendingNotifications = [...s.pendingNotifications, { type: 'streak', text: `${s.currentStreak} dagars streak!`, xp: bonus }];
      s = addCoins(s, COIN_REWARDS.streakMilestone, `${s.currentStreak} dagars streak`);
    }
  }
  return s;
}

// ─── ACTION HANDLERS ────────────────────────────────────────────
// Helper: add coins with tracking
function addCoins(state, amount, reason) {
  return {
    ...state,
    coins: state.coins + amount,
    totalCoinsEarned: state.totalCoinsEarned + amount,
    pendingNotifications: [...state.pendingNotifications, { type: 'coins', text: reason, coins: amount }],
  };
}

// Helper: apply XP boost perks
function getXPMultiplier(state) {
  const now = Date.now();
  const activeBoosts = (state.activePerks || []).filter(p => p.type === 'xp_boost' && p.expiresAt > now);
  return 1 + activeBoosts.reduce((sum, p) => sum + p.value, 0);
}

// Helper: check level up and award coins
function checkLevelUp(prevState, newState) {
  const prevLevel = getLevelInfo(prevState.totalXP).level;
  const newLevel = getLevelInfo(newState.totalXP).level;
  let s = newState;
  if (newLevel > prevLevel) {
    for (let l = prevLevel + 1; l <= newLevel; l++) {
      s = addCoins(s, COIN_REWARDS.levelUp, `Level ${l} uppnått!`);
    }
  }
  return s;
}

export function onTaskCompleted(state, task) {
  let s = ensureToday(state);
  const prevState = s;
  const baseXP = XP_REWARDS.taskComplete;
  const bonusXP = XP_REWARDS.taskCompletePriorityBonus[task.priority] || 0;
  const multiplier = getXPMultiplier(s);
  const totalGain = Math.round((baseXP + bonusXP) * multiplier);

  // Check for double XP perk
  let doubleUsed = false;
  const dblIdx = (s.activePerks || []).findIndex(p => p.type === 'double_xp_next');
  let finalXP = totalGain;
  if (dblIdx >= 0) {
    finalXP = totalGain * 2;
    doubleUsed = true;
    s = { ...s, activePerks: s.activePerks.filter((_, i) => i !== dblIdx) };
  }

  s = {
    ...s,
    totalXP: s.totalXP + finalXP,
    tasksCompleted: s.tasksCompleted + 1,
    tasksToday: s.tasksToday + 1,
    maxTasksInDay: Math.max(s.maxTasksInDay, s.tasksToday + 1),
    legendaryCompleted: s.legendaryCompleted + (task.priority === 'Legendary' ? 1 : 0),
    epicCompleted: s.epicCompleted + (task.priority === 'Epic' ? 1 : 0),
    pendingNotifications: [...s.pendingNotifications, { type: 'xp', text: `Uppgift klar: ${task.title}${doubleUsed ? ' (2x!)' : ''}`, xp: finalXP }],
  };
  s = addCoins(s, COIN_REWARDS.taskComplete, `Uppgift klar`);
  s = updateStreak(s);
  s = checkLevelUp(prevState, s);
  s = checkDailyQuests(s);
  s = checkAchievements(s);
  return s;
}

export function onTaskMoved(state) {
  let s = ensureToday(state);
  s = {
    ...s,
    totalXP: s.totalXP + XP_REWARDS.taskMove,
    movesToday: s.movesToday + 1,
  };
  s = updateStreak(s);
  s = checkDailyQuests(s);
  s = checkAchievements(s);
  return s;
}

export function onStoryCompleted(state) {
  let s = ensureToday(state);
  const prevState = s;
  s = {
    ...s,
    totalXP: s.totalXP + XP_REWARDS.storyComplete,
    storiesCompleted: s.storiesCompleted + 1,
    pendingNotifications: [...s.pendingNotifications, { type: 'xp', text: 'Story slutförd!', xp: XP_REWARDS.storyComplete }],
  };
  s = addCoins(s, COIN_REWARDS.storyComplete, 'Story slutförd');
  s = checkLevelUp(prevState, s);
  s = checkDailyQuests(s);
  s = checkAchievements(s);
  return s;
}

export function onDungeonCleared(state) {
  let s = ensureToday(state);
  const prevState = s;
  s = {
    ...s,
    totalXP: s.totalXP + XP_REWARDS.dungeonClear,
    dungeonsCleared: s.dungeonsCleared + 1,
    dungeonsToday: s.dungeonsToday + 1,
    pendingNotifications: [...s.pendingNotifications, { type: 'xp', text: 'Dungeon Run klar!', xp: XP_REWARDS.dungeonClear }],
  };
  s = addCoins(s, COIN_REWARDS.dungeonClear, 'Dungeon Run klar');
  s = updateStreak(s);
  s = checkLevelUp(prevState, s);
  s = checkDailyQuests(s);
  s = checkAchievements(s);
  return s;
}

export function onComment(state) {
  let s = ensureToday(state);
  s = { ...s, commentsToday: s.commentsToday + 1 };
  s = checkDailyQuests(s);
  return s;
}

export function onBoardCleared(state) {
  let s = ensureToday(state);
  s = { ...s, boardsCleared: s.boardsCleared + 1 };
  s = checkAchievements(s);
  return s;
}

// ─── SHOP & AVATAR ACTIONS ──────────────────────────────────────
export function onPurchaseItem(state, itemId, cost) {
  if (state.coins < cost) return state;
  let s = {
    ...state,
    coins: state.coins - cost,
    totalCoinsSpent: state.totalCoinsSpent + cost,
    totalPurchases: state.totalPurchases + 1,
    inventory: [...(state.inventory || []), itemId],
    pendingNotifications: [...state.pendingNotifications, { type: 'shop', text: 'Föremål köpt!', icon: '🛒' }],
  };
  s = checkAchievements(s);
  return s;
}

export function onPurchasePerk(state, perk, cost) {
  if (state.coins < cost) return state;
  const expiresAt = perk.perkDuration ? Date.now() + perk.perkDuration * 3600000 : Infinity;
  let s = {
    ...state,
    coins: state.coins - cost,
    totalCoinsSpent: state.totalCoinsSpent + cost,
    totalPurchases: state.totalPurchases + 1,
    activePerks: [...(state.activePerks || []), { id: perk.id, type: perk.perkType, value: perk.perkValue, expiresAt }],
    pendingNotifications: [...state.pendingNotifications, { type: 'shop', text: `${perk.name} aktiverad!`, icon: '🧪' }],
  };
  s = checkAchievements(s);
  return s;
}

export function onOpenChest(state, cost, reward) {
  if (state.coins < cost) return state;
  let s = {
    ...state,
    coins: state.coins - cost,
    totalCoinsSpent: state.totalCoinsSpent + cost,
    totalPurchases: state.totalPurchases + 1,
    chestsOpened: (state.chestsOpened || 0) + 1,
  };
  if (reward.type === 'coins') {
    s.coins += reward.amount;
    s.totalCoinsEarned += reward.amount;
    s.pendingNotifications = [...s.pendingNotifications, { type: 'coins', text: `Kista: ${reward.amount} coins!`, coins: reward.amount }];
  } else if (reward.type === 'item' && reward.itemId) {
    if (!s.inventory.includes(reward.itemId)) {
      s.inventory = [...s.inventory, reward.itemId];
    }
    s.pendingNotifications = [...s.pendingNotifications, { type: 'shop', text: `Kista: ${reward.item?.name || 'Föremål'}!`, icon: reward.item?.icon || '📦' }];
  }
  s = checkAchievements(s);
  return s;
}

export function onAvatarUpdate(state, avatarChanges) {
  let s = {
    ...state,
    avatar: { ...(state.avatar || {}), ...avatarChanges },
    avatarCustomized: (state.avatarCustomized || 0) + 1,
  };
  // Track equip stats for achievements
  if (avatarChanges.equippedCompanion && !state.avatar?.equippedCompanion) s.companionsEquipped = (s.companionsEquipped || 0) + 1;
  if (avatarChanges.equippedTitle && !state.avatar?.equippedTitle) s.titlesEquipped = (s.titlesEquipped || 0) + 1;
  if (avatarChanges.equippedAura && !state.avatar?.equippedAura) s.aurasEquipped = (s.aurasEquipped || 0) + 1;
  // Check full outfit
  const av = s.avatar;
  if (av.equippedHead && av.equippedArmor && av.equippedWeapon && av.equippedBack) {
    s.fullOutfitEquipped = (s.fullOutfitEquipped || 0) + 1;
  }
  s = checkAchievements(s);
  return s;
}

export function onQuestReroll(state) {
  const t = state.todayDate;
  const newSeed = parseInt(t.replace(/-/g, ''), 10) + Date.now();
  const quests = pickDailyQuests(newSeed);
  return {
    ...state,
    dailyQuestIds: quests.map(q => q.id),
    dailyQuestsCompletedToday: [],
    _questSeedOverride: newSeed,
  };
}

// Clean up expired perks
export function cleanExpiredPerks(state) {
  const now = Date.now();
  const active = (state.activePerks || []).filter(p => !p.expiresAt || p.expiresAt > now);
  if (active.length === (state.activePerks || []).length) return state;
  return { ...state, activePerks: active };
}

export function consumeNotifications(state) {
  return { ...state, pendingNotifications: [] };
}

// ─── PERSISTENCE ────────────────────────────────────────────────
export function loadGamificationState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return ensureToday({ ...createInitialState(), ...saved });
    }
  } catch { /* ignore */ }
  return ensureToday(createInitialState());
}

export function saveGamificationState(state) {
  try {
    // Don't persist pendingNotifications
    const { pendingNotifications, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch { /* ignore */ }
}
