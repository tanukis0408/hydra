import { registerEvent } from "../register-event";
import fs from "node:fs";
import path from "node:path";
import { ACHIEVEMENT_CUSTOM_SOUND_DIR } from "@main/constants";

const AUDIO_EXTENSIONS = ["wav", "mp3", "ogg", "m4a"];

const removeAchievementSound = async (): Promise<void> => {
  if (!fs.existsSync(ACHIEVEMENT_CUSTOM_SOUND_DIR)) {
    return;
  }

  await Promise.all(
    AUDIO_EXTENSIONS.map(async (extension) => {
      const soundPath = path.join(
        ACHIEVEMENT_CUSTOM_SOUND_DIR,
        `achievement.${extension}`
      );

      if (fs.existsSync(soundPath)) {
        await fs.promises.unlink(soundPath);
      }
    })
  );
};

registerEvent("removeAchievementSound", removeAchievementSound);
