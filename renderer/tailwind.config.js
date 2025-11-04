// tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // -----------------------------------------------------------------
    // [중요] 이 'colors' 객체는 Tailwind 기본 색상을 덮어씁니다.
    // 기본 색상을 유지하려면 이 블록을 삭제하거나 주석 처리하고
    // 아래 'extend.colors'에 필요한 색상만 추가하세요.
    /*
    colors: {
      white: colors.white,
      gray: colors.gray,
      blue: colors.blue,
      slate: colors.slate,
    },
    */
    // -----------------------------------------------------------------

    // 'extend'에 정의해야 기본값을 유지하면서 새 유틸리티가 추가됩니다.
    extend: {
      // 1. 동적 테마 색상 유틸리티 (CSS 변수 사용)
      colors: {
        'theme-bg': 'var(--background-color)', // bg-theme-bg 클래스
        'theme-text': 'var(--font-color)', // text-theme-text 클래스
        'theme-main': 'var(--main-color)', // border-theme-main, text-theme-main 등

        // 만약 기본 색상 외 'slate' 등 특정 색상만 쓰고 싶다면 여기에 추가
        // slate: colors.slate,
      },

      // 2. 동적 글꼴 크기 유틸리티
      fontSize: {
        theme: 'var(--font-size)', // text-theme 클래스
      },

      // 3. 동적 배경 이미지 유틸리티
      backgroundImage: {
        theme: 'var(--background-image)', // bg-theme 클래스
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
};
