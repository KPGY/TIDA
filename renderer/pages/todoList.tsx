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
  Palette,
  GripVertical, // 드래그 핸들 아이콘 추가
} from 'lucide-react';
import { useColorStore } from '../components/store';
import { useState, useMemo, useEffect, useRef } from 'react';

// --- dnd-kit 임포트 ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 1. 개별 Sortable 아이템 컴포넌트 ---
// useSortable 훅은 반드시 별도의 컴포넌트 내부에 있어야 합니다.
const SortableTodoItem = ({
  todo,
  editingTodoId,
  renderEditMode,
  renderTodoItemMain,
  editingSubTodoId,
  AddTodoItemSub,
  openSubTodoIds,
  renderTodoItemSub,
  handleContextMenu,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='relative flex flex-col mb-2 group'
      onContextMenu={(e) => handleContextMenu(e, todo.id)}
    >
      {editingTodoId === todo.id ? (
        renderEditMode()
      ) : (
        <>
          <div className='flex items-center gap-1'>
            {/* 드래그 핸들: attributes와 listeners를 여기에만 부여하여 
                텍스트 클릭 시에는 드래그가 안 되고 핸들을 잡아야만 드래그되게 합니다. */}
            <div
              {...attributes}
              {...listeners}
              className='cursor-grab active:cursor-grabbing text-mainTheme hover:text-mainTheme transition-colors'
            >
              <GripVertical size={20} />
            </div>
            <div className='flex-grow'>{renderTodoItemMain(todo)}</div>
          </div>
          {editingSubTodoId === todo.id ? AddTodoItemSub(todo) : null}
          {openSubTodoIds.includes(todo.id) && todo.subTodos
            ? renderTodoItemSub(todo)
            : null}
        </>
      )}
    </div>
  );
};

// --- 2. 메인 TodoList 컴포넌트 ---
const TodoList = () => {
  const {
    gradientMode,
    bgAttachmentPath,
    todos,
    toggleTodo,
    removeTodo,
    addTodo,
    removeCompleteTodo,
    addSubTodo,
    updateTodo,
    reorderTodos, // 스토어에 이 함수가 있다고 가정합니다. (없다면 set({todos: newArray}))
  } = useColorStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoContent, setNewTodoContent] = useState('');
  const [newSubTodos, setNewSubTodos] = useState<
    { id: string; content: string }[]
  >([]);
  const [selectedColor, setSelectedColor] = useState('transparent');
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingSubTodoId, setEditingSubTodoId] = useState<string | null>(null);
  const [subInputContent, setSubInputContent] = useState('');
  const subInputRef = useRef<HTMLInputElement>(null);
  const [openSubTodoIds, setOpenSubTodoIds] = useState<string[]>([]);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colors = ['#FFB6CC', '#FFFACA', '#BBDED6', '#C0BEE5'];

  // --- dnd-kit 센서 설정 ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 이상 움직여야 드래그가 시작되도록 설정 (클릭 이벤트 간섭 방지)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id);
      const newIndex = todos.findIndex((t) => t.id === over.id);

      const newOrderedTodos = arrayMove(todos, oldIndex, newIndex);
      // 스토어의 reorderTodos 함수를 호출하여 순서를 저장합니다.
      reorderTodos(newOrderedTodos);
    }
  };

  // --- 기존 핸들러들 (유지) ---
  const toggleSubFolder = (id: string) => {
    setOpenSubTodoIds((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id],
    );
  };

  const todayDate = useMemo(() => {
    return `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (${currentDate.toLocaleDateString('ko-KR', { weekday: 'short' })})`;
  }, [currentDate]);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingTodoId(null);
    setNewTodoContent('');
    setNewSubTodos([]);
    setSelectedColor('transparent');
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
      selectedColor,
    );
    setNewTodoContent('');
    setNewSubTodos([]);
    setSelectedColor('transparent');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewTodoContent('');
    setNewSubTodos([]);
    setSelectedColor('transparent');
  };

  const handleEditMode = () => {
    const targetTodo = todos.find((t) => t.id === selectedTodoId);
    if (!targetTodo) return;
    setIsAdding(false);
    setEditingTodoId(selectedTodoId);
    setNewTodoContent(targetTodo.content);
    setNewSubTodos(
      targetTodo.subTodos?.map((s) => ({ id: s.id, content: s.content })) || [],
    );
    setSelectedColor(targetTodo.color || 'transparent');
    setMenuPos(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSaveEdit = () => {
    if (!editingTodoId) return;
    updateTodo(editingTodoId, newTodoContent, newSubTodos, selectedColor);
    setEditingTodoId(null);
    setNewTodoContent('');
    setNewSubTodos([]);
    setSelectedColor('transparent');
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setNewTodoContent('');
    setNewSubTodos([]);
    setSelectedColor('transparent');
  };

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

  // --- UI 컴포넌트들 (기존 코드 유지) ---
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
      <div
        style={{ border: `3px solid ${todo.color || 'transparent'}` }}
        className='flex items-center justify-between rounded-full bg-white shadow-md hover:shadow-lg transition-all w-full'
      >
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
          <p className='break-words leading-tight pr-4 text-sm'>
            {todo.content}
          </p>
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
    <div className='pl-12 mt-2 flex flex-col gap-2'>
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
    <div className='pl-14 mt-2 pr-4 animate-in slide-in-from-top-1 duration-200'>
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

  const renderEditMode = () => (
    <div className='flex flex-col mb-4 animate-in fade-in slide-in-from-top-4 duration-300 w-full pl-'>
      <div
        style={{ border: `3px solid ${selectedColor}` }}
        className='flex items-center justify-between rounded-full bg-white shadow-lg p-1'
      >
        <div className='p-1'>
          <Circle className='text-gray-300' size={36} />
        </div>
        <input
          ref={inputRef}
          value={newTodoContent}
          onChange={(e) => setNewTodoContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
          className='flex-grow bg-transparent outline-none text-sm font-bold text-black min-w-0'
        />
        <div className='flex gap-1 relative'>
          <button
            type='button'
            onClick={() => setShowColorPicker(!showColorPicker)}
            className='p-2 text-mainTheme rounded-full'
          >
            <Palette size={20} />
          </button>
          {showColorPicker && (
            <div className='absolute top-full mt-2 right-0 bg-white shadow-xl border border-gray-100 rounded-xl p-3 z-[60] flex gap-2'>
              <button
                onClick={() => {
                  setSelectedColor('transparent');
                  setShowColorPicker(false);
                }}
                className='w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400'
              >
                <X size={12} />
              </button>
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setShowColorPicker(false);
                  }}
                  className='w-6 h-6 rounded-md shadow-sm hover:scale-110 transition-transform'
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
          <button
            onClick={handleSaveEdit}
            className='p-2 bg-mainTheme rounded-full text-white'
          >
            <Check size={20} />
          </button>
          <button
            onClick={handleCancelEdit}
            className='p-2 bg-gray-100 rounded-full text-black'
          >
            <X size={20} />
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

        {/* 상단 [추가 모드] */}
        {isAdding && (
          <div className='flex flex-col mb-4 animate-in fade-in slide-in-from-top-4 duration-300'>
            <div
              style={{ border: `3px solid ${selectedColor}` }}
              className='flex items-center justify-between rounded-full bg-white shadow-lg p-1 ml-8'
            >
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
              <div className='flex gap-1 relative'>
                <button
                  type='button'
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className='p-2 text-mainTheme rounded-full'
                >
                  <Palette size={20} />
                </button>
                {showColorPicker && (
                  <div className='absolute top-full mt-2 right-0 bg-white shadow-xl border border-gray-100 rounded-xl p-3 z-[60] flex gap-2'>
                    <button
                      onClick={() => {
                        setSelectedColor('transparent');
                        setShowColorPicker(false);
                      }}
                      className='w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400'
                    >
                      <X size={12} />
                    </button>
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          setShowColorPicker(false);
                        }}
                        className='w-6 h-6 rounded-md shadow-sm'
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
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
            <div className='mt-2 pl-12 pr-4 flex flex-col gap-2'>
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

        {/* --- DndContext 적용 리스트 --- */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {todos.length > 0
              ? todos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    editingTodoId={editingTodoId}
                    renderEditMode={renderEditMode}
                    renderTodoItemMain={renderTodoItemMain}
                    editingSubTodoId={editingSubTodoId}
                    AddTodoItemSub={AddTodoItemSub}
                    openSubTodoIds={openSubTodoIds}
                    renderTodoItemSub={renderTodoItemSub}
                    handleContextMenu={handleContextMenu}
                  />
                ))
              : !isAdding && (
                  <div className='flex flex-col items-center justify-center mt-20'>
                    <Cat size={64} className='text-mainTheme mb-4' />
                    <p className='font-bold bg-mainTheme p-2 px-4 rounded-full text-white'>
                      할 일을 추가해 보세요!
                    </p>
                  </div>
                )}
          </SortableContext>
        </DndContext>
      </main>

      {/* 우클릭 메뉴 (유지) */}
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
            onClick={() => selectedTodoId && removeTodo(selectedTodoId)}
            className='w-full px-4 py-1 text-red-500 hover:bg-red-50 text-sm flex items-center gap-2 font-bold'
          >
            <Trash2 size={16} /> 삭제하기
          </button>
        </div>
      )}

      {/* 플로팅 버튼 (유지) */}
      {!isAdding && (
        <button
          className='fixed bottom-8 right-8 z-50 p-4 bg-mainTheme rounded-full shadow-2xl text-white'
          onClick={handleStartAdd}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default TodoList;
