import path from 'path';
// ----------------------------------------------------
// Menu 모듈을 import에 추가했습니다.
import { app, ipcMain, Menu, BrowserWindow } from 'electron'; // BrowserWindow 추가
// ----------------------------------------------------
import serve from 'electron-serve';
import { createWindow } from './helpers';
import Database from 'better-sqlite3';

// ✨ [추가] 자동 업데이트 관련 모듈 임포트
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
// ----------------------------------------------------

// ✨ [추가] electron-log 설정
log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('App starting...');

// ----------------------------------------------------
// ✨ [추가] 자동 업데이트 로직 함수 정의
/**
 * electron-updater의 이벤트 리스너를 설정하고 업데이트 확인을 시작합니다.
 * @param mainWindow - Electron BrowserWindow 객체
 */
function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // 1. 업데이트 에러 발생 시
  autoUpdater.on('error', (err) => {
    log.error('Update Error:', err);
    mainWindow.webContents.send('update-message', {
      type: 'error',
      info: `업데이트 확인 중 에러 발생: ${err.message}`,
    });
  });

  // 2. 새 업데이트 확인 중
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    mainWindow.webContents.send('update-message', {
      type: 'checking',
      info: '새 업데이트 확인 중...',
    });
  });

  // 3. 업데이트가 없을 때
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info);
    mainWindow.webContents.send('update-message', {
      type: 'not-available',
      info: '현재 최신 버전입니다.',
    });
  });

  // 4. 업데이트를 찾았을 때
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info);
    mainWindow.webContents.send('update-message', {
      type: 'available',
      info: `새 업데이트 (v${info.version})가 있습니다. 다운로드를 시작합니다.`,
      version: info.version,
    });
  });

  // 5. 다운로드 진행 상황
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = progressObj.percent.toFixed(2);
    log.info(`Download Progress: ${percent}%`);
    mainWindow.webContents.send('update-message', {
      type: 'progress',
      info: '업데이트 다운로드 중...',
      percent: progressObj.percent,
    });
  });

  // 6. 다운로드 완료
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded.');
    mainWindow.webContents.send('update-message', {
      type: 'downloaded',
      info: '업데이트 다운로드가 완료되었습니다. 재시작하여 적용합니다.',
    });
  });

  // 프로덕션 환경일 때만 업데이트 확인 시작 (플랫폼 체크는 외부 호출부에서 이미 수행됨)
  if (app.isPackaged) {
    log.info('Starting auto-updater check...');
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    log.warn('Skipping auto-updater check in development environment.');
  }
}
// ----------------------------------------------------

// ----------------------------------------------------
// ✨ [기존 코드] 날짜 감시 로직
let currentDate = new Date().toDateString();
let intervalId: NodeJS.Timeout | undefined; // 타입 추가

/**
 * 1초마다 OS의 실제 날짜를 확인하고,
 * 날짜가 변경되면 렌더러(React)에 'date-changed' 이벤트를 보냅니다.
 * @param {BrowserWindow} window - 이벤트를 보낼 메인 윈도우
 */
function startWatchingDate(window: BrowserWindow) {
  // 이미 실행 중이면 중복 실행 방지
  if (intervalId) {
    clearInterval(intervalId);
  }

  intervalId = setInterval(() => {
    // 메인 프로세스의 new Date()는 OS 시간을 정확하게 반영합니다.
    const now = new Date();

    if (now.toDateString() !== currentDate) {
      currentDate = now.toDateString();

      // 윈도우가 파괴되지 않았는지 확인 후 전송
      if (window && !window.isDestroyed()) {
        // 렌더러(React)로 'date-changed' 이벤트를 보냅니다.
        // isoDateString을 보내서 정확한 시간을 전달합니다.
        window.webContents.send(
          'date-changed',
          now.toLocaleDateString('en-CA')
        );
      }
    }
  }, 10000); // 10초 주기
}

/**
 * 날짜 감시 인터벌을 중지합니다.
 */
function stopWatchingDate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = undefined; // 정리 후 undefined로 설정
  }
}
// ----------------------------------------------------

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// DB 초기화
const dbPath = path.join(app.getPath('userData'), 'diary.db');
const db = new Database(dbPath);
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS diary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL
  )
`
).run();

// ✨ [수정] IPC: 업데이트 적용 후 앱 재시작 (윈도우 닫기 추가)
ipcMain.handle('restart-app', () => {
  log.info('Restarting app to install update...');

  // 1. 모든 윈도우를 명시적으로 닫아 종료를 시도합니다. (설치 충돌 방지)
  BrowserWindow.getAllWindows().forEach((w) => {
    // 윈도우가 아직 닫히지 않았다면 닫기를 시도합니다.
    if (!w.isDestroyed()) {
      w.close();
    }
  });

  // 2. 윈도우 닫기 이벤트 처리를 기다린 후 autoUpdater를 호출합니다.
  // 이 호출이 앱을 강제로 닫고 설치 프로그램을 실행하게 됩니다.
  autoUpdater.quitAndInstall();

  return Promise.resolve({});
});

(async () => {
  await app.whenReady();

  // ✨ 기존 코드: 메뉴 표시줄 제거
  if (process.platform === 'win32' || process.platform === 'linux') {
    Menu.setApplicationMenu(null);
  }

  const mainWindow = createWindow('main', {
    width: 450,
    height: 900,

    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');

    // ✨ [수정] 프로덕션 빌드이면서 Windows 플랫폼일 때만 자동 업데이트 감시 시작
    if (process.platform === 'win32') {
      setupAutoUpdater(mainWindow);
    } else {
      log.info(
        `Auto-updater is disabled for current platform: ${process.platform}`
      );
    }
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  // ----------------------------------------------------
  // ✨ [기존 코드]
  // 윈도우 생성 직후에 바로 감시 시작
  startWatchingDate(mainWindow);

  // 윈도우가 닫히면 타이머를 정리합니다. (이건 기존과 동일)
  mainWindow.on('closed', () => {
    stopWatchingDate();
  });
  // ----------------------------------------------------
})();

app.on('window-all-closed', () => {
  // ----------------------------------------------------
  // ✨ [기존 코드] 앱이 종료되기 전 타이머 완전 정지
  stopWatchingDate();
  // ----------------------------------------------------
  app.quit();
});

// IPC: 저장
ipcMain.handle('save-diary', (_event, diary) => {
  const { content, date, time } = diary;
  db.prepare('INSERT INTO diary (content, date, time) VALUES (?, ?, ?)').run(
    content,
    date,
    time
  );
  return { success: true };
});

// IPC: 불러오기
ipcMain.handle('get-diary', (_event, date) => {
  return db
    .prepare('SELECT * FROM diary WHERE date = ? ORDER BY id ASC')
    .all(date);
});

// IPC: 삭제
ipcMain.handle('delete-diary', (_event, id) => {
  try {
    // SQL DELETE 쿼리를 사용하여 해당 ID의 데이터를 삭제합니다.
    db.prepare('DELETE FROM diary WHERE id = ?').run(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    return { success: false, error: (error as Error).message };
  }
});
