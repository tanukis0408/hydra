/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RENDERER_VITE_EXTERNAL_RESOURCES_URL: string;
  readonly RENDERER_VITE_REAL_DEBRID_REFERRAL_ID?: string;
  readonly RENDERER_VITE_TORBOX_REFERRAL_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type KrakenApiBridge = {
  get<T = any>(
    url: string,
    options?: {
      params?: unknown;
      needsAuth?: boolean;
      needsSubscription?: boolean;
      ifModifiedSince?: Date;
    }
  ): Promise<T>;
  post<T = any>(
    url: string,
    options?: { data?: unknown; needsAuth?: boolean; needsSubscription?: boolean }
  ): Promise<T>;
  put<T = any>(
    url: string,
    options?: { data?: unknown; needsAuth?: boolean; needsSubscription?: boolean }
  ): Promise<T>;
  patch<T = any>(
    url: string,
    options?: { data?: unknown; needsAuth?: boolean; needsSubscription?: boolean }
  ): Promise<T>;
  delete<T = any>(
    url: string,
    options?: { needsAuth?: boolean; needsSubscription?: boolean }
  ): Promise<T>;
};

type ElectronBridge = {
  krakenApi: KrakenApiBridge;
  [key: string]: any;
};

interface Window {
  electron: ElectronBridge;
}

declare module "*.svg?react" {
  import type * as React from "react";
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.ico" {
  const src: string;
  export default src;
}

declare module "*.wav" {
  const src: string;
  export default src;
}

declare module "*.scss?inline" {
  const content: string;
  export default content;
}
