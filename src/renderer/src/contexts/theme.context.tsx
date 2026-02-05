import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAppDispatch, useAppSelector } from "@renderer/hooks";
import { setUserPreferences } from "@renderer/features";
import { levelDBService } from "@renderer/services/leveldb.service";
import type { ThemeMode, UserPreferences } from "@types";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolveTheme = (mode: ThemeMode): Theme =>
  mode === "system" ? getSystemTheme() : mode;

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );
  const dispatch = useAppDispatch();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("themeMode");
    return isThemeMode(stored) ? stored : "system";
  });
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(themeMode));

  useEffect(() => {
    if (!userPreferences?.themeMode) return;
    setThemeModeState(userPreferences.themeMode);
  }, [userPreferences?.themeMode]);

  useEffect(() => {
    const resolved = resolveTheme(themeMode);
    setTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = resolveTheme("system");
      setTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    };

    if (media.addEventListener) {
      media.addEventListener("change", handler);
    } else {
      media.addListener(handler);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handler);
      } else {
        media.removeListener(handler);
      }
    };
  }, [themeMode]);

  const syncPreferences = useCallback(
    async (mode: ThemeMode) => {
      try {
        await window.electron?.updateUserPreferences?.({ themeMode: mode });
        const updated = (await levelDBService.get(
          "userPreferences",
          null,
          "json"
        )) as UserPreferences | null;
        dispatch(setUserPreferences(updated));
      } catch {
        // ignore
      }
    },
    [dispatch]
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      localStorage.setItem("themeMode", mode);
      syncPreferences(mode);
    },
    [syncPreferences]
  );

  const toggleThemeMode = useCallback(() => {
    setThemeModeState((prev) => {
      const next =
        prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      localStorage.setItem("themeMode", next);
      syncPreferences(next);
      return next;
    });
  }, [syncPreferences]);

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, toggleThemeMode, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default ThemeProvider;
