import { app, ipcMain, BrowserWindow, dialog, protocol, net } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import { IPC_CHANNEL } from '../ipc/channels';
import log from 'electron-log';

const dbPath = path.join(app.getPath('userData'), 'diary.db');
const db = new Database(dbPath);

/**
 * 데이터베이스를 초기화하고 모든 IPC 핸들러를 등록합니다.
 */
export function initializeDatabaseAndIPC() {
  // ✨ 1. 로컬 파일 접근을 위한 커스텀 프로토콜 등록
  if (process.type === 'browser') {
    app
      .whenReady()
      .then(() => {
        protocol.handle('attachment-asset', (request) => {
          // attachment-asset:// 경로를 실제 로컬 경로로 변환
          const filePath = request.url.substring('attachment-asset://'.length);
          const decodedPath = decodeURIComponent(filePath);

          // net.fetch를 사용하여 로컬 파일을 로드합니다.
          return net.fetch(`file://${decodedPath}`);
        });
        log.info('Custom protocol "attachment-asset://" registered.');
      })
      .catch((err) => log.error('Protocol registration failed:', err));
  }

  // 2. DB 테이블 초기화 (attachmentsJson 컬럼 사용)
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS diary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          attachmentsJson TEXT 
      )
    `
  ).run();

  // 3. 기존 테이블에 attachmentsJson 컬럼이 없는 경우 추가 (마이그레이션)
  try {
    db.prepare(
      `
      ALTER TABLE diary ADD COLUMN attachmentsJson TEXT
    `
    ).run();
    log.info('Added attachmentsJson column to diary table.');
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      log.error('Error adding attachmentsJson column:', e);
    }
  }

  // IPC: 저장 (SAVE_DIARY)
  ipcMain.handle(IPC_CHANNEL.SAVE_DIARY, (_event, diary) => {
    const { content, date, time, attachmentsJson } = diary;
    try {
      db.prepare(
        'INSERT INTO diary (content, date, time, attachmentsJson) VALUES (?, ?, ?, ?)'
      ).run(content, date, time, attachmentsJson);
      return { success: true };
    } catch (error) {
      log.error('Error saving diary entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // IPC: 불러오기 (GET_DIARY)
  ipcMain.handle(IPC_CHANNEL.GET_DIARY, (_event, date) => {
    return db
      .prepare('SELECT * FROM diary WHERE date = ? ORDER BY id ASC')
      .all(date);
  });

  // IPC: 삭제 (DELETE_DIARY)
  ipcMain.handle(IPC_CHANNEL.DELETE_DIARY, (_event, id) => {
    try {
      db.prepare('DELETE FROM diary WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting diary entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}

// IPC: 첨부파일 업로드 처리 (멀티 파일 지원) 로직은 main/ipc/fileUploader.ts로 이동되어 이 파일에서는 제거되었습니다.
