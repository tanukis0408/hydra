import { useEffect, useState } from "react";
import { AlertFillIcon } from "@primer/octicons-react";
import { Button, Link, Modal } from "@renderer/components";
import { useTranslation } from "react-i18next";
import "./emergency-update-modal.scss";

const releasesPageUrl = "https://github.com/tanukis0408/hydra/releases/latest";
const AUTO_INSTALL_SECONDS = 30;

interface EmergencyUpdateModalProps {
  visible: boolean;
  version: string | null;
  downloaded: boolean;
}

export function EmergencyUpdateModal({
  visible,
  version,
  downloaded,
}: EmergencyUpdateModalProps) {
  const { t } = useTranslation("updates");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !downloaded) {
      setSecondsLeft(null);
      return;
    }

    setSecondsLeft(AUTO_INSTALL_SECONDS);

    const intervalId = window.setInterval(() => {
      setSecondsLeft((previous) =>
        previous == null ? previous : Math.max(previous - 1, 0)
      );
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      window.electron.restartAndInstallUpdate();
    }, AUTO_INSTALL_SECONDS * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [downloaded, visible]);

  const handleInstallNow = () => {
    window.electron.restartAndInstallUpdate();
  };

  const statusText = downloaded
    ? t("emergency_ready", { version: version ?? "?" })
    : t("emergency_downloading");

  return (
    <Modal
      visible={visible}
      title={t("emergency_title")}
      description={t("emergency_description")}
      onClose={() => {}}
      clickOutsideToClose={false}
      closeOnEsc={false}
      showCloseButton={false}
    >
      <div className="emergency-update-modal__container">
        <div className="emergency-update-modal__banner">
          <span className="emergency-update-modal__icon">
            <AlertFillIcon size={18} />
          </span>
          <p className="emergency-update-modal__status">{statusText}</p>
        </div>

        {downloaded && secondsLeft !== null && (
          <p className="emergency-update-modal__countdown">
            {t("emergency_auto_install", { seconds: secondsLeft })}
          </p>
        )}

        <div className="emergency-update-modal__actions">
          <Button
            variant="danger"
            onClick={handleInstallNow}
            className="emergency-update-modal__install"
            disabled={!downloaded}
            loading={!downloaded}
          >
            {t("emergency_install_now")}
          </Button>
          <Link to={releasesPageUrl} className="emergency-update-modal__link">
            {t("emergency_release_notes")}
          </Link>
        </div>
      </div>
    </Modal>
  );
}
