import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  AchievementCustomNotificationPosition,
  AchievementNotificationInfo,
} from "@types";
import {
  injectCustomCss,
  removeCustomCss,
  getAchievementSoundUrl,
  getAchievementSoundVolume,
} from "@renderer/helpers";
import { AchievementNotificationItem } from "@renderer/components/achievements/notification/achievement-notification";
import { levelDBService } from "@renderer/services/leveldb.service";
import app from "../../../app.scss?inline";
import styles from "../../../components/achievements/notification/achievement-notification.scss?inline";
import root from "react-shadow";

const NOTIFICATION_TIMEOUT = 4000;
const CLOSE_DURATION = 260;

export function AchievementNotification() {
  const { t } = useTranslation("achievement");

  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] =
    useState<AchievementCustomNotificationPosition>("top-left");

  const [achievements, setAchievements] = useState<
    AchievementNotificationInfo[]
  >([]);
  const [currentAchievement, setCurrentAchievement] =
    useState<AchievementNotificationInfo | null>(null);

  const closeTimeout = useRef<number | undefined>(undefined);
  const hideTimeout = useRef<number | undefined>(undefined);

  const [shadowRootRef, setShadowRootRef] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.notificationWindow = "achievement";
    body.dataset.notificationWindow = "achievement";

    return () => {
      delete root.dataset.notificationWindow;
      delete body.dataset.notificationWindow;
    };
  }, []);

  const playAudio = useCallback(async () => {
    const soundUrl = await getAchievementSoundUrl();
    const volume = await getAchievementSoundVolume();
    const audio = new Audio(soundUrl);
    audio.volume = volume;
    audio.play();
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.onCombinedAchievementsUnlocked(
      (gameCount, achievementCount, position) => {
        if (gameCount === 0 || achievementCount === 0) return;

        setPosition(position);

        setAchievements([
          {
            title: t("new_achievements_unlocked", {
              gameCount,
              achievementCount,
            }),
            isHidden: false,
            isRare: false,
            isPlatinum: false,
            iconUrl: "https://cdn.losbroxas.org/favicon.svg",
          },
        ]);

        playAudio();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [t, playAudio]);

  useEffect(() => {
    const unsubscribe = window.electron.onAchievementUnlocked(
      (position, achievements) => {
        if (!achievements?.length) return;
        if (position) {
          setPosition(position);
        }

        setAchievements((ach) => ach.concat(achievements));

        playAudio();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [playAudio]);

  const clearTimers = useCallback(() => {
    if (closeTimeout.current) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = undefined;
    }
    if (hideTimeout.current) {
      window.clearTimeout(hideTimeout.current);
      hideTimeout.current = undefined;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimers();
    if (!currentAchievement) return;

    closeTimeout.current = window.setTimeout(() => {
      setIsClosing(true);
      hideTimeout.current = window.setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        setAchievements((ach) => ach.slice(1));
        setCurrentAchievement(null);
      }, CLOSE_DURATION);
    }, NOTIFICATION_TIMEOUT);
  }, [clearTimers, currentAchievement]);

  useEffect(() => {
    if (!currentAchievement && achievements.length) {
      setCurrentAchievement(achievements[0]);
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [achievements, currentAchievement]);

  useEffect(() => {
    if (currentAchievement) {
      setIsVisible(true);
      setIsClosing(false);
      scheduleClose();
    } else {
      clearTimers();
    }
  }, [clearTimers, currentAchievement, scheduleClose]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const loadAndApplyTheme = useCallback(async () => {
    if (!shadowRootRef) return;
    const allThemes = (await levelDBService.values("themes")) as {
      isActive?: boolean;
      code?: string;
    }[];
    const activeTheme = allThemes.find((theme) => theme.isActive);
    if (activeTheme?.code) {
      injectCustomCss(activeTheme.code, shadowRootRef);
    } else {
      removeCustomCss(shadowRootRef);
    }
  }, [shadowRootRef]);

  useEffect(() => {
    loadAndApplyTheme();
  }, [loadAndApplyTheme]);

  useEffect(() => {
    const unsubscribe = window.electron.onCustomThemeUpdated(() => {
      loadAndApplyTheme();
    });

    return () => unsubscribe();
  }, [loadAndApplyTheme]);

  return (
    <root.div>
      <style type="text/css">
        {app} {styles}
      </style>
      <section ref={setShadowRootRef}>
        {isVisible && currentAchievement && (
          <AchievementNotificationItem
            achievement={currentAchievement}
            isClosing={isClosing}
            position={position}
          />
        )}
      </section>
    </root.div>
  );
}
