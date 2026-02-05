import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  RocketIcon,
  StarFillIcon,
  FlameIcon,
  TrophyIcon,
  PinIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@primer/octicons-react";
import { userProfileContext } from "@renderer/context";
import "./kraken-badges-box.scss";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  icon: typeof RocketIcon;
  unlocked: boolean;
};

export function KrakenBadgesBox() {
  const { t } = useTranslation("user_profile");
  const { userStats, libraryGames, pinnedGames } =
    useContext(userProfileContext);

  const totalGames = userStats?.libraryCount ?? libraryGames.length;
  const totalPlaytimeHours = Math.floor(
    (userStats?.totalPlayTimeInSeconds?.value ?? 0) / 3600
  );
  const totalAchievements = userStats?.unlockedAchievementSum ?? 0;
  const pinnedCount = pinnedGames.length;

  const lastPlayedDate = useMemo(() => {
    const dates = [...libraryGames, ...pinnedGames]
      .map((game) => (game.lastTimePlayed ? new Date(game.lastTimePlayed) : null))
      .filter((date): date is Date => Boolean(date));

    if (!dates.length) return null;
    return dates.sort((a, b) => b.getTime() - a.getTime())[0];
  }, [libraryGames, pinnedGames]);

  const playedRecently =
    lastPlayedDate !== null &&
    Date.now() - lastPlayedDate.getTime() <= 7 * MS_PER_DAY;

  const badges: BadgeDefinition[] = [
    {
      id: "first-catch",
      title: t("kraken_badge_first_catch", { defaultValue: "First Catch" }),
      description: t("kraken_badge_first_catch_desc", {
        defaultValue: "Add your first game to the library.",
      }),
      icon: RocketIcon,
      unlocked: totalGames >= 1,
    },
    {
      id: "collector",
      title: t("kraken_badge_collector", { defaultValue: "Collector" }),
      description: t("kraken_badge_collector_desc", {
        defaultValue: "Reach 25 games in your library.",
      }),
      icon: StarFillIcon,
      unlocked: totalGames >= 25,
    },
    {
      id: "archivist",
      title: t("kraken_badge_archivist", { defaultValue: "Archivist" }),
      description: t("kraken_badge_archivist_desc", {
        defaultValue: "Reach 100 games in your library.",
      }),
      icon: ShieldCheckIcon,
      unlocked: totalGames >= 100,
    },
    {
      id: "marathoner",
      title: t("kraken_badge_marathoner", { defaultValue: "Marathoner" }),
      description: t("kraken_badge_marathoner_desc", {
        defaultValue: "Log 50 hours of playtime.",
      }),
      icon: FlameIcon,
      unlocked: totalPlaytimeHours >= 50,
    },
    {
      id: "centurion",
      title: t("kraken_badge_centurion", { defaultValue: "Centurion" }),
      description: t("kraken_badge_centurion_desc", {
        defaultValue: "Log 100 hours of playtime.",
      }),
      icon: TrophyIcon,
      unlocked: totalPlaytimeHours >= 100,
    },
    {
      id: "pinned-pro",
      title: t("kraken_badge_pinned_pro", { defaultValue: "Pinned Pro" }),
      description: t("kraken_badge_pinned_pro_desc", {
        defaultValue: "Pin 3 games to your profile.",
      }),
      icon: PinIcon,
      unlocked: pinnedCount >= 3,
    },
    {
      id: "on-the-radar",
      title: t("kraken_badge_on_radar", { defaultValue: "On the Radar" }),
      description: t("kraken_badge_on_radar_desc", {
        defaultValue: "Play something within the last 7 days.",
      }),
      icon: ClockIcon,
      unlocked: playedRecently,
    },
    {
      id: "achievement-hunter",
      title: t("kraken_badge_achievement_hunter", {
        defaultValue: "Achievement Hunter",
      }),
      description: t("kraken_badge_achievement_hunter_desc", {
        defaultValue: "Unlock 50 achievements.",
      }),
      icon: TrophyIcon,
      unlocked: totalAchievements >= 50,
    },
  ];

  if (!badges.length) return null;

  return (
    <div className="kraken-badges">
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            className={`kraken-badges__item ${
              badge.unlocked ? "" : "kraken-badges__item--locked"
            }`}
          >
            <div className="kraken-badges__item-icon">
              <Icon size={20} />
            </div>
            <div className="kraken-badges__item-content">
              <h3 className="kraken-badges__item-title">{badge.title}</h3>
              <p className="kraken-badges__item-description">
                {badge.description}
              </p>
            </div>
            <span className="kraken-badges__item-state">
              {badge.unlocked
                ? t("kraken_badge_unlocked", { defaultValue: "Unlocked" })
                : t("kraken_badge_locked", { defaultValue: "Locked" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
