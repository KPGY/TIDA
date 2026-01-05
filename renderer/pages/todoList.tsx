import Link from 'next/link';
import {
  Home,
  Search,
  ListTodo,
  Settings,
  Plus,
  Circle,
  ChevronDown,
  ChevronUp,
  Check,
  Cat,
  Trash2,
  X,
  Minus,
} from 'lucide-react';
import { useColorStore } from '../components/store';
import { useState, useMemo, useEffect, useRef } from 'react';

const TodoList = () => {
  const {
    gradientMode,
    bgAttachmentPath,
    todos,
    toggleTodo,
    removeTodo,
    addTodo,
    removeCompleteTodo,
    mainTextMode,
  } = useColorStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- 인라인 입력 관련 상태 ---
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoContent, setNewTodoContent] = useState('');
  const [newSubTodos, setNewSubTodos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- 기존 상태 ---
  const [openSubTodoId, setOpenSubTodoId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

  // 입력 모드 활성화 및 포커스
  const handleStartAdd = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // 투두 저장 로직
  const handleSave = () => {
    if (!newTodoContent.trim()) {
      setIsAdding(false);
      return;
    }
    addTodo(
      newTodoContent,
      newSubTodos.filter((s) => s.trim() !== '')
    );
    setNewTodoContent('');
    setNewSubTodos([]);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewTodoContent('');
    setNewSubTodos([]);
  };

  // 우클릭 및 기타 로직 (기존 유지)
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedTodoId(id);
  };

  const ProgressCircle = ({ percentage, size = 48 }) => {
    const radius = (size - 4) / 2; // 테두리 두께를 고려한 반지름
    const circumference = 2 * Math.PI * radius; // 원주 (2 * π * r)

    // 퍼센트에 따른 오프셋 계산 (0일 때 다 비어있고, 100일 때 다 채워짐)
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <svg width={size} height={size} className='transform -rotate-90'>
        {/* 배경 원 (연한 테두리) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='currentColor'
          strokeWidth='3'
          fill='transparent'
          className='text-gray-200'
        />
        {/* 진행 상태 원 (애니메이션 테두리) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='currentColor'
          strokeWidth='3'
          fill='transparent'
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
          strokeLinecap='round'
          className='text-mainTheme'
        />
      </svg>
    );
  };

  useEffect(() => {
    const closeMenu = () => setMenuPos(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const todayDate = useMemo(() => {
    return `${
      currentDate.getMonth() + 1
    }월 ${currentDate.getDate()}일 (${currentDate.toLocaleDateString('ko-KR', {
      weekday: 'short',
    })})`;
  }, [currentDate]);

  return (
    <div
      className={`w-full min-h-screen flex flex-col ${
        bgAttachmentPath
          ? 'bg-attachment bg-fixed'
          : gradientMode
          ? 'bg-gradient-to-r from-bgTheme to-bgThemeEnd'
          : 'bg-bgTheme'
      }`}
    >
      <header
        className={`flex justify-between p-4 items-center fixed ${
          gradientMode
            ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd'
            : 'bg-panelTheme'
        } top-0 left-0 right-0 z-10 app-drag`}
      >
        <p className='text-textPanelTheme text-dynamic font-baseFont'>
          {todayDate}
        </p>
        <div className='flex gap-4 app-no-drag items-center'>
          <Link href='./home'>
            <Home size={20} className='text-mainTheme' />
          </Link>
          <Search size={20} className='text-mainTheme' />
          <Link href='./home'>
            <ListTodo size={20} className='text-mainTheme' />
          </Link>
          <Link href='/setting'>
            <Settings size={20} className='text-mainTheme' />
          </Link>
        </div>
      </header>

      <main className='flex flex-col pt-20 pb-24 px-4 relative'>
        {/* --- 인라인 입력 폼 --- */}
        <div className='flex justify-end mb-4'>
          <button
            onClick={() => {
              // 모든 완료된 투두를 지우는 함수라면 인자 없이 호출하거나
              // 로직에 맞춰 수정이 필요할 수 있습니다.
              removeCompleteTodo();
            }}
            className='p-2 text-red-500 bg-red-100 text-sm flex items-center gap-2 font-bold rounded-lg transition-colors'
          >
            <Trash2 size={16} /> 완료된 항목 삭제
          </button>
        </div>
        {isAdding && (
          <div className='flex flex-col mb-6 animate-in fade-in slide-in-from-top-4 duration-300'>
            <div className='flex items-center justify-between rounded-full bg-white shadow-lg p-1 border-2 border-mainTheme'>
              <div className='p-2'>
                <Circle className='text-gray-300' size={32} />
              </div>
              <input
                ref={inputRef}
                value={newTodoContent}
                onChange={(e) => setNewTodoContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder='할 일을 입력하세요...'
                className='flex-grow bg-transparent outline-none font-bold text-black min-w-0 break-words'
              />
              <div className='flex gap-1 pr-2'>
                <button
                  onClick={handleSave}
                  className='p-2 bg-mainTheme rounded-full text-white hover:scale-105 transition-transform'
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={handleCancel}
                  className='p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200'
                >
                  <X size={20} className='text-black' />
                </button>
              </div>
            </div>

            {/* 인라인 서브 투두 추가 영역 */}
            <div className='mt-2 pl-10 flex flex-col gap-2'>
              {newSubTodos.map((sub, idx) => (
                <div
                  key={idx}
                  className='flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-white'
                >
                  <div className='w-1.5 h-1.5 rounded-full bg-mainTheme' />
                  <input
                    className='bg-transparent outline-none text-sm flex-grow text-black'
                    value={sub}
                    onChange={(e) => {
                      const next = [...newSubTodos];
                      next[idx] = e.target.value;
                      setNewSubTodos(next);
                    }}
                    placeholder='하위 작업...'
                  />
                  <button
                    onClick={() =>
                      setNewSubTodos((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <Minus size={14} className='text-gray-400' />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setNewSubTodos([...newSubTodos, ''])}
                className='text-xs font-bold text-mainTheme self-start ml-2 flex items-center gap-1'
              >
                <Plus size={12} /> 하위 작업 추가
              </button>
            </div>
          </div>
        )}

        {/* --- 리스트 출력 영역 --- */}
        {todos.length > 0
          ? todos.map((todo) => (
              <div
                key={todo.id}
                className='flex flex-col mb-4'
                onContextMenu={(e) => handleContextMenu(e, todo.id)}
              >
                <div className='flex items-center justify-between rounded-full bg-white shadow-md hover:shadow-lg transition-shadow'>
                  <button
                    className={`relative flex items-center justify-center h-14 w-14 flex-shrink-0 ${
                      todo.subTodos.length > 0
                        ? 'cursor-default'
                        : 'cursor-pointer'
                    }`}
                    onClick={() => toggleTodo(todo.id)}
                    disabled={todo.subTodos.length > 0}
                  >
                    <ProgressCircle
                      size={48}
                      percentage={
                        todo.subTodos.length > 0
                          ? (todo.subTodos.filter((sub) => sub.completed)
                              .length /
                              todo.subTodos.length) *
                            100
                          : todo.completed
                          ? 100
                          : 0 // 하위 작업 없을 때: 완료면 100%, 아니면 0%
                      }
                    />
                    {todo.completed ? (
                      <Check className='absolute text-mainTheme' size={28} />
                    ) : (
                      // 1. 완료된 서브 투두 개수 계산
                      // 2. 완료된 게 하나라도 있을 때만 퍼센트 노출
                      (() => {
                        const completedCount = todo.subTodos.filter(
                          (sub) => sub.completed
                        ).length;
                        const totalCount = todo.subTodos.length;

                        if (totalCount > 0 && completedCount > 0) {
                          const percentage = Math.floor(
                            (completedCount / totalCount) * 100
                          );
                          return (
                            <div className='text-mainTheme absolute text-xs font-bold'>
                              {percentage}%
                            </div>
                          );
                        }
                        return null; // 완료된 서브가 없으면 아무것도 안 띄움
                      })()
                    )}
                  </button>
                  <div
                    className={`flex-grow font-bold ml-2 min-w-0 ${
                      todo.completed
                        ? 'line-through text-gray-400'
                        : 'text-black'
                    }`}
                  >
                    <p className='break-words leading-tight pr-4'>
                      {todo.content}
                    </p>
                  </div>
                  {todo.subTodos && todo.subTodos.length > 0 && (
                    <button
                      onClick={() =>
                        setOpenSubTodoId(
                          openSubTodoId === todo.id ? null : todo.id
                        )
                      }
                      className='mr-4'
                    >
                      {openSubTodoId === todo.id ? (
                        <ChevronUp size={20} className='text-gray-500' />
                      ) : (
                        <ChevronDown size={20} className='text-gray-500' />
                      )}
                    </button>
                  )}
                </div>

                {openSubTodoId === todo.id && todo.subTodos && (
                  <div className='pl-10 mt-2 flex flex-col gap-2'>
                    {todo.subTodos.map((sub) => (
                      <div
                        key={sub.id}
                        className='flex items-center rounded-full bg-white p-2 shadow-sm'
                      >
                        <button onClick={() => toggleTodo(sub.id)}>
                          <Circle
                            className={
                              todo.subTodos.find((s) => s.id === sub.id)
                                ?.completed
                                ? 'text-mainTheme'
                                : 'text-gray-200'
                            }
                            size={20}
                          />
                        </button>
                        <p
                          className={`text-sm font-bold ml-3 ${
                            sub.completed
                              ? 'line-through text-gray-400'
                              : 'text-black'
                          }`}
                        >
                          {sub.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          : !isAdding && (
              <div className='flex flex-col items-center justify-center mt-20'>
                <Cat size={64} className='text-mainTheme mb-4' />
                <p className='font-bold bg-mainTheme p-2 rounded-full'>
                  할 일을 추가해 보세요!
                </p>
              </div>
            )}
      </main>

      {/* 우클릭 메뉴 (기존과 동일) */}
      {menuPos && (
        <div
          className='fixed z-[100] bg-white shadow-2xl rounded-xl py-2 w-40'
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <button
            onClick={() => {
              if (selectedTodoId) removeTodo(selectedTodoId);
            }}
            className='w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 text-sm flex items-center gap-2 font-bold'
          >
            <Trash2 size={16} /> 삭제하기
          </button>
        </div>
      )}

      {/* 플로팅 버튼: 클릭 시 인라인 입력창 활성화 */}
      {!isAdding && (
        <button
          className='fixed bottom-8 right-8 z-50 p-4 bg-mainTheme rounded-full shadow-2xl active:scale-90 transition-transform'
          style={{ color: mainTextMode === 'dark' ? '#000' : '#fff' }}
          onClick={handleStartAdd}
        >
          <Plus size={32} />
        </button>
      )}
    </div>
  );
};

export default TodoList;
