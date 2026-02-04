import type { FriendGameSession } from "@main/generated/envelope";
import { db, levelKeys } from "@main/level";
import { KrakenApi } from "@main/services/kraken-api";
import { publishFriendStartedPlayingGameNotification } from "@main/services/notifications";
import type { UserPreferences, UserProfile } from "@types";

export const friendGameSessionEvent = async (payload: FriendGameSession) => {
  const userPreferences = await db.get<string, UserPreferences | null>(
    levelKeys.userPreferences,
    {
      valueEncoding: "json",
    }
  );

  if (userPreferences?.friendStartGameNotificationsEnabled === false) return;

  const friend = await KrakenApi.get<UserProfile>(`/users/${payload.friendId}`);

  if (friend) {
    publishFriendStartedPlayingGameNotification(friend);
  }
};
