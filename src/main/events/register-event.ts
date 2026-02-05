import { ipcMain } from "electron";

export const registerEvent = <
  TArgs extends unknown[] = unknown[],
  TResult = unknown,
>(
  name: string,
  listener: (
    event: Electron.IpcMainInvokeEvent,
    ...args: TArgs
  ) => TResult | Promise<TResult>
) => {
  ipcMain.handle(
    name,
    async (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => {
      return Promise.resolve(listener(event, ...(args as TArgs))).then(
        (result) => {
          if (!result) return result;
          return JSON.parse(JSON.stringify(result));
        }
      );
    }
  );
};
