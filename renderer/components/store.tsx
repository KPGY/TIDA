import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ------------------------------------------
// 1. 인터페이스 정의: 색상, 글꼴, 그리고 그라데이션 상태
// ------------------------------------------

interface ThemeColors {
  bgTheme: string;
  bubbleTheme: string;
  panelTheme: string;
  mainTheme: string;
}

interface FontState {
  baseFont: string;
  fontSize: string;
}

// ⭐ 1-1. 그라데이션 색상 상태 추가
interface GradientColors {
  bgThemeEnd: string;
  bubbleThemeEnd: string;
  panelThemeEnd: string;
  mainThemeEnd: string;
}

// ⭐ 1-2. 모드 토글 상태 추가
interface ModeState {
  gradientMode: boolean; // 그라데이션 모드 ON/OFF
}

interface BackgroundState {
  bgAttachmentPath: string | null; // 배경 이미지 첨부 파일 경로
}

// 최종 상태는 모두 통합
interface SettingState
  extends ThemeColors,
    FontState,
    GradientColors,
    BackgroundState,
    ModeState {
  setSingleColor: (key: keyof ThemeColors, color: string) => void;
  setSingleGradientColor: (key: keyof GradientColors, color: string) => void; // 그라데이션 끝 색상 설정 함수
  setFontStyle: (key: keyof FontState, value: string) => void;
  setGradientMode: (mode: boolean) => void; // 그라데이션 모드 토글 함수
  setbgAttachmentPath: (path: string) => void;
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

// ⭐ 2-1. 그라데이션 끝 색상 기본값 (시작 색상과 동일하게 설정)
const defaultGradientColors: GradientColors = {
  bgThemeEnd: '#FFFFFF',
  bubbleThemeEnd: '#000000',
  panelThemeEnd: '#F5F5F5',
  mainThemeEnd: '#3B82F6',
};

const defaultFont: FontState = {
  baseFont: 'sans-serif',
  fontSize: '16px',
};

// ⭐ 2-2. 모드 기본값
const defaultMode: ModeState = {
  gradientMode: false,
};

const defaultBackground = {
  bgAttachmentPath: '',
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
      ...defaultGradientColors, // ⭐ 그라데이션 색상 추가
      ...defaultMode, // ⭐ 모드 상태 추가 // [색상] 단일 색상 업데이트 함수 (시작 색상)
      ...defaultBackground,

      setSingleColor: (key, color) => {
        console.log(`Zustand: ${key} 색상 변경됨 -> ${color}`);
        set({ [key]: color } as unknown as Partial<SettingState>);
      }, // ⭐ [색상] 단일 그라데이션 끝 색상 업데이트 함수

      setSingleGradientColor: (key, color) => {
        console.log(`Zustand: ${key} (End) 색상 변경됨 -> ${color}`);
        set({ [key]: color } as unknown as Partial<SettingState>);
      }, // [글꼴] 글꼴 스타일(클래스 또는 크기) 업데이트 함수

      setFontStyle: (key, value) => {
        console.log(`Zustand: ${key} 설정 변경됨 -> ${value}`);
        set({ [key]: value } as unknown as Partial<SettingState>);
      }, // ⭐ [모드] 그라데이션 모드 토글 함수

      setGradientMode: (mode) => {
        console.log(`Zustand: Gradient Mode 변경됨 -> ${mode}`);
        set({ gradientMode: mode });
      },

      setbgAttachmentPath: (path: string) => {
        console.log(`Zustand: Background Attachment Path 변경됨 -> ${path}`);
        set({ bgAttachmentPath: path } as unknown as Partial<SettingState>);
      },
    }),
    {
      // 💾 LocalStorage에 저장될 키 이름
      name: 'tida-setting-config',
    }
  )
);
