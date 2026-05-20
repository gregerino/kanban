import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthCtx = createContext(null);

export function useAuth() { return useContext(AuthCtx); }

// Detect if running inside Tauri
const isTauri = () => !!window.__TAURI_INTERNALS__;

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // In Tauri, listen for deep link callbacks (questlog://auth#access_token=...)
    let unlistenDeepLink = null;
    if (isTauri()) {
      import('@tauri-apps/plugin-deep-link').then(({ onOpenUrl }) => {
        onOpenUrl((urls) => {
          for (const url of urls) {
            if (url.startsWith('questlog://auth')) {
              // Extract fragment (everything after #)
              const hashIndex = url.indexOf('#');
              if (hashIndex !== -1) {
                const fragment = url.substring(hashIndex + 1);
                const params = new URLSearchParams(fragment);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                if (accessToken && refreshToken) {
                  supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                }
              }
            }
          }
        }).then(fn => { unlistenDeepLink = fn; });
      }).catch(() => {});
    }

    return () => {
      subscription.unsubscribe();
      if (unlistenDeepLink) unlistenDeepLink();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) return;

    if (isTauri()) {
      // In Tauri: open OAuth in system browser, redirect back via deep link
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'questlog://auth',
          skipBrowserRedirect: true,
        },
      });
      if (data?.url) {
        try {
          const { open } = await import('@tauri-apps/plugin-shell');
          await open(data.url);
        } catch (e) {
          window.location.href = data.url;
        }
      }
    } else {
      // In browser: normal OAuth flow
      const redirectUrl = window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, signInWithGoogle, signOut, isConfigured: !!supabase }}>
      {children}
    </AuthCtx.Provider>
  );
}
