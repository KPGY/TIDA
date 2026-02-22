import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getContrastMode } from './textColor'; // 해당 경로에 유틸리티가 있는지 확인하세요.

// ------------------------------------------
// 1. 인터페이스 정의
// ------------------------------------------

export interface SubTodo {
  id: string;
  content: string;
  completed: boolean;
  order: number;
}

export interface Todolist {
  id: string;
  content: string;
  completed: boolean;
  subTodos: SubTodo[];
  order: number;
  color?: string; // 특정 투두의 개별 테두리 색상
}

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

interface GradientColors {
  bgThemeEnd: string;
  bubbleThemeEnd: string;
  panelThemeEnd: string;
  mainThemeEnd: string;
}

interface ModeState {
  gradientMode: boolean;
}

interface BackgroundState {
  bgAttachmentPath: string | null;
}

interface ContrastState {
  bgTextMode: 'light' | 'dark';
  bubbleTextMode: 'light' | 'dark';
  panelTextMode: 'light' | 'dark';
  mainTextMode: 'light' | 'dark';
}

// 최종 상태 및 액션 통합 인터페이스
interface SettingState
  extends
    ThemeColors,
    FontState,
    GradientColors,
    BackgroundState,
    ModeState,
    ContrastState {
  // [설정 관련 액션]
  setSingleColor: (key: keyof ThemeColors, color: string) => void;
  setSingleGradientColor: (key: keyof GradientColors, color: string) => void;
  setFontStyle: (key: keyof FontState, value: string) => void;
  setGradientMode: (mode: boolean) => void;
  setbgAttachmentPath: (path: string) => void;
  reorderTodos: (newTodos: Todolist[]) => void;

  // [투두 관련 액션]
  todos: Todolist[];
  addTodo: (content: string, subContents?: string[], color?: string) => void;
  addSubTodo: (parentId: string, content: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  removeCompleteTodo: () => void;
  updateTodo: (
    id: string,
    content: string,
    subTodos: { id: string; content: string }[],
    color?: string,
  ) => void;
  clearCompleted: () => void;
}

// ------------------------------------------
// 2. 초기 기본값 정의
// ------------------------------------------

const defaultColors: ThemeColors = {
  bgTheme: '#FFFFFF',
  bubbleTheme: '#000000',
  panelTheme: '#F5F5F5',
  mainTheme: '#3B82F6',
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

const defaultBackground: BackgroundState = {
  bgAttachmentPath: '',
};

const defaultContrast: ContrastState = {
  bgTextMode: getContrastMode(defaultColors.bgTheme),
  bubbleTextMode: getContrastMode(defaultColors.bubbleTheme),
  panelTextMode: getContrastMode(defaultColors.panelTheme),
  mainTextMode: getContrastMode(defaultColors.mainTheme),
};

// ------------------------------------------
// 3. Zustand 스토어 생성
// ------------------------------------------

export const useColorStore = create<SettingState>()(
  persist(
    (set, get) => ({
      ...defaultColors,
      ...defaultFont,
      ...defaultGradientColors,
      ...defaultMode,
      ...defaultBackground,
      ...defaultContrast,
      todos: [],

      // --- 설정(Theme) 액션 ---
      setSingleColor: (key, color) => {
        const newContrastMode = getContrastMode(color);
        const textKeyMap: { [K in keyof ThemeColors]: keyof ContrastState } = {
          bgTheme: 'bgTextMode',
          bubbleTheme: 'bubbleTextMode',
          panelTheme: 'panelTextMode',
          mainTheme: 'mainTextMode',
        };
        const contrastKey = textKeyMap[key];

        set({
          [key]: color,
          [contrastKey]: newContrastMode,
        } as Partial<SettingState>);
      },

      setSingleGradientColor: (key, color) => {
        set({ [key]: color } as Partial<SettingState>);
      },

      setFontStyle: (key, value) => {
        set({ [key]: value } as Partial<SettingState>);
      },

      setGradientMode: (mode) => {
        set({ gradientMode: mode });
      },

      setbgAttachmentPath: (path: string) => {
        set({ bgAttachmentPath: path });
      },

      // --- 투두(Todo) 액션 ---

      // 신규 투두 추가 (색상 포함)
      addTodo: (content, subContents = [], color = 'transparent') => {
        const newTodo: Todolist = {
          id: crypto.randomUUID(),
          content,
          completed: false,
          order: get().todos.length,
          color: color,
          subTodos: subContents
            .filter((sub) => sub.trim() !== '')
            .map((sub, index) => ({
              id: crypto.randomUUID(),
              content: sub,
              completed: false,
              order: index,
            })),
        };

        set((state) => ({
          todos: [...state.todos, newTodo],
        }));
      },

      // 하위 투두 단독 추가
      addSubTodo: (parentId, content) => {
        if (content.trim() === '') return;
        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.id === parentId) {
              const newSub: SubTodo = {
                id: crypto.randomUUID(),
                content: content,
                completed: false,
                order: todo.subTodos.length,
              };
              return {
                ...todo,
                subTodos: [...todo.subTodos, newSub],
                completed: false, // 하위 추가 시 완료 상태 해제
              };
            }
            return todo;
          }),
        }));
      },

      // 완료 상태 토글 (메인 및 서브)
      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((todo) => {
            // 메인 투두를 클릭한 경우
            if (todo.id === id) {
              const nextStatus = !todo.completed;
              return {
                ...todo,
                completed: nextStatus,
                subTodos: todo.subTodos.map((sub) => ({
                  ...sub,
                  completed: nextStatus,
                })),
              };
            }

            // 서브 투두 중 하나를 클릭한 경우
            const hasSub = todo.subTodos.some((sub) => sub.id === id);
            if (hasSub) {
              const updatedSubTodos = todo.subTodos.map((sub) =>
                sub.id === id ? { ...sub, completed: !sub.completed } : sub,
              );
              // 모든 서브 투두가 완료되었을 때만 메인도 완료 처리
              const allSubCompleted = updatedSubTodos.every(
                (sub) => sub.completed,
              );
              return {
                ...todo,
                subTodos: updatedSubTodos,
                completed: allSubCompleted,
              };
            }

            return todo;
          }),
        }));
      },

      removeTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }));
      },

      removeCompleteTodo: () => {
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        }));
      },

      // 투두 수정 (내용, 하위 리스트, 색상 통합 업데이트)
      updateTodo: (id, content, subTodos, color) => {
        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.id === id) {
              return {
                ...todo,
                content: content,
                color: color !== undefined ? color : todo.color,
                subTodos: subTodos.map((s, index) => {
                  // 기존에 있던 서브투두라면 완료 상태 유지
                  const existingSub = todo.subTodos.find(
                    (old) => old.id === s.id,
                  );
                  return {
                    id: s.id || crypto.randomUUID(),
                    content: s.content,
                    completed: existingSub ? existingSub.completed : false,
                    order: index,
                  };
                }),
              };
            }
            return todo;
          }),
        }));
      },

      reorderTodos: (newTodos) => {
        set({ todos: newTodos });
      },

      clearCompleted: () => {
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        }));
      },
    }),
    {
      name: 'tida-setting-config', // 로컬스토리지 키
    },
  ),
);
