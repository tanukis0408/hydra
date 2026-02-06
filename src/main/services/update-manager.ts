import updater, { UpdateInfo } from "electron-updater";
import { logger, WindowManager } from "@main/services";
import { AppUpdaterEvent, UserPreferences } from "@types";
import { app } from "electron";
import { publishNotificationUpdateReadyToInstall } from "@main/services/notifications";
import { db, levelKeys } from "@main/level";
import { MAIN_LOOP_INTERVAL } from "@main/constants";

const { autoUpdater } = updater;
const sendEventsForDebug = false;
const ticksToUpdate = (50 * 60 * 1000) / MAIN_LOOP_INTERVAL; // 50 minutes
const EMERGENCY_TAGS = ["[EMERGENCY]", "[CRITICAL]", "[URGENT]", "[HOTFIX]"];

const includesEmergencyTag = (value: string) => {
  const upper = value.toUpperCase();
  return EMERGENCY_TAGS.some((tag) => upper.includes(tag));
};

const normalizeReleaseNotes = (releaseNotes?: UpdateInfo["releaseNotes"]) => {
  if (!releaseNotes) return "";
  if (typeof releaseNotes === "string") return releaseNotes;
  if (Array.isArray(releaseNotes)) {
    return releaseNotes
      .map((note) => (typeof note === "string" ? note : note.note ?? ""))
      .join("\n");
  }
  return "";
};

export class UpdateManager {
  private static hasNotified = false;
  private static newVersion = "";
  private static checkTick = 0;
  private static mandatoryUpdate = false;

  private static mockValuesForDebug() {
    this.sendEvent({
      type: "update-available",
      info: { version: "3.3.1", mandatory: true },
    });
    this.sendEvent({
      type: "update-downloaded",
      mandatory: true,
      version: "3.3.1",
    });
  }

  private static sendEvent(event: AppUpdaterEvent) {
    WindowManager.mainWindow?.webContents.send("autoUpdaterEvent", event);
  }

  private static async isAutoInstallEnabled() {
    if (process.platform === "darwin") return false;
    if (process.platform === "win32") {
      return process.env.PORTABLE_EXECUTABLE_FILE == null;
    }

    if (process.platform === "linux") {
      const userPreferences = await db.get<string, UserPreferences | null>(
        levelKeys.userPreferences,
        {
          valueEncoding: "json",
        }
      );

      return userPreferences?.enableAutoInstall === true;
    }

    return false;
  }

  public static async checkForUpdates() {
    autoUpdater
      .once("update-available", (info: UpdateInfo) => {
        const emergencyEnv = process.env.KRAKEN_EMERGENCY_UPDATE === "1";
        const notes = normalizeReleaseNotes(info.releaseNotes);
        const releaseName = info.releaseName ?? "";
        const mandatory =
          emergencyEnv ||
          includesEmergencyTag(`${info.version} ${releaseName} ${notes}`);

        this.mandatoryUpdate = mandatory;
        this.sendEvent({
          type: "update-available",
          info: { version: info.version, mandatory },
        });
        this.newVersion = info.version;

        if (mandatory && app.isPackaged) {
          autoUpdater.autoDownload = true;
          autoUpdater
            .downloadUpdate()
            .catch((error) =>
              logger.error("Failed to download emergency update", error)
            );
        }
      })
      .once("update-downloaded", () => {
        this.sendEvent({
          type: "update-downloaded",
          mandatory: this.mandatoryUpdate,
          version: this.newVersion,
        });

        if (!this.hasNotified) {
          this.hasNotified = true;
          publishNotificationUpdateReadyToInstall(this.newVersion);
        }
      });

    const isAutoInstallAvailable = await this.isAutoInstallEnabled();

    if (app.isPackaged) {
      autoUpdater.autoDownload = isAutoInstallAvailable;
      autoUpdater.checkForUpdates().then((result) => {
        logger.log(`Check for updates result: ${result}`);
      });
    } else if (sendEventsForDebug) {
      this.mockValuesForDebug();
    }

    return isAutoInstallAvailable;
  }

  public static checkForUpdatePeriodically() {
    if (this.checkTick % ticksToUpdate == 0) {
      this.checkForUpdates();
    }
    this.checkTick++;
  }
}
