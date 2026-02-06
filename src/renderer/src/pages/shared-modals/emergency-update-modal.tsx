import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Link, Modal } from "@renderer/components";
import { useTranslation } from "react-i18next";
import "./emergency-update-modal.scss";

const releasesPageUrl = "https://github.com/tanukis0408/hydra/releases/latest";

interface EmergencyUpdateModalProps {
  visible: boolean;
  version?: string | null;
  downloaded: boolean;
  onInstall: () => void;
}

export function EmergencyUpdateModal({
  visible,
  version,
  downloaded,
  onInstall,
}: Readonly<EmergencyUpdateModalProps>) {
  const { t } = useTranslation("updates");
  const [countdown, setCountdown] = useState<number | null>(null);
  const installTriggered = useRef(false);

  const safeVersion = useMemo(() => version ?? "?", [version]);

  useEffect(() => {
    if (!visible || !downloaded) {
      setCountdown(null);
      installTriggered.current = false;
      return;
    }

    setCountdown(30);
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current == null) return null;
        if (current <= 1) return 0;
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [visible, downloaded]);

  useEffect(() => {
    if (countdown !== 0) return;
    if (installTriggered.current) return;
    installTriggered.current = true;
    onInstall();
  }, [countdown, onInstall]);

  return (
    <Modal
      visible={visible}
      title={t("emergency_title")}
      description={t("emergency_description", { version: safeVersion })}
      onClose={() => {}}
      clickOutsideToClose={false}
      closeOnEsc={false}
      showCloseButton={false}
      large
    >
      <div className="emergency-update">
        <div className="emergency-update__status">
          <span>
            {downloaded
              ? t("emergency_ready")
              : t("emergency_downloading")}
          </span>
          {downloaded && countdown != null && (
            <span className="emergency-update__countdown">
              {t("emergency_auto_install", { seconds: countdown })}
            </span>
          )}
        </div>

        <div className="emergency-update__actions">
          <Link
            to={releasesPageUrl}
            className="emergency-update__link"
          >
            {t("emergency_release_notes")}
          </Link>
          <Button
            type="button"
            onClick={onInstall}
            disabled={!downloaded}
          >
            {t("emergency_install_now")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
