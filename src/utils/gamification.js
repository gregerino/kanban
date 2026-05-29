/**
 * Gamification engine for QuestLog.
 * Handles XP, levels, achievements, streaks, and daily quests.
 * State is persisted to localStorage per-user.
 */

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
  { id: 'first_quest',      name: 'First Quest',        desc: 'Slutför din första uppgift',             icon: '⚔️', condition: s => s.tasksCompleted >= 1 },
  { id: 'task_10',          name: 'Getting Started',     desc: 'Slutför 10 uppgifter',                  icon: '🗡️', condition: s => s.tasksCompleted >= 10 },
  { id: 'task_50',          name: 'Quest Veteran',       desc: 'Slutför 50 uppgifter',                  icon: '🛡️', condition: s => s.tasksCompleted >= 50 },
  { id: 'task_100',         name: 'Centurion',           desc: 'Slutför 100 uppgifter',                 icon: '👑', condition: s => s.tasksCompleted >= 100 },
  { id: 'task_500',         name: 'Legendary Slayer',    desc: 'Slutför 500 uppgifter',                 icon: '🏆', condition: s => s.tasksCompleted >= 500 },
  { id: 'story_complete',   name: 'Story Finisher',      desc: 'Slutför alla uppgifter i en story',     icon: '📖', condition: s => s.storiesCompleted >= 1 },
  { id: 'story_5',          name: 'Chapter Master',      desc: 'Slutför 5 stories',                     icon: '📚', condition: s => s.storiesCompleted >= 5 },
  { id: 'sprint_slayer',    name: 'Sprint Slayer',       desc: 'Slutför 10 uppgifter på en dag',        icon: '⚡', condition: s => s.maxTasksInDay >= 10 },
  { id: 'streak_5',         name: 'On Fire',             desc: '5 dagars aktivitetsstreak',              icon: '🔥', condition: s => s.bestStreak >= 5 },
  { id: 'streak_10',        name: 'Unstoppable',         desc: '10 dagars aktivitetsstreak',             icon: '💥', condition: s => s.bestStreak >= 10 },
  { id: 'streak_30',        name: 'Iron Will',           desc: '30 dagars aktivitetsstreak',             icon: '🏅', condition: s => s.bestStreak >= 30 },
  { id: 'legendary_task',   name: 'Dragon Slayer',       desc: 'Slutför en Legendary-uppgift',          icon: '🐉', condition: s => s.legendaryCompleted >= 1 },
  { id: 'epic_task_10',     name: 'Epic Hunter',         desc: 'Slutför 10 Epic-uppgifter',             icon: '💜', condition: s => s.epicCompleted >= 10 },
  { id: 'dungeon_1',        name: 'Dungeon Runner',      desc: 'Slutför din första Dungeon Run',        icon: '🏰', condition: s => s.dungeonsCleared >= 1 },
  { id: 'dungeon_10',       name: 'Dungeon Master',      desc: 'Slutför 10 Dungeon Runs',               icon: '🗝️', condition: s => s.dungeonsCleared >= 10 },
  { id: 'dungeon_50',       name: 'Dungeon Legend',       desc: 'Slutför 50 Dungeon Runs',               icon: '🏯', condition: s => s.dungeonsCleared >= 50 },
  { id: 'level_5',          name: 'Adventurer',          desc: 'Nå level 5',                            icon: '🌟', condition: s => getLevelInfo(s.totalXP).level >= 5 },
  { id: 'level_10',         name: 'Ranger',              desc: 'Nå level 10',                           icon: '⭐', condition: s => getLevelInfo(s.totalXP).level >= 10 },
  { id: 'level_20',         name: 'Guild Master',        desc: 'Nå level 20',                           icon: '👸', condition: s => getLevelInfo(s.totalXP).level >= 20 },
  { id: 'no_tasks_left',    name: 'No Tasks Left Behind',desc: 'Töm alla kolumner utom Done',           icon: '✨', condition: s => s.boardsCleared >= 1 },
  { id: 'daily_quest_3',    name: 'Quest Seeker',        desc: 'Slutför 3 daily quests',                icon: '📜', condition: s => s.dailyQuestsCompleted >= 3 },
  { id: 'daily_quest_20',   name: 'Quest Addict',        desc: 'Slutför 20 daily quests',               icon: '🧭', condition: s => s.dailyQuestsCompleted >= 20 },
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
    unlockedAchievements: [], // achievement ids
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
    }
  }
  return s;
}

// ─── ACTION HANDLERS ────────────────────────────────────────────
export function onTaskCompleted(state, task) {
  let s = ensureToday(state);
  const baseXP = XP_REWARDS.taskComplete;
  const bonusXP = XP_REWARDS.taskCompletePriorityBonus[task.priority] || 0;
  const totalGain = baseXP + bonusXP;

  s = {
    ...s,
    totalXP: s.totalXP + totalGain,
    tasksCompleted: s.tasksCompleted + 1,
    tasksToday: s.tasksToday + 1,
    maxTasksInDay: Math.max(s.maxTasksInDay, s.tasksToday + 1),
    legendaryCompleted: s.legendaryCompleted + (task.priority === 'Legendary' ? 1 : 0),
    epicCompleted: s.epicCompleted + (task.priority === 'Epic' ? 1 : 0),
    pendingNotifications: [...s.pendingNotifications, { type: 'xp', text: `Uppgift klar: ${task.title}`, xp: totalGain }],
  };
  s = updateStreak(s);
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
  s = {
    ...s,
    totalXP: s.totalXP + XP_REWARDS.storyComplete,
    storiesCompleted: s.storiesCompleted + 1,
    pendingNotifications: [...s.pendingNotifications, { type: 'xp', text: 'Story slutförd!', xp: XP_REWARDS.storyComplete }],
  };
  s = checkDailyQuests(s);
  s = checkAchievements(s);
  return s;
}

export function onDungeonCleared(state) {
  let s = ensureToday(state);
  s = {
    ...s,
    totalXP: s.totalXP + XP_REWARDS.dungeonClear,
    dungeonsCleared: s.dungeonsCleared + 1,
    dungeonsToday: s.dungeonsToday + 1,
    pendingNotifications: [...s.pendingNotifications, { type: 'xp', text: 'Dungeon Run klar!', xp: XP_REWARDS.dungeonClear }],
  };
  s = updateStreak(s);
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
