import { useCallback, useContext, useEffect, useState } from "react";
import "./settings-appearance.scss";
import { ThemeActions, ThemeCard, ThemePlaceholder } from "./index";
import type { Theme, ThemeMode, ThemeStyle } from "@types";
import { ImportThemeModal } from "./modals/import-theme-modal";
import { settingsContext } from "@renderer/context";
import { useNavigate } from "react-router-dom";
import { levelDBService } from "@renderer/services/leveldb.service";
import { Button, CheckboxField, SelectField, TextField } from "@renderer/components";
import { useAppSelector } from "@renderer/hooks";
import { useTranslation } from "react-i18next";

interface SettingsAppearanceProps {
  appearance: {
    theme: string | null;
    authorId: string | null;
    authorName: string | null;
  };
}

export function SettingsAppearance({
  appearance,
}: Readonly<SettingsAppearanceProps>) {
  const { t } = useTranslation("settings");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isImportThemeModalVisible, setIsImportThemeModalVisible] =
    useState(false);
  const [importTheme, setImportTheme] = useState<{
    theme: string;
    authorId: string;
    authorName: string;
  } | null>(null);
  const [hasShownModal, setHasShownModal] = useState(false);

  const { clearTheme, updateUserPreferences } = useContext(settingsContext);
  const navigate = useNavigate();
  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const [themeStyle, setThemeStyle] = useState<ThemeStyle>("expressive");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [uiScale, setUiScale] = useState(100);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [materialWallpaperPath, setMaterialWallpaperPath] = useState("");

  const loadThemes = useCallback(async () => {
    const themesList = (await levelDBService.values("themes")) as Theme[];
    setThemes(themesList);
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  useEffect(() => {
    if (!userPreferences) return;

    setThemeStyle(userPreferences.themeStyle ?? "expressive");
    setThemeMode(userPreferences.themeMode ?? "system");
    setUiScale(Math.round((userPreferences.uiScale ?? 1) * 100));
    setReduceMotion(userPreferences.reduceMotion ?? false);
    setMaterialWallpaperPath(userPreferences.materialYouWallpaperPath ?? "");
  }, [userPreferences]);

  useEffect(() => {
    const unsubscribe = window.electron.onCustomThemeUpdated(() => {
      loadThemes();
    });

    return () => unsubscribe();
  }, [loadThemes]);

  useEffect(() => {
    if (
      appearance.theme &&
      appearance.authorId &&
      appearance.authorName &&
      !hasShownModal
    ) {
      setIsImportThemeModalVisible(true);
      setImportTheme({
        theme: appearance.theme,
        authorId: appearance.authorId,
        authorName: appearance.authorName,
      });
      setHasShownModal(true);

      navigate("/settings", { replace: true });
      clearTheme();
    }
  }, [
    appearance.theme,
    appearance.authorId,
    appearance.authorName,
    navigate,
    hasShownModal,
    clearTheme,
  ]);

  const onThemeImported = useCallback(() => {
    setIsImportThemeModalVisible(false);
    setImportTheme(null);
    loadThemes();
  }, [loadThemes]);

  const handleThemeModeChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as ThemeMode;
    setThemeMode(value);
    await updateUserPreferences({ themeMode: value });
  };

  const handleUiScaleChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) return;
    setUiScale(value);
    await updateUserPreferences({ uiScale: value / 100 });
  };

  const handleReduceMotionToggle = async () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    await updateUserPreferences({ reduceMotion: next });
  };

  const handleThemeStyleChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as ThemeStyle;
    setThemeStyle(value);
    await updateUserPreferences({ themeStyle: value });
  };

  const handlePickMaterialWallpaper = async () => {
    const { filePaths } = await window.electron.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "webp", "bmp"],
        },
      ],
    });

    if (filePaths && filePaths.length > 0) {
      const path = filePaths[0];
      setMaterialWallpaperPath(path);
      await updateUserPreferences({ materialYouWallpaperPath: path });
    }
  };

  const handleClearMaterialWallpaper = async () => {
    setMaterialWallpaperPath("");
    await updateUserPreferences({ materialYouWallpaperPath: null });
  };

  return (
    <div className="settings-appearance">
      <div className="settings-appearance__theme-mode">
        <div className="settings-appearance__material-header">
          <h3>{t("theme_mode")}</h3>
          <p className="settings-appearance__material-hint">
            {t("theme_mode_description")}
          </p>
        </div>

        <SelectField
          value={themeMode}
          onChange={handleThemeModeChange}
          options={[
            {
              key: "system",
              value: "system",
              label: t("theme_mode_system"),
            },
            { key: "light", value: "light", label: t("theme_mode_light") },
            { key: "dark", value: "dark", label: t("theme_mode_dark") },
          ]}
        />
      </div>

      <div className="settings-appearance__ui-preferences">
        <div className="settings-appearance__material-header">
          <h3>{t("ui_scale")}</h3>
          <p className="settings-appearance__material-hint">
            {t("ui_scale_description")}
          </p>
        </div>

        <div className="settings-appearance__scale">
          <label
            className="settings-appearance__scale-label"
            htmlFor="settings-ui-scale"
          >
            <span>{t("ui_scale")}</span>
            <span className="settings-appearance__scale-value">
              {uiScale}%
            </span>
          </label>
          <input
            id="settings-ui-scale"
            className="settings-appearance__scale-slider"
            type="range"
            min="80"
            max="125"
            step="5"
            value={uiScale}
            onChange={handleUiScaleChange}
          />
        </div>

        <CheckboxField
          label={t("reduce_motion")}
          checked={reduceMotion}
          onChange={handleReduceMotionToggle}
        />
        <p className="settings-appearance__material-hint">
          {t("reduce_motion_description")}
        </p>
      </div>

      <div className="settings-appearance__material">
        <div className="settings-appearance__material-header">
          <h3>{t("material_style")}</h3>
          <p className="settings-appearance__material-hint">
            {t("material_style_description")}
          </p>
        </div>

        <SelectField
          value={themeStyle}
          onChange={handleThemeStyleChange}
          options={[
            {
              key: "expressive",
              value: "expressive",
              label: t("material_expressive"),
            },
            {
              key: "material-you",
              value: "material-you",
              label: t("material_you"),
            },
          ]}
        />

        {themeStyle === "material-you" && (
          <>
            <TextField
              label={t("material_you_wallpaper")}
              value={materialWallpaperPath}
              readOnly
              placeholder={t("material_you_wallpaper_placeholder")}
              rightContent={
                <div className="settings-appearance__material-actions">
                  <Button
                    variant="outline"
                    onClick={handlePickMaterialWallpaper}
                  >
                    {t("material_you_wallpaper_choose")}
                  </Button>
                  {materialWallpaperPath && (
                    <Button
                      variant="text"
                      onClick={handleClearMaterialWallpaper}
                    >
                      {t("material_you_wallpaper_clear")}
                    </Button>
                  )}
                </div>
              }
            />

            <p className="settings-appearance__material-hint">
              {t("material_you_wallpaper_hint")}
            </p>

            <div className="settings-appearance__material-preview">
              <span
                className="settings-appearance__material-swatch"
                style={{ backgroundColor: "var(--kraken-primary)" }}
              />
              <span
                className="settings-appearance__material-swatch"
                style={{ backgroundColor: "var(--kraken-secondary)" }}
              />
              <span
                className="settings-appearance__material-swatch"
                style={{ backgroundColor: "var(--kraken-tertiary)" }}
              />
            </div>
          </>
        )}
      </div>

      <ThemeActions onListUpdated={loadThemes} themesCount={themes.length} />

      <div className="settings-appearance__themes">
        {!themes.length ? (
          <ThemePlaceholder onListUpdated={loadThemes} />
        ) : (
          [...themes]
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            .map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                onListUpdated={loadThemes}
              />
            ))
        )}
      </div>

      {importTheme && (
        <ImportThemeModal
          visible={isImportThemeModalVisible}
          onClose={() => {
            setIsImportThemeModalVisible(false);
            clearTheme();
            setHasShownModal(false);
          }}
          onThemeImported={onThemeImported}
          themeName={importTheme.theme}
          authorId={importTheme.authorId}
          authorName={importTheme.authorName}
        />
      )}
    </div>
  );
}
