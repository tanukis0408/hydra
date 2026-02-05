import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LibraryGame } from "@types";
import {
  ClockIcon,
  StarFillIcon,
  PinIcon,
  RocketIcon,
  HistoryIcon,
  CheckCircleFillIcon,
} from "@primer/octicons-react";
import "./library-stats.scss";

const RECENT_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const formatPlaytime = (milliseconds: number) => {
  const totalMinutes = Math.round(milliseconds / (1000 * 60));
  if (totalMinutes <= 0) return "0m";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

type LibraryStatsProps = {
  library: LibraryGame[];
};

export function LibraryStats({ library }: Readonly<LibraryStatsProps>) {
  const { t } = useTranslation("library");

  const stats = useMemo(() => {
    const totalGames = library.length;
    const favorites = library.filter((game) => game.favorite).length;
    const pinned = library.filter((game) => game.isPinned).length;
    const readyToPlay = library.filter(
      (game) => game.executablePath || game.download?.status === "complete"
    ).length;
    const recentlyPlayed = library.filter((game) => {
      if (!game.lastTimePlayed) return false;
      const lastPlayedTime = new Date(game.lastTimePlayed).getTime();
      return Date.now() - lastPlayedTime <= RECENT_DAYS * MS_PER_DAY;
    }).length;
    const totalPlaytimeMs = library.reduce(
      (total, game) => total + (game.playTimeInMilliseconds ?? 0),
      0
    );
    const mostPlayed = library
      .filter((game) => game.playTimeInMilliseconds)
      .sort(
        (a, b) =>
          (b.playTimeInMilliseconds ?? 0) -
          (a.playTimeInMilliseconds ?? 0)
      )[0];

    return {
      totalGames,
      favorites,
      pinned,
      readyToPlay,
      recentlyPlayed,
      totalPlaytimeMs,
      mostPlayed,
    };
  }, [library]);

  const statCards = [
    {
      id: "total",
      label: t("library_stats_total", { defaultValue: "Total games" }),
      value: stats.totalGames,
      icon: RocketIcon,
    },
    {
      id: "favorites",
      label: t("library_stats_favorites", { defaultValue: "Favorites" }),
      value: stats.favorites,
      icon: StarFillIcon,
    },
    {
      id: "pinned",
      label: t("library_stats_pinned", { defaultValue: "Pinned" }),
      value: stats.pinned,
      icon: PinIcon,
    },
    {
      id: "ready",
      label: t("library_stats_ready", { defaultValue: "Ready to play" }),
      value: stats.readyToPlay,
      icon: CheckCircleFillIcon,
    },
    {
      id: "recent",
      label: t("library_stats_recent", { defaultValue: "Played recently" }),
      value: stats.recentlyPlayed,
      icon: HistoryIcon,
    },
    {
      id: "playtime",
      label: t("library_stats_playtime", { defaultValue: "Total playtime" }),
      value: formatPlaytime(stats.totalPlaytimeMs),
      icon: ClockIcon,
      subtext: stats.mostPlayed
        ? t("library_stats_top_game", {
            defaultValue: "Top: {{title}}",
            title: stats.mostPlayed.title,
          })
        : t("library_stats_top_game", {
            defaultValue: "Top: —",
          }),
    },
  ];

  return (
    <div className="library-stats">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className="library-stats__card">
            <div className="library-stats__card-icon">
              <Icon size={18} />
            </div>
            <div className="library-stats__card-content">
              <span className="library-stats__card-label">{card.label}</span>
              <span className="library-stats__card-value">{card.value}</span>
              {card.subtext && (
                <span className="library-stats__card-subtext">
                  {card.subtext}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
