import Link from 'next/link';
import {
  Home,
  Search,
  ListTodo,
  Settings,
  PlusCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useColorStore } from '../components/store';
import { useState, useMemo, useEffect } from 'react';

const todoList = () => {
  const { gradientMode, bgAttachmentPath } = useColorStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const toggleSubTodos = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDate(new Date());
    }, 10000); // 1초마다 업데이트

    // 컴포넌트가 사라질 때 타이머 정리
    return () => clearInterval(timerId);
  }, []);

  const todayDate = useMemo(() => {
    if (!currentDate || isNaN(currentDate.getTime())) {
      return '날짜 로딩 중...';
    }
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
          <Link
            className='text-mainTheme font-baseFont text-dynamic font-bold'
            href='./home'
          >
            <Home size={20} className='text-mainTheme cursor-pointer' />
          </Link>
          <Search size={20} className='text-mainTheme cursor-pointer' />

          <Link href='/todoList'>
            <ListTodo size={20} className='text-mainTheme cursor-pointer' />
          </Link>

          <Link href='/setting'>
            <Settings size={20} className='text-mainTheme cursor-pointer' />
          </Link>
        </div>
      </header>
      <main className='flex flex-col pt-36'>
        <div
          className='
        flex items-center justify-between rounded-full bg-white m-4 max-w-full shadow-md'
        >
          {/* 1. 왼쪽 영역: 완료 상태 (원과 퍼센트) */}
          <div className='flex items-center justify-center h-14 w-14 flex-shrink-0'>
            <Circle className='text-mainTheme' size={56} />
            <p className='absolute text-mainTheme font-bold text-lg'>50%</p>
          </div>

          {/* 2. 오른쪽 영역: 할 일 내용 (글) */}
          <div className='flex-grow font-bold text-textBgTheme ml-2'>
            여기는 투두페이지 입니다! (할 일 내용)
          </div>
          <button
            onClick={toggleSubTodos}
            className='text-mainTheme mr-2 p-1 flex-shrink-0'
          >
            {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className='pl-2'>
            {/* 서브 투두 아이템 1 */}
            <div className='flex items-center rounded-full bg-white m-4 max-w-full shadow-md'>
              <div className='relative flex-shrink-0 h-12 w-12 flex items-center justify-center mr-4'>
                {/* Circle (배경) */}
                <Circle className='text-mainTheme' size={48} />

                {/* Check (오버레이: Circle 중앙에 겹치게) */}
                <Check
                  className='
                    absolute text-mainTheme bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                  size={24}
                />
              </div>
              <p className='text-textBgTheme font-bold ml-2'>서브 컨텐츠</p>
            </div>
            {/* 서브 투두 아이템 2 */}
            <div className='flex items-center rounded-full bg-white m-4 max-w-full shadow-md'>
              <div className='relative flex-shrink-0 h-12 w-12 flex items-center justify-center mr-4'>
                {/* Circle (배경) */}
                <Circle className='text-mainTheme' size={48} />

                {/* Check (오버레이: Circle 중앙에 겹치게) */}
              </div>
              <p className='text-textBgTheme font-bold ml-2'>서브 컨텐츠2</p>
            </div>
          </div>
        )}
      </main>
      <button className='text-textBgTheme fixed bottom-0 right-0 z-50 p-4'>
        <PlusCircle size={56}></PlusCircle>
      </button>
    </div>
  );
};

export default todoList;
