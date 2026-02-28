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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

import AutoUpdateStatus from '../components/AutoUpdateStatus';
import { useColorStore } from '../components/store';
import { IPC_CHANNEL } from '../../main/ipc/channels';
import ImageViewerModal from '../components/ImageModal';
import AttachmentModal from '../components/attachFile';
import TopBar from '../components/TopBar';
import { TopBarType } from '../components/TopBar';

// --- 인터페이스 및 헬퍼 함수 (기존과 동일) ---
interface Attachment {
  filePath: string;
  fileName: string;
}

interface DiaryItem {
  id: number;
  content: string;
  date: string;
  time: string;
  attachmentsJson: string | null;
}

const getWeekViewDates = (centerDate: Date) => {
  if (!centerDate || isNaN(centerDate.getTime())) return [];
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

const getAttachments = (jsonString: string | null): Attachment[] => {
  if (!jsonString) return [];
  try {
    const files = JSON.parse(jsonString);
    return Array.isArray(files) ? files : [];
  } catch (e) {
    return [];
  }
};

const isImageFile = (fileName: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(ext);
};

// --- 첨부파일 리스트 컴포넌트 (기존과 동일) ---
const DiaryAttachmentList: React.FC<{
  attachments: Attachment[];
  onClickFile: (p: string) => void;
  isBubble?: boolean;
}> = ({ attachments, onClickFile, isBubble = true }) => {
  if (attachments.length === 0) return null;
  const gridCols =
    attachments.length === 1
      ? 'grid-cols-1'
      : attachments.length <= 3
        ? 'grid-cols-2'
        : 'grid-cols-3';
  return (
    <div
      className={`grid ${gridCols} gap-1 ${isBubble ? 'bg-white/10 p-1 rounded-lg mt-2' : 'mt-2'}`}
    >
      {attachments.map((att, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-md cursor-pointer ${isBubble ? 'aspect-square' : 'w-24 h-24'} hover:opacity-80 transition`}
          onClick={() => onClickFile(att.filePath)}
        >
          {isImageFile(att.fileName) ? (
            <img
              src={`attachment-asset://${encodeURIComponent(att.filePath)}`}
              alt={att.fileName}
              className={`w-full h-full ${attachments.length == 1 ? 'object-contain' : 'object-cover'}`}
            />
          ) : (
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

const HomePage: NextPage = () => {
  // --- 상태 관리 (기존과 동일) ---
  const [inputValue, setInputValue] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryList, setDiaryList] = useState<DiaryItem[]>([]);
  const [attachmentsToSend, setAttachmentsToSend] = useState<Attachment[]>([]);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentViewPath, setCurrentViewPath] = useState<string | null>(null);

  const { gradientMode, bgAttachmentPath } = useColorStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const weekDates = useMemo(() => getWeekViewDates(currentDate), [currentDate]);

  const formattedHeaderDate = useMemo(() => {
    if (!currentDate || isNaN(currentDate.getTime())) return '날짜 로딩 중...';
    return `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (${currentDate.toLocaleDateString('ko-KR', { weekday: 'short' })})`;
  }, [currentDate]);

  // --- 비즈니스 로직 (기존과 동일) ---
  const loadDiary = async (date: Date) => {
    const isoDate = date.toLocaleDateString('en-CA');
    const list = await window.ipc.invoke(IPC_CHANNEL.GET_DIARY, isoDate);
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

  const handleAttachmentsSelected = (files: Attachment[]) => {
    setAttachmentsToSend(files);
    setIsAttachmentModalOpen(false);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachmentsToSend((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        !['INPUT', 'TEXTAREA'].includes(
          (document.activeElement as HTMLElement)?.tagName,
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = window.ipc.on(IPC_CHANNEL.DATE_CHANGED, (iso: any) => {
      if (typeof iso === 'string') setCurrentDate(new Date(iso));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadDiary(currentDate);
  }, [currentDate]);

  const handleDateChange = (newDate: Date) => {
    if (currentDate.toDateString() === newDate.toDateString()) {
      setIsCalendarOpen(!isCalendarOpen);
    } else {
      setCurrentDate(new Date(newDate));
      setIsCalendarOpen(false);
    }
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
    setIsCalendarOpen(false);
  };

  const handleSend = async () => {
    if (!inputValue.trim() && attachmentsToSend.length === 0) return;
    const entryDate = new Date(currentDate);
    const now = new Date();
    entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    await window.ipc.invoke(IPC_CHANNEL.SAVE_DIARY, {
      content: inputValue,
      date: entryDate.toLocaleDateString('en-CA'),
      time: entryDate.toTimeString().slice(0, 5),
      attachmentsJson:
        attachmentsToSend.length > 0 ? JSON.stringify(attachmentsToSend) : null,
    });
    setInputValue('');
    setAttachmentsToSend([]);
    loadDiary(currentDate);
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col ${bgAttachmentPath ? 'bg-attachment bg-fixed' : gradientMode ? 'bg-gradient-to-r from-bgTheme to-bgThemeEnd' : 'bg-bgTheme'}`}
    >
      <AutoUpdateStatus />

      <TopBar type={TopBarType.MAIN} />

      <header
        className={`flex justify-between p-4 items-center relative z-10 pt-10 ${gradientMode ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd' : 'bg-panelTheme'}`}
      >
        <p className='text-textPanelTheme text-dynamic font-baseFont'>
          {formattedHeaderDate}
        </p>
        <div className='flex gap-4 items-center'>
          <button onClick={handleTodayClick}>
            <Home size={20} className='text-mainTheme cursor-pointer' />
          </button>
          <Search size={20} className='text-mainTheme cursor-pointer' />
          <Link href='/todoList'>
            <ListTodo size={20} className='text-mainTheme cursor-pointer' />
          </Link>
          <Link href='/setting'>
            <Settings size={20} className='text-mainTheme cursor-pointer' />
          </Link>
        </div>
      </header>

      {/* 3. 7일 날짜 선택바 (Fixed 해제 -> Relative) */}
      <div
        className={`w-full flex justify-between items-center px-4 py-2 overflow-x-auto relative z-10 ${gradientMode ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd' : 'bg-panelTheme'}`}
      >
        {weekDates.map((date, index) => {
          const isSelected = date.toDateString() === currentDate.toDateString();
          return (
            <div
              key={index}
              className={`flex flex-col items-center p-2 rounded-lg cursor-pointer flex-shrink-0 w-1/7 min-w-[14%] transition duration-200 ${isSelected ? (gradientMode ? 'bg-gradient-to-r from-mainTheme to-mainThemeEnd text-textMainTheme rounded-full font-bold shadow-md' : 'bg-mainTheme text-textMainTheme rounded-full font-bold shadow-md') : 'text-textPanelTheme hover:bg-black/5'}`}
              onClick={() => handleDateChange(date)}
            >
              <span className='text-dynamic font-baseFont'>
                {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
              </span>
              <span className='text-dynamic font-baseFont'>
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. 메인 영역 (헤더가 고정이 아니므로 pt 여백을 대폭 줄임) */}
      <main className='flex-grow p-4 text-gray-950 overflow-y-auto pb-24 flex flex-col-reverse relative'>
        {diaryList.map((item) => (
          <div
            key={item.id}
            className='flex items-end mb-2 group flex-shrink-0 w-full'
          >
            <span className='text-xs text-textBgTheme mr-2 mb-1 flex-shrink-0 rounded-full px-2 bg-gray-400/50'>
              {item.time}
            </span>
            <div
              className={`${gradientMode ? 'bg-gradient-to-r from-bubbleTheme to-bubbleThemeEnd' : 'bg-bubbleTheme'} text-textBubbleTheme text-dynamic font-baseFont p-2 rounded-xl overflow-hidden break-words max-w-[70%] whitespace-pre-wrap`}
            >
              {item.content}
              <DiaryAttachmentList
                attachments={getAttachments(item.attachmentsJson)}
                onClickFile={handleOpenFile}
                isBubble={true}
              />
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className='hidden group-hover:block text-gray-400 hover:text-red-500 cursor-pointer p-1 mb-1 flex-shrink-0 ml-1'
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </main>

      {/* --- 푸터 및 기타 모달 (기존과 동일) --- */}
      <footer
        className={`fixed bottom-0 left-0 right-0 p-4 z-10 ${gradientMode ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd' : 'bg-panelTheme'} flex flex-col gap-2`}
      >
        {attachmentsToSend.length > 0 && (
          <div className='flex gap-2 p-2 bg-gray-100/70 rounded-lg overflow-x-auto whitespace-nowrap'>
            {attachmentsToSend.map((att, index) => (
              <div
                key={att.filePath + index}
                className='relative flex items-center bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-700 max-w-xs flex-shrink-0'
              >
                {isImageFile(att.fileName) ? (
                  <Image
                    src={`attachment-asset://${encodeURIComponent(att.filePath)}`}
                    alt={att.fileName}
                    width={48}
                    height={48}
                    className='object-cover rounded flex-shrink-0'
                  />
                ) : (
                  <FileText size={16} className='text-gray-500 mr-2' />
                )}
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className='ml-2 text-gray-400 hover:text-red-500 transition'
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className='flex items-center gap-4 w-full'>
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
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Send
            size={24}
            className={`flex-shrink-0 cursor-pointer ${!inputValue.trim() && attachmentsToSend.length === 0 ? 'text-gray-400' : 'text-mainTheme'}`}
            onClick={handleSend}
          />
        </div>
      </footer>

      {isCalendarOpen && (
        <div
          className='absolute top-28 left-0 right-0 bottom-0 z-20 flex justify-center p-4'
          onClick={() => setIsCalendarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <DatePicker
              selected={currentDate}
              onChange={(d: Date) => {
                setCurrentDate(d);
                setIsCalendarOpen(false);
              }}
              inline
              locale={ko}
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
      {isAttachmentModalOpen && (
        <AttachmentModal
          initialFiles={attachmentsToSend}
          onClose={() => setIsAttachmentModalOpen(false)}
          onSave={handleAttachmentsSelected}
        />
      )}
    </div>
  );
};

export default HomePage;
