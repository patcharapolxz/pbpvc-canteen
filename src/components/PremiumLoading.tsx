'use client';

interface PremiumLoadingProps {
  text?: string;
  subtext?: string;
}

export default function PremiumLoading({ text = 'กรุณารอสักครู่', subtext = 'กำลังเข้าสู่ระบบ...' }: PremiumLoadingProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md select-none">
      <div className="bg-white/95 dark:bg-[#1a1a1a]/95 rounded-[32px] p-8 max-w-[320px] w-full text-center border border-white/20 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all">
        {/* Spinning & Pulsing Logo Container */}
        <div className="relative w-[110px] h-[110px] mx-auto mb-6 flex items-center justify-center">
          {/* Pulsing Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
          
          {/* Spinning Emerald Ring */}
          <div className="absolute inset-0 rounded-full border-[4px] border-emerald-100 dark:border-emerald-950 border-t-emerald-600 dark:border-t-emerald-400 animate-spin" />
          
          {/* Logo in the center */}
          <div className="w-[84px] h-[84px] rounded-full bg-white flex items-center justify-center p-1.5 shadow-md overflow-hidden z-10">
            <img 
              src="https://yt3.googleusercontent.com/XB0JxhuEvnPiHwnQvPBZYcLaOyBLG897mi9fo7Y_H19bs1-Fbt2s92L2AWEYgxjK7acnC54RZA=s900-c-k-c0x00ffffff-no-rj" 
              className="rounded-full w-full h-full object-cover animate-pulse" 
              alt="PBPVC Logo" 
            />
          </div>
        </div>
        
        {/* Thai Waiting Text */}
        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
          {text}
        </h3>
        {subtext && (
          <p className="text-gray-400 dark:text-gray-500 text-[11px] font-bold tracking-wider uppercase mt-1">
            {subtext}
          </p>
        )}
        
        {/* Tiny bouncing dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
