// renderer/electron.d.ts
export {};

declare global {
  interface Window {
    ipc: {
      invoke: (channel: string, value?: unknown) => Promise<any>;
      on: (
        channel: string,
        callback: (...args: unknown[]) => void
      ) => () => void;
    };
    electronAPI: {
      openFileDialog: () => Promise<string | null>;
    };
  }
}
