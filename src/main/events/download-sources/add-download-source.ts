import { registerEvent } from "../register-event";
import { KrakenApi } from "@main/services/kraken-api";
import { downloadSourcesSublevel } from "@main/level";
import type { DownloadSource } from "@types";
import { logger } from "@main/services";
import axios from "axios";
import { randomUUID, createHash } from "node:crypto";
import { DownloadSourceStatus } from "@shared";

const addDownloadSource = async (
  _event: Electron.IpcMainInvokeEvent,
  url: string
) => {
  try {
    const existingSources = await downloadSourcesSublevel.values().all();
    const urlExists = existingSources.some((source) => source.url === url);

    if (urlExists) {
      throw new Error("Download source with this URL already exists");
    }

    let downloadSource: DownloadSource | null = null;

    try {
      downloadSource = await KrakenApi.post<DownloadSource>(
        "/download-sources",
        {
          url,
        },
        { needsAuth: false }
      );
    } catch (apiError) {
      logger.warn(
        "Kraken API unavailable when adding download source, falling back to direct fetch:",
        apiError
      );

      // Offline/unauth fallback: fetch the JSON directly and create a minimal local source entry
      const response = await axios.get(url, { timeout: 15000 });

      if (!response.data) {
        throw new Error("Download source JSON is empty or invalid");
      }

      const fingerprint = createHash("md5").update(url).digest("hex");
      downloadSource = {
        id: randomUUID(),
        name: (response.data as { name?: string }).name ?? new URL(url).hostname,
        url,
        status: DownloadSourceStatus.Matched,
        downloadCount: 0,
        fingerprint,
        isRemote: false,
        createdAt: new Date().toISOString(),
      };
    }

    if (!downloadSource) {
      throw new Error("Failed to resolve download source");
    }

    if (KrakenApi.isLoggedIn() && KrakenApi.hasActiveSubscription()) {
      try {
        await KrakenApi.post("/profile/download-sources", {
          urls: [url],
        });
      } catch (error) {
        logger.error("Failed to add download source to profile:", error);
      }
    }

    await downloadSourcesSublevel.put(downloadSource.id, {
      ...downloadSource,
      isRemote: true,
      createdAt: new Date().toISOString(),
    });

    return downloadSource;
  } catch (error) {
    logger.error("Failed to add download source:", error);
    throw error;
  }
};

registerEvent("addDownloadSource", addDownloadSource);
