import { useCallback, useContext, useEffect, useState } from "react";
import "./settings-appearance.scss";
import { ThemeActions, ThemeCard, ThemePlaceholder } from "./index";
import type { Theme, ThemeStyle } from "@types";
import { ImportThemeModal } from "./modals/import-theme-modal";
import { settingsContext } from "@renderer/context";
import { useNavigate } from "react-router-dom";
import { levelDBService } from "@renderer/services/leveldb.service";
import { Button, SelectField, TextField } from "@renderer/components";
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
