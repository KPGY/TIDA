import { X, Minus, Annoyed, Frown, Smile } from 'lucide-react';
import Image from 'next/image';

export enum TopBarType {
  MAIN = 'MAIN',
  TODO = 'TODO',
}

interface TopBarProps {
  type: TopBarType; // 🚀 필수 prop: 상단바 종류
  title?: string; // Optional: 타이틀
  percent?: number; // Optional: 메인 화면용 퍼센트
}

const TopBar: React.FC<TopBarProps> = ({ type, percent = 0 }) => {
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

  return (
    <div className='fixed top-0 left-0 right-0 h-10 flex items-center justify-between px-2 z-[90] app-drag pointer-events-auto'>
      <div className='flex items-center'>
        {type === TopBarType.MAIN && (
          <div className='text-mainTheme p-2 text-base font-sans font-bold mt-1'>
            TIDA
          </div>
        )}

        {type === TopBarType.TODO && <>{getStatus()}</>}
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
  );
};

export default TopBar;
