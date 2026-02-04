import { registerEvent } from "../register-event";
import {
  DownloadManager,
  KrakenApi,
  WSClient,
  gamesPlaytime,
} from "@main/services";
import { db, downloadsSublevel, gamesSublevel, levelKeys } from "@main/level";

const signOut = async (_event: Electron.IpcMainInvokeEvent) => {
  const databaseOperations = db
    .batch([
      {
        type: "del",
        key: levelKeys.auth,
      },
      {
        type: "del",
        key: levelKeys.user,
      },
    ])
    .then(() => {
      /* Removes all games being played */
      gamesPlaytime.clear();

      return Promise.all([gamesSublevel.clear(), downloadsSublevel.clear()]);
    });

  /* Cancels any ongoing downloads */
  DownloadManager.cancelDownload();

  KrakenApi.handleSignOut();

  await Promise.all([
    databaseOperations,
    KrakenApi.post("/auth/logout").catch(() => {}),
  ]);

  WSClient.close();
};

registerEvent("signOut", signOut);
