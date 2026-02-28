import path from 'path';
import { app, Menu, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import log from 'electron-log';

// ----------------------------------------------------
// ✨ 모듈화된 로직 Import
import { initializeDatabaseAndIPC } from './db/database';
import { initializeAutoUpdater } from './updater/autoUpdater';
import { startWatchingDate, stopWatchingDate } from './utils/dataWatcher';

// ****************************************************
// 파일 업로드 IPC를 담당하는 새로운 함수를 import 합니다.
import { initializeFileUploaderIPC } from './ipc/fileUpload';
// ****************************************************

log.info('App starting...');

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// ----------------------------------------------------
// ✨ DB 초기화 및 관련 IPC 등록 (SAVE_DIARY, GET_DIARY, DELETE_DIARY)
initializeDatabaseAndIPC();
// ----------------------------------------------------

// ****************************************************
// 파일 업로드 관련 IPC 핸들러 (UPLOAD_BACKGROUND, UPLOAD_ATTACHMENT)를 한 번만 초기화합니다.
initializeFileUploaderIPC();
// ****************************************************

(async () => {
  await app.whenReady();

  // 메뉴 표시줄 제거
  if (process.platform === 'win32' || process.platform === 'linux') {
    Menu.setApplicationMenu(null);
  }

  const mainWindow = createWindow('main', {
    width: 450,
    height: 900,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  ipcMain.handle('WINDOW_MINIMIZE', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('WINDOW_CLOSE', () => {
    mainWindow.close();
  });

  // ****************************************************
  // ⭐️ 핵심 수정 로직: focus/blur 이벤트 리스너 추가
  // 포커스를 얻으면: setAlwaysOnTop(true)
  mainWindow.on('focus', () => {
    // 포커스를 얻으면 항상 위에 있도록 유지합니다.
    mainWindow.setAlwaysOnTop(true);
    log.info('Window Focus: alwaysOnTop set to true');
    // 렌더러 프로세스에 상태 변화를 알릴 수도 있습니다. (예: mainWindow.webContents.send('window-focused', true))
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');

    // ✨ 자동 업데이트 초기화 (새 함수 호출)
    initializeAutoUpdater(mainWindow);
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  // 윈도우 생성 직후에 바로 날짜 감시 시작
  startWatchingDate(mainWindow);

  // 윈도우가 닫히면 타이머를 정리합니다.
  mainWindow.on('closed', () => {
    stopWatchingDate();
  });
})();

app.on('window-all-closed', () => {
  // 앱이 종료되기 전 타이머 완전 정지
  stopWatchingDate();
  app.quit();
});
