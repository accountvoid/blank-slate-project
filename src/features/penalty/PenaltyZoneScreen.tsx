import { useState, useEffect, useRef } from 'react';

interface PenaltyZoneScreenProps {
  endTime: string; 
  onTimeComplete: () => void;
}

export const PenaltyZoneScreen = ({ endTime, onTimeComplete }: PenaltyZoneScreenProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const calculateTime = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0 && onTimeComplete && !completedRef.current) {
        completedRef.current = true;
        onTimeComplete();
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [endTime, onTimeComplete]);

  const formatTime = (s: number) => {
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return {
      h: String(hours).padStart(2, '0'),
      m: String(minutes).padStart(2, '0'),
      sec: String(seconds).padStart(2, '0')
    };
  };

  const t = formatTime(timeRemaining);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden font-sans select-none flex flex-col">
      
      {/* الجزء العلوي - بنفسجي غامق */}
      <div className="relative h-[60vh] w-full bg-gradient-to-b from-[#1a0b2e] via-[#0d0517] to-black flex flex-col items-center justify-center">
        
        {/* إضاءة بنفسجية خافتة في الخلفية */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.2)_0%,transparent_70%)]" />

        {/* العداد العلوي */}
        <div className="relative z-50 flex flex-col items-center w-full px-4">
          <div className="px-6 py-1 border-x-2 border-red-600/40 mb-6">
            <span className="text-red-500 font-bold tracking-[0.5em] text-[12px] md:text-[14px] uppercase">
              Penalty Countdown
            </span>
          </div>
          
          <div className="text-6xl sm:text-7xl md:text-9xl font-mono font-light text-white tracking-[0.1em] drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            {t.h}<span className="text-red-600 animate-pulse">:</span>{t.m}<span className="text-red-600 animate-pulse">:</span>{t.sec}
          </div>
        </div>

        {/* تأثير ضبابي بنفسجي فوق خط الأفق */}
        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* الجزء السفلي - الأسود الفاحم مع الشخصية والخط */}
      <div className="relative h-[40vh] w-full bg-black flex flex-col items-center">
        
        {/* الخط الأحمر ومجسم الشخص */}
        <div className="absolute top-[30%] left-0 right-0 z-50 flex flex-col items-center">
          
          {/* مجسم الشخص فوق الخط مباشرة */}
          <div className="relative mb-[-4px]">
            <div className="relative w-12 h-20 flex flex-col items-center">
              {/* الرأس */}
              <div className="w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-1" />
              {/* الجسم */}
              <div className="w-8 h-12 bg-gradient-to-b from-white to-red-600 rounded-t-xl shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              {/* وهج تحت الشخص */}
              <div className="absolute -bottom-2 w-10 h-10 bg-red-600/40 blur-lg rounded-full" />
            </div>
          </div>

          {/* الخط الأحمر المتوهج */}
          <div className="h-[4px] w-full bg-red-600 shadow-[0_0_25px_3px_rgba(220,38,38,1),0_0_50px_15px_rgba(220,38,38,0.5)]" />
          <div className="absolute top-[76px] w-full h-8 bg-red-500/20 blur-xl" />
        </div>

        {/* تفاصيل الأرضية */}
        <div className="w-full h-full opacity-25 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
      </div>

      {/* تأثير الغبار المتطاير */}
      <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.09] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-float" />

      <style>{`
        @keyframes float {
          0% { background-position: 0 0; }
          100% { background-position: 500px 1000px; }
        }
        .animate-float { animation: float 100s linear infinite; }
      `}</style>
      
    </div>
  );
};
