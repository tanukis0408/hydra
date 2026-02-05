import { useTranslation } from "react-i18next";

import { Button, TextField } from "@renderer/components";
import { useAppSelector, useDownload, useLibrary } from "@renderer/hooks";

import { useEffect, useMemo, useRef, useState } from "react";
import { BinaryNotFoundModal } from "../shared-modals/binary-not-found-modal";
import "./downloads.scss";
import { DeleteGameModal } from "./delete-game-modal";
import { DownloadGroup } from "./download-group";
import type { GameShop, LibraryGame, SeedingStatus } from "@types";
import { orderBy } from "lodash-es";
import { ArrowDownIcon, XCircleIcon } from "@primer/octicons-react";
import { Downloader } from "@shared";

export default function Downloads() {
  const { library, updateLibrary } = useLibrary();
  const extraction = useAppSelector((state) => state.download.extraction);

  const { t } = useTranslation("downloads");

  const gameToBeDeleted = useRef<[GameShop, string] | null>(null);

  const [showBinaryNotFoundModal, setShowBinaryNotFoundModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(
    window.localStorage.getItem("downloadsHideCompleted") === "true"
  );
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);

  const {
    removeGameInstaller,
    pauseSeeding,
    pauseDownload,
    resumeDownload,
    lastPacket,
  } = useDownload();

  const handleDeleteGame = async () => {
    if (gameToBeDeleted.current) {
      const [shop, objectId] = gameToBeDeleted.current;

      await pauseSeeding(shop, objectId);
      await removeGameInstaller(shop, objectId);
    }
  };

  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const [seedingStatus, setSeedingStatus] = useState<SeedingStatus[]>([]);

  useEffect(() => {
    window.electron.onSeedingStatus((value) => setSeedingStatus(value));

    const unsubscribeExtraction = window.electron.onExtractionComplete(() => {
      updateLibrary();
    });

    return () => {
      unsubscribeExtraction();
    };
  }, [updateLibrary]);

  useEffect(() => {
    window.localStorage.setItem(
      "downloadsHideCompleted",
      String(hideCompleted)
    );
  }, [hideCompleted]);

  const handleOpenGameInstaller = (shop: GameShop, objectId: string) =>
    window.electron.openGameInstaller(shop, objectId).then((isBinaryInPath) => {
      if (!isBinaryInPath) setShowBinaryNotFoundModal(true);
      updateLibrary();
    });

  const handleOpenDeleteGameModal = (shop: GameShop, objectId: string) => {
    gameToBeDeleted.current = [shop, objectId];
    setShowDeleteModal(true);
  };

  const filteredLibrary = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return library;
    return library.filter((game) => game.title.toLowerCase().includes(query));
  }, [library, filterQuery]);

  const libraryGroup: Record<string, LibraryGame[]> = useMemo(() => {
    const initialValue: Record<string, LibraryGame[]> = {
      downloading: [],
      queued: [],
      complete: [],
    };

    const result = orderBy(
      filteredLibrary,
      (game) => game.download?.timestamp,
      "desc"
    ).reduce((prev, next) => {
      /* Game has been manually added to the library */
      if (!next.download) return prev;

      /* Is downloading or extracting */
      const isExtracting =
        next.download.extracting || extraction?.visibleId === next.id;
      if (lastPacket?.gameId === next.id || isExtracting)
        return { ...prev, downloading: [...prev.downloading, next] };

      /* Is either queued or paused */
      if (next.download.queued || next.download?.status === "paused")
        return { ...prev, queued: [...prev.queued, next] };

      return { ...prev, complete: [...prev.complete, next] };
    }, initialValue);

    const queued = orderBy(result.queued, (game) => game.download?.timestamp, [
      "asc",
    ]);

    const complete = orderBy(result.complete, (game) =>
      game.download?.progress === 1 ? 0 : 1
    );

    return {
      ...result,
      queued,
      complete,
    };
  }, [filteredLibrary, lastPacket?.gameId, extraction?.visibleId]);

  const queuedGameIds = useMemo(
    () => libraryGroup.queued.map((game) => game.id),
    [libraryGroup.queued]
  );

  const activeDownloads = useMemo(
    () =>
      libraryGroup.downloading.filter((game) => {
        if (!game.download) return false;
        return extraction?.visibleId !== game.id;
      }),
    [libraryGroup.downloading, extraction?.visibleId]
  );

  const resumableDownloads = useMemo(
    () =>
      libraryGroup.queued.filter((game) => {
        if (!game.download) return false;
        if (
          game.download.downloader === Downloader.RealDebrid &&
          !userPreferences?.realDebridApiToken
        )
          return false;
        if (
          game.download.downloader === Downloader.TorBox &&
          !userPreferences?.torBoxApiToken
        )
          return false;
        return true;
      }),
    [
      libraryGroup.queued,
      userPreferences?.realDebridApiToken,
      userPreferences?.torBoxApiToken,
    ]
  );

  const handlePauseAll = async () => {
    if (!activeDownloads.length) return;
    setIsBulkActionRunning(true);
    try {
      for (const game of activeDownloads) {
        await pauseDownload(game.shop, game.objectId);
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleResumeAll = async () => {
    if (!resumableDownloads.length) return;
    setIsBulkActionRunning(true);
    try {
      for (const game of resumableDownloads) {
        await resumeDownload(game.shop, game.objectId);
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const downloadGroups = useMemo(
    () => [
      {
        id: "downloading",
        title: t("download_in_progress"),
        library: libraryGroup.downloading,
        queuedGameIds: [] as string[],
      },
      {
        id: "queued",
        title: t("queued_downloads"),
        library: libraryGroup.queued,
        queuedGameIds,
      },
      {
        id: "completed",
        title: t("downloads_completed"),
        library: libraryGroup.complete,
        queuedGameIds: [] as string[],
      },
    ],
    [
      libraryGroup.downloading,
      libraryGroup.queued,
      libraryGroup.complete,
      queuedGameIds,
      t,
    ]
  );

  const visibleGroups = useMemo(
    () =>
      hideCompleted
        ? downloadGroups.filter((group) => group.id !== "completed")
        : downloadGroups,
    [downloadGroups, hideCompleted]
  );

  const hasItemsInLibrary = useMemo(
    () => visibleGroups.some((group) => group.library.length > 0),
    [visibleGroups]
  );

  const hasDownloads = useMemo(() => {
    return library.some((game) => game.download);
  }, [library]);

  const summaryCards = useMemo(
    () => [
      {
        id: "downloading",
        label: t("download_in_progress"),
        value: libraryGroup.downloading.length,
        tone: "active",
      },
      {
        id: "queued",
        label: t("queued_downloads"),
        value: libraryGroup.queued.length,
        tone: "queued",
      },
      {
        id: "completed",
        label: t("downloads_completed"),
        value: libraryGroup.complete.length,
        tone: "completed",
      },
    ],
    [
      libraryGroup.downloading.length,
      libraryGroup.queued.length,
      libraryGroup.complete.length,
      t,
    ]
  );

  return (
    <>
      <BinaryNotFoundModal
        visible={showBinaryNotFoundModal}
        onClose={() => setShowBinaryNotFoundModal(false)}
      />

      <DeleteGameModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        deleteGame={handleDeleteGame}
      />

      {hasDownloads ? (
        <section className="downloads__container">
          <div className="downloads__toolbar">
            <TextField
              containerProps={{ className: "downloads__filter" }}
              theme="dark"
              value={filterQuery}
              placeholder={t("filter")}
              onChange={(event) => setFilterQuery(event.target.value)}
              rightContent={
                filterQuery ? (
                  <button
                    type="button"
                    className="downloads__clear-filter"
                    onClick={() => setFilterQuery("")}
                    aria-label={t("remove")}
                  >
                    <XCircleIcon size={16} />
                  </button>
                ) : null
              }
            />
            <div className="downloads__toolbar-actions">
              <Button
                variant="outline"
                onClick={handlePauseAll}
                disabled={!activeDownloads.length || isBulkActionRunning}
              >
                {t("pause_all")}
              </Button>
              <Button
                variant="outline"
                onClick={handleResumeAll}
                disabled={!resumableDownloads.length || isBulkActionRunning}
              >
                {t("resume_all")}
              </Button>
              <Button
                variant={hideCompleted ? "tonal" : "outline"}
                onClick={() => setHideCompleted((prev) => !prev)}
                aria-pressed={hideCompleted}
              >
                {hideCompleted ? t("show_completed") : t("hide_completed")}
              </Button>
            </div>
          </div>
          <div className="downloads__summary">
            {summaryCards.map((card) => (
              <div
                key={card.id}
                className={`downloads__summary-card downloads__summary-card--${card.tone}`}
              >
                <span className="downloads__summary-label">{card.label}</span>
                <span className="downloads__summary-value">{card.value}</span>
              </div>
            ))}
          </div>
          {hasItemsInLibrary && (
            <div className="downloads__groups">
              {visibleGroups.map((group) => (
                <DownloadGroup
                  key={group.id}
                  title={group.title}
                  library={group.library}
                  openDeleteGameModal={handleOpenDeleteGameModal}
                  openGameInstaller={handleOpenGameInstaller}
                  seedingStatus={seedingStatus}
                  queuedGameIds={group.queuedGameIds}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="downloads__no-downloads">
          <div className="downloads__arrow-icon">
            <ArrowDownIcon size={24} />
          </div>
          <h2>{t("no_downloads_title")}</h2>
          <p>{t("no_downloads_description")}</p>
        </div>
      )}
    </>
  );
}
