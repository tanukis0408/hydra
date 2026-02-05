/// <reference types="vite/client" />

import type {
  AchievementCustomNotificationPosition,
  AchievementNotificationInfo,
  AppUpdaterEvent,
  DownloadProgress,
  FriendRequestAction,
  FriendRequestSync,
  GameRunning,
  GameShop,
  LocalNotification,
  NotificationSync,
  SeedingStatus,
  ShortcutLocation,
  StartGameDownloadPayload,
  Theme,
  UpdateProfileRequest,
  UserAchievement,
  UserPreferences,
} from "@types";
import type { AuthPage } from "@shared";
import type { AxiosProgressEvent } from "axios";
import type { OpenDialogOptions } from "electron";

interface ImportMetaEnv {
  readonly RENDERER_VITE_EXTERNAL_RESOURCES_URL: string;
  readonly RENDERER_VITE_REAL_DEBRID_REFERRAL_ID?: string;
  readonly RENDERER_VITE_TORBOX_REFERRAL_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type KrakenApiBridge = {
  get<T = unknown>(
    url: string,
    options?: {
      params?: unknown;
      needsAuth?: boolean;
      needsSubscription?: boolean;
      ifModifiedSince?: Date;
    }
  ): Promise<T>;
  post<T = unknown>(
    url: string,
    options?: {
      data?: unknown;
      needsAuth?: boolean;
      needsSubscription?: boolean;
    }
  ): Promise<T>;
  put<T = unknown>(
    url: string,
    options?: {
      data?: unknown;
      needsAuth?: boolean;
      needsSubscription?: boolean;
    }
  ): Promise<T>;
  patch<T = unknown>(
    url: string,
    options?: {
      data?: unknown;
      needsAuth?: boolean;
      needsSubscription?: boolean;
    }
  ): Promise<T>;
  delete<T = unknown>(
    url: string,
    options?: { needsAuth?: boolean; needsSubscription?: boolean }
  ): Promise<T>;
};

type IpcInvokeReturn = ReturnType<typeof import("electron").ipcRenderer.invoke>;
type IpcInvoke = (...args: unknown[]) => IpcInvokeReturn;
type IpcListener<TArgs extends unknown[] = []> = (
  cb: (...args: TArgs) => void
) => () => void;

type LevelDbBridge = {
  get: IpcInvoke;
  put: IpcInvoke;
  del: IpcInvoke;
  clear: IpcInvoke;
  values: IpcInvoke;
  iterator: IpcInvoke;
};

type ElectronBridge = {
  /* Torrenting */
  startGameDownload: (payload: StartGameDownloadPayload) => IpcInvokeReturn;
  addGameToQueue: (payload: StartGameDownloadPayload) => IpcInvokeReturn;
  cancelGameDownload: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  pauseGameDownload: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  resumeGameDownload: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  pauseGameSeed: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  resumeGameSeed: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  updateDownloadQueuePosition: (
    shop: GameShop,
    objectId: string,
    direction: "up" | "down"
  ) => IpcInvokeReturn;
  onDownloadProgress: IpcListener<[DownloadProgress | null]>;
  onHardDelete: IpcListener;
  onSeedingStatus: IpcListener<[SeedingStatus[]]>;
  checkDebridAvailability: (magnets: string[]) => IpcInvokeReturn;

  /* Catalogue */
  getGameShopDetails: (
    objectId: string,
    shop: GameShop,
    language: string
  ) => IpcInvokeReturn;
  getRandomGame: () => IpcInvokeReturn;
  getGameStats: (objectId: string, shop: GameShop) => IpcInvokeReturn;
  getGameAssets: (objectId: string, shop: GameShop) => IpcInvokeReturn;
  onUpdateAchievements: (
    objectId: string,
    shop: GameShop,
    cb: (achievements: UserAchievement[]) => void
  ) => () => void;

  /* User preferences */
  getUserPreferences: () => IpcInvokeReturn;
  updateUserPreferences: (preferences: UserPreferences) => IpcInvokeReturn;
  autoLaunch: (autoLaunchProps: {
    enabled: boolean;
    minimized: boolean;
  }) => IpcInvokeReturn;
  authenticateRealDebrid: (apiToken: string) => IpcInvokeReturn;
  authenticateTorBox: (apiToken: string) => IpcInvokeReturn;

  /* Download sources */
  addDownloadSource: (url: string) => IpcInvokeReturn;
  removeDownloadSource: (
    removeAll?: boolean,
    downloadSourceId?: string
  ) => IpcInvokeReturn;
  getDownloadSources: () => IpcInvokeReturn;
  syncDownloadSources: () => IpcInvokeReturn;
  getDownloadSourcesCheckBaseline: () => IpcInvokeReturn;
  getDownloadSourcesSinceValue: () => IpcInvokeReturn;

  /* Library */
  toggleAutomaticCloudSync: (
    shop: GameShop,
    objectId: string,
    automaticCloudSync: boolean
  ) => IpcInvokeReturn;
  addGameToLibrary: (
    shop: GameShop,
    objectId: string,
    title: string
  ) => IpcInvokeReturn;
  addCustomGameToLibrary: (
    title: string,
    executablePath: string,
    iconUrl?: string,
    logoImageUrl?: string,
    libraryHeroImageUrl?: string
  ) => IpcInvokeReturn;
  copyCustomGameAsset: (
    sourcePath: string,
    assetType: "icon" | "logo" | "hero"
  ) => IpcInvokeReturn;
  saveTempFile: (fileName: string, fileData: Uint8Array) => IpcInvokeReturn;
  deleteTempFile: (filePath: string) => IpcInvokeReturn;
  cleanupUnusedAssets: () => IpcInvokeReturn;
  updateCustomGame: (params: {
    shop: GameShop;
    objectId: string;
    title: string;
    iconUrl?: string;
    logoImageUrl?: string;
    libraryHeroImageUrl?: string;
    originalIconPath?: string;
    originalLogoPath?: string;
    originalHeroPath?: string;
  }) => IpcInvokeReturn;
  updateGameCustomAssets: (params: {
    shop: GameShop;
    objectId: string;
    title: string;
    customIconUrl?: string | null;
    customLogoImageUrl?: string | null;
    customHeroImageUrl?: string | null;
    customOriginalIconPath?: string | null;
    customOriginalLogoPath?: string | null;
    customOriginalHeroPath?: string | null;
  }) => IpcInvokeReturn;
  createGameShortcut: (
    shop: GameShop,
    objectId: string,
    location: ShortcutLocation
  ) => IpcInvokeReturn;
  updateExecutablePath: (
    shop: GameShop,
    objectId: string,
    executablePath: string | null
  ) => IpcInvokeReturn;
  addGameToFavorites: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  removeGameFromFavorites: (
    shop: GameShop,
    objectId: string
  ) => IpcInvokeReturn;
  clearNewDownloadOptions: (
    shop: GameShop,
    objectId: string
  ) => IpcInvokeReturn;
  toggleGamePin: (
    shop: GameShop,
    objectId: string,
    pinned: boolean
  ) => IpcInvokeReturn;
  updateLaunchOptions: (
    shop: GameShop,
    objectId: string,
    launchOptions: string | null
  ) => IpcInvokeReturn;
  selectGameWinePrefix: (
    shop: GameShop,
    objectId: string,
    winePrefixPath: string | null
  ) => IpcInvokeReturn;
  verifyExecutablePathInUse: (executablePath: string) => IpcInvokeReturn;
  getLibrary: () => IpcInvokeReturn;
  refreshLibraryAssets: () => IpcInvokeReturn;
  openGameInstaller: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  getGameInstallerActionType: (
    shop: GameShop,
    objectId: string
  ) => IpcInvokeReturn;
  openGameInstallerPath: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  openGameExecutablePath: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  getGameSaveFolder: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  openGameSaveFolder: (
    shop: GameShop,
    objectId: string,
    saveFolderPath: string
  ) => IpcInvokeReturn;
  openGame: (
    shop: GameShop,
    objectId: string,
    executablePath: string,
    launchOptions?: string | null
  ) => IpcInvokeReturn;
  closeGame: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  removeGameFromLibrary: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  removeGame: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  deleteGameFolder: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  getGameByObjectId: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  resetGameAchievements: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  changeGamePlayTime: (
    shop: GameShop,
    objectId: string,
    playtime: number
  ) => IpcInvokeReturn;
  extractGameDownload: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  scanInstalledGames: () => IpcInvokeReturn;
  getDefaultWinePrefixSelectionPath: () => IpcInvokeReturn;
  createSteamShortcut: (shop: GameShop, objectId: string) => IpcInvokeReturn;
  onGamesRunning: IpcListener<
    [Array<Pick<GameRunning, "id" | "sessionDurationInMillis">>]
  >;
  onLibraryBatchComplete: IpcListener;
  onExtractionComplete: IpcListener<[GameShop, string]>;
  onExtractionProgress: IpcListener<[GameShop, string, number]>;
  onArchiveDeletionPrompt: IpcListener<[string[]]>;
  deleteArchive: (filePath: string) => IpcInvokeReturn;

  /* Hardware */
  getDiskFreeSpace: (path: string) => IpcInvokeReturn;
  checkFolderWritePermission: (path: string) => IpcInvokeReturn;

  /* Cloud save */
  uploadSaveGame: (
    objectId: string,
    shop: GameShop,
    downloadOptionTitle: string | null
  ) => IpcInvokeReturn;
  downloadGameArtifact: (
    objectId: string,
    shop: GameShop,
    gameArtifactId: string
  ) => IpcInvokeReturn;
  getGameArtifacts: (objectId: string, shop: GameShop) => IpcInvokeReturn;
  getGameBackupPreview: (objectId: string, shop: GameShop) => IpcInvokeReturn;
  selectGameBackupPath: (
    shop: GameShop,
    objectId: string,
    backupPath: string | null
  ) => IpcInvokeReturn;
  onUploadComplete: (
    objectId: string,
    shop: GameShop,
    cb: () => void
  ) => () => void;
  onBackupDownloadProgress: (
    objectId: string,
    shop: GameShop,
    cb: (progress: AxiosProgressEvent) => void
  ) => () => void;
  onBackupDownloadComplete: (
    objectId: string,
    shop: GameShop,
    cb: () => void
  ) => () => void;

  /* Misc */
  ping: () => IpcInvokeReturn;
  getVersion: () => IpcInvokeReturn;
  getDefaultDownloadsPath: () => IpcInvokeReturn;
  isStaging: () => IpcInvokeReturn;
  isPortableVersion: () => IpcInvokeReturn;
  openExternal: (src: string) => IpcInvokeReturn;
  openCheckout: () => IpcInvokeReturn;
  showOpenDialog: (options: OpenDialogOptions) => IpcInvokeReturn;
  showItemInFolder: (path: string) => IpcInvokeReturn;
  krakenApi: KrakenApiBridge;
  canInstallCommonRedist: () => IpcInvokeReturn;
  installCommonRedist: () => IpcInvokeReturn;
  installHydraDeckyPlugin: () => IpcInvokeReturn;
  getHydraDeckyPluginInfo: () => IpcInvokeReturn;
  checkHomebrewFolderExists: () => IpcInvokeReturn;
  platform: string;

  /* Auto update */
  onAutoUpdaterEvent: IpcListener<[AppUpdaterEvent]>;
  onCommonRedistProgress: IpcListener<[{ log: string; complete: boolean }]>;
  onPreflightProgress: IpcListener<[{ status: string; detail: string | null }]>;
  resetCommonRedistPreflight: () => IpcInvokeReturn;
  checkForUpdates: () => IpcInvokeReturn;
  restartAndInstallUpdate: () => IpcInvokeReturn;

  /* Profile */
  getMe: () => IpcInvokeReturn;
  updateProfile: (updateProfile: UpdateProfileRequest) => IpcInvokeReturn;
  processProfileImage: (imagePath: string) => IpcInvokeReturn;
  onSyncFriendRequests: IpcListener<[FriendRequestSync]>;
  onSyncNotificationCount: IpcListener<[NotificationSync]>;
  updateFriendRequest: (
    userId: string,
    action: FriendRequestAction
  ) => IpcInvokeReturn;

  /* User */
  getComparedUnlockedAchievements: (
    objectId: string,
    shop: GameShop,
    userId: string
  ) => IpcInvokeReturn;
  getUnlockedAchievements: (
    objectId: string,
    shop: GameShop
  ) => IpcInvokeReturn;

  /* Auth */
  getAuth: () => IpcInvokeReturn;
  signOut: () => IpcInvokeReturn;
  openAuthWindow: (page: AuthPage) => IpcInvokeReturn;
  getSessionHash: () => IpcInvokeReturn;
  onSignIn: IpcListener;
  onAccountUpdated: IpcListener;
  onSignOut: IpcListener;

  /* Notifications */
  publishNewRepacksNotification: (newRepacksCount: number) => IpcInvokeReturn;
  getLocalNotifications: () => IpcInvokeReturn;
  getLocalNotificationsCount: () => IpcInvokeReturn;
  markLocalNotificationRead: (id: string) => IpcInvokeReturn;
  markAllLocalNotificationsRead: () => IpcInvokeReturn;
  deleteLocalNotification: (id: string) => IpcInvokeReturn;
  clearAllLocalNotifications: () => IpcInvokeReturn;
  onLocalNotificationCreated: IpcListener<[LocalNotification]>;
  onAchievementUnlocked: IpcListener<
    [AchievementCustomNotificationPosition?, AchievementNotificationInfo[]?]
  >;
  onCombinedAchievementsUnlocked: IpcListener<
    [number, number, AchievementCustomNotificationPosition]
  >;
  updateAchievementCustomNotificationWindow: () => IpcInvokeReturn;
  showAchievementTestNotification: () => IpcInvokeReturn;
  copyAchievementSound: (sourcePath: string) => IpcInvokeReturn;
  removeAchievementSound: () => IpcInvokeReturn;

  /* Themes */
  addCustomTheme: (theme: Theme) => IpcInvokeReturn;
  getAllCustomThemes: () => IpcInvokeReturn;
  deleteAllCustomThemes: () => IpcInvokeReturn;
  deleteCustomTheme: (themeId: string) => IpcInvokeReturn;
  updateCustomTheme: (themeId: string, code: string) => IpcInvokeReturn;
  getCustomThemeById: (themeId: string) => IpcInvokeReturn;
  getActiveCustomTheme: () => IpcInvokeReturn;
  toggleCustomTheme: (themeId: string, isActive: boolean) => IpcInvokeReturn;
  copyThemeAchievementSound: (
    themeId: string,
    sourcePath: string
  ) => IpcInvokeReturn;
  removeThemeAchievementSound: (themeId: string) => IpcInvokeReturn;
  getThemeSoundPath: (themeId: string) => IpcInvokeReturn;
  getThemeSoundDataUrl: (themeId: string) => IpcInvokeReturn;
  importThemeSoundFromStore: (
    themeId: string,
    themeName: string,
    storeUrl: string
  ) => IpcInvokeReturn;

  /* Editor */
  openEditorWindow: (themeId: string) => IpcInvokeReturn;
  onCustomThemeUpdated: IpcListener;
  onNewDownloadOptions: IpcListener<[{ gameId: string; count: number }[]]>;
  closeEditorWindow: (themeId?: string) => IpcInvokeReturn;

  /* Game Launcher Window */
  showGameLauncherWindow: () => IpcInvokeReturn;
  closeGameLauncherWindow: () => IpcInvokeReturn;
  openMainWindow: () => IpcInvokeReturn;
  isMainWindowOpen: () => IpcInvokeReturn;

  /* LevelDB Generic CRUD */
  leveldb: LevelDbBridge;
};

declare global {
  interface Window {
    electron: ElectronBridge;
    __grantDevSubscription?: () => Promise<void>;
  }
}

export {};
