import { X, Minus } from 'lucide-react';

const TopBar = () => {
  return (
    <>
      {/* 1. 드래그 가능 영역 (z-index 낮음, 화면 전체) */}
      <div className='fixed top-0 left-0 right-0 h-10 app-drag z-[90]'></div>

      {/* 2. 클릭 가능 영역 (z-index 높음, 버튼 위치만) */}
      <div className='fixed top-0 right-0 h-10 flex items-center px-4 z-[100] app-no-drag pointer-events-auto'>
        <div className='flex gap-1'>
          <button
            onClick={() => window.ipc.invoke('WINDOW_MINIMIZE')}
            className='p-2 rounded-full transition-colors group cursor-pointer'
          >
            <Minus
              size={16}
              className='text-mainTheme opacity-80 group-hover:opacity-100'
            />
          </button>
          <button
            onClick={() => window.ipc.invoke('WINDOW_CLOSE')}
            className='p-2 rounded-full transition-colors group cursor-pointer'
          >
            <X
              size={16}
              className='text-mainTheme opacity-80 group-hover:opacity-100'
            />
          </button>
        </div>
      </div>
    </>
  );
};

export default TopBar;
