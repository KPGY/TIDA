import Link from 'next/link';
import {
  Home,
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
  Pencil,
  Palette,
  GripVertical,
} from 'lucide-react';
import { useColorStore } from '../components/store';
import { useState, useEffect, useRef, useMemo } from 'react';
import { TopBarType } from '../components/TopBar';

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
import TopBar from '../components/TopBar';

// --- 1. 하위 작업용 Sortable 아이템 컴포넌트 (추가됨) ---
const SortableSubTodoItem = ({ sub, toggleTodo }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sub.id });

  const style = {
    transform: transform ? `translate3d(0px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center rounded-full bg-white/95 h-9 px-3 shadow-sm ml-1 group/sub'
    >
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing text-gray-300 hover:text-mainTheme mr-1 p-1'
      >
        <GripVertical size={14} />
      </div>
      <button onClick={() => toggleTodo(sub.id)}>
        <Circle
          className={sub.completed ? 'text-mainTheme' : 'text-gray-200'}
          size={18}
        />
      </button>
      <p
        className={`text-xs font-bold ml-3 break-words whitespace-pre-wrap flex-grow min-w-0 ${
          sub.completed ? 'line-through text-gray-400' : 'text-black'
        }`}
      >
        {sub.content}
      </p>
    </div>
  );
};

// --- 2. 개별 Sortable 메인 아이템 컴포넌트 ---
const SortableTodoItem = ({
  todo,
  editingTodoId,
  renderEditMode,
  renderTodoItemMain,
  editingSubTodoId,
  AddTodoItemSub,
  openSubTodoIds,
  handleContextMenu,
  onEditClick,
  toggleTodo, // 추가됨
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
    transform: transform ? `translate3d(0px, ${transform.y}px, 0)` : undefined,
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
            <div
              {...attributes}
              {...listeners}
              className='cursor-grab active:cursor-grabbing text-mainTheme p-1 hover:bg-mainTheme/10 rounded-md transition-colors w-7'
            >
              <GripVertical size={20} />
            </div>
            <div className='flex-grow min-w-0'>
              {renderTodoItemMain(todo, onEditClick)}
            </div>
          </div>
          {editingSubTodoId === todo.id ? AddTodoItemSub(todo) : null}

          {/* 하위 작업 렌더링 로직 수정: SortableContext 적용 */}
          {openSubTodoIds.includes(todo.id) && todo.subTodos && (
            <div className='pl-12 mt-1 flex flex-col gap-1'>
              <SortableContext
                items={todo.subTodos.map((s: any) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {todo.subTodos.map((sub: any) => (
                  <SortableSubTodoItem
                    key={sub.id}
                    sub={sub}
                    toggleTodo={toggleTodo}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --- 3. 메인 TodoList 컴포넌트 ---
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
    reorderTodos,
  } = useColorStore();

  const [currentDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoContent, setNewTodoContent] = useState('');
  const [newSubTodos, setNewSubTodos] = useState<
    { id: string; content: string }[]
  >([]);
  const [selectedColor, setSelectedColor] = useState('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingSubTodoId, setEditingSubTodoId] = useState<string | null>(null);
  const [subInputContent, setSubInputContent] = useState('');
  const [openSubTodoIds, setOpenSubTodoIds] = useState<string[]>([]);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const colors = ['#FFB6CC', '#FFFACA', '#BBDED6', '#C0BEE5'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 드래그 종료 핸들러 수정
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 1. 메인 투두 순서 변경 확인
    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTodos(arrayMove(todos, oldIndex, newIndex));
    } else {
      // 2. 하위 작업(Sub-todos) 순서 변경 확인
      for (const todo of todos) {
        if (!todo.subTodos) continue;
        const subOldIndex = todo.subTodos.findIndex(
          (s: any) => s.id === active.id,
        );
        const subNewIndex = todo.subTodos.findIndex(
          (s: any) => s.id === over.id,
        );

        if (subOldIndex !== -1 && subNewIndex !== -1) {
          const newSubTodosList = arrayMove(
            todo.subTodos,
            subOldIndex,
            subNewIndex,
          );
          updateTodo(todo.id, todo.content, newSubTodosList, todo.color);
          break;
        }
      }
    }
  };

  const resetForm = () => {
    setNewTodoContent('');
    setNewSubTodos([]);
    setSelectedColor('transparent');
    setShowColorPicker(false);
  };

  const handleEditMode = (id: string) => {
    const targetTodo = todos.find((t) => t.id === id);
    if (!targetTodo) return;
    setIsAdding(false);
    setEditingTodoId(id);
    setNewTodoContent(targetTodo.content);
    setNewSubTodos(
      targetTodo.subTodos?.map((s: any) => ({
        id: s.id,
        content: s.content,
      })) || [],
    );
    setSelectedColor(targetTodo.color || 'transparent');
    setMenuPos(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSaveEdit = () => {
    if (!editingTodoId) return;
    updateTodo(editingTodoId, newTodoContent, newSubTodos, selectedColor);
    setEditingTodoId(null);
    resetForm();
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedTodoId(id);
  };

  const handleSaveSubTodo = (parentId: string) => {
    if (!subInputContent.trim()) {
      setEditingSubTodoId(null);
      return;
    }
    addSubTodo(parentId, subInputContent);
    setSubInputContent('');
    setEditingSubTodoId(null);
    if (!openSubTodoIds.includes(parentId))
      setOpenSubTodoIds((prev) => [...prev, parentId]);
  };

  useEffect(() => {
    const closeMenu = () => setMenuPos(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const ProgressCircle = ({ percentage, size = 36 }: any) => {
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

  const renderEditorUI = (onSave: () => void, onCancel: () => void) => (
    <div
      className={`flex flex-col animate-in fade-in slide-in-from-top-4 duration-300 w-full z-10 relative
    ${isAdding ? 'mb-3' : 'mb-1'}`}
    >
      <div className='flex items-center gap-1 min-w-0'>
        <div className='w-7 flex-shrink-0' />
        <div
          style={{ border: `3px solid ${selectedColor}` }}
          className='flex-grow flex items-center h-14 rounded-full bg-white shadow-lg'
        >
          <div className='w-12 flex-shrink-0 flex items-center justify-center'>
            <Circle className='text-gray-300' size={38} />
          </div>
          <input
            ref={inputRef}
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave()}
            placeholder='할 일을 입력하세요'
            className='flex-grow bg-transparent outline-none text-sm font-bold ml-1 text-black min-w-0 h-full w-full'
          />
          <div className='flex items-center gap-1 pr-2 relative'>
            <button
              type='button'
              onClick={() => setShowColorPicker(!showColorPicker)}
              className='p-1.5 text-mainTheme rounded-full'
            >
              <Palette size={20} />
            </button>

            {showColorPicker && (
              <div className='absolute top-full right-0 mt-3 bg-white shadow-2xl border border-gray-100 rounded-2xl p-3 z-[100] flex gap-2 animate-in zoom-in-95 duration-200'>
                <button
                  onClick={() => {
                    setSelectedColor('transparent');
                    setShowColorPicker(false);
                  }}
                  className='w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50'
                >
                  <X size={14} />
                </button>
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorPicker(false);
                    }}
                    className='w-7 h-7 rounded-full shadow-sm hover:scale-125 transition-transform'
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={onSave}
              className='p-1.5 bg-mainTheme rounded-full text-white'
            >
              <Check size={20} />
            </button>
            <button
              onClick={onCancel}
              className='p-1.5 text-white bg-gray-300 rounded-full'
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className='pl-12 mt-1 flex flex-col gap-1'>
        <div className='flex flex-col gap-1.5'>
          {newSubTodos.map((sub, idx) => (
            <div
              key={sub.id}
              className='flex items-center rounded-full bg-white/95 h-9 px-3 shadow-sm ml-1'
            >
              <Circle className='text-gray-300' size={18} />
              <input
                className='text-xs font-bold ml-3 text-black outline-none flex-grow bg-transparent'
                value={sub.content}
                placeholder='하위 작업'
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
                className='text-red-400'
              >
                <Minus size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setNewSubTodos([
              ...newSubTodos,
              { id: Date.now().toString(), content: '' },
            ])
          }
          className='text-[12px] font-bold text-mainTheme self-start flex items-center gap-1 opacity-80 hover:opacity-100'
        >
          <Plus size={10} /> 하위 작업 추가
        </button>
      </div>
    </div>
  );

  const renderTodoItemMain = (todo: any, onEditClick: any) => {
    const totalCount = todo.subTodos?.length || 0;
    const completedCount =
      todo.subTodos?.filter((sub: any) => sub.completed).length || 0;
    const percentage =
      totalCount > 0
        ? Math.floor((completedCount / totalCount) * 100)
        : todo.completed
          ? 100
          : 0;
    const isLineThrough =
      totalCount > 0
        ? totalCount === completedCount && totalCount !== 0
        : todo.completed;

    const handleMainCheck = () => {
      if (totalCount > 0) {
        setOpenSubTodoIds((prev) =>
          prev.includes(todo.id)
            ? prev.filter((i) => i !== todo.id)
            : [...prev, todo.id],
        );
      } else {
        toggleTodo(todo.id);
      }
    };

    return (
      <div
        style={{ border: `3px solid ${todo.color || 'transparent'}` }}
        className='flex items-center min-h-14 rounded-full bg-white shadow-md hover:shadow-lg w-full overflow-hidden'
      >
        <div className='w-12 flex-shrink-0 flex items-center justify-center'>
          <button
            className={`relative flex items-center justify-center ${totalCount > 0 ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={handleMainCheck}
            disabled={totalCount > 0}
          >
            <ProgressCircle size={36} percentage={percentage} />
            {isLineThrough ? (
              <Check className='absolute text-mainTheme' size={20} />
            ) : (
              totalCount > 0 &&
              completedCount > 0 && (
                <div className='text-mainTheme absolute text-[10px] font-bold'>
                  {percentage}%
                </div>
              )
            )}
          </button>
        </div>
        <div
          className={`flex-grow font-bold min-w-0 ${
            isLineThrough ? 'line-through text-gray-300' : 'text-black'
          }`}
        >
          <p className='whitespace-pre-wrap break-words text-sm ml-1'>
            {todo.content}
          </p>
        </div>
        <div className='flex items-center pr-2'>
          <button
            onClick={() => onEditClick(todo.id)}
            className='text-gray-400 p-1.5 hover:bg-mainTheme/10 rounded-full transition-colors'
          >
            <Pencil size={18} />
          </button>
          {totalCount > 0 && (
            <button
              onClick={() =>
                setOpenSubTodoIds((prev) =>
                  prev.includes(todo.id)
                    ? prev.filter((i) => i !== todo.id)
                    : [...prev, todo.id],
                )
              }
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
    );
  };

  const todoLength = useMemo(() => {
    if (todos.length === 0) return 0;
    const uncompletedItems = todos.filter((todo) => !todo.completed);
    return uncompletedItems.length;
  }, [todos]);

  return (
    <div
      className={`w-full min-h-screen flex flex-col ${bgAttachmentPath ? 'bg-attachment bg-fixed' : gradientMode ? 'bg-gradient-to-r from-bgTheme to-bgThemeEnd' : 'bg-bgTheme'}`}
    >
      <TopBar
        type={TopBarType.TODO}
        percent={todoLength}
        gradientMode={gradientMode}
      >
        <header className='flex justify-between px-4 pb-4 items-center relative left-0 right-0'>
          <p className='text-textPanelTheme text-dynamic font-baseFont'>{`${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (${currentDate.toLocaleDateString('ko-KR', { weekday: 'short' })})`}</p>
          <div className='flex gap-4 items-center'>
            <Link href='./home'>
              <Home size={20} className='text-mainTheme' />
            </Link>
            <Link href='./home'>
              <ListTodo size={20} className='text-mainTheme' />
            </Link>
            <Link href='/setting'>
              <Settings size={20} className='text-mainTheme' />
            </Link>
          </div>
        </header>
      </TopBar>

      <main className='flex flex-col pt-2 pb-24 px-4 relative mt-20'>
        <div className='flex justify-end mb-2 mt-1'>
          <button
            onClick={() => removeCompleteTodo()}
            className='p-1 text-red-500 bg-red-100 flex items-center gap-2 font-bold rounded-lg'
          >
            <BrushCleaning size={16} />
          </button>
        </div>

        {isAdding &&
          renderEditorUI(
            () => {
              addTodo(
                newTodoContent,
                newSubTodos.map((s) => s.content),
                selectedColor,
              );
              setIsAdding(false);
              resetForm();
            },
            () => {
              setIsAdding(false);
              resetForm();
            },
          )}

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
                    renderEditMode={() =>
                      renderEditorUI(handleSaveEdit, () =>
                        setEditingTodoId(null),
                      )
                    }
                    renderTodoItemMain={renderTodoItemMain}
                    onEditClick={handleEditMode}
                    editingSubTodoId={editingSubTodoId}
                    AddTodoItemSub={handleSaveSubTodo}
                    openSubTodoIds={openSubTodoIds}
                    toggleTodo={toggleTodo} // 토글 함수 전달
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

      {menuPos && (
        <div
          className='fixed z-[100] bg-white shadow-2xl rounded-xl py-2 w-40 border border-gray-100'
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <button
            onClick={() => selectedTodoId && removeTodo(selectedTodoId)}
            className='w-full px-4 py-2 text-red-500 hover:bg-red-50 text-sm flex items-center gap-2 font-bold transition-colors'
          >
            <Trash2 size={16} /> 삭제하기
          </button>
        </div>
      )}

      {!isAdding && !editingTodoId && (
        <button
          className='fixed bottom-8 right-8 z-40 p-4 bg-mainTheme rounded-full shadow-2xl text-white hover:scale-110 transition-transform'
          onClick={() => {
            setIsAdding(true);
            resetForm();
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default TodoList;
