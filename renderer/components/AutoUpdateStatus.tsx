'use client';
import React, { useState, useEffect } from 'react';

// 업데이트 상태 타입 정의 (메인 프로세스에서 보내는 메시지 형식과 일치해야 함)
interface UpdateStatus {
  type:
    | 'checking'
    | 'available'
    | 'progress'
    | 'downloaded'
    | 'not-available'
    | 'error'
    | null;
  info: string;
  percent?: number;
  version?: string;
}

// Global window.ipc interface (preload.ts의 callback 시그니처와 일치해야 함: (message, ...) 만 받음)
declare global {
  interface Window {
    ipc: {
      invoke: (channel: string, value?: unknown) => Promise<any>;
      on: (
        channel: string,
        // 콜백은 event를 제외한, 메인 프로세스가 보낸 인수만 받습니다.
        callback: (...args: unknown[]) => void
      ) => () => void;
    };
  }
}

const AutoUpdateStatus: React.FC = () => {
  // TypeScript 문법을 정확히 준수하여 useState를 정의합니다.
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    type: null,
    info: '',
  });

  useEffect(() => {
    // window.ipc가 정의되어 있지 않으면 (예: 일반 웹 브라우저 환경) 종료
    if (typeof window === 'undefined' || !window.ipc) return;

    // 메인 프로세스에서 전달되는 'update-message' 이벤트를 수신합니다.
    const updateListener = (message: unknown) => {
      // 메시지가 UpdateStatus 형식인지 확인하고 상태 업데이트
      if (
        typeof message === 'object' &&
        message !== null &&
        'type' in message
      ) {
        setUpdateStatus(message as UpdateStatus);
        console.log('[Updater] Message Received:', message);
      }
    };

    // IPC 채널: 'update-message' 구독
    // preload에서 event를 제거하고 보내므로, 여기서 바로 message를 받습니다.
    const unsubscribe = window.ipc.on('update-message', (message) => {
      // message는 이미 첫 번째 인수로 들어옴 (event가 제거되었으므로)
      updateListener(message);
    });

    // 컴포넌트 언마운트 시 리스너를 제거합니다.
    return () => {
      unsubscribe();
    };
  }, []);

  // 업데이트 다운로드 완료 후 재시작 요청
  const handleRestartApp = async () => {
    if (typeof window === 'undefined' || !window.ipc) return;

    // 'restart-app' 명령을 메인 프로세스로 invoke합니다.
    try {
      // 'restart-app' 채널을 통해 명령을 보냅니다.
      await window.ipc.invoke('restart-app');
    } catch (error) {
      console.error('Failed to send restart command:', error);
    }
  };

  const renderUpdateUI = () => {
    // 업데이트 확인 중이거나 없으면 UI를 표시하지 않습니다.
    if (
      !updateStatus.type ||
      updateStatus.type === 'not-available' ||
      updateStatus.type === 'checking'
    ) {
      return null;
    }

    const isDownloaded = updateStatus.type === 'downloaded';
    const currentVersion = updateStatus.version || '새 버전';

    // Tailwind CSS 클래스를 사용하여 UI를 스타일링합니다.
    return (
      <div className='fixed bottom-0 right-0 m-4 p-4 bg-white/90 border-t-4 border-indigo-500 shadow-xl rounded-lg max-w-sm z-50 transition-opacity duration-300'>
        <h3 className='font-bold text-lg text-indigo-700'>
          🚀 {isDownloaded ? '업데이트 준비 완료' : '자동 업데이트'}
        </h3>
        <p className='text-sm text-gray-600 mt-1'>{updateStatus.info}</p>

        {/* 다운로드 진행 바 */}
        {updateStatus.type === 'progress' &&
          updateStatus.percent !== undefined && (
            <div className='mt-3'>
              <div className='w-full bg-indigo-100 rounded-full h-2.5'>
                <div
                  className='bg-indigo-600 h-2.5 rounded-full transition-all duration-500'
                  style={{ width: `${updateStatus.percent.toFixed(0)}%` }}
                ></div>
              </div>
              <p className='text-xs text-indigo-600 mt-1 text-right'>
                {updateStatus.percent.toFixed(0)}% 완료
              </p>
            </div>
          )}

        {/* 재시작 버튼 */}
        {isDownloaded && (
          <button
            onClick={handleRestartApp}
            className='w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md font-medium'
          >
            지금 재시작하고 v{currentVersion} 적용하기
          </button>
        )}

        {/* 에러 메시지 */}
        {updateStatus.type === 'error' && (
          <div className='mt-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs'>
            {updateStatus.info}
          </div>
        )}
      </div>
    );
  };

  return renderUpdateUI();
};

export default AutoUpdateStatus;
