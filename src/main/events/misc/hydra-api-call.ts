import { registerEvent } from "../register-event";
import { KrakenApi } from "@main/services";

interface KrakenApiCallPayload {
  method: "get" | "post" | "put" | "patch" | "delete";
  url: string;
  data?: unknown;
  params?: unknown;
  options?: {
    needsAuth?: boolean;
    needsSubscription?: boolean;
    ifModifiedSince?: Date;
  };
}

const hydraApiCall = async (
  _event: Electron.IpcMainInvokeEvent,
  payload: KrakenApiCallPayload
) => {
  const { method, url, data, params, options } = payload;

  switch (method) {
    case "get":
      return KrakenApi.get(url, params, options);
    case "post":
      return KrakenApi.post(url, data, options);
    case "put":
      return KrakenApi.put(url, data, options);
    case "patch":
      return KrakenApi.patch(url, data, options);
    case "delete":
      return KrakenApi.delete(url, options);
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
};

registerEvent("hydraApiCall", hydraApiCall);
