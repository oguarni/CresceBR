/**
 * Browser-side demo API.
 *
 * The public site is hosted as static files with no backend behind it, so this
 * module answers the app's API calls locally from the seeded catalog. It is
 * opt-in: `VITE_DEMO_MODE=true` is set for the hosted build only, and local
 * development keeps talking to the real Express server through the Vite proxy.
 */

import type { AxiosInstance } from 'axios';
import { demoAdapter } from './adapter';
import { resetState } from './store';

export const isDemoMode = (): boolean => import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Routes an axios instance to the demo API. Safe to call unconditionally —
 * it is a no-op unless demo mode is enabled.
 */
export const installDemoApi = (instance: AxiosInstance): void => {
  if (!isDemoMode()) return;

  instance.defaults.adapter = demoAdapter;

  // A visitor who has clicked the demo into a strange state needs a way out
  // that does not involve clearing site data by hand.
  (window as unknown as { resetCresceBRDemo: () => void }).resetCresceBRDemo = () => {
    resetState();
    window.location.reload();
  };
};

export { resetState };
