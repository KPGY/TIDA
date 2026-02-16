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
  Pencil,
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
    updateTodo,
  } = useColorStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- 상태 관리 ---
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoContent, setNewTodoContent] = useState('');
  const [newSubTodos, setNewSubTodos] = useState<
    { id: string; content: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editingSubTodoId, setEditingSubTodoId] = useState<string | null>(null);
  const [subInputContent, setSubInputContent] = useState('');
  const subInputRef = useRef<HTMLInputElement>(null);

  const [openSubTodoIds, setOpenSubTodoIds] = useState<string[]>([]);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  // --- 공통 핸들러 ---
  const toggleSubFolder = (id: string) => {
    setOpenSubTodoIds((prev) =>
      prev.includes(id)
        ? prev.filter((openId) => openId !== id)
        : [...prev, id],
    );
  };

  const todayDate = useMemo(() => {
    return `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (${currentDate.toLocaleDateString('ko-KR', { weekday: 'short' })})`;
  }, [currentDate]);

  // --- 추가(Add) 관련 핸들러 ---
  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingTodoId(null); // 수정 모드 해제
    setNewTodoContent('');
    setNewSubTodos([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSave = () => {
    if (!newTodoContent.trim()) {
      setIsAdding(false);
      return;
    }
    addTodo(
      newTodoContent,
      newSubTodos.map((s) => s.content).filter((c) => c.trim() !== ''),
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

  // --- 수정(Edit) 관련 핸들러 ---
  const handleEditMode = () => {
    const targetTodo = todos.find((t) => t.id === selectedTodoId);
    if (!targetTodo) return;

    setIsAdding(false); // 추가 모드 해제
    setEditingTodoId(selectedTodoId);
    setNewTodoContent(targetTodo.content);
    setNewSubTodos(
      targetTodo.subTodos?.map((s) => ({ id: s.id, content: s.content })) || [],
    );
    setMenuPos(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSaveEdit = () => {
    if (!editingTodoId) return;
    // Store에 업데이트 요청 (서브투두 객체 배열 그대로 전달)
    updateTodo(editingTodoId, newTodoContent, newSubTodos);
    setEditingTodoId(null);
    setNewTodoContent('');
    setNewSubTodos([]);
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setNewTodoContent('');
    setNewSubTodos([]);
  };

  // --- 서브투두 단독 추가 핸들러 ---
  const handleSaveSubTodo = (parentId: string) => {
    if (!subInputContent.trim()) {
      setEditingSubTodoId(null);
      return;
    }
    addSubTodo(parentId, subInputContent);
    setSubInputContent('');
    setEditingSubTodoId(null);
    if (!openSubTodoIds.includes(parentId)) {
      setOpenSubTodoIds((prev) => [...prev, parentId]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedTodoId(id);
  };

  useEffect(() => {
    const closeMenu = () => setMenuPos(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // --- UI 컴포넌트 덩어리들 ---

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

  const renderTodoItemMain = (todo) => {
    const totalCount = todo.subTodos?.length || 0;
    const completedCount =
      todo.subTodos?.filter((sub) => sub.completed).length || 0;
    const percentage =
      totalCount > 0
        ? Math.floor((completedCount / totalCount) * 100)
        : todo.completed
          ? 100
          : 0;

    return (
      <div className='flex items-center justify-between rounded-full bg-white shadow-md hover:shadow-lg transition-shadow'>
        <button
          className={`relative flex items-center justify-center h-12 w-12 flex-shrink-0 ${totalCount > 0 ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={() => toggleTodo(todo.id)}
          disabled={totalCount > 0}
        >
          <ProgressCircle size={36} percentage={percentage} />
          {todo.completed ? (
            <Check className='absolute text-mainTheme' size={24} />
          ) : (
            totalCount > 0 &&
            completedCount > 0 && (
              <div className='text-mainTheme absolute text-[10px] font-bold'>
                {percentage}%
              </div>
            )
          )}
        </button>
        <div
          className={`flex-grow font-bold ml-2 min-w-0 ${todo.completed ? 'line-through text-gray-400' : 'text-black'}`}
        >
          <p className='break-words leading-tight pr-4'>{todo.content}</p>
        </div>
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
          {totalCount > 0 && (
            <button onClick={() => toggleSubFolder(todo.id)} className='p-1'>
              {openSubTodoIds.includes(todo.id) ? (
                <ChevronUp size={20} className='text-gray-500' />
              ) : (
                <ChevronDown size={20} className='text-gray-500' />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTodoItemSub = (todo) => (
    <div className='pl-8 mt-2 flex flex-col gap-2'>
      {todo.subTodos.map((sub) => (
        <div
          key={sub.id}
          className='flex items-center rounded-full bg-white/95 p-2 shadow-sm'
        >
          <button onClick={() => toggleTodo(sub.id)}>
            <Circle
              className={sub.completed ? 'text-mainTheme' : 'text-gray-200'}
              size={18}
            />
          </button>
          <p
            className={`text-sm font-bold ml-3 ${sub.completed ? 'line-through text-gray-400' : 'text-black'}`}
          >
            {sub.content}
          </p>
        </div>
      ))}
    </div>
  );

  const AddTodoItemSub = (todo) => (
    <div className='pl-10 mt-2 pr-4 animate-in slide-in-from-top-1 duration-200'>
      <div className='flex items-center bg-white rounded-full px-3 py-1 border-2 border-mainTheme shadow-sm'>
        <div className='w-1.5 h-1.5 rounded-full bg-mainTheme mr-1' />
        <input
          ref={subInputRef}
          className='outline-none text-sm flex-grow font-bold text-black min-w-0'
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
  );

  // --- 핵심: 수정 모드 UI ---
  const renderEditMode = () => (
    <div className='flex flex-col mb-4 animate-in fade-in slide-in-from-top-4 duration-300'>
      <div className='flex items-center justify-between rounded-full bg-white shadow-lg p-1 border-2 border-mainTheme'>
        <div className='p-1'>
          <Circle className='text-gray-300' size={32} />
        </div>
        <input
          ref={inputRef}
          value={newTodoContent}
          onChange={(e) => setNewTodoContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
          className='flex-grow bg-transparent outline-none text-sm font-bold text-black min-w-0'
        />
        <div className='flex gap-1'>
          <button
            onClick={handleSaveEdit}
            className='p-2 bg-mainTheme rounded-full text-white'
          >
            <Check size={20} />
          </button>
          <button
            onClick={handleCancelEdit}
            className='p-2 bg-gray-100 rounded-full'
          >
            <X size={20} className='text-black' />
          </button>
        </div>
      </div>
      <div className='pl-8 mt-2 flex flex-col gap-2'>
        {newSubTodos.map((sub, idx) => (
          <div
            key={sub.id}
            className='flex items-center rounded-full bg-white/95 p-2 shadow-sm'
          >
            <Circle className='text-gray-200 ml-1' size={18} />
            <input
              className='text-sm font-bold ml-3 text-black outline-none flex-grow'
              value={sub.content}
              onChange={(e) => {
                const next = [...newSubTodos];
                next[idx] = { ...next[idx], content: e.target.value };
                setNewSubTodos(next);
              }}
            />
            <button
              onClick={() =>
                setNewSubTodos((prev) => prev.filter((_, i) => i !== idx))
              }
              className='pr-2'
            >
              <Minus size={16} className='text-red-400' />
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setNewSubTodos([
              ...newSubTodos,
              { id: Date.now().toString(), content: '' },
            ])
          }
          className='text-xs font-bold text-mainTheme self-start ml-2 flex items-center gap-1'
        >
          <Plus size={12} /> 하위 작업 추가
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`w-full min-h-screen flex flex-col ${bgAttachmentPath ? 'bg-attachment bg-fixed' : gradientMode ? 'bg-gradient-to-r from-bgTheme to-bgThemeEnd' : 'bg-bgTheme'}`}
    >
      <header
        className={`flex justify-between p-4 items-center fixed ${gradientMode ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd' : 'bg-panelTheme'} top-0 left-0 right-0 z-10 app-drag`}
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

        {/* 상단 [추가 모드] 입력창 */}
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
                className='flex-grow bg-transparent outline-none text-sm font-bold text-black min-w-0'
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
                  className='p-2 bg-gray-300 rounded-full'
                >
                  <X size={20} />
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
                    value={sub.content}
                    onChange={(e) => {
                      const next = [...newSubTodos];
                      next[idx] = { ...next[idx], content: e.target.value };
                      setNewSubTodos(next);
                    }}
                    placeholder='하위 작업'
                    className='outline-none text-sm flex-grow font-bold text-black'
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
                onClick={() =>
                  setNewSubTodos([
                    ...newSubTodos,
                    { id: Date.now().toString(), content: '' },
                  ])
                }
                className='text-xs font-bold text-mainTheme self-start ml-2 flex items-center gap-1'
              >
                <Plus size={12} /> 하위 작업 추가
              </button>
            </div>
          </div>
        )}

        {/* 리스트 출력 */}
        {todos.length > 0
          ? todos.map((todo) => (
              <div
                key={todo.id}
                className='flex flex-col mb-2'
                onContextMenu={(e) => handleContextMenu(e, todo.id)}
              >
                {editingTodoId === todo.id ? (
                  renderEditMode() // 수정 모드
                ) : (
                  <>
                    {renderTodoItemMain(todo)}
                    {editingSubTodoId === todo.id ? AddTodoItemSub(todo) : null}
                    {openSubTodoIds.includes(todo.id) && todo.subTodos
                      ? renderTodoItemSub(todo)
                      : null}
                  </>
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
            className='w-full px-4 py-1 text-green-500 hover:bg-green-50 flex items-center gap-2 text-sm font-bold'
            onClick={handleEditMode}
          >
            <Pencil size={16} /> 수정하기
          </button>
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
