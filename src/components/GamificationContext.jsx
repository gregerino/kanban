import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  loadGamificationState, saveGamificationState, getLevelInfo,
  onTaskCompleted, onTaskMoved, onStoryCompleted, onDungeonCleared, onComment, onBoardCleared,
  consumeNotifications, getDailyQuests, ACHIEVEMENTS,
} from '../utils/gamification';

const GamificationCtx = createContext(null);
export function useGamification() { return useContext(GamificationCtx); }

export default function GamificationProvider({ children, enabled }) {
  const [state, setState] = useState(() => loadGamificationState());
  const [notifications, setNotifications] = useState([]);
  const saveTimer = useRef(null);

  // Persist on change (debounced)
  useEffect(() => {
    if (!enabled) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveGamificationState(state), 300);
    return () => clearTimeout(saveTimer.current);
  }, [state, enabled]);

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
