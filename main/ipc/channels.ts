export const IPC_CHANNEL = {
  // Diary CRUD
  SAVE_DIARY: 'save-diary',
  GET_DIARY: 'get-diary',
  DELETE_DIARY: 'delete-diary', // ✨ 첨부파일

  UPLOAD_ATTACHMENT: 'upload-attachment', // Auto Updater

  UPLOAD_BACKGROUND: 'upload-background',

  UPLOAD_STICKER: 'upload-sticker',

  RESTART_APP: 'restart-app',
  UPDATE_MESSAGE: 'update-message', // Date Watcher

  DATE_CHANGED: 'date-changed',
} as const;

// 렌더러와 메인 간 통신에 사용될 데이터 타입을 여기에 정의하면 좋습니다. (TS 환경이라면)
// export type DiaryEntry = { ... };
