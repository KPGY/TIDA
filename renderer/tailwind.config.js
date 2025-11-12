/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export const content = [
  './renderer/pages/**/*.{js,ts,jsx,tsx}',
  './renderer/components/**/*.{js,ts,jsx,tsx}',
];
export const theme = {
  extend: {
    colors: {
      // Tailwind 클래스: bg-bgTheme, text-mainTheme 등으로 사용 가능
      bgTheme: 'var(--color-bg)',
      bubbleTheme: 'var(--color-bubble)',
      panelTheme: 'var(--color-panel)',
      mainTheme: 'var(--color-main)',
      bgThemeEnd: 'var(--color-bg-end)',
      bubbleThemeEnd: 'var(--color-bubble-end)',
      panelThemeEnd: 'var(--color-panel-end)',
      mainThemeEnd: 'var(--color-main-end)',
    },

    fontFamily: {
      // Tailwind 클래스: font-baseFont로 사용 가능
      baseFont: 'var(--base-font-family)', // 예: baseFont: 'Noto Sans KR, sans-serif'
    },

    fontSize: {
      // Tailwind 클래스: text-dynamic로 사용 가능하며, --font-size 변수를 참조합니다.
      dynamic: ['var(--font-size)', { lineHeight: '1.5' }],
    },
  },
};

export const plugins = [
  plugin(function ({ addUtilities }) {
    const newUtilities = {
      // 드래그 가능 영역 클래스 정의
      '.app-drag': {
        '-webkit-app-region': 'drag',
      }, // 드래그 불가능 영역 클래스 정의
      '.app-no-drag': {
        '-webkit-app-region': 'no-drag',
      },
      // ⭐ 커스텀 배경 이미지 속성 정의
      '.bg-attachment': {
        'background-image': 'var(--bg-attachment-path)',
        'background-size': 'cover',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
      },
    };

    addUtilities(newUtilities, ['responsive', 'hover']);
  }),
];
