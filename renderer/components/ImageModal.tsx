'use client';
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ImageViewerModalProps {
  filePath: string;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  filePath,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키 이벤트 처리
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);

  // 배경 클릭 이벤트 처리
  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === modalRef.current) {
      onClose();
    }
  };

  // URL 인코딩 및 커스텀 프로토콜 적용
  const imageUrl = `attachment-asset://${encodeURIComponent(filePath)}`;

  return (
    <div
      ref={modalRef}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm'
      onClick={handleBackgroundClick}
    >
      <div className='relative max-w-[90vw] max-h-[90vh] p-4'>
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className='absolute top-0 right-0 m-6 z-10 text-white p-2 bg-gray-700/50 rounded-full hover:bg-gray-700 transition'
          title='닫기 (ESC)'
        >
          <X size={24} />
        </button>

        {/* 이미지 표시 (원본 비율 유지) */}
        <img
          src={imageUrl}
          alt='첨부 이미지'
          className='max-w-full max-h-full object-contain shadow-2xl rounded-lg'
          // 로딩 실패 시 에러 처리
          onError={() =>
            console.error('Failed to load image in modal:', filePath)
          }
        />
      </div>
    </div>
  );
};

export default ImageViewerModal;
