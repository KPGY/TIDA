import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useColorStore } from '../components/store';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  // 필요한 네 가지 상태를 모두 구독합니다.
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
  } = useColorStore();

  useEffect(() => {
    const rootStyle = document.documentElement.style;

    // 네 가지 색상을 각각 다른 CSS 변수에 설정합니다. (이 부분은 유지)
    rootStyle.setProperty('--color-bg', bgTheme);
    rootStyle.setProperty('--color-bubble', bubbleTheme);
    rootStyle.setProperty('--color-panel', panelTheme);
    rootStyle.setProperty('--color-main', mainTheme);
    rootStyle.setProperty('--color-bg-end', bgThemeEnd);
    rootStyle.setProperty('--color-bubble-end', bubbleThemeEnd);
    rootStyle.setProperty('--color-panel-end', panelThemeEnd);
    rootStyle.setProperty('--color-main-end', mainThemeEnd);
    rootStyle.setProperty('--base-font-family', baseFont);
    rootStyle.setProperty('--font-size', fontSize);
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
  ]);

  // ⭐️ 수정된 부분: Component를 불필요한 div로 감싸지 않고 바로 반환합니다.
  return <Component {...pageProps} />;
}

export default MyApp;
