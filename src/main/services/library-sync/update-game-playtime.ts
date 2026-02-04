import type { Game } from "@types";
import { KrakenApi } from "../hydra-api";

export const trackGamePlaytime = async (
  game: Game,
  deltaInMillis: number,
  lastTimePlayed: Date
) => {
  if (game.shop === "custom") {
    return;
  }

  return KrakenApi.put(`/profile/games/${game.shop}/${game.objectId}`, {
    playTimeDeltaInSeconds: Math.trunc(deltaInMillis / 1000),
    lastTimePlayed,
  });
};
