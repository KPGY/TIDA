import { contextBridge, ipcRenderer } from 'electron';

const handler = {
  invoke(channel: string, value?: unknown) {
    return ipcRenderer.invoke(channel, value);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: any, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

contextBridge.exposeInMainWorld('ipc', handler);
export type IpcHandler = typeof handler;
