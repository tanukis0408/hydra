import React from "react";
import { useTheme } from "@renderer/contexts/theme.context";
import "./theme-toggle.scss";

export const ThemeToggle: React.FC = () => {
  const { theme, themeMode, toggleThemeMode } = useTheme();

  const label =
    themeMode === "system"
      ? "Auto"
      : theme === "light"
      ? "Light"
      : "Dark";

  const nextLabel =
    themeMode === "light" ? "Dark" : themeMode === "dark" ? "Auto" : "Light";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch theme mode to ${nextLabel}`}
      title={`Theme mode: ${label}`}
      onClick={toggleThemeMode}
    >
      {label}
    </button>
  );
};

export default ThemeToggle;
