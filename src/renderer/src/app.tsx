import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar, BottomPanel, Header, Toast } from "@renderer/components";
import { WorkWonders } from "workwonders-sdk";
import {
  useAppDispatch,
  useAppSelector,
  useDownload,
  useLibrary,
  useToast,
  useUserDetails,
} from "@renderer/hooks";
import { useDownloadOptionsListener } from "@renderer/hooks/use-download-options-listener";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  setUserPreferences,
  toggleDraggingDisabled,
  closeToast,
  setUserDetails,
  setProfileBackground,
  setGameRunning,
  setExtractionProgress,
  clearExtraction,
} from "@renderer/features";
import { useTranslation } from "react-i18next";
import { useSubscription } from "./hooks/use-subscription";
import KrakenCloudModal from "./pages/shared-modals/kraken-cloud/kraken-cloud-modal";
import { WelcomeToKrakenModal } from "./pages/shared-modals/welcome-to-kraken-modal";
import { ReleaseNotesModal } from "./pages/shared-modals/release-notes-modal";
import { EmergencyUpdateModal } from "./pages/shared-modals/emergency-update-modal";
import { ThemeProvider, useTheme } from "./contexts/theme.context";
import { ThemeToggle } from "./components/theme-toggle/theme-toggle";
import { ArchiveDeletionModal } from "./pages/downloads/archive-deletion-error-modal";

import {
  injectCustomCss,
  removeCustomCss,
  getAchievementSoundUrl,
  getAchievementSoundVolume,
} from "./helpers";
import { buildMaterialYouPalette } from "./helpers/material-theme";
import { levelDBService } from "./services/leveldb.service";
import type { UserPreferences } from "@types";
import "./app.scss";
import { average } from "color.js";

export interface AppProps {
  children: React.ReactNode;
}

const MATERIAL_YOU_VARIABLES = [
  "--kraken-primary",
  "--kraken-on-primary",
  "--kraken-primary-container",
  "--kraken-on-primary-container",
  "--kraken-secondary",
  "--kraken-on-secondary",
  "--kraken-secondary-container",
  "--kraken-on-secondary-container",
  "--kraken-tertiary",
  "--kraken-on-tertiary",
  "--kraken-tertiary-container",
  "--kraken-on-tertiary-container",
] as const;

const applyMaterialPalette = (
  root: HTMLElement,
  palette: ReturnType<typeof buildMaterialYouPalette>
) => {
  root.style.setProperty("--kraken-primary", palette.primary);
  root.style.setProperty("--kraken-on-primary", palette.onPrimary);
  root.style.setProperty(
    "--kraken-primary-container",
    palette.primaryContainer
  );
  root.style.setProperty(
    "--kraken-on-primary-container",
    palette.onPrimaryContainer
  );
  root.style.setProperty("--kraken-secondary", palette.secondary);
  root.style.setProperty("--kraken-on-secondary", palette.onSecondary);
  root.style.setProperty(
    "--kraken-secondary-container",
    palette.secondaryContainer
  );
  root.style.setProperty(
    "--kraken-on-secondary-container",
    palette.onSecondaryContainer
  );
  root.style.setProperty("--kraken-tertiary", palette.tertiary);
  root.style.setProperty("--kraken-on-tertiary", palette.onTertiary);
  root.style.setProperty(
    "--kraken-tertiary-container",
    palette.tertiaryContainer
  );
  root.style.setProperty(
    "--kraken-on-tertiary-container",
    palette.onTertiaryContainer
  );
};

const clearMaterialPalette = (root: HTMLElement) => {
  MATERIAL_YOU_VARIABLES.forEach((variable) => {
    root.style.removeProperty(variable);
  });
};

const isMaterialImageSource = (value?: string | null) =>
  Boolean(value) &&
  (value?.startsWith("local:") ||
    value?.startsWith("http") ||
    value?.startsWith("data:"));

function MaterialStyleSync() {
  const { theme } = useTheme();
  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );
  const userDetails = useAppSelector((state) => state.userDetails.userDetails);
  const profileBackground = useAppSelector(
    (state) => state.userDetails.profileBackground
  );

  useEffect(() => {
    const root = document.documentElement;
    const style = userPreferences?.themeStyle ?? "expressive";

    root.setAttribute("data-material-style", style);

    if (style !== "material-you") {
      clearMaterialPalette(root);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const source =
        (userPreferences?.materialYouWallpaperPath
          ? `local:${userPreferences.materialYouWallpaperPath}`
          : undefined) ||
        userDetails?.backgroundImageUrl ||
        profileBackground ||
        "";

      const fallback =
        getComputedStyle(root)
          .getPropertyValue("--md-sys-color-primary")
          .trim() || "#d0bcff";

      let baseColor = fallback;

      if (isMaterialImageSource(source)) {
        try {
          const color = await average(source, { amount: 1, format: "hex" });
          const colorString =
            typeof color === "string" ? color : color.toString();
          if (colorString) baseColor = colorString;
        } catch {
          baseColor = fallback;
        }
      }

      if (cancelled) return;

      const palette = buildMaterialYouPalette(baseColor, theme);
      applyMaterialPalette(root, palette);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    theme,
    userPreferences?.themeStyle,
    userPreferences?.materialYouWallpaperPath,
    userDetails?.backgroundImageUrl,
    profileBackground,
  ]);

  return null;
}

function UiPreferencesSync() {
  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  useEffect(() => {
    const root = document.documentElement;
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldReduce =
      Boolean(userPreferences?.reduceMotion) || prefersReduced;

    if (shouldReduce) {
      root.setAttribute("data-reduce-motion", "true");
    } else {
      root.removeAttribute("data-reduce-motion");
    }

    const rawScale = userPreferences?.uiScale ?? 1;
    const scale = Math.min(Math.max(rawScale, 0.8), 1.25);

    root.style.setProperty("--kraken-ui-scale", String(scale));
    if (document.body) {
      document.body.style.zoom = String(scale);
    }

    return () => {
      if (document.body) {
        document.body.style.zoom = "";
      }
    };
  }, [userPreferences?.reduceMotion, userPreferences?.uiScale]);

  return null;
}

export function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { updateLibrary, library } = useLibrary();

  // Listen for new download options updates
  useDownloadOptionsListener();

  const { t } = useTranslation("app");

  const { clearDownload, setLastPacket } = useDownload();

  const workwondersRef = useRef<WorkWonders | null>(null);

  const {
    hasActiveSubscription,
    fetchUserDetails,
    updateUserDetails,
    clearUserDetails,
  } = useUserDetails();

  const {
    hideKrakenCloudModal,
    isKrakenCloudModalVisible,
    krakenCloudFeature,
  } = useSubscription();

  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const draggingDisabled = useAppSelector(
    (state) => state.window.draggingDisabled
  );

  const toast = useAppSelector((state) => state.toast);

  const { showSuccessToast } = useToast();

  const [showArchiveDeletionModal, setShowArchiveDeletionModal] =
    useState(false);
  const [archivePaths, setArchivePaths] = useState<string[]>([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [emergencyUpdate, setEmergencyUpdate] = useState<{
    version: string;
    downloaded: boolean;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      levelDBService.get("userPreferences", null, "json"),
      updateLibrary(),
    ]).then(([preferences]) => {
      dispatch(setUserPreferences(preferences as UserPreferences | null));
      setPreferencesLoaded(true);
    });
  }, [navigate, location.pathname, dispatch, updateLibrary]);

  useEffect(() => {
    window.electron.getVersion().then((version) => {
      setAppVersion(version);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.onAutoUpdaterEvent((event) => {
      if (event.type === "update-available" && event.info.mandatory) {
        setEmergencyUpdate({ version: event.info.version, downloaded: false });
      }

      if (event.type === "update-downloaded" && event.mandatory) {
        setEmergencyUpdate((current) => ({
          version: event.version ?? current?.version ?? "?",
          downloaded: true,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.onDownloadProgress(
      (downloadProgress) => {
        if (downloadProgress?.progress === 1) {
          clearDownload();
          updateLibrary();
          return;
        }

        setLastPacket(downloadProgress);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [clearDownload, setLastPacket, updateLibrary]);

  useEffect(() => {
    const unsubscribe = window.electron.onHardDelete(() => {
      updateLibrary();
    });

    return () => unsubscribe();
  }, [updateLibrary]);

  const setupWorkWonders = useCallback(
    async (token?: string, locale?: string) => {
      if (workwondersRef.current) return;

      workwondersRef.current = new WorkWonders();

      const possibleLocales = ["en", "pt", "ru"];

      const parsedLocale =
        possibleLocales.find((l) => l === locale?.slice(0, 2)) ?? "en";

      await workwondersRef.current.init({
        organization: "kraken",
        token,
        locale: parsedLocale,
      });

      await workwondersRef.current.changelog.initChangelogWidget();
      workwondersRef.current.changelog.initChangelogWidgetMini();

      if (token) {
        workwondersRef.current.feedback.initFeedbackWidget();
      }
    },
    [workwondersRef]
  );

  const setupExternalResources = useCallback(async () => {
    const cachedUserDetails = window.localStorage.getItem("userDetails");

    if (cachedUserDetails) {
      const { profileBackground, ...userDetails } =
        JSON.parse(cachedUserDetails);

      dispatch(setUserDetails(userDetails));
      dispatch(setProfileBackground(profileBackground));
    }

    const userPreferences = await window.electron.getUserPreferences();
    const userDetails = await fetchUserDetails().catch(() => null);

    if (userDetails) {
      updateUserDetails(userDetails);
    }

    setupWorkWonders(userDetails?.workwondersJwt, userPreferences?.language);

    const externalResourcesBase =
      import.meta.env.RENDERER_VITE_EXTERNAL_RESOURCES_URL ||
      "https://hydralinks.pages.dev";

    if (!document.getElementById("external-resources")) {
      const $script = document.createElement("script");
      $script.id = "external-resources";
      $script.src = `${externalResourcesBase}/bundle.js?t=${Date.now()}`;
      document.head.appendChild($script);
    }
  }, [fetchUserDetails, updateUserDetails, dispatch, setupWorkWonders]);

  useEffect(() => {
    setupExternalResources();
  }, [setupExternalResources]);

  const onSignIn = useCallback(() => {
    fetchUserDetails().then((response) => {
      if (response) {
        updateUserDetails(response);
        showSuccessToast(t("successfully_signed_in"));
      }
    });
  }, [fetchUserDetails, t, showSuccessToast, updateUserDetails]);

  useEffect(() => {
    const unsubscribe = window.electron.onGamesRunning((gamesRunning) => {
      if (gamesRunning.length) {
        const lastGame = gamesRunning[gamesRunning.length - 1];
        const libraryGame = library.find(
          (library) => library.id === lastGame.id
        );

        if (libraryGame) {
          dispatch(
            setGameRunning({
              ...libraryGame,
              sessionDurationInMillis: lastGame.sessionDurationInMillis,
            })
          );
          return;
        }
      }
      dispatch(setGameRunning(null));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch, library]);

  useEffect(() => {
    const listeners = [
      window.electron.onSignIn(onSignIn),
      window.electron.onLibraryBatchComplete(() => {
        updateLibrary();
      }),
      window.electron.onSignOut(() => clearUserDetails()),
      window.electron.onExtractionProgress((shop, objectId, progress) => {
        dispatch(setExtractionProgress({ shop, objectId, progress }));
      }),
      window.electron.onExtractionComplete(() => {
        dispatch(clearExtraction());
        updateLibrary();
      }),
      window.electron.onArchiveDeletionPrompt((paths) => {
        setArchivePaths(paths);
        setShowArchiveDeletionModal(true);
      }),
    ];

    return () => {
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, [onSignIn, updateLibrary, clearUserDetails, dispatch]);

  useEffect(() => {
    const asyncScrollAndNotify = async () => {
      if (contentRef.current) contentRef.current.scrollTop = 0;
      await workwondersRef.current?.notifyUrlChange?.();
    };
    asyncScrollAndNotify();
  }, [location.pathname, location.search]);

  useEffect(() => {
    new MutationObserver(() => {
      const modal = document.body.querySelector("[data-kraken-dialog]");

      dispatch(toggleDraggingDisabled(Boolean(modal)));
    }).observe(document.body, {
      attributes: false,
      childList: true,
    });
  }, [dispatch, draggingDisabled]);

  const loadAndApplyTheme = useCallback(async () => {
    const allThemes = (await levelDBService.values("themes")) as {
      isActive?: boolean;
      code?: string;
    }[];
    const activeTheme = allThemes.find((theme) => theme.isActive);
    if (activeTheme?.code) {
      injectCustomCss(activeTheme.code);
    } else {
      removeCustomCss();
    }
  }, []);

  useEffect(() => {
    loadAndApplyTheme();
  }, [loadAndApplyTheme]);

  useEffect(() => {
    const unsubscribe = window.electron.onCustomThemeUpdated(() => {
      loadAndApplyTheme();
    });

    return () => unsubscribe();
  }, [loadAndApplyTheme]);

  const playAudio = useCallback(async () => {
    const soundUrl = await getAchievementSoundUrl();
    const volume = await getAchievementSoundVolume();
    const audio = new Audio(soundUrl);
    audio.volume = volume;
    audio.play();
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.onAchievementUnlocked(() => {
      playAudio();
    });

    return () => {
      unsubscribe();
    };
  }, [playAudio]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    if (userPreferences?.welcomeTutorialSeen === true) return;
    setShowWelcomeModal(true);
  }, [preferencesLoaded, userPreferences?.welcomeTutorialSeen]);

  useEffect(() => {
    if (!preferencesLoaded || !appVersion) return;
    if (userPreferences?.welcomeTutorialSeen !== true) return;
    if (userPreferences?.lastSeenVersion === appVersion) return;
    setShowReleaseNotes(true);
  }, [
    preferencesLoaded,
    appVersion,
    userPreferences?.lastSeenVersion,
    userPreferences?.welcomeTutorialSeen,
  ]);

  const handleWelcomeClose = useCallback(async () => {
    setShowWelcomeModal(false);
    try {
      await window.electron.updateUserPreferences({
        welcomeTutorialSeen: true,
      });
      const preferences = (await levelDBService.get(
        "userPreferences",
        null,
        "json"
      )) as UserPreferences | null;
      dispatch(setUserPreferences(preferences));
    } catch {
      // ignore
    }
  }, [dispatch]);

  const handleReleaseNotesClose = useCallback(async () => {
    setShowReleaseNotes(false);
    if (!appVersion) return;
    try {
      await window.electron.updateUserPreferences({
        lastSeenVersion: appVersion,
      });
      const preferences = (await levelDBService.get(
        "userPreferences",
        null,
        "json"
      )) as UserPreferences | null;
      dispatch(setUserPreferences(preferences));
    } catch {
      // ignore
    }
  }, [appVersion, dispatch]);

  const handleEmergencyInstall = useCallback(() => {
    window.electron.restartAndInstallUpdate();
  }, []);

  const handleToastClose = useCallback(() => {
    dispatch(closeToast());
  }, [dispatch]);

  return (
    <ThemeProvider>
      <>
        <MaterialStyleSync />
        <UiPreferencesSync />
        {window.electron.platform === "win32" && (
          <div className="title-bar">
            <h4>
              Kraken
              {hasActiveSubscription && (
                <span className="title-bar__cloud-text"> Cloud</span>
              )}
            </h4>
            <div style={{ marginLeft: "auto" }}>
              <ThemeToggle />
            </div>
          </div>
        )}

        <Toast
          visible={toast.visible}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={handleToastClose}
          duration={toast.duration}
        />

        <KrakenCloudModal
          visible={isKrakenCloudModalVisible}
          onClose={hideKrakenCloudModal}
          feature={krakenCloudFeature}
        />

        <ArchiveDeletionModal
          visible={showArchiveDeletionModal}
          archivePaths={archivePaths}
          onClose={() => setShowArchiveDeletionModal(false)}
        />

        <WelcomeToKrakenModal
          visible={showWelcomeModal}
          onClose={handleWelcomeClose}
        />

        <ReleaseNotesModal
          visible={showReleaseNotes && !showWelcomeModal}
          version={appVersion ?? "1.0.0"}
          onClose={handleReleaseNotesClose}
        />

        <EmergencyUpdateModal
          visible={Boolean(emergencyUpdate)}
          version={emergencyUpdate?.version}
          downloaded={Boolean(emergencyUpdate?.downloaded)}
          onInstall={handleEmergencyInstall}
        />

        <main>
          <Sidebar />

          <article className="container">
            <Header />

            <section
              ref={contentRef}
              id="scrollableDiv"
              className="container__content"
            >
              <Outlet />
            </section>
          </article>
        </main>

        <BottomPanel />
      </>
    </ThemeProvider>
  );
}
