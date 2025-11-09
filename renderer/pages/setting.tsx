'use client';
import React, { ChangeEvent, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useColorStore } from '../components/store';
import { useState } from 'react';

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
    setGradientMode,
    setSingleColor,
    setSingleGradientColor,
    setFontStyle, // 폰트 상태 변경 함수
  } = useColorStore();

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

  return (
    <React.Fragment>
      <Head>
        <title>TIDA - 설정</title>
      </Head>
      <header className='flex p-4 justify-between items-center bg-gray-50 shadow-sm'>
        <h1 className='text-lg font-semibold text-gray-800'>설정</h1>
        <Link
          className='text-gray-950 p-1 rounded-full hover:bg-gray-200 transition'
          href='/home'
        >
          <Home size={20} className='text-gray-600 cursor-pointer' />
        </Link>
      </header>

      <main className='flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto'>
        {/* === 색상 설정 영역 (2x2 Grid) === */}
        <div className='flex justify-between items-center border-b'>
          <h2 className='text-xl font-bold text-gray-950  pb-2'>테마 색상</h2>
          <button
            className={`text-xl font-bold ${
              gradientMode ? 'text-gray-950' : 'text-gray-500'
            } pb-2`}
            onClick={toggleGradientMode}
          >
            그라데이션 모드
          </button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {/* 1. 메인 (Main) 색상 */}
          <div className='grid grid-cols-[1fr_2fr] items-center gap-4'>
            <label className='text-gray-950 text-sm font-medium'>메인</label>
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
            <label className='text-gray-950 text-sm font-medium'>배경</label>
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
            <label className='text-gray-950 text-sm font-medium'>패널</label>
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
            <label className='text-gray-950 text-sm font-medium'>버블</label>
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

        {/* === 글꼴 설정 영역 === */}
        <h2 className='text-xl font-bold text-gray-950 mt-6 border-b pb-2'>
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
        <h2 className='text-xl font-bold text-gray-950 mt-6 border-b pb-2'>
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
        <h2 className='text-xl font-bold text-gray-950 mt-6 border-b pb-2'>
          미리 보기
        </h2>
        <div
          className={`border border-gray-300 ${
            gradientMode
              ? 'bg-gradient-to-r from-bgTheme to-bgThemeEnd'
              : 'bg-bgTheme'
          } rounded-md mb-4 h-40 p-4 flex flex-col justify-center items-center`}
          // 배경색과 폰트 스타일을 직접 적용하여 미리보기
        >
          <p
            className={`text-gray-950 text-dynamic font-normal`}
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
    </React.Fragment>
  );
}
