import { Cracker } from "@shared";
import { UnlockedAchievement } from "@types";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { achievementsLogger } from "../logger";

type IniSection = Record<string, string | number>;
type IniData = Record<string, IniSection>;

type GoldbergAchievement = {
  name?: string;
  earned?: boolean;
  earned_time?: number;
};

type GoldbergAchievements =
  | GoldbergAchievement[]
  | Record<string, GoldbergAchievement>;

type SteamCacheAchievement = {
  bAchieved?: boolean;
  strID?: string;
  rtUnlocked?: number;
};

type SteamCacheRecord = [
  string,
  { data?: { vecHighlight?: SteamCacheAchievement[] } },
];

export const parseAchievementFile = (
  filePath: string,
  type: Cracker
): UnlockedAchievement[] => {
  if (!existsSync(filePath)) return [];

  try {
    if (type == Cracker.codex) {
      const parsed = iniParse(filePath);
      return processDefault(parsed);
    }

    if (type == Cracker.rune) {
      const parsed = iniParse(filePath);
      return processDefault(parsed);
    }

    if (type === Cracker.onlineFix) {
      const parsed = iniParse(filePath);
      return processOnlineFix(parsed);
    }

    if (type === Cracker.goldberg) {
      const parsed = jsonParse<GoldbergAchievements>(filePath);
      return processGoldberg(parsed);
    }

    if (type == Cracker.userstats) {
      const parsed = iniParse(filePath);
      return processUserStats(parsed);
    }

    if (type == Cracker.rld) {
      const parsed = iniParse(filePath);
      return processRld(parsed);
    }

    if (type === Cracker.skidrow) {
      const parsed = iniParse(filePath);
      return processSkidrow(parsed);
    }

    if (type === Cracker._3dm) {
      const parsed = iniParse(filePath);
      return process3DM(parsed);
    }

    if (type === Cracker.flt) {
      const achievements = readdirSync(filePath);

      return achievements.map((achievement) => {
        return {
          name: achievement,
          unlockTime: Date.now(),
        };
      });
    }

    if (type === Cracker.creamAPI) {
      const parsed = iniParse(filePath);
      return processCreamAPI(parsed);
    }

    if (type === Cracker.empress) {
      const parsed = jsonParse<GoldbergAchievements>(filePath);
      return processGoldberg(parsed);
    }

    if (type === Cracker.razor1911) {
      return processRazor1911(filePath);
    }

    if (type === Cracker.Steam) {
      const parsed = jsonParse<SteamCacheRecord[]>(filePath);
      return processSteamCacheAchievement(parsed);
    }

    achievementsLogger.log(
      `Unprocessed ${type} achievements found on ${filePath}`
    );
    return [];
  } catch (err) {
    achievementsLogger.error(`Error parsing ${type} - ${filePath}`, err);
    return [];
  }
};

const iniParse = (filePath: string): IniData => {
  const fileContent = readFileSync(filePath, "utf-8");

  const lines =
    fileContent.charCodeAt(0) === 0xfeff
      ? fileContent.slice(1).split(/[\r\n]+/)
      : fileContent.split(/[\r\n]+/);

  let objectName = "";
  const object: Record<string, Record<string, string | number>> = {};

  for (const line of lines) {
    if (line.startsWith("###") || !line.length) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      objectName = line.slice(1, -1);
      object[objectName] = {};
    } else {
      const [name, ...value] = line.split("=");
      object[objectName][name.trim()] = value.join("=").trim();
    }
  }

  return object;
};

const jsonParse = <T = unknown>(filePath: string): T => {
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
};

const processRazor1911 = (filePath: string): UnlockedAchievement[] => {
  const fileContent = readFileSync(filePath, "utf-8");

  const lines =
    fileContent.charCodeAt(0) === 0xfeff
      ? fileContent.slice(1).split(/[\r\n]+/)
      : fileContent.split(/[\r\n]+/);

  const achievements: UnlockedAchievement[] = [];
  for (const line of lines) {
    if (!line.length) continue;

    const [name, unlocked, unlockTime] = line.split(" ");
    if (unlocked === "1") {
      achievements.push({
        name,
        unlockTime: Number(unlockTime) * 1000,
      });
    }
  }

  return achievements;
};

const processOnlineFix = (
  unlockedAchievements: IniData
): UnlockedAchievement[] => {
  const parsedUnlockedAchievements: UnlockedAchievement[] = [];

  for (const achievement of Object.keys(unlockedAchievements)) {
    const unlockedAchievement = unlockedAchievements[achievement];

    if (unlockedAchievement?.["achieved"] == "true") {
      const timestamp = Number(unlockedAchievement["timestamp"]);
      parsedUnlockedAchievements.push({
        name: achievement,
        unlockTime: timestamp * 1000,
      });
    } else if (unlockedAchievement?.["Achieved"] == "true") {
      const unlockTime = unlockedAchievement["TimeUnlocked"];
      if (unlockTime == null) continue;

      const unlockTimeNumber = Number(unlockTime);
      if (Number.isNaN(unlockTimeNumber)) continue;

      parsedUnlockedAchievements.push({
        name: achievement,
        unlockTime:
          String(unlockTime).length === 7
            ? unlockTimeNumber * 1000 * 1000
            : unlockTimeNumber * 1000,
      });
    }
  }

  return parsedUnlockedAchievements;
};

const processCreamAPI = (
  unlockedAchievements: IniData
): UnlockedAchievement[] => {
  const parsedUnlockedAchievements: UnlockedAchievement[] = [];

  for (const achievement of Object.keys(unlockedAchievements)) {
    const unlockedAchievement = unlockedAchievements[achievement];

    if (unlockedAchievement?.["achieved"] == "true") {
      const unlockTime = unlockedAchievement["unlocktime"];
      if (unlockTime == null) continue;

      const unlockTimeNumber = Number(unlockTime);
      if (Number.isNaN(unlockTimeNumber)) continue;
      parsedUnlockedAchievements.push({
        name: achievement,
        unlockTime:
          String(unlockTime).length === 7
            ? unlockTimeNumber * 1000 * 1000
            : unlockTimeNumber * 1000,
      });
    }
  }

  return parsedUnlockedAchievements;
};

const processSkidrow = (
  unlockedAchievements: IniData
): UnlockedAchievement[] => {
  const parsedUnlockedAchievements: UnlockedAchievement[] = [];
  const achievements = unlockedAchievements["Achievements"];
  if (!achievements) return parsedUnlockedAchievements;

  for (const achievement of Object.keys(achievements)) {
    const unlockedAchievement = String(achievements[achievement]).split("@");

    if (unlockedAchievement[0] === "1") {
      parsedUnlockedAchievements.push({
        name: achievement,
        unlockTime:
          Number(unlockedAchievement[unlockedAchievement.length - 1]) * 1000,
      });
    }
  }

  return parsedUnlockedAchievements;
};

const processGoldberg = (
  unlockedAchievements: GoldbergAchievements
): UnlockedAchievement[] => {
  const newUnlockedAchievements: UnlockedAchievement[] = [];

  if (Array.isArray(unlockedAchievements)) {
    for (const achievement of unlockedAchievements) {
      if (achievement?.earned && typeof achievement.earned_time === "number") {
        newUnlockedAchievements.push({
          name: achievement.name ?? "",
          unlockTime: achievement.earned_time * 1000,
        });
      }
    }

    return newUnlockedAchievements;
  }

  for (const achievement of Object.keys(unlockedAchievements)) {
    const unlockedAchievement = unlockedAchievements[achievement];

    if (
      unlockedAchievement?.earned &&
      typeof unlockedAchievement.earned_time === "number"
    ) {
      newUnlockedAchievements.push({
        name: achievement,
        unlockTime: unlockedAchievement.earned_time * 1000,
      });
    }
  }
  return newUnlockedAchievements;
};

const processSteamCacheAchievement = (
  unlockedAchievements: SteamCacheRecord[]
): UnlockedAchievement[] => {
  const newUnlockedAchievements: UnlockedAchievement[] = [];

  const achievementIndex = unlockedAchievements.findIndex(
    (element) => element[0] === "achievements"
  );

  if (achievementIndex === -1) {
    achievementsLogger.info("No achievements found in Steam cache file");
    return [];
  }

  const unlockedAchievementsData =
    unlockedAchievements[achievementIndex][1].data?.vecHighlight;

  if (!unlockedAchievementsData) return [];

  for (const achievement of unlockedAchievementsData) {
    if (achievement.bAchieved) {
      newUnlockedAchievements.push({
        name: achievement.strID ?? "",
        unlockTime: (achievement.rtUnlocked ?? 0) * 1000,
      });
    }
  }

  return newUnlockedAchievements;
};

const process3DM = (unlockedAchievements: IniData): UnlockedAchievement[] => {
  const newUnlockedAchievements: UnlockedAchievement[] = [];

  const achievements = unlockedAchievements["State"];
  const times = unlockedAchievements["Time"];
  if (!achievements || !times) return newUnlockedAchievements;

  for (const achievement of Object.keys(achievements)) {
    if (achievements[achievement] == "0101") {
      const time = times[achievement];

      newUnlockedAchievements.push({
        name: achievement,
        unlockTime:
          new DataView(
            new Uint8Array(Buffer.from(String(time), "hex")).buffer
          ).getUint32(0, true) * 1000,
      });
    }
  }

  return newUnlockedAchievements;
};

const processDefault = (
  unlockedAchievements: IniData
): UnlockedAchievement[] => {
  const newUnlockedAchievements: UnlockedAchievement[] = [];

  for (const achievement of Object.keys(unlockedAchievements)) {
    const unlockedAchievement = unlockedAchievements[achievement];

    if (unlockedAchievement?.["Achieved"] == "1") {
      const unlockTime = Number(unlockedAchievement["UnlockTime"]);
      if (Number.isNaN(unlockTime)) continue;
      newUnlockedAchievements.push({
        name: achievement,
        unlockTime: unlockTime * 1000,
      });
    }
  }

  return newUnlockedAchievements;
};

const processRld = (unlockedAchievements: IniData): UnlockedAchievement[] => {
  const newUnlockedAchievements: UnlockedAchievement[] = [];

  for (const achievement of Object.keys(unlockedAchievements)) {
    if (achievement === "Steam") continue;

    const unlockedAchievement = unlockedAchievements[achievement];

    if (unlockedAchievement?.State) {
      const unlocked = new DataView(
        new Uint8Array(
          Buffer.from(String(unlockedAchievement.State), "hex")
        ).buffer
      ).getUint32(0, true);

      if (unlocked === 1) {
        newUnlockedAchievements.push({
          name: achievement,
          unlockTime:
            new DataView(
              new Uint8Array(
                Buffer.from(String(unlockedAchievement.Time), "hex")
              ).buffer
            ).getUint32(0, true) * 1000,
        });
      }
    }
  }

  return newUnlockedAchievements;
};

const processUserStats = (
  unlockedAchievements: IniData
): UnlockedAchievement[] => {
  const newUnlockedAchievements: UnlockedAchievement[] = [];

  const achievements = unlockedAchievements["ACHIEVEMENTS"];

  if (!achievements) return [];

  for (const achievement of Object.keys(achievements)) {
    const unlockedAchievement = String(achievements[achievement]);

    const unlockTime = Number(
      unlockedAchievement.slice(1, -1).replace("unlocked = true, time = ", "")
    );

    if (!isNaN(unlockTime)) {
      newUnlockedAchievements.push({
        name: achievement.replace(/"/g, ``),
        unlockTime: unlockTime * 1000,
      });
    }
  }

  return newUnlockedAchievements;
};
