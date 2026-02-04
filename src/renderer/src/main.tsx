import React from "react";
import ReactDOM from "react-dom/client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Provider } from "react-redux";
import LanguageDetector from "i18next-browser-languagedetector";
import { HashRouter, Route, Routes } from "react-router-dom";

import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/700.css";

import "react-loading-skeleton/dist/skeleton.css";
import "react-tooltip/dist/react-tooltip.css";

import { App } from "./app";

import { store } from "./store";

import resources from "@locales";

import { logger } from "./logger";
import { addCookieInterceptor } from "./cookies";
import * as Sentry from "@sentry/react";
import { levelDBService } from "./services/leveldb.service";
import Catalogue from "./pages/catalogue/catalogue";
import Home from "./pages/home/home";
import Downloads from "./pages/downloads/downloads";
import GameDetails from "./pages/game-details/game-details";
import Settings from "./pages/settings/settings";
import Profile from "./pages/profile/profile";
import Achievements from "./pages/achievements/achievements";
import ThemeEditor from "./pages/theme-editor/theme-editor";
import Library from "./pages/library/library";
import Notifications from "./pages/notifications/notifications";
import { AchievementNotification } from "./pages/achievements/notification/achievement-notification";
import GameLauncher from "./pages/game-launcher/game-launcher";

console.log = logger.log;

Sentry.init({
  dsn: import.meta.env.RENDERER_VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.5,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  release: "kraken-launcher@" + (await window.electron.getVersion()),
});

// Dev helper: grant a local developer subscription (safe for development only)
// Usage: open DevTools console and run `window.__grantDevSubscription()`
;(window as any).__grantDevSubscription = async function () {
  try {
    const now = Date.now();
    const future = new Date(now + 1000 * 60 * 60 * 24 * 365).toISOString();
    const raw = localStorage.getItem("userDetails");
    const user = raw ? JSON.parse(raw) : {};
    const patched = {
      id: user.id || "dev-user",
      username: user.username || "dev",
      email: user.email || null,
      displayName: user.displayName || "Dev User",
      profileImageUrl: user.profileImageUrl || null,
      backgroundImageUrl: user.backgroundImageUrl || null,
      profileVisibility: user.profileVisibility || "PUBLIC",
      bio: user.bio || "",
      featurebaseJwt: user.featurebaseJwt || "",
      workwondersJwt: user.workwondersJwt || "",
      subscription: {
        id: "dev-subscription",
        status: "active",
        plan: { id: "dev", name: "Developer" },
        expiresAt: future,
        paymentMethod: "paypal",
      },
      karma: user.karma || 0,
    };
    localStorage.setItem("userDetails", JSON.stringify(patched));
    // reload to pick up new state
    location.reload();
  } catch (e) {
    // ignore
  }
};

const isStaging = await window.electron.isStaging();
addCookieInterceptor(isStaging);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })
  .then(async () => {
    const userPreferences = (await levelDBService.get(
      "userPreferences",
      null,
      "json"
    )) as { language?: string } | null;

    if (userPreferences?.language) {
      i18n.changeLanguage(userPreferences.language);
    } else {
      window.electron.updateUserPreferences({ language: i18n.language });
    }
  });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/library" element={<Library />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/game/:shop/:objectId" element={<GameDetails />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route path="/theme-editor" element={<ThemeEditor />} />
          <Route
            path="/achievement-notification"
            element={<AchievementNotification />}
          />
          <Route path="/game-launcher" element={<GameLauncher />} />
        </Routes>
      </HashRouter>
    </Provider>
  </React.StrictMode>
);
