import path from 'path';
// ----------------------------------------------------
// Menu 모듈을 import에 추가했습니다.
import { app, ipcMain, Menu, BrowserWindow } from 'electron'; // BrowserWindow 추가
// ----------------------------------------------------
import serve from 'electron-serve';
import { createWindow } from './helpers';
import Database from 'better-sqlite3';

// ----------------------------------------------------
// ✨ [추가] 날짜 감시 로직
let currentDate = new Date().toDateString();
let intervalId;

/**
 * 1초마다 OS의 실제 날짜를 확인하고,
 * 날짜가 변경되면 렌더러(React)에 'date-changed' 이벤트를 보냅니다.
 * @param {BrowserWindow} window - 이벤트를 보낼 메인 윈도우
 */
function startWatchingDate(window) {
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
  }, 10000); // 1초 주기
}

/**
 * 날짜 감시 인터벌을 중지합니다.
 */
function stopWatchingDate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
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

(async () => {
  await app.whenReady();

  // ✨ 추가된 코드: 메뉴 표시줄 제거
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
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  // ----------------------------------------------------
  // ✨ [수정]
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
  // ✨ [추가] 앱이 종료되기 전 타이머 완전 정지
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
    return { success: false, error: error.message };
  }
});
