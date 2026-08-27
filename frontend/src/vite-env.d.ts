/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * `'true'` makes the app answer its own API calls from `src/demo` instead of
   * reaching the network. Set for the hosted static build by `vite.config.ts`.
   */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
