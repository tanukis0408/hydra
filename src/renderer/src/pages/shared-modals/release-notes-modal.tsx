import { useMemo } from "react";
import { Button, Link, Modal } from "@renderer/components";
import "./release-notes-modal.scss";

interface ReleaseNotesModalProps {
  visible: boolean;
  version: string;
  onClose: () => void;
}

export function ReleaseNotesModal({
  visible,
  version,
  onClose,
}: Readonly<ReleaseNotesModalProps>) {
  const notes = useMemo(
    () => [
      "Новый Aqua-дизайн + Material You/Expressive.",
      "Коллекции профиля: Избранное, Прохожу, Хочу поиграть, Забросил и кастомные.",
      "Creator-бейджи и кастомные метки профиля.",
      "Переработанные ачивки: стиль и очередь без наложений.",
      "Welcome-тур для первого запуска.",
      "Обновлены ссылки на источники и гид по добавлению.",
    ],
    []
  );

  return (
    <Modal
      visible={visible}
      title={`Kraken ${version} Aqua`}
      description="Что нового в релизе"
      onClose={onClose}
      large
      clickOutsideToClose={false}
    >
      <div className="release-notes">
        <ul className="release-notes__list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

        <div className="release-notes__links">
          <div className="release-notes__link-row">
            <span className="release-notes__label">Kraken releases:</span>
            <Link to="https://github.com/tanukis0408/hydra/releases/latest">
              github.com/tanukis0408/hydra/releases/latest
            </Link>
          </div>
          <div className="release-notes__link-row">
            <span className="release-notes__label">Hydra changelog:</span>
            <Link to="https://github.com/hydralauncher/hydra/releases">
              github.com/hydralauncher/hydra/releases
            </Link>
          </div>
        </div>

        <div className="release-notes__actions">
          <Button type="button" onClick={onClose}>
            Ок, поехали
          </Button>
        </div>
      </div>
    </Modal>
  );
}
