import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getContrastMode } from './textColor';

// ------------------------------------------
// 1. 인터페이스 정의: 색상, 글꼴, 그리고 그라데이션 상태
// ------------------------------------------

interface ThemeColors {
  bgTheme: string;
  bubbleTheme: string;
  panelTheme: string;
  mainTheme: string; // 예: 버튼 색상
}

interface FontState {
  baseFont: string;
  fontSize: string;
}

interface GradientColors {
  bgThemeEnd: string;
  bubbleThemeEnd: string;
  panelThemeEnd: string;
  mainThemeEnd: string;
}

interface ModeState {
  gradientMode: boolean; // 그라데이션 모드 ON/OFF
}

interface BackgroundState {
  bgAttachmentPath: string | null; // 배경 이미지 첨부 파일 경로
}

// ⭐ 새로 추가된: 대비 모드 상태
interface ContrastState {
  bgTextMode: 'light' | 'dark';
  bubbleTextMode: 'light' | 'dark';
  panelTextMode: 'light' | 'dark';
  mainTextMode: 'light' | 'dark';
}

// 최종 상태 통합
interface SettingState
  extends ThemeColors,
    FontState,
    GradientColors,
    BackgroundState,
    ModeState,
    ContrastState {
  // ⭐ 통합
  setSingleColor: (key: keyof ThemeColors, color: string) => void;
  setSingleGradientColor: (key: keyof GradientColors, color: string) => void;
  setFontStyle: (key: keyof FontState, value: string) => void;
  setGradientMode: (mode: boolean) => void;
  setbgAttachmentPath: (path: string) => void;
}

// ==========================================
// 3. 기본값 정의
// ==========================================

const defaultColors: ThemeColors = {
  bgTheme: '#FFFFFF', // 밝은 배경 기본값
  bubbleTheme: '#000000', // 어두운 버블 기본값
  panelTheme: '#F5F5F5', // 밝은 패널 기본값
  mainTheme: '#3B82F6', // 파란색 버튼 기본값
};

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

const defaultMode: ModeState = {
  gradientMode: false,
};

const defaultBackground = {
  bgAttachmentPath: '',
};

// ⭐ 3-1. 대비 모드 기본값 (초기 배경색을 기반으로 계산)
const defaultContrast: ContrastState = {
  bgTextMode: getContrastMode(defaultColors.bgTheme),
  bubbleTextMode: getContrastMode(defaultColors.bubbleTheme),
  panelTextMode: getContrastMode(defaultColors.panelTheme),
  mainTextMode: getContrastMode(defaultColors.mainTheme),
};

// ==========================================
// 4. 스토어 생성 및 Persist 적용
// ==========================================

export const useColorStore = create(
  persist<SettingState>(
    (set, get) => ({
      // 기본 상태 통합
      ...defaultColors,
      ...defaultFont,
      ...defaultGradientColors,
      ...defaultMode,
      ...defaultBackground,
      ...defaultContrast, // ⭐ 대비 모드 상태 통합

      // [색상] 단일 색상 업데이트 함수 (대비 자동 계산 로직 포함)
      setSingleColor: (key, color) => {
        // 1. 새 배경색의 대비 모드를 계산
        const newContrastMode = getContrastMode(color);

        // 2. 배경 키에 대응하는 텍스트 모드 키 매핑
        const textKeyMap: { [K in keyof ThemeColors]: keyof ContrastState } = {
          bgTheme: 'bgTextMode',
          bubbleTheme: 'bubbleTextMode',
          panelTheme: 'panelTextMode',
          mainTheme: 'mainTextMode',
        };
        const contrastKey = textKeyMap[key];

        // 3. 배경색과 계산된 대비 모드를 한 번에 업데이트
        set({
          [key]: color,
          [contrastKey]: newContrastMode,
        } as unknown as Partial<SettingState>);
      },

      // [그라데이션] 끝 색상 업데이트 함수 (대비 계산은 시작 색상을 기준으로 하므로 로직 불필요)
      setSingleGradientColor: (key, color) => {
        set({ [key]: color } as unknown as Partial<SettingState>);
      },

      // [글꼴] 글꼴 스타일(클래스 또는 크기) 업데이트 함수
      setFontStyle: (key, value) => {
        set({ [key]: value } as unknown as Partial<SettingState>);
      },

      // [모드] 그라데이션 모드 토글 함수
      setGradientMode: (mode) => {
        set({ gradientMode: mode });
      },

      // [배경] 배경 이미지 경로 설정 함수
      setbgAttachmentPath: (path: string) => {
        set({ bgAttachmentPath: path } as unknown as Partial<SettingState>);
      },
    }),
    {
      // 💾 LocalStorage에 저장될 키 이름
      name: 'tida-setting-config',
    }
  )
);
