import { useCallback, useMemo, useState, useEffect } from "react";
import { Button, CheckboxField, Modal } from "@renderer/components";
import { useLibrary, useToast } from "@renderer/hooks";
import { useTranslation } from "react-i18next";
import "./migration-wizard-modal.scss";

interface MigrationWizardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MigrationWizardModal({
  visible,
  onClose,
}: Readonly<MigrationWizardModalProps>) {
  const { t } = useTranslation("settings");
  const { updateLibrary } = useLibrary();
  const { showSuccessToast, showErrorToast } = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    found: number;
    total: number;
  } | null>(null);
  const [options, setOptions] = useState({
    importMetadata: true,
    scanInstalled: true,
  });

  const isLastStep = stepIndex === 2;
  const isNextDisabled =
    isRunning || (stepIndex === 1 && !isLastStep);

  const handleRunMigration = useCallback(async () => {
    setIsRunning(true);
    setScanResult(null);

    try {
      if (options.importMetadata) {
        await window.electron.refreshLibraryAssets();
      }

      if (options.scanInstalled) {
        const scan = (await window.electron.scanInstalledGames()) as {
          foundGames: Array<{ title: string; executablePath: string }>;
          total: number;
        };
        setScanResult({
          found: scan?.foundGames?.length ?? 0,
          total: scan?.total ?? 0,
        });
      }

      await updateLibrary();
      showSuccessToast(
        t("migration_wizard_done_title"),
        t("migration_wizard_done_body")
      );
      setStepIndex(2);
    } catch {
      showErrorToast(
        t("migration_wizard"),
        t("migration_wizard_failed", {
          defaultValue: "Migration failed. Please try again.",
        })
      );
    } finally {
      setIsRunning(false);
    }
  }, [
    options.importMetadata,
    options.scanInstalled,
    showErrorToast,
    showSuccessToast,
    t,
    updateLibrary,
  ]);

  const steps = useMemo(
    () => [
      {
        title: t("migration_wizard_intro_title"),
        content: (
          <div className="migration-wizard__content">
            <p className="migration-wizard__description">
              {t("migration_wizard_intro_body")}
            </p>
          </div>
        ),
      },
      {
        title: t("migration_wizard_select_title"),
        content: (
          <div className="migration-wizard__content">
            <CheckboxField
              label={t("migration_wizard_import_metadata")}
              checked={options.importMetadata}
              onChange={() =>
                setOptions((prev) => ({
                  ...prev,
                  importMetadata: !prev.importMetadata,
                }))
              }
            />
            <CheckboxField
              label={t("migration_wizard_scan_installed")}
              checked={options.scanInstalled}
              onChange={() =>
                setOptions((prev) => ({
                  ...prev,
                  scanInstalled: !prev.scanInstalled,
                }))
              }
            />
            <div className="migration-wizard__actions">
              <Button onClick={handleRunMigration} disabled={isRunning}>
                {isRunning
                  ? t("migration_wizard_running")
                  : t("migration_wizard_run")}
              </Button>
            </div>
          </div>
        ),
      },
      {
        title: t("migration_wizard_done_title"),
        content: (
          <div className="migration-wizard__content">
            <p className="migration-wizard__description">
              {t("migration_wizard_done_body")}
            </p>
            {scanResult && (
              <div className="migration-wizard__result">
                {t("migration_wizard_done_scan", {
                  found: scanResult.found,
                  total: scanResult.total,
                })}
              </div>
            )}
          </div>
        ),
      },
    ],
    [
      handleRunMigration,
      isRunning,
      options.importMetadata,
      options.scanInstalled,
      scanResult,
      t,
    ]
  );

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      setIsRunning(false);
      setScanResult(null);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      title={steps[stepIndex]?.title ?? t("migration_wizard")}
      onClose={onClose}
      clickOutsideToClose={!isRunning}
      closeOnEsc={!isRunning}
    >
      <div className="migration-wizard">{steps[stepIndex]?.content}</div>

      <div className="migration-wizard__footer">
        <div className="migration-wizard__steps">
          {steps.map((_, index) => (
            <span
              key={`migration-step-${index}`}
              className={`migration-wizard__step ${
                index === stepIndex ? "migration-wizard__step--active" : ""
              }`}
            />
          ))}
        </div>
        <div className="migration-wizard__footer-actions">
          <Button
            theme="outline"
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={stepIndex === 0 || isRunning}
          >
            {t("migration_wizard_back")}
          </Button>
          <Button
            onClick={() => {
              if (isLastStep) {
                onClose();
                setStepIndex(0);
                return;
              }
              setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
            }}
            disabled={isNextDisabled}
          >
            {isLastStep
              ? t("migration_wizard_finish")
              : t("migration_wizard_next")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
