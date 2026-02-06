import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Link, Modal } from "@renderer/components";
import { useAppSelector } from "@renderer/hooks";
import tgIcon from "@renderer/assets/icons/tg.png";
import "./welcome-to-kraken-modal.scss";

interface WelcomeToKrakenModalProps {
  visible: boolean;
  onClose: () => void;
}

const SOURCE_LIBRARY_URL = "https://library.hydra.wiki/sources";
const FITGIRL_SOURCE_URL = "https://hydralinks.cloud/sources/fitgirl.json";
const DEFAULT_SOURCE_URL = FITGIRL_SOURCE_URL;

export function WelcomeToKrakenModal({
  visible,
  onClose,
}: Readonly<WelcomeToKrakenModalProps>) {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const userDetails = useAppSelector((state) => state.userDetails.userDetails);

  const profileLink = userDetails?.id ? `/profile/${userDetails.id}` : null;

  const steps = useMemo(
    () => [
      {
        title: "Welcome to Kraken",
        content: (
          <div className="welcome-kraken__section">
            <p>
              Короткий тур, чтобы все настроить с первого запуска. Мы покажем
              где добавить источники, как быстро найти игры и как получать
              обновления.
            </p>
            <div className="welcome-kraken__note">
              <strong>Kraken</strong> — форк Hydra Launcher с новым дизайном
              Aqua (2026).
            </div>
          </div>
        ),
      },
      {
        title: "Добавьте источник",
        content: (
          <div className="welcome-kraken__section">
            <p>
              Источники — это JSON‑ссылки с каталогом игр. Без них список будет
              пустым.
            </p>
            <ul className="welcome-kraken__list">
              <li>Открой настройки → «Источники загрузки».</li>
              <li>Нажми «Добавить источник».</li>
              <li>Вставь ссылку на JSON‑файл.</li>
            </ul>
            <div className="welcome-kraken__note">
              Hydra не предоставляет источники — они поддерживаются сообществом.
              Самый удобный каталог — Hydra Library.
              <div className="welcome-kraken__link-row">
                <Link to={SOURCE_LIBRARY_URL}>
                  library.hydra.wiki/sources
                </Link>
                <span className="welcome-kraken__hint">
                  Открой карточку FitGirl и нажми Copy или Install.
                </span>
              </div>
              <div className="welcome-kraken__code">
                {FITGIRL_SOURCE_URL}
              </div>
              <span className="welcome-kraken__hint">
                Пример ссылки на FitGirl JSON.
              </span>
            </div>
            <div className="welcome-kraken__actions-inline">
              <Button
                type="button"
                theme="outline"
                onClick={() =>
                  navigate(
                    `/settings?tab=2&urls=${encodeURIComponent(
                      DEFAULT_SOURCE_URL
                    )}`
                  )
                }
              >
                Открыть добавление источника
              </Button>
              <Button
                type="button"
                theme="outline"
                onClick={() => window.electron.openExternal(SOURCE_LIBRARY_URL)}
              >
                Открыть Hydra Library
              </Button>
              <span className="welcome-kraken__hint">
                Подставим пример автоматически.
              </span>
            </div>
          </div>
        ),
      },
      {
        title: "Быстрый старт",
        content: (
          <div className="welcome-kraken__section">
            <ul className="welcome-kraken__list">
              <li>Каталог — ищи и добавляй игры в библиотеку.</li>
              <li>Библиотека — ставь теги, следи за прогрессом.</li>
              <li>Загрузки — контролируй скорость и статус.</li>
              <li>Профиль — кастомизация и ваши коллекции.</li>
            </ul>
            <div className="welcome-kraken__note">
              Обновления Kraken приходят через репозиторий на GitHub.
            </div>
          </div>
        ),
      },
      {
        title: "Спасибо",
        content: (
          <div className="welcome-kraken__section welcome-kraken__section--credits">
            <p>
              Спасибо за то, что используете Kraken в 2026. Отдельное спасибо
              разработчикам оригинальной Hydra.
            </p>
            <div className="welcome-kraken__credits">
              <div className="welcome-kraken__credit-row">
                <img
                  src={tgIcon}
                  alt="Telegram"
                  className="welcome-kraken__tg-icon"
                />
                <Link to="https://t.me/bunker_tanukis">
                  t.me/bunker_tanukis
                </Link>
              </div>
              <div className="welcome-kraken__credit-row">
                <span className="welcome-kraken__label">Kraken repo:</span>
                <Link to="https://github.com/tanukis0408/hydra.git">
                  github.com/tanukis0408/hydra.git
                </Link>
              </div>
              <div className="welcome-kraken__credit-row">
                <span className="welcome-kraken__label">Hydra repo:</span>
                <Link to="https://github.com/hydralauncher/hydra">
                  github.com/hydralauncher/hydra
                </Link>
              </div>
              <div className="welcome-kraken__credit-row">
                <span className="welcome-kraken__label">
                  Hydra changelog:
                </span>
                <Link to="https://github.com/hydralauncher/hydra/releases">
                  github.com/hydralauncher/hydra/releases
                </Link>
              </div>
              <div className="welcome-kraken__credit-row">
                <span className="welcome-kraken__label">By TANUKIS:</span>
                <Link to="https://github.com/tanukis0408">
                  github.com/tanukis0408
                </Link>
              </div>
              {profileLink && (
                <div className="welcome-kraken__credit-row">
                  <span className="welcome-kraken__label">
                    Мой профиль Hydra:
                  </span>
                  <Link to={profileLink}>/profile/{userDetails?.id}</Link>
                </div>
              )}
            </div>
            <div className="welcome-kraken__signature">
              Сделано с огромной любовью за 4 дня — By TANUKIS.
            </div>
          </div>
        ),
      },
    ],
    [navigate, profileLink, userDetails?.id]
  );

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <Modal
      visible={visible}
      title={steps[stepIndex]?.title ?? "Welcome to Kraken"}
      onClose={onClose}
      large
      clickOutsideToClose={false}
    >
      <div className="welcome-kraken">{steps[stepIndex]?.content}</div>

      <div className="welcome-kraken__footer">
        <div className="welcome-kraken__steps">
          {steps.map((_, index) => (
            <span
              key={`step-${index}`}
              className={`welcome-kraken__step ${
                index === stepIndex ? "welcome-kraken__step--active" : ""
              }`}
            />
          ))}
        </div>
        <div className="welcome-kraken__footer-actions">
          <Button
            type="button"
            theme="outline"
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={stepIndex === 0}
          >
            Назад
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (isLastStep) {
                onClose();
              } else {
                setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
              }
            }}
          >
            {isLastStep ? "Готово" : "Далее"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
