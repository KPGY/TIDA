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
  BrushCleaning,
  Trash2,
  X,
  Minus,
  ListPlus,
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
    addSubTodo,
  } = useColorStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- 메인 투두 입력 관련 상태 ---
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoContent, setNewTodoContent] = useState('');
  const [newSubTodos, setNewSubTodos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- 기존 리스트 내 하위 투두(Sub-todo) 입력 관련 상태 ---
  const [editingSubTodoId, setEditingSubTodoId] = useState<string | null>(null);
  const [subInputContent, setSubInputContent] = useState('');
  const subInputRef = useRef<HTMLInputElement>(null);

  // --- UI 상태 (수정됨: 단일 string에서 string 배열로 변경) ---
  const [openSubTodoIds, setOpenSubTodoIds] = useState<string[]>([]);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

  // 폴더 열고 닫기 핸들러 (개별 독립 작동)
  const toggleSubFolder = (id: string) => {
    setOpenSubTodoIds((prev) =>
      prev.includes(id) ? prev.filter((openId) => openId !== id) : [...prev, id]
    );
  };

  // 입력 모드 활성화 및 포커스
  const handleStartAdd = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // 메인 투두 저장 로직
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

  // --- 기존 리스트에 하위 작업 저장 (스토어 연동) ---
  const handleSaveSubTodo = (parentId: string) => {
    if (!subInputContent.trim()) {
      setEditingSubTodoId(null);
      return;
    }
    addSubTodo(parentId, subInputContent);
    setSubInputContent('');
    setEditingSubTodoId(null);

    // 저장 후 해당 리스트가 닫혀있다면 열어줌
    if (!openSubTodoIds.includes(parentId)) {
      setOpenSubTodoIds((prev) => [...prev, parentId]);
    }
  };

  // 우클릭 메뉴 핸들러
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedTodoId(id);
  };

  const ProgressCircle = ({ percentage, size = 48 }) => {
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <svg width={size} height={size} className='transform -rotate-90'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='currentColor'
          strokeWidth='3'
          fill='transparent'
          className='text-gray-200'
        />
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

      <main className='flex flex-col pt-16 pb-24 px-4 relative'>
        <div className='flex justify-end mb-4'>
          <button
            onClick={() => removeCompleteTodo()}
            className='p-1 text-red-500 bg-red-100 flex items-center gap-2 font-bold rounded-lg transition-colors'
          >
            <BrushCleaning size={16} />
          </button>
        </div>

        {/* --- 상단 메인 투두 입력 폼 --- */}
        {isAdding && (
          <div className='flex flex-col mb-4 animate-in fade-in slide-in-from-top-4 duration-300'>
            <div className='flex items-center justify-between rounded-full bg-white shadow-lg p-1 border-2 border-mainTheme'>
              <div className='p-1'>
                <Circle className='text-gray-300' size={32} />
              </div>
              <input
                ref={inputRef}
                value={newTodoContent}
                onChange={(e) => setNewTodoContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder='할 일을 입력하세요'
                className='flex-grow bg-transparent outline-none text-sm font-bold text-black min-w-0 break-words'
              />
              <div className='flex gap-1'>
                <button
                  onClick={handleSave}
                  className='p-2 bg-mainTheme rounded-full text-white'
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={handleCancel}
                  className='p-2 bg-gray-100 rounded-full'
                >
                  <X size={20} className='text-black' />
                </button>
              </div>
            </div>

            <div className='mt-2 pl-10 pr-4 flex flex-col gap-2'>
              {newSubTodos.map((sub, idx) => (
                <div
                  key={idx}
                  className='flex items-center bg-white rounded-full px-3 py-1 border-2 border-mainTheme shadow-sm'
                >
                  <div className='w-1.5 h-1.5 rounded-full bg-mainTheme mr-1' />
                  <input
                    className='outline-none text-sm flex-grow font-bold text-black'
                    value={sub}
                    onChange={(e) => {
                      const next = [...newSubTodos];
                      next[idx] = e.target.value;
                      setNewSubTodos(next);
                    }}
                    placeholder='하위 작업'
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
                className='flex flex-col mb-2'
                onContextMenu={(e) => handleContextMenu(e, todo.id)}
              >
                <div className='flex items-center justify-between rounded-full bg-white shadow-md hover:shadow-lg transition-shadow'>
                  <button
                    className={`relative flex items-center justify-center h-12 w-12 flex-shrink-0 ${
                      todo.subTodos.length > 0
                        ? 'cursor-default'
                        : 'cursor-pointer'
                    }`}
                    onClick={() => toggleTodo(todo.id)}
                    disabled={todo.subTodos.length > 0}
                  >
                    <ProgressCircle
                      size={36}
                      percentage={
                        todo.subTodos.length > 0
                          ? (todo.subTodos.filter((sub) => sub.completed)
                              .length /
                              todo.subTodos.length) *
                            100
                          : todo.completed
                          ? 100
                          : 0
                      }
                    />
                    {todo.completed ? (
                      <Check className='absolute text-mainTheme' size={24} />
                    ) : (
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
                            <div className='text-mainTheme absolute text-[10px] font-bold'>
                              {percentage}%
                            </div>
                          );
                        }
                        return null;
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

                  {/* 조작 버튼 영역 */}
                  <div className='flex items-center mr-2'>
                    <button
                      onClick={() => {
                        setEditingSubTodoId(todo.id);
                        setTimeout(() => subInputRef.current?.focus(), 50);
                      }}
                      className='text-gray-400 p-1 hover:bg-mainTheme/10 rounded-full transition-colors'
                    >
                      <ListPlus size={20} />
                    </button>

                    {todo.subTodos && todo.subTodos.length > 0 && (
                      <button
                        onClick={() => toggleSubFolder(todo.id)}
                        className='p-1'
                      >
                        {openSubTodoIds.includes(todo.id) ? (
                          <ChevronUp size={20} className='text-gray-500' />
                        ) : (
                          <ChevronDown size={20} className='text-gray-500' />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 하위 작업 입력창 */}
                {editingSubTodoId === todo.id && (
                  <div className='pl-10 mt-2 pr-4 animate-in slide-in-from-top-1 duration-200'>
                    <div className='flex items-center bg-white rounded-full px-3 py-1 border-2 border-mainTheme shadow-sm'>
                      <div className='w-1.5 h-1.5 rounded-full bg-mainTheme mr-1' />
                      <input
                        ref={subInputRef}
                        className='outline-none text-sm flex-grow font-bold text-black'
                        value={subInputContent}
                        onChange={(e) => setSubInputContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveSubTodo(todo.id);
                          if (e.key === 'Escape') setEditingSubTodoId(null);
                        }}
                        placeholder='하위 작업'
                      />
                      <button
                        onClick={() => handleSaveSubTodo(todo.id)}
                        className='text-mainTheme ml-1'
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubTodoId(null);
                          setSubInputContent('');
                        }}
                        className='text-gray-400 ml-1'
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 하위 작업 리스트 출력 (여러 개 동시 펼침 가능) */}
                {openSubTodoIds.includes(todo.id) && todo.subTodos && (
                  <div className='pl-8 mt-2 flex flex-col gap-2'>
                    {todo.subTodos.map((sub) => (
                      <div
                        key={sub.id}
                        className='flex items-center rounded-full bg-white/95 p-2 shadow-sm'
                      >
                        <button onClick={() => toggleTodo(sub.id)}>
                          <Circle
                            className={
                              sub.completed ? 'text-mainTheme' : 'text-gray-200'
                            }
                            size={18}
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
                <p className='font-bold bg-mainTheme p-2 px-4 rounded-full text-white'>
                  할 일을 추가해 보세요!
                </p>
              </div>
            )}
      </main>

      {/* 우클릭 메뉴 */}
      {menuPos && (
        <div
          className='fixed z-[100] bg-white shadow-2xl rounded-xl py-2 w-40'
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <button
            onClick={() => {
              if (selectedTodoId) removeTodo(selectedTodoId);
            }}
            className='w-full px-4 py-1 text-red-500 hover:bg-red-50 text-sm flex items-center gap-2 font-bold'
          >
            <Trash2 size={16} /> 삭제하기
          </button>
        </div>
      )}

      {/* 플로팅 버튼 */}
      {!isAdding && (
        <button
          className='fixed bottom-8 right-8 z-50 p-4 bg-mainTheme rounded-full shadow-2xl active:scale-90 transition-transform'
          style={{ color: mainTextMode === 'dark' ? '#000' : '#fff' }}
          onClick={handleStartAdd}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default TodoList;
