/// <reference types="vite/client" />

/**
 * Type definitions for environment variables
 * All VITE_ prefixed variables are exposed to the client
 */
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_CATEN_BASE_URL: string;
  readonly VITE_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

interface Window {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
}

