import { app, ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';
import { IPC_CHANNEL } from './channels';
// IPC_CHANNEL 정의는 그대로 유지됩니다.
// import { IPC_CHANNEL } from './channels';

// 파일 업로드 및 복사 로직을 처리하는 헬퍼 함수
export async function handleFileUpload(
  event: Electron.IpcMainInvokeEvent,
  multiSelections: boolean,
  subDirectory: string // 👈 새 매개변수: 저장할 서브 폴더 이름 (예: 'background', 'chat')
) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { success: false, error: 'Window not found' };

  // 1. 다이얼로그 설정
  const properties: ('openFile' | 'multiSelections')[] = ['openFile'];
  if (multiSelections) {
    properties.push('multiSelections');
  }

  // 2. 파일 선택 다이얼로그 열기
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

  // 3. 파일 복사 및 저장
  try {
    // 기본 저장 경로: userData/attachments
    const baseDir = path.join(app.getPath('userData'), 'attachments');

    // 최종 저장 경로: userData/attachments/<subDirectory>
    const destinationDir = path.join(baseDir, subDirectory);

    // 서브 폴더를 포함하여 경로가 없으면 생성
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    const uploadedFiles = result.filePaths.map((originalPath) => {
      const originalFileName = path.basename(originalPath);
      const timestamp = Date.now();
      const extension = path.extname(originalFileName);
      const baseName = path.basename(originalFileName, extension);

      // 파일명 중복 방지를 위해 타임스탬프 추가
      const newFileName = `${baseName}_${timestamp}${extension}`;

      // 최종 파일 저장 경로
      const destinationPath = path.join(destinationDir, newFileName);

      // 파일 복사 실행
      fs.copyFileSync(originalPath, destinationPath);
      log.info(`File uploaded and copied to: ${destinationPath}`);

      return {
        filePath: destinationPath, // 저장된 파일의 전체 경로
        fileName: originalFileName, // 원본 파일 이름
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
 * UPLOAD_BACKGROUND는 'background' 폴더에, UPLOAD_ATTACHMENT는 'chat' 폴더에 저장합니다.
 */
export function initializeFileUploaderIPC() {
  // 1. IPC: 배경 이미지 업로드 (단일 파일)
  ipcMain.handle(IPC_CHANNEL.UPLOAD_BACKGROUND, (event) => {
    // multiSelections: false, subDirectory: 'background' 지정
    return handleFileUpload(event, false, 'background');
  });

  // 2. IPC: 첨부파일 업로드 (멀티 파일 지원) - 채팅 첨부파일
  ipcMain.handle(IPC_CHANNEL.UPLOAD_ATTACHMENT, (event) => {
    // multiSelections: true, subDirectory: 'chat' 지정
    return handleFileUpload(event, true, 'chat');
  });
}
