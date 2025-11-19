import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useColorStore } from '../components/store';
import '../styles/globals.css';

// Light/Dark 모드에 따라 실제 Hex 코드를 반환하는 헬퍼 함수
const getTextColor = (mode: 'light' | 'dark'): string => {
  // 'light' 모드 (배경이 어두움): 텍스트는 밝은 흰색
  // 'dark' 모드 (배경이 밝음): 텍스트는 어두운 검은색
  return mode === 'light' ? '#FFFFFF' : '#111827'; // #111827은 Tailwind gray-900과 유사
};

function MyApp({ Component, pageProps }: AppProps) {
  // 필요한 모든 상태를 구독합니다. 특히 새로 추가된 TextMode들을 포함합니다.
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
    bgAttachmentPath,
    // ⭐ 새로 구독하는 대비 모드 상태
    bubbleTextMode,
    panelTextMode,
    mainTextMode,
    bgTextMode,
  } = useColorStore();

  useEffect(() => {
    const rootStyle = document.documentElement.style;

    // 1. 색상 변수 설정 (배경/패널/버블/메인)
    rootStyle.setProperty('--color-bg', bgTheme);
    rootStyle.setProperty('--color-bubble', bubbleTheme);
    rootStyle.setProperty('--color-panel', panelTheme);
    rootStyle.setProperty('--color-main', mainTheme);

    // 2. 그라데이션 끝 색상 변수 설정
    rootStyle.setProperty('--color-bg-end', bgThemeEnd);
    rootStyle.setProperty('--color-bubble-end', bubbleThemeEnd);
    rootStyle.setProperty('--color-panel-end', panelThemeEnd);
    rootStyle.setProperty('--color-main-end', mainThemeEnd);

    // 3. 글꼴 변수 설정
    rootStyle.setProperty('--base-font-family', baseFont);
    rootStyle.setProperty('--font-size', fontSize);

    // 4. ⭐ 텍스트 대비 색상 변수 설정 (자동 계산된 모드 적용)
    // 각 영역의 배경색에 가장 적합한 텍스트 색상 Hex 코드를 설정합니다.
    rootStyle.setProperty('--text-bubble', getTextColor(bubbleTextMode));
    rootStyle.setProperty('--text-panel', getTextColor(panelTextMode));
    rootStyle.setProperty('--text-main', getTextColor(mainTextMode));
    rootStyle.setProperty('--text-bg', getTextColor(bgTextMode));

    // 5. 배경 이미지 경로 변수 설정
    if (bgAttachmentPath) {
      // Windows 경로의 백슬래시(\)를 슬래시(/)로 변환
      const normalizedPath = bgAttachmentPath.replace(/\\/g, '/');
      // 경로를 URL 인코딩 (특수 문자, 공백 처리)
      const encodedPath = encodeURIComponent(normalizedPath);
      // 최종 URL 형식으로 CSS 변수에 할당
      rootStyle.setProperty(
        '--bg-attachment-path',
        `url("attachment-asset://${encodedPath}")`
      );
    } else {
      // 경로가 없을 경우 'none'을 할당하여 이미지 미표시 상태를 명확히 함
      rootStyle.setProperty('--bg-attachment-path', 'none');
    }
  }, [
    bgTheme,
    bubbleTheme,
    panelTheme,
    mainTheme,
    baseFont,
    fontSize,
    bgThemeEnd,
    bubbleThemeEnd,
    panelThemeEnd,
    mainThemeEnd,
    bgAttachmentPath,
    // ⭐ 대비 모드 상태를 의존성 배열에 추가하여 변경 시 리렌더링 유발
    bubbleTextMode,
    panelTextMode,
    mainTextMode,
    bgTextMode,
  ]);

  return <Component {...pageProps} />;
}

export default MyApp;
