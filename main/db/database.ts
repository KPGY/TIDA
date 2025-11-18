import { app, ipcMain, protocol, net } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs'; // 👈 파일 시스템 접근을 위해 필요
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

  // ---

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

  // ---

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

  // ---

  // IPC: 삭제 (DELETE_DIARY) - DB 삭제 및 파일 시스템에서 첨부 파일 제거 로직 추가
  ipcMain.handle(IPC_CHANNEL.DELETE_DIARY, (_event, id) => {
    let filePathsToDelete: string[] = [];

    try {
      // 1. 첨부 파일 경로 가져오기 (DB 레코드 삭제 전)
      const entry = db
        .prepare('SELECT attachmentsJson FROM diary WHERE id = ?')
        .get(id);

      if (entry && entry.attachmentsJson) {
        try {
          // JSON 문자열을 파싱하여 파일 경로 목록 추출
          const attachments = JSON.parse(entry.attachmentsJson);
          filePathsToDelete = attachments.map(
            (att: { filePath: string }) => att.filePath
          );
        } catch (parseError) {
          log.error(
            `Failed to parse attachmentsJson for entry ID ${id}. DB deletion will proceed.`,
            parseError
          );
        }
      }

      // 2. DB에서 레코드 삭제
      db.prepare('DELETE FROM diary WHERE id = ?').run(id);
      log.info(`Deleted diary entry ID: ${id} from database.`);

      // 3. 파일 저장소에서 첨부 파일 삭제
      filePathsToDelete.forEach((filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // 실제 파일 삭제
            log.info(`Successfully deleted file: ${filePath}`);
          } else {
            log.warn(`File not found on disk, skipping deletion: ${filePath}`);
          }
        } catch (fileDeleteError) {
          // 파일 삭제 실패는 로그로만 기록하고, DB 삭제 성공에는 영향을 주지 않음
          log.error(`Failed to delete file ${filePath}:`, fileDeleteError);
        }
      });

      return { success: true };
    } catch (error) {
      log.error('Error deleting diary entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
