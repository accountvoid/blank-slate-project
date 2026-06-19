import { useState, useEffect, useRef } from 'react';

interface PenaltyZoneScreenProps {
  endTime: string; 
  onTimeComplete: () => void;
}

export const PenaltyZoneScreen = ({ endTime, onTimeComplete }: PenaltyZoneScreenProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [fear, setFear] = useState(0);
  const [health, setHealth] = useState(100);
  const [phase, setPhase] = useState(0);

  const completedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      setTimeRemaining(remaining);

      // 💀 ضغط نفسي حسب الوقت
      const maxTime = 4 * 60 * 60; // تقديري
      const progress = 1 - remaining / maxTime;

      setFear(Math.min(100, Math.floor(progress * 100)));

      // ⚔️ مراحل الضغط
      if (progress < 0.3) setPhase(0);
      else if (progress < 0.6) setPhase(1);
      else if (progress < 0.85) setPhase(2);
      else setPhase(3);

      // 💔 ضرر تدريجي مع الخوف
      setHealth(h => Math.max(0, 100 - fear * 0.3));

      // ⛔ انتهاء الوقت
      if (remaining <= 0 && !completedRef.current) {
        completedRef.current = true;
        onTimeComplete();
      }
    };

    calculateTime();
    intervalRef.current = setInterval(calculateTime, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [endTime, onTimeComplete, fear]);

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
    <div className={`fixed inset-0 z-[100] overflow-hidden font-sans select-none flex flex-col transition-all duration-500 ${
      phase === 3 ? 'bg-red-950' : phase === 2 ? 'bg-purple-950' : 'bg-black'
    }`}>
      
      {/* 👁️ Shadow Presence */}
      {fear > 20 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="w-40 h-40 bg-black rounded-full blur-3xl opacity-60 animate-pulse" />
          <div className="absolute w-10 h-10 bg-red-600 rounded-full blur-xl animate-ping" />
        </div>
      )}

      {/* الجزء العلوي */}
      <div className="relative h-[60vh] w-full bg-gradient-to-b from-[#1a0b2e] via-[#0d0517] to-black flex flex-col items-center justify-center">
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.2)_0%,transparent_70%)]" />

        {/* العداد */}
        <div className="relative z-50 flex flex-col items-center w-full px-4">
          
          <div className="px-6 py-1 border-x-2 border-red-600/40 mb-6">
            <span className="text-red-500 font-bold tracking-[0.5em] text-[12px] uppercase">
              PENALTY REALM
            </span>
          </div>

          <div className={`text-6xl font-mono text-white transition-all ${
            phase === 3 ? 'animate-pulse scale-110 text-red-500' : ''
          }`}>
            {t.h}:{t.m}:{t.sec}
          </div>

          {/* 💔 Health Bar */}
          <div className="mt-4 w-[200px] h-2 bg-white/10">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${health}%` }}
            />
          </div>

          {/* 😨 Fear Bar */}
          <div className="mt-2 w-[200px] h-2 bg-white/10">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${fear}%` }}
            />
          </div>
        </div>

        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* الجزء السفلي */}
      <div className="relative h-[40vh] w-full bg-black flex flex-col items-center">
        
        {/* الخط والشخص */}
        <div className="absolute top-[30%] left-0 right-0 z-50 flex flex-col items-center">
          
          <div className="relative mb-[-4px]">
            <div className="relative w-12 h-20 flex flex-col items-center">
              <div className="w-5 h-5 bg-white rounded-full mb-1 shadow-lg" />
              <div className="w-8 h-12 bg-gradient-to-b from-white to-red-600 rounded-t-xl" />
              <div className="absolute -bottom-2 w-10 h-10 bg-red-600/40 blur-lg rounded-full" />
            </div>
          </div>

          <div className="h-[4px] w-full bg-red-600 shadow-[0_0_25px_3px_rgba(220,38,38,1)]" />
        </div>

        <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* الغبار */}
      <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse" />
    </div>
  );
};
