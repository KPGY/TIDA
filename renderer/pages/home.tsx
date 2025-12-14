// src/pages/HomePage.tsx
'use client';
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
} from 'react';
import Image from 'next/image';
import { NextPage } from 'next';
import {
  ListTodo,
  Settings,
  Plus,
  Send,
  X,
  Search,
  FileText,
  Home,
} from 'lucide-react';
import Link from 'next/link';
// ✨ DatePicker 및 스타일 import
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

import AutoUpdateStatus from '../components/AutoUpdateStatus';
import { useColorStore } from '../components/store';
import { IPC_CHANNEL } from '../../main/ipc/channels';
import ImageViewerModal from '../components/ImageModal';
// ✨ AttachmentModal import 추가
import AttachmentModal from '../components/attachFile';

// ✨ 개별 첨부 파일 객체의 타입
interface Attachment {
  filePath: string;
  fileName: string;
}

// ✨ DiaryItem 인터페이스 (attachmentsJson 필드 사용)
interface DiaryItem {
  id: number;
  content: string;
  date: string;
  time: string;
  attachmentsJson: string | null;
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

// ✨ JSON 문자열을 Attachment 배열로 변환하는 헬퍼 함수
const getAttachments = (jsonString: string | null): Attachment[] => {
  if (!jsonString) return [];
  try {
    const files = JSON.parse(jsonString);
    return Array.isArray(files) ? files : [];
  } catch (e) {
    console.error('Failed to parse attachments JSON:', e);
    return [];
  }
};

// ✨ 이미지 파일 확장자 확인 헬퍼 함수
const isImageFile = (fileName: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(ext);
};

// --------------------------------------------------------------------------
// ✨ 컴포넌트 분리: 첨부파일 목록을 격자 형태로 표시
// --------------------------------------------------------------------------
interface DiaryAttachmentListProps {
  attachments: Attachment[];
  onClickFile: (filePath: string) => void;
  isBubble?: boolean; // 일기 버블 내부에 있는지 여부 (스타일 조정용)
}

const DiaryAttachmentList: React.FC<DiaryAttachmentListProps> = ({
  attachments,
  onClickFile,
  isBubble = true,
}) => {
  if (attachments.length === 0) return null;

  // ✨ 수정된 그리드 로직: 1개일 때 grid-cols-1, 2~3개일 때 grid-cols-2, 4개 이상일 때 grid-cols-3
  const gridCols =
    attachments.length === 1
      ? 'grid-cols-1'
      : attachments.length <= 3
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <div
      className={`grid ${gridCols} gap-1 ${
        isBubble ? 'bg-white/10 p-1 rounded-lg mt-2' : 'mt-2'
      }`}
    >
      {attachments.map((att, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-md cursor-pointer ${
            isBubble ? 'aspect-square' : 'w-24 h-24'
          } hover:opacity-80 transition`}
          onClick={() => onClickFile(att.filePath)}
          title={att.fileName}
        >
          {isImageFile(att.fileName) ? (
            // ✨ 커스텀 프로토콜과 URL 인코딩 사용 (이미지 로딩 문제 해결)
            <img
              src={`attachment-asset://${encodeURIComponent(att.filePath)}`}
              alt={att.fileName}
              className={`w-full h-full ${
                attachments.length == 1 ? 'object-contain' : 'object-cover'
              }`}
              // 이미지 로딩 실패 시 파일 아이콘 표시
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '';
                target.alt = '파일 로딩 실패';
                target.classList.add('bg-gray-200');
              }}
            />
          ) : (
            // 이미지 파일이 아닌 경우
            <div className='w-full h-full flex flex-col items-center justify-center bg-white/20 p-1 text-white text-xs'>
              <FileText size={16} />
              <span className='truncate w-full text-center mt-1'>
                {att.fileName}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
// --------------------------------------------------------------------------

const HomePage: NextPage = () => {
  const [inputValue, setInputValue] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryList, setDiaryList] = useState<DiaryItem[]>([]);

  // 1. ✨ 최종 전송 대기 파일 목록
  const [attachmentsToSend, setAttachmentsToSend] = useState<Attachment[]>([]);

  // 2. Attachment Modal 상태 유지
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  // ✨ 캘린더 모달 상태 유지 (기존 상태 유지)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 이미지 뷰어 모달 상태 유지
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentViewPath, setCurrentViewPath] = useState<string | null>(null);

  const { gradientMode, bgAttachmentPath } = useColorStore();

  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const loadDiary = async (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return;
    }
    const isoDate = date.toLocaleDateString('en-CA');
    const list: DiaryItem[] = await window.ipc.invoke(
      IPC_CHANNEL.GET_DIARY,
      isoDate
    );
    setDiaryList(list);
  };

  const handleDelete = async (id: number) => {
    await window.ipc.invoke(IPC_CHANNEL.DELETE_DIARY, id);
    loadDiary(currentDate);
  };

  const handleOpenFile = (filePath: string) => {
    setCurrentViewPath(filePath);
    setIsModalOpen(true);
  };

  // 3. ✨ 모달에서 파일을 선택하고 돌아왔을 때 처리
  // NOTE: AttachmentModal의 onSave Prop 시그니처가 (files, stickers)를 받는 경우를 대비해, files만 사용
  const handleAttachmentsSelected = (
    files: Attachment[],
    stickers?: Attachment[]
  ) => {
    setAttachmentsToSend(files); // 최종 파일 목록을 상태에 저장
    setIsAttachmentModalOpen(false); // 모달 닫기
  };

  // 4. ✨ 미리보기 항목에서 파일을 삭제하는 핸들러 추가
  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachmentsToSend((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const activeTag = (document.activeElement as HTMLElement)?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleIPCDateChange = (isoDateString: unknown) => {
      if (typeof isoDateString !== 'string' || !isoDateString) {
        return;
      }

      const now = new Date(isoDateString);

      if (isNaN(now.getTime())) {
        return;
      }

      setCurrentDate((prevDate) => {
        const prevDateString =
          !prevDate || isNaN(prevDate.getTime())
            ? null
            : prevDate.toDateString();

        if (now.toDateString() !== prevDateString) {
          return now;
        }
        return prevDate;
      });
    };

    const unsubscribe = window.ipc.on(
      IPC_CHANNEL.DATE_CHANGED,
      handleIPCDateChange
    );
    setCurrentDate(new Date());

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadDiary(currentDate);
  }, [currentDate]);

  // ✨ handleDateChange 수정: 날짜 재클릭 시 캘린더 모달 토글
  const handleDateChange = (newDate: Date) => {
    const isSameDay =
      currentDate &&
      !isNaN(currentDate.getTime()) &&
      newDate.toDateString() === currentDate.toDateString();

    if (isSameDay) {
      // 1. 현재 선택된 날짜를 다시 클릭했을 경우: 캘린더 열림 상태를 토글
      setIsCalendarOpen((prev) => !prev);
    } else {
      // 2. 다른 날짜를 선택했을 경우: 날짜 변경 및 캘린더 닫기
      setCurrentDate(new Date(newDate));
      setIsCalendarOpen(false); // 날짜를 바꾸면 캘린더는 닫아줍니다.
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
    setIsCalendarOpen(false);
  };

  const handleSend = async () => {
    // 5. 전송 조건
    if (!inputValue.trim() && attachmentsToSend.length === 0) return;

    const submissionTime = new Date();
    const entryDate = new Date(currentDate);
    entryDate.setHours(submissionTime.getHours());
    entryDate.setMinutes(submissionTime.getMinutes());
    entryDate.setSeconds(submissionTime.getSeconds());

    const diary = {
      content: inputValue,
      date: entryDate.toLocaleDateString('en-CA'),
      time: entryDate.toTimeString().slice(0, 5),

      // 6. attachmentsToSend 사용
      attachmentsJson:
        attachmentsToSend.length > 0 ? JSON.stringify(attachmentsToSend) : null,
    };

    await window.ipc.invoke(IPC_CHANNEL.SAVE_DIARY, diary);

    setInputValue('');
    setAttachmentsToSend([]); // 7. 전송 후 최종 파일 목록 초기화

    loadDiary(currentDate);
  };

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
      <AutoUpdateStatus />
      <header
        className={`flex justify-between p-4 items-center fixed ${
          gradientMode
            ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd'
            : 'bg-panelTheme'
        } top-0 left-0 right-0 z-10 app-drag`}
      >
        <p className='text-textPanelTheme text-dynamic font-baseFont'>
          {formattedHeaderDate}
        </p>
        <div className='flex gap-4 app-no-drag items-center'>
          <button
            className='text-mainTheme font-baseFont text-dynamic font-bold'
            onClick={handleTodayClick}
          >
            <Home size={20} className='text-mainTheme cursor-pointer' />
          </button>
          <Search size={20} className='text-mainTheme cursor-pointer' />

          <ListTodo size={20} className='text-mainTheme cursor-pointer' />
          <Link href='/setting'>
            <Settings size={20} className='text-mainTheme cursor-pointer' />
          </Link>
        </div>
      </header>

      <div
        className={`w-full flex justify-between items-center px-4 py-2 overflow-x-auto fixed top-12 ${
          gradientMode
            ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd'
            : 'bg-panelTheme'
        } z-10`}
      >
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
                    ? gradientMode
                      ? 'bg-gradient-to-r from-mainTheme to-mainThemeEnd text-textMainTheme rounded-full font-bold shadow-md'
                      : 'bg-mainTheme text-textMainTheme rounded-full font-bold shadow-md'
                    : 'text-textPanelTheme hover:bg-gray-100'
                }`}
              onClick={() => handleDateChange(date)}
            >
              <span className='text-dynamic font-baseFont'>
                {shortDayOfWeek}
              </span>
              <span className='text-dynamic font-baseFont'>{dayOfMonth}</span>
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
            <span className='text-sm text-textBgTheme mr-2 mb-1 flex-shrink-0 rounded-full pl-2 pr-2 bg-gray-400'>
              {item.time}
            </span>
            <div
              className={`${
                gradientMode
                  ? 'bg-gradient-to-r from-bubbleTheme to-bubbleThemeEnd'
                  : 'bg-bubbleTheme'
              } text-textBubbleTheme text-dynamic font-baseFont p-2 rounded-xl overflow-hidden break-words max-w-[70%] whitespace-pre-wrap`}
            >
              {item.content}

              {/* ✨ 통합된 첨부파일 그리드 표시 */}
              <DiaryAttachmentList
                attachments={getAttachments(item.attachmentsJson)}
                onClickFile={handleOpenFile}
                isBubble={true}
              />
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

      <footer
        className={`fixed bottom-0 left-0 right-0 p-4 ${
          gradientMode
            ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd'
            : 'bg-panelTheme'
        } flex flex-col gap-2 z-10`}
      >
        {/* 8. ✨ 첨부 파일 미리보기 목록 및 삭제 버튼 구현 */}
        {attachmentsToSend.length > 0 && (
          <div className='flex gap-2 p-2 bg-gray-100/70 rounded-lg overflow-x-auto whitespace-nowrap'>
            {attachmentsToSend.map((att, index) => (
              <div
                key={att.filePath + index}
                className='relative flex items-center bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-700 max-w-xs flex-shrink-0'
              >
                {isImageFile(att.fileName) ? (
                  // 이미지 파일인 경우: 실제 이미지를 썸네일로 표시
                  <Image
                    src={`attachment-asset://${encodeURIComponent(
                      att.filePath
                    )}`}
                    alt={att.fileName}
                    width={48}
                    height={48}
                    className='object-cover rounded flex-shrink-0' // 크기를 작게 지정
                    // 로드 실패 시 대체 아이콘 표시
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // 실패 시 FileText 아이콘으로 대체할 요소를 추가할 수 있습니다.
                    }}
                  />
                ) : (
                  // 기타 파일인 경우 파일 아이콘
                  <FileText size={16} className='text-gray-500 mr-2' />
                )}

                {/* 9. ✨ 삭제 버튼 */}
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className='ml-2 text-gray-400 hover:text-red-500 transition'
                  title='첨부 취소'
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className='flex items-center gap-4 w-full'>
          {/* 10. Plus 버튼 */}
          <button onClick={() => setIsAttachmentModalOpen(true)}>
            <Plus
              size={24}
              className='flex-shrink-0 cursor-pointer text-mainTheme'
            />
          </button>

          <textarea
            className='flex-grow p-2 rounded-full focus:outline-none text-gray-950 resize-none'
            ref={inputRef}
            value={inputValue}
            rows={1}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) {
                return;
              }

              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  return;
                } else {
                  e.preventDefault();
                  handleSend();
                }
              }
            }}
          />
          <Send
            size={24}
            // 11. 전송 조건
            className={`flex-shrink-0 cursor-pointer ${
              !inputValue.trim() && attachmentsToSend.length === 0
                ? 'text-gray-400'
                : 'text-mainTheme'
            }`}
            onClick={handleSend}
            style={{
              pointerEvents:
                !inputValue.trim() && attachmentsToSend.length === 0
                  ? 'none'
                  : 'auto',
            }}
          />
        </div>
      </footer>

      {/* ✨ Calendar 모달 렌더링 부분 (isCalendarOpen 상태 사용) */}
      {isCalendarOpen && (
        <div
          className='absolute top-28 left-0 right-0 bottom-0 z-20 flex justify-center p-4 app-no-drag'
          onClick={() => setIsCalendarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <DatePicker
              selected={currentDate}
              onChange={(date: Date) => {
                setCurrentDate(date);
                setIsCalendarOpen(false);
              }}
              inline
              locale={ko}
              onCalendarOpen={() => inputRef.current?.blur()}
            />
          </div>
        </div>
      )}

      {isModalOpen && currentViewPath && (
        <ImageViewerModal
          filePath={currentViewPath}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* 12. AttachmentModal 렌더링 */}
      {isAttachmentModalOpen && (
        <AttachmentModal
          initialAttachments={attachmentsToSend} // 이미 첨부된 파일 전달
          onClose={() => setIsAttachmentModalOpen(false)}
          onSave={handleAttachmentsSelected}
        />
      )}
    </div>
  );
};

export default HomePage;
