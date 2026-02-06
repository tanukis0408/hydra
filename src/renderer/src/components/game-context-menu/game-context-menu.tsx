import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  PlayIcon,
  DownloadIcon,
  HeartIcon,
  HeartFillIcon,
  GearIcon,
  PencilIcon,
  FileDirectoryIcon,
  LinkIcon,
  TrashIcon,
  XIcon,
  TagIcon,
  DotIcon,
  DotFillIcon,
} from "@primer/octicons-react";
import SteamLogo from "@renderer/assets/steam-logo.svg?react";
import { LibraryGame } from "@types";
import {
  ContextMenu,
  ContextMenuItemData,
  ContextMenuProps,
  ConfirmationModal,
  useGameActions,
} from "..";
import { useProfileCollections, buildProfileGameKey } from "@renderer/hooks";
import { useUserDetails } from "@renderer/hooks";

interface GameContextMenuProps extends Omit<ContextMenuProps, "items"> {
  game: LibraryGame;
}

export function GameContextMenu({
  game,
  visible,
  position,
  onClose,
}: GameContextMenuProps) {
  const { t } = useTranslation("game_details");
  const { t: tProfile } = useTranslation("user_profile");
  const [showConfirmRemoveLibrary, setShowConfirmRemoveLibrary] =
    useState(false);
  const [showConfirmRemoveFiles, setShowConfirmRemoveFiles] = useState(false);
  const { userDetails } = useUserDetails();
  const { state, toggleGameCategory } = useProfileCollections(userDetails?.id);
  const gameKey = buildProfileGameKey(game.shop, game.objectId);
  const activeCategories = new Set(state.assignments[gameKey] ?? []);
  const canManageCollections = Boolean(userDetails?.id);
  const {
    canPlay,
    isDeleting,
    isGameDownloading,
    isGameRunning,
    hasRepacks,
    shouldShowCreateStartMenuShortcut,
    handlePlayGame,
    handleCloseGame,
    handleToggleFavorite,
    handleCreateShortcut,
    handleCreateSteamShortcut,
    handleOpenFolder,
    handleOpenDownloadOptions,
    handleOpenDownloadLocation,
    handleRemoveFromLibrary,
    handleRemoveFiles,
    handleOpenGameOptions,
  } = useGameActions(game);

  const collectionItems: ContextMenuItemData[] = [
    {
      id: "collection-playing",
      label: tProfile("profile_category_playing", {
        defaultValue: "Playing",
      }),
      icon: activeCategories.has("playing") ? (
        <DotFillIcon size={16} />
      ) : (
        <DotIcon size={16} />
      ),
      onClick: () => toggleGameCategory(gameKey, "playing"),
      disabled: isDeleting || !canManageCollections,
    },
    {
      id: "collection-want-to-play",
      label: tProfile("profile_category_want_to_play", {
        defaultValue: "Want to play",
      }),
      icon: activeCategories.has("want_to_play") ? (
        <DotFillIcon size={16} />
      ) : (
        <DotIcon size={16} />
      ),
      onClick: () => toggleGameCategory(gameKey, "want_to_play"),
      disabled: isDeleting || !canManageCollections,
    },
    {
      id: "collection-dropped",
      label: tProfile("profile_category_dropped", {
        defaultValue: "Dropped",
      }),
      icon: activeCategories.has("dropped") ? (
        <DotFillIcon size={16} />
      ) : (
        <DotIcon size={16} />
      ),
      onClick: () => toggleGameCategory(gameKey, "dropped"),
      disabled: isDeleting || !canManageCollections,
    },
    ...state.customCategories.map((category) => ({
      id: `collection-${category.id}`,
      label: category.label,
      icon: activeCategories.has(category.id) ? (
        <DotFillIcon size={16} />
      ) : (
        <DotIcon size={16} />
      ),
      onClick: () => toggleGameCategory(gameKey, category.id),
      disabled: isDeleting || !canManageCollections,
    })),
  ];

  const items: ContextMenuItemData[] = [
    {
      id: "play",
      label: isGameRunning ? t("close") : canPlay ? t("play") : t("download"),
      icon: isGameRunning ? (
        <XIcon size={16} />
      ) : canPlay ? (
        <PlayIcon size={16} />
      ) : (
        <DownloadIcon size={16} />
      ),
      onClick: () => {
        if (isGameRunning) {
          void handleCloseGame();
        } else if (canPlay) {
          void handlePlayGame();
        } else {
          handleOpenDownloadOptions();
        }
      },
      disabled: isDeleting,
    },
    {
      id: "favorite",
      label: game.favorite ? t("remove_from_favorites") : t("add_to_favorites"),
      icon: game.favorite ? (
        <HeartFillIcon size={16} />
      ) : (
        <HeartIcon size={16} />
      ),
      onClick: () => {
        void handleToggleFavorite();
      },
      disabled: isDeleting,
    },
    {
      id: "collections",
      label: tProfile("profile_collections_title", {
        defaultValue: "Collections",
      }),
      icon: <TagIcon size={16} />,
      submenu: collectionItems,
      disabled: isDeleting || !canManageCollections,
    },
    ...(game.executablePath
      ? [
          {
            id: "shortcuts",
            label: t("create_shortcut_simple"),
            icon: <LinkIcon size={16} />,
            disabled: isDeleting,
            submenu: [
              {
                id: "desktop-shortcut",
                label: t("create_shortcut"),
                icon: <LinkIcon size={16} />,
                onClick: () => handleCreateShortcut("desktop"),
                disabled: isDeleting,
              },
              {
                id: "steam-shortcut",
                label: t("create_steam_shortcut"),
                icon: <SteamLogo style={{ width: 16, height: 16 }} />,
                onClick: handleCreateSteamShortcut,
                disabled: isDeleting,
              },
              ...(shouldShowCreateStartMenuShortcut
                ? [
                    {
                      id: "start-menu-shortcut",
                      label: t("create_start_menu_shortcut"),
                      icon: <LinkIcon size={16} />,
                      onClick: () => handleCreateShortcut("start_menu"),
                      disabled: isDeleting,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),

    {
      id: "manage",
      label: t("options"),
      icon: <GearIcon size={16} />,
      disabled: isDeleting,
      submenu: [
        ...(game.executablePath
          ? [
              {
                id: "open-folder",
                label: t("open_folder"),
                icon: <FileDirectoryIcon size={16} />,
                onClick: handleOpenFolder,
                disabled: isDeleting,
              },
            ]
          : []),
        ...(game.executablePath
          ? [
              {
                id: "download-options",
                label: t("open_download_options"),
                icon: <PlayIcon size={16} />,
                onClick: handleOpenDownloadOptions,
                disabled: isDeleting || isGameDownloading || !hasRepacks,
              },
            ]
          : []),
        ...(game.download?.downloadPath
          ? [
              {
                id: "download-location",
                label: t("open_download_location"),
                icon: <FileDirectoryIcon size={16} />,
                onClick: handleOpenDownloadLocation,
                disabled: isDeleting,
              },
            ]
          : []),

        {
          id: "remove-library",
          label: t("remove_from_library"),
          icon: <XIcon size={16} />,
          onClick: () => setShowConfirmRemoveLibrary(true),
          disabled: isDeleting,
          danger: true,
        },
        ...(game.download?.downloadPath
          ? [
              {
                id: "remove-files",
                label: t("remove_files"),
                icon: <TrashIcon size={16} />,
                onClick: () => setShowConfirmRemoveFiles(true),
                disabled: isDeleting || isGameDownloading,
                danger: true,
              },
            ]
          : []),
      ],
    },
    {
      id: "properties",
      label: t("properties"),
      separator: true,
      icon: <PencilIcon size={16} />,
      onClick: () => handleOpenGameOptions(),
      disabled: isDeleting,
    },
  ];

  return (
    <>
      <ContextMenu
        items={items}
        visible={visible}
        position={position}
        onClose={onClose}
        className={
          !game.executablePath ? "context-menu--game-not-installed" : undefined
        }
      />

      <ConfirmationModal
        visible={showConfirmRemoveLibrary}
        title={t("remove_from_library_title")}
        descriptionText={t("remove_from_library_description", {
          game: game.title,
        })}
        onClose={() => {
          setShowConfirmRemoveLibrary(false);
          onClose();
        }}
        onConfirm={async () => {
          setShowConfirmRemoveLibrary(false);
          onClose();
          await handleRemoveFromLibrary();
        }}
        cancelButtonLabel={t("cancel")}
        confirmButtonLabel={t("remove")}
      />

      <ConfirmationModal
        visible={showConfirmRemoveFiles}
        title={t("remove_files")}
        descriptionText={t("delete_modal_description", { ns: "downloads" })}
        onClose={() => {
          setShowConfirmRemoveFiles(false);
          onClose();
        }}
        onConfirm={async () => {
          setShowConfirmRemoveFiles(false);
          onClose();
          await handleRemoveFiles();
        }}
        cancelButtonLabel={t("cancel")}
        confirmButtonLabel={t("remove")}
      />
    </>
  );
}
