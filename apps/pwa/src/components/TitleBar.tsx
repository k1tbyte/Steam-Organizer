import { FC } from 'react';

const isTauri = import.meta.env.VITE_IS_TAURI === '1';

export const TitleBar: FC = () => {
  if (!isTauri) return null;

  const minimize = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  };
  
  const toggleMaximize = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().toggleMaximize();
  };
  
  const close = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  };

  return (
    <div data-tauri-drag-region className="h-8 bg-primary flex justify-between items-center select-none fixed top-0 left-0 right-0 z-[100] text-[#8e8e8e]"
    style={{ WebkitAppRegion: 'drag' } as any}>
        
        {/* App Info / Drag Handle */}
        <div className="flex items-center px-3 gap-2 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 512 512"><use href="/favicon.svg#logo" fill="#6d67fd"/></svg>
            <span className="text-xs font-semibold">Steam Organizer</span>
        </div>

        {/* Window Controls */}
        <div className="flex h-full">
            <button 
              onClick={minimize} 
              className="px-4 h-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line></svg>
            </button>
            <button 
              onClick={toggleMaximize} 
              className="px-4 h-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            </button>
            <button 
              onClick={close} 
              className="px-4 h-full hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    </div>
  );
};
