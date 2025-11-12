// pages/HomePage.tsx

'use client';
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
} from 'react';
import { NextPage } from 'next';
import {
  Calendar,
  Settings,
  Plus,
  Send,
  X,
  Search,
  FileText,
  Image,
} from 'lucide-react';
import Link from 'next/link';
import AutoUpdateStatus from '../components/AutoUpdateStatus';
import { useColorStore } from '../components/store';
import { IPC_CHANNEL } from '../../main/ipc/channels';
import ImageViewerModal from '../components/ImageModal';

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
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileUpload = async () => {
    if (!window.ipc) return;
    setIsUploading(true);

    const result = await window.ipc.invoke(IPC_CHANNEL.UPLOAD_ATTACHMENT);

    if (result.success && result.files && Array.isArray(result.files)) {
      setCurrentAttachments(result.files);
    } else if (result.error !== 'User cancelled file selection') {
      console.error(`파일 업로드 실패: ${result.error}`);
    }

    setIsUploading(false);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setCurrentAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleOpenFile = (filePath: string) => {
    // TODO: 메인 프로세스에 파일 열기 명령을 IPC로 보냄 (예: shell.openPath)
    console.log(`Open request for: ${filePath}`);
    // await window.ipc.invoke('open-file', filePath);
    setCurrentViewPath(filePath);
    // 2. 모달 열기 플래그를 true로 설정
    setIsModalOpen(true);
  };

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const activeTag = document.activeElement.tagName;
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

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(new Date(newDate));
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const handleSend = async () => {
    if (!inputValue.trim() && currentAttachments.length === 0) return;

    const submissionTime = new Date();
    const entryDate = new Date(currentDate);
    entryDate.setHours(submissionTime.getHours());
    entryDate.setMinutes(submissionTime.getMinutes());
    entryDate.setSeconds(submissionTime.getSeconds());

    const diary = {
      content: inputValue,
      date: entryDate.toLocaleDateString('en-CA'),
      time: entryDate.toTimeString().slice(0, 5),

      attachmentsJson:
        currentAttachments.length > 0
          ? JSON.stringify(currentAttachments)
          : null,
    };

    await window.ipc.invoke(IPC_CHANNEL.SAVE_DIARY, diary);

    setInputValue('');
    setCurrentAttachments([]);

    loadDiary(currentDate);
  };

  return (
    // HomePage.tsx의 최신 로직 (올바름)
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
        <p className='text-gray-900 text-dynamic font-baseFont'>
          {formattedHeaderDate}
        </p>
        <div className='flex gap-4 app-no-drag items-center'>
          <button
            className='text-mainTheme font-baseFont text-dynamic font-bold'
            onClick={handleTodayClick}
          >
            Today
          </button>
          <Search
            size={20}
            className='text-mainTheme cursor-pointer'
            onClick={() => console.log('검색 기능 미구현')}
          />
          <Calendar size={20} className='text-mainTheme cursor-pointer' />
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
                      ? 'bg-gradient-to-r from-mainTheme to-mainThemeEnd text-white rounded-full font-bold shadow-md'
                      : 'bg-mainTheme text-white rounded-full font-bold shadow-md'
                    : 'text-gray-950 hover:bg-gray-100'
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
            <span className='text-sm text-gray-400 mr-2 mb-1 flex-shrink-0'>
              {item.time}
            </span>
            <div
              className={`${
                gradientMode
                  ? 'bg-gradient-to-r from-bubbleTheme to-bubbleThemeEnd'
                  : 'bg-bubbleTheme'
              } text-white text-dynamic font-baseFont p-2 rounded-xl overflow-hidden break-words max-w-[70%] whitespace-pre-wrap`}
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
        {/* ✨ 현재 선택된 첨부파일 미리보기 (푸터용 스타일) */}
        {currentAttachments.length > 0 && (
          <div className='flex flex-col gap-2 p-2 bg-gray-100/70 rounded-lg max-w-full'>
            <div className='flex items-center gap-2'>
              <Image size={16} className='text-gray-700' />
              <span className='text-gray-700 text-sm font-semibold'>
                첨부 파일 ({currentAttachments.length}개)
              </span>
            </div>

            <div className='flex flex-wrap gap-2'>
              {currentAttachments.map((att, index) => (
                <div
                  key={index}
                  className='relative flex items-center bg-white border border-gray-300 rounded-lg p-1 pr-3 text-sm text-gray-800 hover:shadow-md transition'
                >
                  {/* 이미지 썸네일 표시 */}
                  {isImageFile(att.fileName) ? (
                    <div className='w-12 h-12 flex-shrink-0 overflow-hidden rounded-md mr-2'>
                      {/* ✨ 커스텀 프로토콜과 URL 인코딩 사용 */}
                      <img
                        src={`attachment-asset://${encodeURIComponent(
                          att.filePath
                        )}`}
                        alt={att.fileName}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  ) : (
                    <div className='w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-md mr-2'>
                      <FileText size={20} className='text-gray-500' />
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className='ml-2 text-red-500 hover:text-red-700 transition'
                    title='첨부 취소'
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='flex items-center gap-4 w-full'>
          <button onClick={handleFileUpload} disabled={isUploading}>
            <Plus
              size={24}
              className={`flex-shrink-0 cursor-pointer ${
                isUploading ? 'text-gray-400 animate-pulse' : 'text-mainTheme'
              }`}
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
            className={`flex-shrink-0 cursor-pointer ${
              !inputValue.trim() && currentAttachments.length === 0
                ? 'text-gray-400'
                : 'text-mainTheme'
            }`}
            onClick={handleSend}
            style={{
              pointerEvents:
                !inputValue.trim() && currentAttachments.length === 0
                  ? 'none'
                  : 'auto',
            }}
          />
        </div>
      </footer>
      {isModalOpen && currentViewPath && (
        <ImageViewerModal
          filePath={currentViewPath}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
