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

export class UpdateManager {
  private static hasNotified = false;
  private static newVersion = "";
  private static checkTick = 0;
  private static isMandatoryUpdate = false;

  private static mockValuesForDebug() {
    this.sendEvent({ type: "update-available", info: { version: "3.3.1" } });
    this.sendEvent({ type: "update-downloaded" });
  }

  private static sendEvent(event: AppUpdaterEvent) {
    WindowManager.mainWindow?.webContents.send("autoUpdaterEvent", event);
  }

  private static isEmergencyUpdate(info: UpdateInfo) {
    if (process.env.KRAKEN_EMERGENCY_UPDATE === "1") return true;

    const notesText: string[] = [];

    if (info.releaseName) notesText.push(info.releaseName);

    if (Array.isArray(info.releaseNotes)) {
      for (const note of info.releaseNotes) {
        if (note.version) notesText.push(note.version);
        if (note.note) notesText.push(note.note);
      }
    } else if (typeof info.releaseNotes === "string") {
      notesText.push(info.releaseNotes);
    }

    const haystack = notesText.join("\n").toLowerCase();

    if (!haystack) return false;

    const emergencyTags = [
      "[emergency]",
      "[critical]",
      "[urgent]",
      "emergency",
      "critical",
      "urgent",
    ];

    return emergencyTags.some((tag) => haystack.includes(tag));
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
        const isMandatory = this.isEmergencyUpdate(info);
        this.isMandatoryUpdate = isMandatory;

        this.sendEvent({
          type: "update-available",
          info: { version: info.version, mandatory: isMandatory },
        });

        this.newVersion = info.version;

        if (isMandatory) {
          autoUpdater
            .downloadUpdate()
            .catch((error) =>
              logger.error("Failed to download mandatory update:", error)
            );
        }
      })
      .once("update-downloaded", () => {
        this.sendEvent({
          type: "update-downloaded",
          mandatory: this.isMandatoryUpdate,
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
