// main/utils/dateWatcher.ts
import { BrowserWindow } from 'electron';
import { IPC_CHANNEL } from '../ipc/channels';

let currentDate = new Date().toDateString();
let intervalId: NodeJS.Timeout | undefined;

/**
 * 10초마다 OS의 실제 날짜를 확인하고, 날짜가 변경되면 렌더러에 이벤트를 보냅니다.
 * @param window - 이벤트를 보낼 메인 윈도우
 */
export function startWatchingDate(window: BrowserWindow) {
  if (intervalId) {
    clearInterval(intervalId);
  }

  intervalId = setInterval(() => {
    const now = new Date();

    if (now.toDateString() !== currentDate) {
      currentDate = now.toDateString();

      if (window && !window.isDestroyed()) {
        window.webContents.send(
          IPC_CHANNEL.DATE_CHANGED,
          now.toLocaleDateString('en-CA')
        );
      }
    }
  }, 10000);
}

/**
 * 날짜 감시 인터벌을 중지합니다.
 */
export function stopWatchingDate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = undefined;
  }
}
