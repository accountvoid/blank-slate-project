import { PenaltyZoneScreen } from '@/features/penalty/PenaltyZoneScreen';
import { usePunishment } from '@/hooks/usePunishment';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const ROUND_TASKS = [
  { title: 'Round 1 — Endurance', desc: '20 push-ups + 1 km walk' },
  { title: 'Round 2 — Focus', desc: '15 min reading or memorisation' },
  { title: 'Round 3 — Discipline', desc: '10 min meditation + 50 squats' },
  { title: 'Round 4 — Will', desc: '20 min cardio or stretching' },
];

const ROUND_MS = 60 * 60 * 1000; // 1 hour
const TOTAL_ROUNDS = 4;

const Penalty = () => {
  const navigate = useNavigate();
  const { active, endAt, refresh } = usePunishment();
  const [now, setNow] = useState(Date.now());

  // Punishment is now activated server-side (start_punishment / check_and_apply_punishment).
  // The Penalty page is purely a display + countdown. If the user reaches here without
  // an active punishment, send them home.
  useEffect(() => {
    if (!active && !endAt) {
      const t = setTimeout(() => navigate('/', { replace: true }), 200);
      return () => clearTimeout(t);
    }
  }, [active, endAt, navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleTimeComplete = async () => {
    await refresh();
    navigate('/');
  };

  const endTime = endAt ?? new Date(Date.now() + 4 * ROUND_MS).toISOString();
  const endMs = new Date(endTime).getTime();
  const startMs = endMs - TOTAL_ROUNDS * ROUND_MS;
  const elapsed = Math.max(0, now - startMs);
  const currentRound = Math.min(TOTAL_ROUNDS - 1, Math.floor(elapsed / ROUND_MS));
  const roundElapsed = elapsed - currentRound * ROUND_MS;
  const roundRemaining = Math.max(0, ROUND_MS - roundElapsed);
  const mm = String(Math.floor(roundRemaining / 60000)).padStart(2, '0');
  const ss = String(Math.floor((roundRemaining % 60000) / 1000)).padStart(2, '0');

  const task = useMemo(() => ROUND_TASKS[currentRound] ?? ROUND_TASKS[0], [currentRound]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <img src="/GrottoMonsters.png" style={{ position: 'absolute', top: '10%', left: '5%', zIndex: 10, width: '150px' }} alt="penalty-1" />
      <img src="/GrottoMonsters.png" style={{ position: 'absolute', bottom: '15%', right: '10%', zIndex: 10, width: '150px' }} alt="penalty-2" />
      <img src="/GrottoMonsters.png" style={{ position: 'absolute', top: '50%', left: '80%', zIndex: 10, width: '150px' }} alt="penalty-3" />

      {/* 4-round HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md">
        <div className="bg-black/80 border-2 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.4)] p-3 rounded-none font-mono text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-[0.3em] text-red-400">PENALTY ZONE</span>
            <span className="text-[10px] tracking-[0.2em] text-red-300">{mm}:{ss}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-none',
                  i < currentRound ? 'bg-red-500' : i === currentRound ? 'bg-red-400 animate-pulse' : 'bg-white/10'
                )}
              />
            ))}
          </div>
          <div className="text-xs font-bold text-red-300">{task.title}</div>
          <div className="text-[11px] text-white/70 mt-1">{task.desc}</div>
          <div className="text-[10px] text-white/40 mt-2">
            Round {currentRound + 1} / {TOTAL_ROUNDS} — Fail to complete and the monster strikes.
          </div>
        </div>
      </div>

      <PenaltyZoneScreen endTime={endTime} onTimeComplete={handleTimeComplete} />
    </div>
  );
};

export default Penalty;
