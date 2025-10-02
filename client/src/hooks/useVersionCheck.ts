import { useEffect } from 'react';

const APP_VERSION = '1.0.3';
const VERSION_KEY = 'app_version';

export function useVersionCheck() {
  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion && storedVersion !== APP_VERSION) {
      // Version changed - force reload to get new assets
      // This preserves localStorage data (userId, etc)
      console.log(`App updated from ${storedVersion} to ${APP_VERSION} - reloading...`);
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      // Force reload with cache bypass
      window.location.reload();
    } else if (!storedVersion) {
      // First time - just set the version
      localStorage.setItem(VERSION_KEY, APP_VERSION);
    }
  }, []);
}
