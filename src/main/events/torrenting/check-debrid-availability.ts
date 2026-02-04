import { KrakenDebridClient } from "@main/services/download/hydra-debrid";
import { registerEvent } from "../register-event";

const checkDebridAvailability = async (
  _event: Electron.IpcMainInvokeEvent,
  magnets: string[]
) => {
  return KrakenDebridClient.getAvailableMagnets(magnets);
};

registerEvent("checkDebridAvailability", checkDebridAvailability);
