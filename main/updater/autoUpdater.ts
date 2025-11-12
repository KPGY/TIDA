// main/updater/autoUpdater.ts
import { app, ipcMain, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { IPC_CHANNEL } from '../ipc/channels';

log.transports.file.level = 'info';
autoUpdater.logger = log;

/**
 * electron-updater의 이벤트 리스너를 설정하고 업데이트 확인을 시작합니다.
 * @param mainWindow - Electron BrowserWindow 객체
 */
function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // ... (기존 setupAutoUpdater 함수의 내용 그대로 복사)

  // 1. 업데이트 에러 발생 시
  autoUpdater.on('error', (err) => {
    log.error('Update Error:', err);
    mainWindow.webContents.send(IPC_CHANNEL.UPDATE_MESSAGE, {
      type: 'error',
      info: `업데이트 확인 중 에러 발생: ${err.message}`,
    });
  });

  // 2. 새 업데이트 확인 중
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    mainWindow.webContents.send(IPC_CHANNEL.UPDATE_MESSAGE, {
      type: 'checking',
      info: '새 업데이트 확인 중...',
    });
  });

  // 3. 업데이트가 없을 때
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info);
    mainWindow.webContents.send(IPC_CHANNEL.UPDATE_MESSAGE, {
      type: 'not-available',
      info: '현재 최신 버전입니다.',
    });
  });

  // 4. 업데이트를 찾았을 때
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info);
    mainWindow.webContents.send(IPC_CHANNEL.UPDATE_MESSAGE, {
      type: 'available',
      info: `새 업데이트 (v${info.version})가 있습니다. 다운로드를 시작합니다.`,
      version: info.version,
    });
  });

  // 5. 다운로드 진행 상황
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = progressObj.percent.toFixed(2);
    log.info(`Download Progress: ${percent}%`);
    mainWindow.webContents.send(IPC_CHANNEL.UPDATE_MESSAGE, {
      type: 'progress',
      info: '업데이트 다운로드 중...',
      percent: progressObj.percent,
    });
  });

  // 6. 다운로드 완료
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded.');
    mainWindow.webContents.send(IPC_CHANNEL.UPDATE_MESSAGE, {
      type: 'downloaded',
      info: '업데이트 다운로드가 완료되었습니다. 재시작하여 적용합니다.',
    });
  });

  // 프로덕션 환경일 때만 업데이트 확인 시작
  if (app.isPackaged) {
    log.info('Starting auto-updater check...');
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    log.warn('Skipping auto-updater check in development environment.');
  }
}

/**
 * IPC: 업데이트 적용 후 앱 재시작
 */
function setupRestartIPC() {
  ipcMain.handle(IPC_CHANNEL.RESTART_APP, () => {
    log.info('Restarting app to install update...');

    // 1. 모든 윈도우를 명시적으로 닫아 종료를 시도합니다.
    BrowserWindow.getAllWindows().forEach((w) => {
      if (!w.isDestroyed()) {
        w.close();
      }
    });

    // 2. 윈도우 닫기 이벤트 처리를 기다린 후 autoUpdater를 호출합니다.
    autoUpdater.quitAndInstall();

    return Promise.resolve({});
  });
}

/**
 * 자동 업데이트 관련 모든 초기화 로직을 수행합니다.
 */
export function initializeAutoUpdater(mainWindow: BrowserWindow): void {
  setupRestartIPC();
  // Windows 플랫폼일 때만 자동 업데이트 감시 시작
  if (app.isPackaged && process.platform === 'win32') {
    setupAutoUpdater(mainWindow);
  } else {
    log.info(
      `Auto-updater is disabled for current platform: ${process.platform}`
    );
  }
}
