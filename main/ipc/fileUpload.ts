import { app, ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';
import { IPC_CHANNEL } from './channels';

// 파일 업로드 및 복사 로직을 처리하는 헬퍼 함수
export async function handleFileUpload(
  event: Electron.IpcMainInvokeEvent,
  multiSelections: boolean
) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { success: false, error: 'Window not found' };

  const properties: ('openFile' | 'multiSelections')[] = ['openFile'];
  if (multiSelections) {
    properties.push('multiSelections');
  }

  const result = await dialog.showOpenDialog(window, {
    properties: properties,
    title: '첨부파일 선택',
    filters: [
      { name: '이미지 파일', extensions: ['jpg', 'png', 'gif', 'jpeg'] },
      { name: '모든 파일', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'User cancelled file selection' };
  }

  try {
    const attachmentsDir = path.join(app.getPath('userData'), 'attachments');
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
    }

    const uploadedFiles = result.filePaths.map((originalPath) => {
      const originalFileName = path.basename(originalPath);
      const timestamp = Date.now();
      const extension = path.extname(originalFileName);
      const baseName = path.basename(originalFileName, extension);
      const newFileName = `${baseName}_${timestamp}${extension}`;
      const destinationPath = path.join(attachmentsDir, newFileName);

      fs.copyFileSync(originalPath, destinationPath);
      log.info(`File uploaded and copied to: ${destinationPath}`);

      return {
        filePath: destinationPath,
        fileName: originalFileName,
      };
    });

    return { success: true, files: uploadedFiles };
  } catch (error) {
    log.error('File copy failed:', error);
    return {
      success: false,
      error: `파일 복사 실패: ${(error as Error).message}`,
    };
  }
}

/**
 * 모든 파일 업로드 관련 IPC 핸들러를 등록합니다.
 * UPLOAD_BACKGROUND (단일 선택) 및 UPLOAD_ATTACHMENT (다중 선택)를 포함합니다.
 */
export function initializeFileUploaderIPC() {
  // 1. IPC: 배경 이미지 업로드 (단일 파일)
  ipcMain.handle(IPC_CHANNEL.UPLOAD_BACKGROUND, (event) => {
    return handleFileUpload(event, false); // multiSelections: false
  });

  // 2. IPC: 첨부파일 업로드 (멀티 파일 지원) - database.ts에서 이관됨
  ipcMain.handle(IPC_CHANNEL.UPLOAD_ATTACHMENT, (event) => {
    return handleFileUpload(event, true); // multiSelections: true
  });
}
