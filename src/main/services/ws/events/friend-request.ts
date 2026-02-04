import type { FriendRequest } from "@main/generated/envelope";
import { KrakenApi } from "@main/services/kraken-api";
import { publishNewFriendRequestNotification } from "@main/services/notifications";
import { WindowManager } from "@main/services/window-manager";

export const friendRequestEvent = async (payload: FriendRequest) => {
  WindowManager.mainWindow?.webContents.send("on-sync-friend-requests", {
    friendRequestCount: payload.friendRequestCount,
  });

  if (payload.senderId) {
    const user = await KrakenApi.get(`/users/${payload.senderId}`);

    if (user) {
      publishNewFriendRequestNotification(user);
    }
  }
};
