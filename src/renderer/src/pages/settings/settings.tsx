import { Button } from "@renderer/components";
import { useTranslation } from "react-i18next";
import { SettingsGeneral } from "./settings-general";
import { SettingsBehavior } from "./settings-behavior";
import { SettingsDownloadSources } from "./settings-download-sources";
import {
  SettingsContextConsumer,
  SettingsContextProvider,
} from "@renderer/context";
import { SettingsAccount } from "./settings-account";
import { useUserDetails } from "@renderer/hooks";
import { useMemo } from "react";
import "./settings.scss";
import { SettingsAppearance } from "./appearance/settings-appearance";
import { SettingsDebrid } from "./settings-debrid";

export default function Settings() {
  const { t } = useTranslation("settings");

  const { userDetails } = useUserDetails();

  const categories = useMemo(() => {
    const categories = [
      { tabLabel: t("general"), contentTitle: t("general") },
      { tabLabel: t("behavior"), contentTitle: t("behavior") },
      { tabLabel: t("download_sources"), contentTitle: t("download_sources") },
      {
        tabLabel: t("appearance"),
        contentTitle: t("appearance"),
      },
      { tabLabel: t("debrid"), contentTitle: t("debrid") },
    ];

    if (userDetails)
      return [
        ...categories,
        { tabLabel: t("account"), contentTitle: t("account") },
      ];
    return categories;
  }, [userDetails, t]);

  return (
    <SettingsContextProvider>
      <SettingsContextConsumer>
        {({ currentCategoryIndex, setCurrentCategoryIndex, appearance }) => {
          const safeIndex = Math.min(
            currentCategoryIndex,
            categories.length - 1
          );
          const renderCategory = () => {
            if (safeIndex === 0) {
              return <SettingsGeneral />;
            }

            if (safeIndex === 1) {
              return <SettingsBehavior />;
            }

            if (safeIndex === 2) {
              return <SettingsDownloadSources />;
            }

            if (safeIndex === 3) {
              return <SettingsAppearance appearance={appearance} />;
            }

            if (safeIndex === 4) {
              return <SettingsDebrid />;
            }

            return <SettingsAccount />;
          };

          return (
            <section className="settings__container">
              <div className="settings__content">
                <section className="settings__categories">
                  {categories.map((category, index) => (
                    <Button
                      key={category.contentTitle}
                      theme={
                        safeIndex === index ? "primary" : "outline"
                      }
                      onClick={() => setCurrentCategoryIndex(index)}
                    >
                      {category.tabLabel}
                    </Button>
                  ))}
                </section>

                <h2>{categories[safeIndex].contentTitle}</h2>
                {renderCategory()}
              </div>
            </section>
          );
        }}
      </SettingsContextConsumer>
    </SettingsContextProvider>
  );
}
