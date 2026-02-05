import { registerEvent } from "../register-event";
import fs from "node:fs";
import path from "node:path";
import { ACHIEVEMENT_CUSTOM_SOUND_DIR } from "@main/constants";

const AUDIO_EXTENSIONS = ["wav", "mp3", "ogg", "m4a"];

const clearExistingSounds = async () => {
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

const copyAchievementSound = async (
  _event: Electron.IpcMainInvokeEvent,
  sourcePath: string
): Promise<string> => {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error("Source file does not exist");
  }

  const extension = path.extname(sourcePath).replace(".", "").toLowerCase();
  if (!AUDIO_EXTENSIONS.includes(extension)) {
    throw new Error("Unsupported audio format");
  }

  if (!fs.existsSync(ACHIEVEMENT_CUSTOM_SOUND_DIR)) {
    fs.mkdirSync(ACHIEVEMENT_CUSTOM_SOUND_DIR, { recursive: true });
  }

  await clearExistingSounds();

  const destinationPath = path.join(
    ACHIEVEMENT_CUSTOM_SOUND_DIR,
    `achievement.${extension}`
  );

  await fs.promises.copyFile(sourcePath, destinationPath);

  return destinationPath;
};

registerEvent("copyAchievementSound", copyAchievementSound);
