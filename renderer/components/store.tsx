import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getContrastMode } from './textColor'; // 기존 유틸리티 함수

// ------------------------------------------
// 1. 인터페이스 정의
// ------------------------------------------

export interface Todolist {
  id: string;
  content: string;
  completed: boolean;
  subTodos: SubTodo[]; // 재귀적 구조
  order: number;
}

interface SubTodo {
  id: string;
  content: string;
  completed: boolean;
  order: number;
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
  extends ThemeColors,
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

  // [투두 관련 액션]
  todos: Todolist[];
  addTodo: (content: string, subContents?: string[]) => void; // 서브 투두 배열 추가
  addSubTodo: (parentId: string, content: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  removeCompleteTodo: () => void;
  updateTodo: (id: string, content: string) => void;
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
// 3. Zustand 스토어 생성 (Persist 적용)
// ------------------------------------------

export const useColorStore = create<SettingState>()(
  persist(
    (set, get) => ({
      // --- 초기 상태 값 통합 ---
      ...defaultColors,
      ...defaultFont,
      ...defaultGradientColors,
      ...defaultMode,
      ...defaultBackground,
      ...defaultContrast,
      todos: [],

      // --- 설정(Theme) 액션 구현 ---
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

      // --- 투두(Todo) 액션 구현 ---
      addTodo: (content, subContents = []) => {
        // 메인 투두 생성
        const newTodo: Todolist = {
          id: crypto.randomUUID(),
          content,
          completed: false,
          order: get().todos.length,
          // 서브 투두 문자열 배열을 Todolist 객체 배열로 변환
          subTodos: subContents
            .filter((sub) => sub.trim() !== '') // 빈 내용 제외
            .map((sub, index) => ({
              id: crypto.randomUUID(),
              content: sub,
              completed: false,
              subTodos: [], // 3단계 계층은 현재 빈 배열로 시작
              order: index,
            })),
        };

        set((state) => ({
          todos: [...state.todos, newTodo],
        }));
      },

      addSubTodo: (parentId, content) => {
        if (content.trim() === '') return;

        set(
          (state): Partial<SettingState> => ({
            // 1. 반환 타입을 Partial<SettingState>로 명시
            todos: state.todos.map((todo): Todolist => {
              // 2. 각 요소가 Todolist임을 명시
              if (todo.id === parentId) {
                const newSub: SubTodo = {
                  id: crypto.randomUUID(),
                  content: content,
                  completed: false,
                  order:
                    todo.subTodos.length > 0
                      ? Math.max(...todo.subTodos.map((s) => s.order)) + 1
                      : 0,
                };

                // 반드시 Todolist 인터페이스의 모든 필드가 포함되도록 반환
                return {
                  ...todo,
                  subTodos: [...todo.subTodos, newSub],
                  completed: false,
                };
              }
              return todo; // 조건에 맞지 않아도 Todolist 타입 객체 반환
            }),
          })
        );
      },

      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((todo) => {
            // 1. 메인 투두를 클릭한 경우
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

            // 2. 서브 투두 중 하나를 클릭한 경우 탐색
            const hasSub = todo.subTodos.some((sub) => sub.id === id);
            if (hasSub) {
              const updatedSubTodos = todo.subTodos.map((sub) =>
                sub.id === id ? { ...sub, completed: !sub.completed } : sub
              );
              // 모든 서브 투두가 완료되었는지 확인
              const allSubCompleted = updatedSubTodos.every(
                (sub) => sub.completed
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

      // Zustand store 내부 액션
      removeCompleteTodo: () => {
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        }));
      },

      updateTodo: (id, content) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, content } : todo
          ),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        }));
      },
    }),
    {
      name: 'tida-setting-config', // LocalStorage 키
    }
  )
);
