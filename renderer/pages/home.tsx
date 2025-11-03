'use client';
import React, { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { NextPage } from 'next';
import { Calendar, Settings, Plus, Send, X } from 'lucide-react';
import Link from 'next/link';

interface DiaryItem {
  id: number;
  content: string;
  date: string;
  time: string;
}

declare global {
  interface Window {
    ipc: {
      invoke: (channel: string, value?: unknown) => Promise<any>;
      on: (
        channel: string,
        callback: (...args: unknown[]) => void
      ) => () => void;
    };
  }
}

// 7일간 날짜 배열
const getWeekViewDates = (centerDate: Date) => {
  // 날짜가 유효하지 않으면 빈 배열 반환
  if (!centerDate || isNaN(centerDate.getTime())) {
    return [];
  }
  const dates = [];
  const tempDate = new Date(centerDate);
  tempDate.setDate(tempDate.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const day = new Date(tempDate);
    day.setDate(tempDate.getDate() + i);
    dates.push(day);
  }
  return dates;
};

const HomePage: NextPage = () => {
  const [inputValue, setInputValue] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryList, setDiaryList] = useState<DiaryItem[]>([]);

  const weekDates = useMemo(() => getWeekViewDates(currentDate), [currentDate]);

  const formattedHeaderDate = useMemo(() => {
    if (!currentDate || isNaN(currentDate.getTime())) {
      return '날짜 로딩 중...';
    }
    return `${
      currentDate.getMonth() + 1
    }월 ${currentDate.getDate()}일 (${currentDate.toLocaleDateString('ko-KR', {
      weekday: 'short',
    })})`;
  }, [currentDate]);

  // DB에서 해당 날짜 일기 불러오기
  const loadDiary = async (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      // console.error('loadDiary: 유효하지 않은 날짜로 호출되었습니다.', date);
      return;
    }
    const isoDate = date.toLocaleDateString('en-CA');
    const list: DiaryItem[] = await window.ipc.invoke('get-diary', isoDate);
    setDiaryList(list);
  };

  // 일기 삭제 처리
  const handleDelete = async (id: number) => {
    await window.ipc.invoke('delete-diary', id);
    loadDiary(currentDate);
  };

  // IPC 이벤트 리스너 (메인 프로세스로부터 날짜 변경 수신)
  useEffect(() => {
    // ✨ [수정 1] 함수 이름을 handleIPCDateChange로 명확하게 변경
    const handleIPCDateChange = (isoDateString: unknown) => {
      // console.log(
      //   '[렌더러] 메인으로부터 날짜 변경 이벤트 수신!',
      //   isoDateString
      // );

      if (typeof isoDateString !== 'string' || !isoDateString) {
        // console.error(
        //   '[렌더러] 메인으로부터 유효하지 않은 날짜 값을 받았습니다:',
        //   isoDateString
        // );
        return;
      }

      const now = new Date(isoDateString);

      if (isNaN(now.getTime())) {
        // console.error(
        //   `[렌더러] 수신된 값 '${isoDateString}'으로 유효한 날짜를 만들 수 없습니다.`
        // );
        return;
      }

      setCurrentDate((prevDate) => {
        const prevDateString =
          !prevDate || isNaN(prevDate.getTime())
            ? null
            : prevDate.toDateString();

        if (now.toDateString() !== prevDateString) {
          // console.log(
          //   `%c[렌더러] 날짜 상태 업데이트: ${prevDateString} -> ${now.toDateString()}`,
          //   'color: blue; font-weight: bold;'
          // );
          return now;
        }
        return prevDate;
      });
    };

    // ✨ handleIPCDateChange 함수로 구독
    const unsubscribe = window.ipc.on('date-changed', handleIPCDateChange);
    setCurrentDate(new Date()); // 처음 로드 시 현재 날짜로 설정

    return () => {
      unsubscribe();
    };
  }, []);

  // currentDate가 변경되면 항상 목록을 새로고침
  useEffect(() => {
    loadDiary(currentDate);
  }, [currentDate]);

  // 달력에서 날짜를 클릭했을 때
  const handleDateChange = (newDate: Date) => {
    // ✨ [수정 2]
    // new Date()로 감싸서 "완전히 새로운" 날짜 객체를 생성합니다.
    // 이렇게 하면 React가 상태 변경을 100% 감지하고 UI를 새로고침합니다.
    setCurrentDate(new Date(newDate));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // 전송 버튼 클릭 시
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // 1. '지금' 시간 정보 획득 (시간/분/초를 위해)
    const submissionTime = new Date();

    // 2. '저장할 날짜' 객체 생성 (기본은 UI에 표시된 currentDate)
    const entryDate = new Date(currentDate);

    // 3. '저장할 날짜'에 '지금'의 시간/분/초를 적용
    entryDate.setHours(submissionTime.getHours());
    entryDate.setMinutes(submissionTime.getMinutes());
    entryDate.setSeconds(submissionTime.getSeconds());

    // 4. 이 조합된 날짜로 diary 객체 생성
    const diary = {
      content: inputValue,
      date: entryDate.toLocaleDateString('en-CA'), // 날짜는 currentDate 기반
      time: entryDate.toTimeString().slice(0, 5), // 시간은 submissionTime 기반
    };

    // 5. DB에 저장
    await window.ipc.invoke('save-diary', diary);

    // 6. 입력창 비우기
    setInputValue('');

    // 7. 현재 보고 있는 목록을 새로고침
    loadDiary(currentDate);
  };

  return (
    <div className='w-full min-h-screen flex flex-col bg-white'>
      <header className='flex justify-between p-4 items-center fixed top-0 left-0 right-0 bg-white z-10'>
        <p className='text-gray-950 text-sm'>{formattedHeaderDate}</p>
        <div className='flex gap-4'>
          <Calendar size={20} className='text-gray-600 cursor-pointer' />
          <Link href='/setting'>
            <Settings size={20} className='text-gray-600 cursor-pointer' />
          </Link>
        </div>
      </header>

      <div className='w-full flex justify-between items-center px-4 py-2 border-b border-t border-gray-100 overflow-x-auto fixed top-12 bg-white z-10'>
        {weekDates.map((date, index) => {
          const isSelected =
            currentDate &&
            !isNaN(currentDate.getTime()) &&
            date.toDateString() === currentDate.toDateString();

          const shortDayOfWeek = date.toLocaleDateString('ko-KR', {
            weekday: 'short',
          });
          const dayOfMonth = date.getDate();
          return (
            <div
              key={index}
              className={`flex flex-col items-center p-2 rounded-lg cursor-pointer flex-shrink-0 w-1/7 min-w-[14%] transition duration-200 
                ${
                  isSelected
                    ? 'bg-slate-500 text-white rounded-full font-bold shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => handleDateChange(date)}
            >
              <span className='text-sm'>{shortDayOfWeek}</span>
              <span className='text-xl'>{dayOfMonth}</span>
            </div>
          );
        })}
      </div>

      <main className='flex-grow p-4 text-gray-950 overflow-y-auto pb-24 pt-36 flex flex-col-reverse'>
        {diaryList.map((item) => (
          <div
            key={item.id}
            className='flex items-end mb-2 group flex-shrink-0 w-full'
          >
            <span className='text-sm text-gray-400 mr-2 mb-1 flex-shrink-0'>
              {item.time}
            </span>
            <div className='bg-slate-500 text-white p-2 rounded-xl overflow-hidden break-words max-w-[70%]'>
              {item.content}
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              title='삭제'
              className='hidden group-hover:block text-gray-400 hover:text-red-500 cursor-pointer p-1 mb-1 flex-shrink-0 mr-2'
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </main>

      <footer className='fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center gap-4 z-10'>
        <Plus
          size={24}
          className='text-slate-500 flex-shrink-0 cursor-pointer'
        />
        <input
          className='flex-grow p-2 border-2 border-gray-300 rounded-full focus:outline-none focus:border-slate-500 text-gray-950'
          type='text'
          placeholder='오늘은 무슨일이 있었나요?'
          value={inputValue}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Send
          size={24}
          className='text-slate-500 flex-shrink-0 cursor-pointer'
          onClick={handleSend}
        />
      </footer>
    </div>
  );
};

export default HomePage;
