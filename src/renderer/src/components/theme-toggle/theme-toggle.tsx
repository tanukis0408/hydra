import React from "react";
import { useTheme } from "@renderer/contexts/theme.context";
import "./theme-toggle.scss";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      onClick={toggleTheme}
    >
      {theme === "light" ? "🌞" : "🌙"}
    </button>
  );
};

export default ThemeToggle;
