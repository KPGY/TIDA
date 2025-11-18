'use client';
import React, { ChangeEvent, useMemo, useState } from 'react'; // useState 추가
import Link from 'next/link';
import {
  Home,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Image as ImageIcon,
  X,
} from 'lucide-react'; // X 아이콘 추가
import { useColorStore } from '../components/store';

// Electron IPC 통신을 위한 타입 정의
// window.ipc가 전역에 노출되어 있다고 가정합니다.
interface ipc {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}
declare global {
  interface Window {
    ipc: ipc;
  }
}

// IPC 채널 상수를 명확히 정의
const IPC_CHANNEL_UPLOAD_BACKGROUND = 'upload-background';

// 시각적 구분을 위한 폰트 옵션 목록
const fontOptions = [
  {
    label: '고딕 (기본)',
    tailwindClass: 'font-sans',
    cssValue: 'system-ui, sans-serif', // 가장 안정적인 시스템 기본 폰트
  },
  {
    label: '명조 (세리프)',
    tailwindClass: 'font-serif',
    cssValue: 'Georgia, "Tims New Roman", serif',
  },
  {
    label: '고정폭 (모노)',
    tailwindClass: 'font-mono',
    cssValue: 'ui-monospace, monospace',
  },
  {
    label: '얇은 고딕',
    tailwindClass: 'font-extralight', // Tailwind 클래스 사용 (미리보기용)
    cssValue: 'Arial, sans-serif', // 얇은 느낌을 줄 수 있는 폰트
  },
];

export default function SettingPage() {
  const {
    bgTheme,
    bubbleTheme,
    panelTheme,
    mainTheme,
    bgThemeEnd,
    bubbleThemeEnd,
    panelThemeEnd,
    mainThemeEnd,
    baseFont,
    fontSize,
    gradientMode,
    bgAttachmentPath, // 배경 이미지 경로 상태 가져오기
    setGradientMode,
    setSingleColor,
    setSingleGradientColor,
    setFontStyle, // 폰트 상태 변경 함수
    setbgAttachmentPath, // 배경 이미지 경로 설정 함수 가져오기
  } = useColorStore();

  // 사용자 피드백을 위한 상태 (Alert 대체)
  const [feedback, setFeedback] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // 피드백 메시지를 숨기는 함수
  const hideFeedback = () => setFeedback(null);

  // 글자 크기를 px 단위 문자열에서 숫자(10~30)로 변환
  const currentFontSizeValue = useMemo(() => {
    return parseInt(fontSize.replace('px', ''), 10);
  }, [fontSize]);

  // 현재 선택된 폰트 클래스를 미리보기 창에 적용하기 위한 로직
  const previewFontClass = useMemo(() => {
    const selectedOption = fontOptions.find((opt) => opt.cssValue === baseFont);
    // baseFont가 Noto Sans KR, sans-serif 등 유효한 CSS 값일 때만 Tailwind 클래스 반환
    return selectedOption ? selectedOption.tailwindClass : 'font-sans';
  }, [baseFont]);

  // 글자 크기 슬라이더 핸들러
  const handleFontSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFontStyle('fontSize', `${e.target.value}px`);
  };

  // 글꼴 버튼 클릭 핸들러
  const handleFontSelect = (cssValue: string) => {
    setFontStyle('baseFont', cssValue);
  };

  // 그라데이션 모드 토글 핸들러
  const toggleGradientMode = () => {
    setGradientMode(!gradientMode);
  };

  const isEndColorDisabled = !gradientMode;

  /**
   * 배경 이미지 첨부 버튼 클릭 핸들러
   * Electron IPC를 호출하여 파일 선택 및 복사를 요청합니다.
   */
  const handleBackgroundAttachment = async () => {
    setFeedback(null); // 이전 피드백 초기화

    if (typeof window !== 'undefined' && window.ipc) {
      try {
        // IPC 채널 상수를 사용
        const result = await window.ipc.invoke(IPC_CHANNEL_UPLOAD_BACKGROUND);

        if (result.success && result.files && result.files.length > 0) {
          // 배경 이미지는 단일 파일만 지원하므로 첫 번째 파일의 경로만 사용
          const filePath = result.files[0].filePath;
          setbgAttachmentPath(filePath); // Zustand에 경로 저장
          setFeedback({
            message: '배경 이미지가 성공적으로 설정되었습니다.',
            type: 'success',
          });
        } else if (result.error === 'User cancelled file selection') {
          console.log('User cancelled file selection.');
        } else {
          // IPC 호출은 성공했으나 파일 복사 등의 내부 오류 발생 시
          console.error('File upload failed:', result.error);
          setFeedback({
            message: `파일 업로드 실패: ${result.error}`,
            type: 'error',
          });
        }
      } catch (error) {
        // IPC 호출 자체가 실패 (채널 이름 오류, 메인 프로세스 응답 없음 등)
        console.error('IPC invoke error (IPC 통신 실패):', error);
        setFeedback({
          message:
            '파일 업로드 요청 중 예기치 않은 오류가 발생했습니다. 콘솔을 확인하십시오.',
          type: 'error',
        });
      }
    } else {
      // Electron 환경이 아닐 경우
      console.warn('IPC Renderer is not available. Skipping file upload.');
      setFeedback({
        message: '경고: Electron 환경이 아닙니다. IPC 호출을 건너뜁니다.',
        type: 'error',
      });
    }
  };

  /**
   * 배경 이미지 제거 핸들러
   */
  const handleRemoveBackgroundAttachment = () => {
    setbgAttachmentPath(''); // 경로를 빈 문자열로 설정하여 제거
    setFeedback({ message: '배경 이미지가 제거되었습니다.', type: 'success' });
  };

  return (
    <div>
      <header className='flex p-4 justify-between items-center bg-gray-50 shadow-sm app-drag fixed top-0 z-10 w-full'>
        <h1 className='text-lg font-baseFont text-gray-800'>설정</h1>
        <Link
          className='text-gray-950 p-1 rounded-full hover:bg-gray-200 transition app-no-drag'
          href='/home'
        >
          <Home size={20} className='text-mainTheme cursor-pointer' />
        </Link>
      </header>

      {/* === 피드백 메시지 (Alert 대체) === */}
      {feedback && (
        <div
          className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 p-3 rounded-lg shadow-xl flex items-center gap-3 transition-all duration-300 ${
            feedback.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          role='alert'
        >
          {feedback.type === 'success' ? (
            <Sparkles size={20} />
          ) : (
            <X size={20} />
          )}
          <span className='font-bold'>{feedback.message}</span>
          <button
            onClick={hideFeedback}
            className='ml-4 opacity-70 hover:opacity-100 transition'
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main className='flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto mt-14 bg-gray-50'>
        {/* === 색상 설정 영역 (2x2 Grid) === */}
        <div className='flex justify-between items-center border-b'>
          <h2 className='text-xl font-baseFont font-bold text-gray-950  pb-2'>
            테마 색상
          </h2>
          <button
            className={`text-xl font-bold flex gap-1 ${
              gradientMode ? 'text-gray-950' : 'text-gray-500'
            } pb-2`}
            onClick={toggleGradientMode}
          >
            {gradientMode ? (
              <Sparkles className='text-mainTheme' size={20} />
            ) : (
              <Sparkles className='opacity-50' size={20} />
            )}
            {gradientMode ? (
              <ToggleRight className='text-mainTheme' size={20} />
            ) : (
              <ToggleLeft className='opacity-50' size={20} />
            )}
          </button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {/* 1. 메인 (Main) 색상 */}
          <div className='grid grid-cols-[1fr_2fr] items-center gap-4'>
            <label className='text-gray-950 text-sm font-baseFont'>메인</label>
            <div className='flex gap-4 justify-end'>
              <input
                type='color'
                name='mainTheme'
                value={mainTheme}
                className='h-10 w-16 cursor-pointer rounded-md'
                onChange={(e) => setSingleColor('mainTheme', e.target.value)}
              />
              {/* 그라데이션 끝 색상 자리 */}
              <input
                type='color'
                name='mainThemeEnd'
                value={mainThemeEnd}
                disabled={isEndColorDisabled}
                className={`h-10 w-16 cursor-pointer rounded-md ${
                  gradientMode ? 'opacity-100' : 'opacity-50'
                }`} // 단일 색상 모드로 가정하고 투명도 적용
                onChange={(e) =>
                  setSingleGradientColor('mainThemeEnd', e.target.value)
                }
              />
            </div>
          </div>

          {/* 2. 배경 (Background) 색상 */}
          <div className='grid grid-cols-[1fr_2fr] items-center gap-4'>
            <label className='text-gray-950 text-sm font-baseFont'>배경</label>
            <div className='flex gap-4 justify-end'>
              <input
                type='color'
                name='bgTheme'
                value={bgTheme}
                className='h-10 w-16 cursor-pointer rounded-md'
                onChange={(e) => setSingleColor('bgTheme', e.target.value)}
              />
              {/* 그라데이션 끝 색상 자리 */}
              <input
                type='color'
                name='bgThemeEnd'
                value={bgThemeEnd}
                disabled={isEndColorDisabled}
                className={`h-10 w-16 cursor-pointer rounded-md ${
                  gradientMode ? 'opacity-100' : 'opacity-50'
                }`}
                onChange={(e) =>
                  setSingleGradientColor('bgThemeEnd', e.target.value)
                }
              />
            </div>
          </div>

          {/* 3. 패널 (Panel) 색상 */}
          <div className='grid grid-cols-[1fr_2fr] items-center gap-4'>
            <label className='text-gray-950 text-sm font-baseFont'>패널</label>
            <div className='flex gap-4 justify-end'>
              <input
                type='color'
                name='panelTheme'
                value={panelTheme}
                className='h-10 w-16 cursor-pointer rounded-md'
                onChange={(e) => setSingleColor('panelTheme', e.target.value)}
              />
              {/* 그라데이션 끝 색상 자리 */}
              <input
                type='color'
                name='panelThemeEnd'
                value={panelThemeEnd}
                disabled={isEndColorDisabled}
                className={`h-10 w-16 cursor-pointer rounded-md ${
                  gradientMode ? 'opacity-100' : 'opacity-50'
                }`}
                onChange={(e) =>
                  setSingleGradientColor('panelThemeEnd', e.target.value)
                }
              />
            </div>
          </div>

          {/* 4. 버블 (Bubble) 색상 */}
          <div className='grid grid-cols-[1fr_2fr] items-center gap-4'>
            <label className='text-gray-950 text-sm font-baseFont'>버블</label>
            <div className='flex gap-4 justify-end'>
              <input
                type='color'
                name='bubbleTheme'
                value={bubbleTheme}
                className='h-10 w-16 cursor-pointer rounded-md'
                onChange={(e) => setSingleColor('bubbleTheme', e.target.value)}
              />
              {/* 그라데이션 끝 색상 자리 */}
              <input
                type='color'
                name='bubbleThemeEnd'
                value={bubbleThemeEnd}
                disabled={isEndColorDisabled}
                className={`h-10 w-16 cursor-pointer rounded-md ${
                  gradientMode ? 'opacity-100' : 'opacity-50'
                }`}
                onChange={(e) =>
                  setSingleGradientColor('bubbleThemeEnd', e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* === 배경 이미지 설정 영역 === */}
        <h2 className='text-xl font-baseFont font-bold text-gray-950 border-b pb-2'>
          배경 이미지
        </h2>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleBackgroundAttachment}
            className='flex items-center gap-2 border font-baseFont text-gray-950 p-2 border-gray-300 rounded-md hover:bg-gray-50 transition'
          >
            <ImageIcon size={20} />
            첨부파일 선택
          </button>
          {bgAttachmentPath ? (
            <button
              onClick={handleRemoveBackgroundAttachment}
              className='text-red-600 border font-baseFont border-red-300 p-2 rounded-md hover:bg-red-50 transition text-sm'
            >
              배경 이미지 제거
            </button>
          ) : (
            <p className='text-gray-500 text-sm'>
              현재 설정된 배경 이미지가 없습니다.
            </p>
          )}
        </div>

        {bgAttachmentPath && (
          <div className='text-sm text-gray-700 truncate p-2 font-baseFont bg-gray-100 rounded-md'>
            현재 경로: {bgAttachmentPath}
          </div>
        )}

        {/* === 글꼴 설정 영역 === */}
        <h2 className='text-xl font-baseFont font-bold text-gray-950 mt-6 border-b pb-2'>
          글꼴
        </h2>
        <div className='grid grid-cols-2 gap-4'>
          {fontOptions.map((font) => {
            const isSelected = baseFont === font.cssValue;
            return (
              <button
                key={font.label}
                onClick={() => handleFontSelect(font.cssValue)}
                className={`border-2 p-4 rounded-md transition duration-150 hover:bg-gray-50 
                  ${
                    isSelected
                      ? 'border-mainTheme ring-2 ring-mainTheme'
                      : 'border-gray-300'
                  }
                `}
                // 버튼 내부에 폰트 클래스를 적용하여 미리보기
                style={{ fontFamily: font.cssValue }}
              >
                <span className='text-gray-950 text-lg font-normal'>
                  {font.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* === 글자 크기 설정 영역 === */}
        <h2 className='text-xl font-baseFont font-bold text-gray-950 mt-6 border-b pb-2'>
          글자 크기 ({fontSize})
        </h2>
        <input
          type='range'
          min={12} // 10px 대신 12px부터 시작하는 것이 좋음
          max={24} // 30px 대신 24px까지 조절하는 것이 일반적
          value={currentFontSizeValue}
          onChange={handleFontSizeChange}
          className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-mainTheme'
        />

        {/* === 미리 보기 영역 === */}
        <h2 className='text-xl font-baseFont font-bold text-gray-950 mt-6 border-b pb-2'>
          미리 보기
        </h2>
        <div
          className={`border border-gray-300 rounded-md mb-4 h-40 p-4 ${
            bgAttachmentPath
              ? 'bg-attachment'
              : gradientMode
              ? 'bg-gradient-to-r from-bgTheme to-bgThemeEnd'
              : 'bg-bgTheme'
          } flex flex-col justify-center items-center overflow-hidden`}
          // 배경색과 폰트 스타일을 직접 적용하여 미리보기
        >
          <p
            className={`text-gray-950 text-dynamic font-normal text-center bg-white/70 backdrop-blur-sm p-2 rounded-md`}
            style={{
              fontFamily: baseFont,
              // 글자 크기 적용
              fontSize: fontSize,
            }}
          >
            현재 설정된 글꼴과 글자 크기({fontSize})를 보여주는 미리보기
            창입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
