import { Button, Modal } from "@renderer/components";
import { useTranslation } from "react-i18next";
import "./kraken-cloud-modal.scss";

export interface KrakenCloudModalProps {
  feature: string;
  visible: boolean;
  onClose: () => void;
}

export const KrakenCloudModal = ({
  feature,
  visible,
  onClose,
}: KrakenCloudModalProps) => {
  const { t } = useTranslation("kraken_cloud");

  const handleClickOpenCheckout = () => {
    window.electron.openCheckout();
  };

  return (
    <Modal visible={visible} title={t("kraken_cloud")} onClose={onClose}>
      <div
        className="kraken-cloud-modal__container"
        data-kraken-cloud-feature={feature}
      >
        {t("kraken_cloud_feature_found")}
        <Button onClick={handleClickOpenCheckout}>{t("learn_more")}</Button>
      </div>
    </Modal>
  );
};

export default KrakenCloudModal;
