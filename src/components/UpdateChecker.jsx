import { useState, useEffect } from 'react';

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (update) setUpdateAvailable(update);
      } catch (e) {
        // Not in Tauri environment or update check failed
        console.log('Update check skipped:', e.message);
      }
    };

    // Check after 3 seconds, then every 30 minutes
    const timeout = setTimeout(checkUpdate, 3000);
    const interval = setInterval(checkUpdate, 30 * 60 * 1000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []);

  if (!updateAvailable || dismissed) return null;

  const install = async () => {
    setDownloading(true);
    try {
      await updateAvailable.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (e) {
      console.error('Update failed:', e);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-xs animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Uppdatering tillgänglig</p>
          <p className="text-xs text-gray-500 mt-0.5">Version {updateAvailable.version} finns att ladda ner.</p>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={install}
              disabled={downloading}
              className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 disabled:opacity-50"
            >
              {downloading ? 'Installerar...' : 'Uppdatera nu'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1 text-gray-500 hover:text-gray-700 text-xs font-medium"
            >
              Senare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
