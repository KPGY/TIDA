import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// AutoUpdateStatus.tsx에서 사용하는 window.ipc 객체를 정의합니다.
const ipc = {
  // ipcRenderer.invoke에 대응 (재시작 버튼)
  invoke: (channel: string, value?: unknown) =>
    ipcRenderer.invoke(channel, value),

  // ipcRenderer.on에 대응 (업데이트 상태 메시지)
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    // 리스너 함수 정의: 첫 번째 인자(event)는 무시하고, 나머지 인자를 React로 전달합니다.
    const listener = (event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);

    // 리스너 등록
    ipcRenderer.on(channel, listener);

    // 클린업 함수 반환
    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
};

// 렌더러(React)의 window 객체에 'ipc'라는 이름으로 노출합니다.
contextBridge.exposeInMainWorld('ipc', ipc);
