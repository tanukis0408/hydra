import { shell } from "electron";
import { registerEvent } from "../register-event";
import { KrakenApi } from "@main/services";
import { db, levelKeys } from "@main/level";
import type { Auth } from "@types";

const openCheckout = async (_event: Electron.IpcMainInvokeEvent) => {
  const auth = await db.get<string, Auth>(levelKeys.auth, {
    valueEncoding: "json",
  });

  if (!auth) {
    return;
  }

  const { accessToken: paymentToken } = await KrakenApi.post<{
    accessToken: string;
  }>("/auth/payment", {
    refreshToken: auth.refreshToken,
  });

  const params = new URLSearchParams({
    token: paymentToken,
  });

  shell.openExternal(
    `${import.meta.env.MAIN_VITE_CHECKOUT_URL}?${params.toString()}`
  );
};

registerEvent("openCheckout", openCheckout);
