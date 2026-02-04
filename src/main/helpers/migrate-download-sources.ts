import { downloadSourcesSublevel } from "@main/level";
import { KrakenApi } from "@main/services/kraken-api";
import { DownloadSource } from "@types";

export const migrateDownloadSources = async () => {
  const downloadSources = downloadSourcesSublevel.iterator();

  for await (const [key, value] of downloadSources) {
    if (!value.isRemote) {
      const downloadSource = await KrakenApi.post<DownloadSource>(
        "/download-sources",
        {
          url: value.url,
        },
        { needsAuth: false }
      );

      await downloadSourcesSublevel.put(downloadSource.id, {
        ...downloadSource,
        isRemote: true,
        createdAt: new Date().toISOString(),
      });

      await downloadSourcesSublevel.del(key);
    }
  }
};
