// src/pages/components/AttachmentModal.tsx
import React, { useState } from 'react';
import {
  Plus,
  X,
  FileText,
  UploadCloud,
  Smile,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { IPC_CHANNEL } from '../../main/ipc/channels';

export interface Attachment {
  filePath: string;
  fileName: string;
}

interface AttachmentModalProps {
  initialFiles: Attachment[];
  initialStickers: Attachment[];
  onClose: () => void;
  // 변경된 파일과 스티커를 모두 반환하지만, 실제로는 수정한 쪽만 변경됩니다.
  onSave: (files: Attachment[], stickers: Attachment[]) => void;
}

// 이미지 파일 확장자 확인
const isImageFile = (fileName: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(ext);
};

// ✨ 모드 타입 정의
type Mode = 'SELECT' | 'FILE' | 'STICKER';

const AttachmentModal: React.FC<AttachmentModalProps> = ({
  initialFiles = [],
  initialStickers = [],
  onClose,
  onSave,
}) => {
  // 1. 현재 어떤 화면을 보여줄지 결정하는 상태 (초기값: 선택 화면)
  const [mode, setMode] = useState<Mode>('SELECT');

  // 2. 데이터 상태 관리
  const [selectedFiles, setSelectedFiles] =
    useState<Attachment[]>(initialFiles);
  const [selectedStickers, setSelectedStickers] =
    useState<Attachment[]>(initialStickers);
  const [isUploading, setIsUploading] = useState(false);

  // 현재 모드에 따라 보여줄 데이터와 핸들러를 동적으로 결정
  const isFileMode = mode === 'FILE';
  const currentList = isFileMode ? selectedFiles : selectedStickers;
  const currentTitle = isFileMode ? '일반 파일 관리' : '스티커/배경 관리';

  // 3. 통합 업로드 핸들러
  const handleUpload = async () => {
    if (!window.ipc) return;
    setIsUploading(true);

    // 모드에 따라 채널 분기
    const channel = isFileMode
      ? IPC_CHANNEL.UPLOAD_ATTACHMENT
      : IPC_CHANNEL.UPLOAD_STICKER;

    const result = await window.ipc.invoke(channel);

    if (result.success && result.files && Array.isArray(result.files)) {
      if (isFileMode) {
        setSelectedFiles((prev) => [...prev, ...result.files]);
      } else {
        setSelectedStickers((prev) => [...prev, ...result.files]);
      }
    }
    setIsUploading(false);
  };

  // 4. 삭제 핸들러
  const handleRemove = (indexToRemove: number) => {
    if (isFileMode) {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    } else {
      setSelectedStickers((prev) => prev.filter((_, i) => i !== indexToRemove));
    }
  };

  // 5. 저장 핸들러
  const handleSave = () => {
    // 변경된 내용은 반영하고, 건드리지 않은 쪽은 초기값(또는 현재값)을 그대로 유지해서 보냅니다.
    onSave(selectedFiles, selectedStickers);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm'>
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- [헤더 영역] --- */}
        <div className='flex justify-between items-center p-4 border-b border-gray-100'>
          <div className='flex items-center gap-2'>
            {mode !== 'SELECT' && (
              <button
                onClick={() => setMode('SELECT')}
                className='p-1 rounded-full hover:bg-gray-100 transition mr-1'
                title='뒤로 가기'
              >
                <ArrowLeft size={20} className='text-gray-600' />
              </button>
            )}
            <h2 className='text-lg font-bold text-gray-800'>
              {mode === 'SELECT' ? '첨부 유형 선택' : currentTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition'
          >
            <X size={24} />
          </button>
        </div>

        {/* --- [컨텐츠 영역] --- */}
        <div className='flex-grow overflow-y-auto p-6 bg-gray-50'>
          {/* A. 초기 선택 화면 (SELECT Mode) */}
          {mode === 'SELECT' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 h-full'>
              {/* 파일 선택 버튼 */}
              <button
                onClick={() => setMode('FILE')}
                className='group flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-200 rounded-xl hover:border-mainTheme hover:shadow-lg transition-all duration-300'
              >
                <div className='w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition'>
                  <FileText size={32} />
                </div>
                <h3 className='text-lg font-bold text-gray-800 mb-2'>
                  일반 파일
                </h3>
                <p className='text-sm text-gray-500 text-center'>
                  문서나 이미지를
                  <br />
                  단순 첨부합니다.
                </p>
                <span className='mt-4 text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded'>
                  현재 {selectedFiles.length}개
                </span>
              </button>

              {/* 스티커 선택 버튼 */}
              <button
                disabled={true}
                onClick={() => setMode('STICKER')}
                className='group flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed'
              >
                <div className='w-16 h-16 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center mb-4 '>
                  <Smile size={32} />
                </div>
                <h3 className='text-lg font-bold text-gray-800 mb-2'>
                  스티커 / 배경
                </h3>
                <p className='text-sm text-gray-500 text-center'>
                  꾸미기용 스티커를
                  <br />
                  첨부합니다.
                </p>
                <span className='mt-4 text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded'>
                  현재 {selectedStickers.length}개
                </span>
              </button>
            </div>
          )}

          {/* B. 상세 작업 화면 (FILE or STICKER Mode) */}
          {mode !== 'SELECT' && (
            <div className='space-y-4'>
              {/* 업로드 버튼 (상단 배치) */}
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
                  isUploading
                    ? 'bg-gray-50 border-gray-300 cursor-wait'
                    : 'bg-white border-mainTheme/50 hover:bg-mainTheme/5 hover:border-mainTheme cursor-pointer'
                }`}
              >
                {isUploading ? (
                  <span className='text-sm text-gray-400 animate-pulse'>
                    업로드 중...
                  </span>
                ) : (
                  <>
                    <UploadCloud size={28} className='text-mainTheme mb-2' />
                    <span className='font-semibold text-gray-700'>
                      클릭하여 {isFileMode ? '파일' : '스티커'} 추가
                    </span>
                  </>
                )}
              </button>

              {/* 미리보기 리스트 */}
              {currentList.length === 0 ? (
                <div className='text-center py-10 text-gray-400'>
                  선택된 항목이 없습니다.
                </div>
              ) : (
                <div className='grid grid-cols-3 gap-3'>
                  {currentList.map((item, idx) => (
                    <div
                      key={idx}
                      className='relative group aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm'
                    >
                      {/* 이미지/아이콘 표시 */}
                      <div className='w-full h-full flex items-center justify-center'>
                        {isImageFile(item.fileName) ? (
                          <img
                            src={`attachment-asset://${encodeURIComponent(
                              item.filePath
                            )}`}
                            alt={item.fileName}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='flex flex-col items-center justify-center p-2'>
                            <FileText
                              size={24}
                              className='text-gray-400 mb-1'
                            />
                            <span className='text-[10px] text-gray-500 text-center break-all line-clamp-2'>
                              {item.fileName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 삭제 버튼 (호버시 등장) */}
                      <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                        <button
                          onClick={() => handleRemove(idx)}
                          className='bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transform hover:scale-110 transition'
                          title='삭제'
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- [푸터 영역] --- */}
        {mode !== 'SELECT' && (
          <div className='p-4 border-t border-gray-100 bg-white flex justify-end gap-2'>
            <button
              onClick={() => setMode('SELECT')}
              className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition'
            >
              이전으로
            </button>
            <button
              onClick={handleSave}
              className='px-6 py-2 bg-mainTheme hover:bg-mainThemeEnd text-white rounded-lg font-semibold shadow-md transition text-sm'
            >
              완료 ({currentList.length}개)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentModal;
