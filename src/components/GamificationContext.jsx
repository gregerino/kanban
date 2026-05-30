import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  loadGamificationState, saveGamificationState, getLevelInfo,
  onTaskCompleted, onTaskMoved, onStoryCompleted, onDungeonCleared, onComment, onBoardCleared,
  onPurchaseItem, onPurchasePerk, onOpenChest, onAvatarUpdate, onQuestReroll, cleanExpiredPerks,
  consumeNotifications, getDailyQuests, ACHIEVEMENTS,
} from '../utils/gamification';
import { SHOP_ITEMS, openChest as rollChest } from '../utils/shopData';
import { supabase } from '../utils/supabase';

const GamificationCtx = createContext(null);
export function useGamification() { return useContext(GamificationCtx); }

export default function GamificationProvider({ children, enabled, user }) {
  const [state, setState] = useState(() => loadGamificationState());
  const [notifications, setNotifications] = useState([]);
  const saveTimer = useRef(null);
  const pushTimer = useRef(null);
  const isPullingRef = useRef(false);
  const lastPushedRef = useRef(null);

  // ---- PULL gamification state from Supabase on login ----
  useEffect(() => {
    if (!user || !supabase || !enabled) return;
    let cancelled = false;

    const pull = async () => {
      isPullingRef.current = true;
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('gamification_data')
          .eq('user_id', user.id)
          .single();

        if (cancelled) return;

        if (!error && data?.gamification_data) {
          const cloudState = data.gamification_data;
          const localState = loadGamificationState();

          // Merge: pick the state with more total XP (most progress)
          // This is a simple conflict resolution strategy
          const merged = (cloudState.totalXP || 0) >= (localState.totalXP || 0)
            ? { ...localState, ...cloudState }
            : { ...cloudState, ...localState };

          // Always keep the best of both for key metrics
          merged.totalXP = Math.max(cloudState.totalXP || 0, localState.totalXP || 0);
          merged.coins = Math.max(cloudState.coins || 0, localState.coins || 0);
          merged.tasksCompleted = Math.max(cloudState.tasksCompleted || 0, localState.tasksCompleted || 0);
          merged.storiesCompleted = Math.max(cloudState.storiesCompleted || 0, localState.storiesCompleted || 0);
          merged.bestStreak = Math.max(cloudState.bestStreak || 0, localState.bestStreak || 0);
          merged.dungeonsCleared = Math.max(cloudState.dungeonsCleared || 0, localState.dungeonsCleared || 0);
          merged.dailyQuestsCompleted = Math.max(cloudState.dailyQuestsCompleted || 0, localState.dailyQuestsCompleted || 0);
          merged.maxTasksInDay = Math.max(cloudState.maxTasksInDay || 0, localState.maxTasksInDay || 0);
          merged.legendaryCompleted = Math.max(cloudState.legendaryCompleted || 0, localState.legendaryCompleted || 0);
          merged.epicCompleted = Math.max(cloudState.epicCompleted || 0, localState.epicCompleted || 0);

          // Merge unlocked achievements (union of both)
          const localAch = new Set(localState.unlockedAchievements || []);
          const cloudAch = new Set(cloudState.unlockedAchievements || []);
          merged.unlockedAchievements = [...new Set([...localAch, ...cloudAch])];

          // Merge inventory (union)
          const localInv = new Set(localState.inventory || []);
          const cloudInv = new Set(cloudState.inventory || []);
          merged.inventory = [...new Set([...localInv, ...cloudInv])];

          // Use the avatar with more equipment
          const cloudAvatar = cloudState.avatar || {};
          const localAvatar = localState.avatar || {};
          const cloudEquipCount = [cloudAvatar.equippedHead, cloudAvatar.equippedArmor, cloudAvatar.equippedWeapon, cloudAvatar.equippedBack, cloudAvatar.equippedCompanion].filter(Boolean).length;
          const localEquipCount = [localAvatar.equippedHead, localAvatar.equippedArmor, localAvatar.equippedWeapon, localAvatar.equippedBack, localAvatar.equippedCompanion].filter(Boolean).length;
          merged.avatar = cloudEquipCount >= localEquipCount ? cloudAvatar : localAvatar;

          merged.pendingNotifications = [];

          setState(merged);
          saveGamificationState(merged);
        } else if (!error && !data?.gamification_data) {
          // No cloud data yet — push local state up
          pushToCloud(loadGamificationState());
        }
      } catch (err) {
        console.error('Gamification pull error:', err);
      } finally {
        isPullingRef.current = false;
      }
    };

    pull();
    return () => { cancelled = true; };
  }, [user, enabled]);

  // ---- PUSH to Supabase (debounced) ----
  const pushToCloud = useCallback((stateToSave) => {
    if (!user || !supabase) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        const { pendingNotifications, _lastChestReward, ...cleanState } = stateToSave;
        const serialized = JSON.stringify(cleanState);

        // Skip if identical to last push
        if (lastPushedRef.current === serialized) return;
        lastPushedRef.current = serialized;

        await supabase.from('user_settings').upsert({
          user_id: user.id,
          gamification_data: cleanState,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.error('Gamification push error:', err);
      }
    }, 1000);
  }, [user]);

  // Persist locally + push to cloud on change (debounced)
  useEffect(() => {
    if (!enabled) return;
    if (isPullingRef.current) return; // Don't push while pulling

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveGamificationState(state);
      pushToCloud(state);
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state, enabled, pushToCloud]);

  // Clean expired perks periodically
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setState(s => cleanExpiredPerks(s)), 60000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Process pending notifications
  useEffect(() => {
    if (!enabled) return;
    if (state.pendingNotifications.length > 0) {
      setNotifications(prev => [...prev, ...state.pendingNotifications]);
      setState(s => consumeNotifications(s));
    }
  }, [state.pendingNotifications, enabled]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const dispatch = useCallback((action, payload) => {
    if (!enabled) return;
    setState(prev => {
      switch (action) {
        case 'TASK_COMPLETED': return onTaskCompleted(prev, payload);
        case 'TASK_MOVED': return onTaskMoved(prev);
        case 'STORY_COMPLETED': return onStoryCompleted(prev);
        case 'DUNGEON_CLEARED': return onDungeonCleared(prev);
        case 'COMMENT': return onComment(prev);
        case 'BOARD_CLEARED': return onBoardCleared(prev);
        case 'PURCHASE_ITEM': return onPurchaseItem(prev, payload.itemId, payload.cost);
        case 'PURCHASE_PERK': return onPurchasePerk(prev, payload.perk, payload.cost);
        case 'OPEN_CHEST': {
          const reward = rollChest(payload.chestId, prev.inventory || []);
          if (!reward) return prev;
          const next = onOpenChest(prev, payload.cost, reward);
          next._lastChestReward = reward;
          return next;
        }
        case 'UPDATE_AVATAR': return onAvatarUpdate(prev, payload);
        case 'QUEST_REROLL': return onQuestReroll(prev);
        default: return prev;
      }
    });
  }, [enabled]);

  const levelInfo = enabled ? getLevelInfo(state.totalXP) : null;
  const dailyQuests = enabled ? getDailyQuests(state) : [];
  const achievements = enabled ? ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: state.unlockedAchievements.includes(a.id),
  })) : [];

  return (
    <GamificationCtx.Provider value={{
      enabled,
      state,
      levelInfo,
      dailyQuests,
      achievements,
      notifications,
      dispatch,
      dismissNotification: () => setNotifications(prev => prev.slice(1)),
    }}>
      {children}
    </GamificationCtx.Provider>
  );
}
