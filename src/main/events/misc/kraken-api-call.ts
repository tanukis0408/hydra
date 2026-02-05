import { KrakenApi } from "@main/services";
import { registerEvent } from "../register-event";

type KrakenApiCallPayload = {
  method: "get" | "post" | "put" | "patch" | "delete";
  url: string;
  params?: unknown;
  data?: unknown;
  options?: {
    needsAuth?: boolean;
    needsSubscription?: boolean;
    ifModifiedSince?: Date;
  };
};

const krakenApiCall = async (
  _event: Electron.IpcMainInvokeEvent,
  payload: KrakenApiCallPayload
) => {
  switch (payload.method) {
    case "get":
      return KrakenApi.get(payload.url, payload.params, payload.options);
    case "post":
      return KrakenApi.post(payload.url, payload.data, payload.options);
    case "put":
      return KrakenApi.put(payload.url, payload.data, payload.options);
    case "patch":
      return KrakenApi.patch(payload.url, payload.data, payload.options);
    case "delete":
      return KrakenApi.delete(payload.url, payload.options);
    default:
      throw new Error(`Unsupported method: ${payload.method}`);
  }
};

registerEvent("krakenApiCall", krakenApiCall);
