import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { UserGame } from "@types";
import { UserLibraryGameCard } from "./user-library-game-card";
import {
  SYSTEM_CATEGORY_IDS,
  type SystemCategoryId,
  useProfileCollections,
  buildProfileGameKey,
} from "@renderer/hooks";
import "./profile-content.scss";

interface ProfileCollectionsProps {
  userId?: string;
  isMe: boolean;
  pinnedGames: UserGame[];
  libraryGames: UserGame[];
  sortBy?: string;
  statIndex: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SYSTEM_CATEGORY_LABELS: Record<SystemCategoryId, string> = {
  favorites: "favorites",
  playing: "profile_category_playing",
  want_to_play: "profile_category_want_to_play",
  dropped: "profile_category_dropped",
};

export function ProfileCollections({
  userId,
  isMe,
  pinnedGames,
  libraryGames,
  sortBy,
  statIndex,
  onMouseEnter,
  onMouseLeave,
}: Readonly<ProfileCollectionsProps>) {
  const { t } = useTranslation("user_profile");
  const { state } = useProfileCollections(userId);

  const allGames = useMemo(() => {
    const map = new Map<string, UserGame>();
    [...pinnedGames, ...libraryGames].forEach((game) => {
      map.set(buildProfileGameKey(game.shop, game.objectId), game);
    });
    return map;
  }, [libraryGames, pinnedGames]);

  const favoritesGames = useMemo(
    () => Array.from(allGames.values()).filter((game) => game.favorite),
    [allGames]
  );

  const assignmentsByCategory = useMemo(() => {
    const map: Record<string, UserGame[]> = {};
    Object.entries(state.assignments).forEach(([gameKey, categories]) => {
      const game = allGames.get(gameKey);
      if (!game) return;
      categories.forEach((categoryId) => {
        if (!map[categoryId]) map[categoryId] = [];
        map[categoryId].push(game);
      });
    });
    return map;
  }, [allGames, state.assignments]);

  const categories = useMemo(() => {
    const systemCategories = SYSTEM_CATEGORY_IDS.map((categoryId) => {
      const games =
        categoryId === "favorites"
          ? favoritesGames
          : assignmentsByCategory[categoryId] ?? [];
      const visible = state.systemVisibility[categoryId] !== false;
      return {
        id: categoryId,
        label: t(SYSTEM_CATEGORY_LABELS[categoryId], {
          defaultValue:
            categoryId === "favorites"
              ? "Favorites"
              : categoryId === "playing"
                ? "Playing"
                : categoryId === "want_to_play"
                  ? "Want to play"
                  : "Dropped",
        }),
        games,
        visible,
      };
    });

    const customCategories = state.customCategories.map((category) => ({
      id: category.id,
      label: category.label,
      games: assignmentsByCategory[category.id] ?? [],
      visible: category.visible !== false,
      custom: true,
    }));

    return [...systemCategories, ...customCategories];
  }, [
    assignmentsByCategory,
    favoritesGames,
    state.customCategories,
    state.systemVisibility,
    t,
  ]);

  const visibleCategories = categories.filter(
    (category) => category.visible && (isMe || category.games.length > 0)
  );

  if (!isMe && visibleCategories.length === 0) return null;

  return (
    <div className="profile-content__collections">
      <div className="profile-content__section-header">
        <div className="profile-content__section-title-group">
          <h2>
            {t("profile_collections_title", {
              defaultValue: "Collections",
            })}
          </h2>
        </div>
      </div>

      {visibleCategories.length === 0 && (
        <p className="profile-content__collections-empty">
          {t("profile_collections_empty", {
            defaultValue: "No games here yet.",
          })}
          {isMe && (
            <span>
              {" "}
              {t("profile_collections_hint", {
                defaultValue: "Right-click a game to add it to a list.",
              })}
            </span>
          )}
        </p>
      )}

      {visibleCategories.map((category) => (
        <div key={category.id} className="profile-content__collection">
          <div className="profile-content__section-header">
            <div className="profile-content__section-title-group">
              <h3>{category.label}</h3>
              <span className="profile-content__section-badge">
                {category.games.length}
              </span>
            </div>
          </div>

          {category.games.length > 0 ? (
            <ul className="profile-content__games-grid">
              {category.games.slice(0, 6).map((game) => (
                <li
                  key={`${category.id}-${game.objectId}`}
                  style={{ listStyle: "none" }}
                >
                  <UserLibraryGameCard
                    game={game}
                    statIndex={statIndex}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    sortBy={sortBy}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-content__collections-empty">
              {t("profile_collections_empty", {
                defaultValue: "No games here yet.",
              })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
