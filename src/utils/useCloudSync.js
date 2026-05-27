import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import { loadBoards, loadActiveId, saveBoards as saveLocal, saveActiveId as saveActiveLocal, createEmptyBoard } from './storage';
import { uid } from './helpers';

/**
 * Cloud sync hook. When a user is logged in, boards are stored in Supabase
 * and synced in realtime across devices. Falls back to localStorage when offline
 * or not logged in.
 */
export default function useCloudSync(user) {
  const [boards, setBoards] = useState(loadBoards);
  const [activeId, setActiveId] = useState(() => {
    const saved = loadActiveId();
    const bs = loadBoards();
    return saved && bs.find(b => b.id === saved) ? saved : bs[0]?.id;
  });
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const pushTimeoutRef = useRef(null);
  const skipNextRemoteRef = useRef(false);
  const lastPushedRef = useRef(null);

  // ---- PULL from Supabase on login ----
  useEffect(() => {
    if (!user || !supabase) return;
    let cancelled = false;

    const pull = async () => {
      setSyncing(true);
      setSyncError(null);
      try {
        // Fetch user's boards
        const { data: rows, error } = await supabase
          .from('boards')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: true });

        if (error) throw error;
        if (cancelled) return;

        if (rows && rows.length > 0) {
          const cloudBoards = rows.map(r => r.data);
          setBoards(cloudBoards);
          saveLocal(cloudBoards);

          // Fetch active board preference
          const { data: settings } = await supabase
            .from('user_settings')
            .select('active_board_id')
            .eq('user_id', user.id)
            .single();

          if (settings?.active_board_id && cloudBoards.find(b => b.id === settings.active_board_id)) {
            setActiveId(settings.active_board_id);
            saveActiveLocal(settings.active_board_id);
          } else {
            setActiveId(cloudBoards[0].id);
          }
        } else {
          // First time — push local boards to cloud
          const localBoards = loadBoards();
          for (const board of localBoards) {
            await supabase.from('boards').upsert({
              user_id: user.id,
              board_id: board.id,
              data: board,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,board_id' });
          }
          await supabase.from('user_settings').upsert({
            user_id: user.id,
            active_board_id: localBoards[0]?.id || '',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
      } catch (err) {
        console.error('Sync pull error:', err);
        setSyncError(err.message);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };

    pull();
    return () => { cancelled = true; };
  }, [user]);

  // ---- Realtime subscription ----
  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('boards-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'boards',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        try {
          // Skip if we just pushed this change
          if (skipNextRemoteRef.current) {
            skipNextRemoteRef.current = false;
            return;
          }

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedBoard = payload.new?.data;
            const boardId = payload.new?.board_id;
            if (!updatedBoard || !boardId) return;

            // Don't apply if this is the same data we just pushed
            try {
              if (lastPushedRef.current === JSON.stringify(updatedBoard)) return;
            } catch { /* ignore serialization errors */ }

            setBoards(prev => {
              try {
                const exists = prev.find(b => b.id === boardId);
                let next;
                if (exists) {
                  next = prev.map(b => b.id === boardId ? updatedBoard : b);
                } else {
                  next = [...prev, updatedBoard];
                }
                saveLocal(next);
                return next;
              } catch (err) {
                console.error('Error applying remote board update:', err);
                return prev;
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const boardId = payload.old?.board_id;
            if (!boardId) return;
            setBoards(prev => {
              const next = prev.filter(b => b.id !== boardId);
              if (next.length === 0) return prev; // Don't allow empty boards
              saveLocal(next);
              return next;
            });
          }
        } catch (err) {
          console.error('Realtime sync handler error:', err);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ---- PUSH to Supabase (debounced) ----
  const pushToCloud = useCallback((newBoards, newActiveId) => {
    if (!user || !supabase) return;

    // Debounce: wait 500ms before pushing
    if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
    pushTimeoutRef.current = setTimeout(async () => {
      try {
        // Upsert each board
        for (const board of newBoards) {
          const serialized = JSON.stringify(board);
          lastPushedRef.current = serialized;
          skipNextRemoteRef.current = true;

          await supabase.from('boards').upsert({
            user_id: user.id,
            board_id: board.id,
            data: board,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,board_id' });
        }

        // Delete boards that no longer exist locally
        const { data: cloudRows } = await supabase
          .from('boards')
          .select('board_id')
          .eq('user_id', user.id);

        if (cloudRows) {
          const localIds = new Set(newBoards.map(b => b.id));
          for (const row of cloudRows) {
            if (!localIds.has(row.board_id)) {
              await supabase.from('boards')
                .delete()
                .eq('user_id', user.id)
                .eq('board_id', row.board_id);
            }
          }
        }

        // Save active board preference
        if (newActiveId) {
          await supabase.from('user_settings').upsert({
            user_id: user.id,
            active_board_id: newActiveId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
      } catch (err) {
        console.error('Sync push error:', err);
        setSyncError(err.message);
      }
    }, 500);
  }, [user]);

  // Wrap setBoards to also push to cloud
  const setBoardsAndSync = useCallback((updater) => {
    setBoards(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLocal(next);
      pushToCloud(next, activeId);
      return next;
    });
  }, [pushToCloud, activeId]);

  // Wrap setActiveId to also push to cloud
  const setActiveIdAndSync = useCallback((id) => {
    setActiveId(id);
    saveActiveLocal(id);
    if (user && supabase) {
      supabase.from('user_settings').upsert({
        user_id: user.id,
        active_board_id: id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).catch(console.error);
    }
  }, [user]);

  return {
    boards,
    setBoards: setBoardsAndSync,
    activeId,
    setActiveId: setActiveIdAndSync,
    syncing,
    syncError,
  };
}
