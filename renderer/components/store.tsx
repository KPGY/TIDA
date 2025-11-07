import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ------------------------------------------
// 1. 인터페이스 정의: 색상 및 글꼴 상태
// ------------------------------------------

interface ThemeColors {
  bgTheme: string;
  bubbleTheme: string;
  panelTheme: string;
  mainTheme: string;
}

interface FontState {
  baseFont: string; // 폰트 클래스 (예: 'font-serif', 'font-sans')
  fontSize: string; // 폰트 크기 (예: '16px', '20px')
}

// ColorState가 이제 ThemeColors와 FontState를 모두 포함합니다.
interface SettingState extends ThemeColors, FontState {
  setSingleColor: (key: keyof ThemeColors, color: string) => void;
  setFontStyle: (key: keyof FontState, value: string) => void; // 글꼴 업데이트 함수
}

// ------------------------------------------
// 2. 기본값 정의
// ------------------------------------------

const defaultColors: ThemeColors = {
  bgTheme: '#FFFFFF',
  bubbleTheme: '#000000',
  panelTheme: '#F5F5F5',
  mainTheme: '#3B82F6',
};

const defaultFont: FontState = {
  baseFont: 'sans-serif',
  fontSize: '16px',
};

// ------------------------------------------
// 3. 스토어 생성 및 Persist 적용
// ------------------------------------------

export const useColorStore = create(
  persist<SettingState>(
    (set) => ({
      // 기본 상태 통합
      ...defaultColors,
      ...defaultFont,

      // [색상] 단일 색상 업데이트 함수
      setSingleColor: (key, color) => {
        console.log(`Zustand: ${key} 색상 변경됨 -> ${color}`);
        // 동적 키 설정
        set({ [key]: color } as unknown as Partial<SettingState>);
      },

      // [글꼴] 글꼴 스타일(클래스 또는 크기) 업데이트 함수
      setFontStyle: (key, value) => {
        console.log(`Zustand: ${key} 설정 변경됨 -> ${value}`);
        set({ [key]: value } as unknown as Partial<SettingState>);
      },
    }),
    {
      // 💾 LocalStorage에 저장될 키 이름
      name: 'tida-setting-config',
    }
  )
);
