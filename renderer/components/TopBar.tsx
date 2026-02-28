import { X, Minus, BatteryLow, BatteryFull, BatteryMedium } from 'lucide-react';

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
  const getStatusIcon = () => {
    if (percent === 0) return <BatteryLow size={20} className='text-red-400' />;
    if (percent < 100)
      return <BatteryMedium size={20} className='text-orange-400' />;
    else return <BatteryFull size={20} className='text-green-400' />;
  };

  return (
    <div className='fixed top-0 left-0 right-0 h-10 flex items-center justify-between px-2 z-[90] app-drag pointer-events-auto'>
      <div className='flex items-center'>
        {type === TopBarType.MAIN && (
          <div className='text-mainTheme font-bold p-2 text-sm'>TIDA</div>
        )}

        {type === TopBarType.TODO && (
          <div className='text-mainTheme text-sm font-bold p-2 flex gap-1 items-center antialiased'>
            {/* 🚀 아이콘을 y축으로 1px~1.5px 정도 내립니다 */}
            <div className='translate-y-[1px] flex items-center justify-center'>
              {getStatusIcon()}
            </div>

            {/* 텍스트의 line-height를 조절해서 높이를 맞춥니다 */}
            <span className='leading-none'>{percent}% 완료했습니다!</span>
          </div>
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
  );
};

export default TopBar;
