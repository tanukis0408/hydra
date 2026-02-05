import { registerEvent } from "../register-event";
import fs from "node:fs";
import path from "node:path";
import { logger } from "@main/services";
import { ACHIEVEMENT_CUSTOM_SOUND_DIR } from "@main/constants";

const mimeTypes: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
};

const getAchievementSoundDataUrl = async (): Promise<string | null> => {
  try {
    if (!fs.existsSync(ACHIEVEMENT_CUSTOM_SOUND_DIR)) {
      return null;
    }

    const formats = ["wav", "mp3", "ogg", "m4a"];

    for (const format of formats) {
      const soundPath = path.join(
        ACHIEVEMENT_CUSTOM_SOUND_DIR,
        `achievement.${format}`
      );
      if (!fs.existsSync(soundPath)) continue;

      const buffer = await fs.promises.readFile(soundPath);
      const mimeType = mimeTypes[format] || "audio/mpeg";
      const base64 = buffer.toString("base64");

      return `data:${mimeType};base64,${base64}`;
    }

    return null;
  } catch (error) {
    logger.error("Failed to get achievement sound data URL", error);
    return null;
  }
};

registerEvent("getAchievementSoundDataUrl", getAchievementSoundDataUrl);
