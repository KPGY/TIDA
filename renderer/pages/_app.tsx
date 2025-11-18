import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useColorStore } from '../components/store';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  // 필요한 상태들을 구독합니다.
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
    opacityLevel,
  } = useColorStore();

  useEffect(() => {
    const rootStyle = document.documentElement.style; // 1. 색상 변수 설정

    const opacityValue = parseFloat(opacityLevel) / 100;
    rootStyle.setProperty('opacity', opacityValue.toString());

    rootStyle.setProperty('--color-bg', bgTheme);
    rootStyle.setProperty('--color-bubble', bubbleTheme);
    rootStyle.setProperty('--color-panel', panelTheme);
    rootStyle.setProperty('--color-main', mainTheme);
    rootStyle.setProperty('--color-bg-end', bgThemeEnd);
    rootStyle.setProperty('--color-bubble-end', bubbleThemeEnd);
    rootStyle.setProperty('--color-panel-end', panelThemeEnd);
    rootStyle.setProperty('--color-main-end', mainThemeEnd); // 2. 글꼴 변수 설정
    rootStyle.setProperty('--base-font-family', baseFont);
    rootStyle.setProperty('--font-size', fontSize); // 3. ⭐ 배경 이미지 경로 변수 설정 (경로 변환 및 인코딩 처리)

    if (bgAttachmentPath) {
      // Windows 경로의 백슬래시(\)를 슬래시(/)로 변환
      const normalizedPath = bgAttachmentPath.replace(/\\/g, '/'); // 경로를 URL 인코딩 (특수 문자, 공백 처리)
      const encodedPath = encodeURIComponent(normalizedPath); // 최종 URL 형식으로 CSS 변수에 할당
      rootStyle.setProperty(
        '--bg-attachment-path',
        `url("attachment-asset://${encodedPath}")` // ⭐ url() 안에 "" 추가하여 안전성 확보
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
    opacityLevel,
  ]); // ⭐️ Component를 바로 반환합니다.

  return <Component {...pageProps} />;
}

export default MyApp;
