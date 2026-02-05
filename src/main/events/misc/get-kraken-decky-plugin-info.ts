import { DeckyPlugin } from "@main/services";
import { registerEvent } from "../register-event";

const getKrakenDeckyPluginInfo = async () => {
  return DeckyPlugin.checkPluginVersion();
};

registerEvent("getHydraDeckyPluginInfo", getKrakenDeckyPluginInfo);
