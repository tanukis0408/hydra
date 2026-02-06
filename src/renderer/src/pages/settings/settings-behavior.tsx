import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CheckboxField } from "@renderer/components";
import { useAppSelector } from "@renderer/hooks";
import { settingsContext } from "@renderer/context";
import "./settings-behavior.scss";

export function SettingsBehavior() {
  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const [showRunAtStartup, setShowRunAtStartup] = useState(false);

  const { updateUserPreferences } = useContext(settingsContext);

  const [form, setForm] = useState({
    preferQuitInsteadOfHiding: false,
    runAtStartup: false,
    startMinimized: false,
    disableNsfwAlert: false,
    enableAutoInstall: false,
    seedAfterDownloadComplete: false,
    showHiddenAchievementsDescription: false,
    showDownloadSpeedInMegabytes: false,
    extractFilesByDefault: true,
    enableSteamAchievements: false,
    autoplayGameTrailers: true,
    hideToTrayOnGameStart: false,
    enableNewDownloadOptionsBadges: true,
    createStartMenuShortcut: true,
  });

  const { t } = useTranslation("settings");
  const hint = (key: string, fallback: string) =>
    t(key, { defaultValue: fallback });

  useEffect(() => {
    if (userPreferences) {
      setForm({
        preferQuitInsteadOfHiding:
          userPreferences.preferQuitInsteadOfHiding ?? false,
        runAtStartup: userPreferences.runAtStartup ?? false,
        startMinimized: userPreferences.startMinimized ?? false,
        disableNsfwAlert: userPreferences.disableNsfwAlert ?? false,
        enableAutoInstall: userPreferences.enableAutoInstall ?? false,
        seedAfterDownloadComplete:
          userPreferences.seedAfterDownloadComplete ?? false,
        showHiddenAchievementsDescription:
          userPreferences.showHiddenAchievementsDescription ?? false,
        showDownloadSpeedInMegabytes:
          userPreferences.showDownloadSpeedInMegabytes ?? false,
        extractFilesByDefault: userPreferences.extractFilesByDefault ?? true,
        enableSteamAchievements:
          userPreferences.enableSteamAchievements ?? false,
        autoplayGameTrailers: userPreferences.autoplayGameTrailers ?? true,
        hideToTrayOnGameStart: userPreferences.hideToTrayOnGameStart ?? false,
        enableNewDownloadOptionsBadges:
          userPreferences.enableNewDownloadOptionsBadges ?? true,
        createStartMenuShortcut:
          userPreferences.createStartMenuShortcut ?? true,
      });
    }
  }, [userPreferences]);

  useEffect(() => {
    window.electron.isPortableVersion().then((isPortableVersion) => {
      setShowRunAtStartup(!isPortableVersion);
    });
  }, []);

  const handleChange = (values: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...values }));
    updateUserPreferences(values);
  };

  return (
    <>
      <CheckboxField
        label={t("quit_app_instead_hiding")}
        hint={hint(
          "hint_quit_app_instead_hiding",
          "Close Kraken instead of minimizing to tray."
        )}
        checked={form.preferQuitInsteadOfHiding}
        onChange={() =>
          handleChange({
            preferQuitInsteadOfHiding: !form.preferQuitInsteadOfHiding,
          })
        }
      />

      <CheckboxField
        label={t("hide_to_tray_on_game_start")}
        hint={hint(
          "hint_hide_to_tray_on_game_start",
          "Hide Kraken to the tray when a game starts."
        )}
        checked={form.hideToTrayOnGameStart}
        onChange={() =>
          handleChange({
            hideToTrayOnGameStart: !form.hideToTrayOnGameStart,
          })
        }
      />

      {showRunAtStartup && (
        <CheckboxField
          label={t("launch_with_system")}
          hint={hint(
            "hint_launch_with_system",
            "Start Kraken automatically when Windows starts."
          )}
          onChange={() => {
            handleChange({ runAtStartup: !form.runAtStartup });
            window.electron.autoLaunch({
              enabled: !form.runAtStartup,
              minimized: form.startMinimized,
            });
          }}
          checked={form.runAtStartup}
        />
      )}

      {showRunAtStartup && (
        <div
          className={`settings-behavior__checkbox-container ${form.runAtStartup ? "settings-behavior__checkbox-container--enabled" : ""}`}
        >
          <CheckboxField
            label={t("launch_minimized")}
            hint={hint(
              "hint_launch_minimized",
              "Start minimized in tray (requires auto-launch)."
            )}
            style={{ cursor: form.runAtStartup ? "pointer" : "not-allowed" }}
            checked={form.runAtStartup && form.startMinimized}
            disabled={!form.runAtStartup}
            onChange={() => {
              handleChange({ startMinimized: !form.startMinimized });
              window.electron.autoLaunch({
                minimized: !form.startMinimized,
                enabled: form.runAtStartup,
              });
            }}
          />
        </div>
      )}

      {window.electron.platform === "linux" && (
        <CheckboxField
          label={t("enable_auto_install")}
          hint={hint(
            "hint_enable_auto_install",
            "Allow automatic install of required components on Linux."
          )}
          checked={form.enableAutoInstall}
          onChange={() =>
            handleChange({ enableAutoInstall: !form.enableAutoInstall })
          }
        />
      )}

      <CheckboxField
        label={t("autoplay_trailers_on_game_page")}
        hint={hint(
          "hint_autoplay_trailers_on_game_page",
          "Automatically play trailers on game pages."
        )}
        checked={form.autoplayGameTrailers}
        onChange={() =>
          handleChange({ autoplayGameTrailers: !form.autoplayGameTrailers })
        }
      />

      <CheckboxField
        label={t("disable_nsfw_alert")}
        hint={hint(
          "hint_disable_nsfw_alert",
          "Disable the NSFW content warning."
        )}
        checked={form.disableNsfwAlert}
        onChange={() =>
          handleChange({ disableNsfwAlert: !form.disableNsfwAlert })
        }
      />

      <CheckboxField
        label={t("seed_after_download_complete")}
        hint={hint(
          "hint_seed_after_download_complete",
          "Continue seeding torrents after download finishes."
        )}
        checked={form.seedAfterDownloadComplete}
        onChange={() =>
          handleChange({
            seedAfterDownloadComplete: !form.seedAfterDownloadComplete,
          })
        }
      />

      <CheckboxField
        label={t("show_hidden_achievement_description")}
        hint={hint(
          "hint_show_hidden_achievement_description",
          "Show hidden achievement descriptions before unlocking."
        )}
        checked={form.showHiddenAchievementsDescription}
        onChange={() =>
          handleChange({
            showHiddenAchievementsDescription:
              !form.showHiddenAchievementsDescription,
          })
        }
      />

      <CheckboxField
        label={t("show_download_speed_in_megabytes")}
        hint={hint(
          "hint_show_download_speed_in_megabytes",
          "Display download speed in MB/s."
        )}
        checked={form.showDownloadSpeedInMegabytes}
        onChange={() =>
          handleChange({
            showDownloadSpeedInMegabytes: !form.showDownloadSpeedInMegabytes,
          })
        }
      />

      <CheckboxField
        label={t("extract_files_by_default")}
        hint={hint(
          "hint_extract_files_by_default",
          "Automatically extract archives after download."
        )}
        checked={form.extractFilesByDefault}
        onChange={() =>
          handleChange({
            extractFilesByDefault: !form.extractFilesByDefault,
          })
        }
      />

      <CheckboxField
        label={t("enable_steam_achievements")}
        hint={hint(
          "hint_enable_steam_achievements",
          "Enable Steam achievement scanning. May impact performance."
        )}
        checked={form.enableSteamAchievements}
        onChange={() =>
          handleChange({
            enableSteamAchievements: !form.enableSteamAchievements,
          })
        }
      />

      <CheckboxField
        label={t("enable_new_download_options_badges")}
        hint={hint(
          "hint_enable_new_download_options_badges",
          "Show a badge when new download options are found."
        )}
        checked={form.enableNewDownloadOptionsBadges}
        onChange={() =>
          handleChange({
            enableNewDownloadOptionsBadges:
              !form.enableNewDownloadOptionsBadges,
          })
        }
      />

      {window.electron.platform === "win32" && (
        <CheckboxField
          label={t("create_start_menu_shortcut_on_download")}
          hint={hint(
            "hint_create_start_menu_shortcut_on_download",
            "Create a Start Menu shortcut after download completes."
          )}
          checked={form.createStartMenuShortcut}
          onChange={() =>
            handleChange({
              createStartMenuShortcut: !form.createStartMenuShortcut,
            })
          }
        />
      )}
    </>
  );
}
