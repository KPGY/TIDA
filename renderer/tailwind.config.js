/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
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
        // Tailwind 클래스: font-custom-base로 사용 가능
        baseFont: 'var(--base-font-family)',
        // 주의: 이 변수 값은 CSS의 font-family 리스트여야 합니다.
        // 예: baseFont: 'Noto Sans KR, sans-serif'
      },

      fontSize: {
        // Tailwind 클래스: text-dynamic로 사용 가능하며, --font-size 변수를 참조합니다.
        dynamic: ['var(--font-size)', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        // 드래그 가능 영역 클래스 정의
        '.app-drag': {
          '-webkit-app-region': 'drag',
        },
        // 드래그 불가능 영역 클래스 정의
        '.app-no-drag': {
          '-webkit-app-region': 'no-drag',
        },
      };

      addUtilities(newUtilities, ['responsive', 'hover']);
    }),
  ],
};
