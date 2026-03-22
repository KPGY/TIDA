import { X, Minus, Annoyed, Frown, Smile } from 'lucide-react';

export enum TopBarType {
  MAIN = 'MAIN',
  TODO = 'TODO',
  SETTING = 'SETTING',
}

interface TopBarProps {
  type: TopBarType; // 🚀 필수 prop: 상단바 종류
  title?: string; // Optional: 타이틀
  percent?: number; // Optional: 메인 화면용 퍼센트
  children?: React.ReactNode; // Optional: 추가 콘텐츠 (예: 설정 아이콘)
  gradientMode?: boolean; // Optional: 그라데이션 모드 여부
}

const TopBar: React.FC<TopBarProps> = ({
  type,
  percent = 0,
  children,
  gradientMode,
}) => {
  const getStatus = () => {
    if (percent === 0)
      return (
        <div className='text-mainTheme text-dynamic font-bold p-1 mt-1 flex gap-1 items-center antialiased font-baseFont'>
          <Smile size={20} className='text-green-400 -mt-1' />할 일이 없습니다
        </div>
      );
    if (percent < 10)
      return (
        <div className='text-mainTheme text-dynamic font-bold p-1 mt-1 flex gap-1 items-center antialiased font-baseFont'>
          <Annoyed size={20} className='text-yellow-400 -mt-1' />총 {percent}
          개의 할 일이 있습니다
        </div>
      );
    else
      return (
        <div className='text-mainTheme text-dynamic font-bold p-1 mt-1 flex gap-1 items-center antialiased font-baseFont'>
          <Frown size={20} className='text-red-400 -mt-1' />할 일이
          캐많습니다...
        </div>
      );
  };

  const getBackgroundClass = () => {
    // 1. 설정(SETTING) 타입일 경우 고정색 반환 (예: bg-gray-50 또는 원하는 테마색)
    if (type === TopBarType.SETTING) {
      return 'bg-gray-50'; // 원하는 고정색 클래스로 변경하세요!
    }

    // 2. 그 외 타입은 기존처럼 gradientMode에 따라 결정
    return gradientMode
      ? 'bg-gradient-to-r from-panelTheme to-panelThemeEnd'
      : 'bg-panelTheme';
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[90] flex flex-col w-full pointer-events-auto ${getBackgroundClass()}`}
    >
      {/* 2. 시스템 드래그 영역: 여기만 h-10을 유지합니다. */}
      <div className='h-10 flex items-center justify-between px-2 app-drag'>
        <div className='flex items-center'>
          {type === TopBarType.MAIN || type === TopBarType.SETTING ? (
            <div className='text-mainTheme p-2 text-base font-sans font-bold mt-1'>
              TIDA
            </div>
          ) : (
            getStatus()
          )}
        </div>

        <div className='flex gap-1 app-no-drag'>
          <button
            onClick={() => window.ipc.invoke('WINDOW_MINIMIZE')}
            className='p-2 rounded-full transition-colors group cursor-pointer hover:bg-black/5'
          >
            <Minus
              size={16}
              className='text-mainTheme opacity-80 group-hover:opacity-100'
            />
          </button>
          <button
            onClick={() => window.ipc.invoke('WINDOW_CLOSE')}
            className='p-2 rounded-full transition-colors group cursor-pointer hover:bg-black/5'
          >
            <X
              size={16}
              className='text-mainTheme opacity-80 group-hover:opacity-100'
            />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default TopBar;
