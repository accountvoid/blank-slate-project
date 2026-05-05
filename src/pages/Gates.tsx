import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { BottomNav } from '@/components/BottomNav';
import { GateLootModal, generateGateLoot, LootItem } from '@/components/GateLootModal';
import { AlertTriangle, Zap, Target, Clock, X, Skull, Activity, Scan, Shield, Map as MapIcon, LocateFixed, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Gate } from '@/types/game';

const useGateTimer = (closingTime?: string) => {
  const [remaining, setRemaining] = useState(0);
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    if (!closingTime) return;
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(closingTime).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      setIsBroken(diff <= 0);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [closingTime]);

  const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');

  return { remaining, isBroken, formatted: `${h}:${m}:${s}` };
};

const Gates = () => {
  const { gameState, completeGate } = useGameState();
  const navigate = useNavigate();
  
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [showManaDetails, setShowManaDetails] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showLootModal, setShowLootModal] = useState(false);
  const [currentLoot, setCurrentLoot] = useState<LootItem[]>([]);
  const [completedGate, setCompletedGate] = useState<Gate | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const totalLevel = gameState.totalLevel || 1;
  const playerPower = totalLevel;

  const gates = gameState.gates || [];

  const hasManaGauge = gameState.inventory?.some(item => item.id === 'mana_meter' && item.quantity > 0);

  const handleGateClick = (gate: Gate) => {
    setSelectedGate(gate);
    setShowManaDetails(false);
    setIsScanning(false);
    setIsExiting(false);
    setTimeout(() => setIsVisible(true), 50);
  };

  const handleCloseModal = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setSelectedGate(null);
      setIsExiting(false);
      setShowManaDetails(false);
    }, 800);
  };

  const handleScanMana = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowManaDetails(true);
    }, 8000); 
  };

  const handleEnterGate = () => {
    if (!selectedGate) return;
    setIsEntering(true);
    setTimeout(() => {
      navigate(`/dungeon?rank=${selectedGate.rank}`);
    }, 3000);
  };

  const handleCollectLoot = () => {
    if (!completedGate) return;
    completeGate(completedGate.id, currentLoot);
    setShowLootModal(false);
    setCompletedGate(null);
    setCurrentLoot([]);
  };

  const getGateColor = (rank: string) => {
    switch (rank) {
      case 'S': return 'from-red-500 to-red-700';
      case 'A': return 'from-purple-500 to-purple-700';
      case 'B': return 'from-blue-500 to-blue-700';
      case 'C': return 'from-cyan-500 to-cyan-700';
      case 'D': return 'from-green-500 to-green-700';
      case 'E': return 'from-gray-500 to-gray-700';
      default: return 'from-blue-500 to-blue-700';
    }
  };

  const getGateBorderColor = (rank: string) => {
    switch (rank) {
      case 'S': return 'border-red-500/50';
      case 'A': return 'border-purple-500/50';
      case 'B': return 'border-blue-500/50';
      case 'C': return 'border-cyan-500/50';
      case 'D': return 'border-green-500/50';
      case 'E': return 'border-gray-500/50';
      default: return 'border-blue-500/50';
    }
  };

  const getGateGlow = (rank: string) => {
    switch (rank) {
      case 'S': return '0 0 80px rgba(239, 68, 68, 0.7)';
      case 'A': return '0 0 80px rgba(168, 85, 247, 0.6)';
      case 'B': return '0 0 60px rgba(59, 130, 246, 0.5)';
      case 'C': return '0 0 50px rgba(6, 182, 212, 0.4)';
      case 'D': return '0 0 50px rgba(34, 197, 94, 0.4)';
      case 'E': return '0 0 40px rgba(156, 163, 175, 0.3)';
      default: return '0 0 50px rgba(59, 130, 246, 0.5)';
    }
  };

  const isGateLocked = (gate: Gate) => gate.rank === 'S' || gate.rank === 'A';
  const canSeeGateDetails = (gate: Gate) => !isGateLocked(gate);

  if (isEntering) {
    return (
      <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <img src="/portal.gif" alt="Portal Transition" className="w-full h-full object-cover mix-blend-screen scale-150 animate-[spin_20s_linear_infinite]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white font-sans selection:bg-purple-500/30 pb-40 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(76,29,149,0.15),transparent_80%)]" />
      </div>

      <header className="relative z-20 pt-16 pb-12 px-6 text-center border-b border-white/5">
        <h1 className="relative text-3xl font-black italic tracking-[0.3em] uppercase">
          <span className="text-white drop-shadow-[0_0_100px_rgba(255,255,255,0.5)]">Dungeon</span>
          <span className="block text-xs text-blue-400 mt-2 tracking-[0.5em] font-bold uppercase opacity-70">Gate Recognition System</span>
        </h1>
        <div className="mt-4 text-sm text-slate-400">
          البوابات المتاحة اليوم: <span className="text-white font-bold">{gates.length}</span>
        </div>
      </header>

      {gates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <Target className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-400 mb-2">لا توجد بوابات</h2>
          <p className="text-sm text-slate-500">لم يتم اكتشاف أي بوابات اليوم. عد غداً!</p>
        </div>
      ) : (
        <main className="relative z-10 px-6 space-y-40 mt-16">
          {gates.map((gate, idx) => (
            <GateCard
              key={gate.id}
              gate={gate}
              index={idx}
              onGateClick={handleGateClick}
              getGateGlow={getGateGlow}
              getGateBorderColor={getGateBorderColor}
              getGateColor={getGateColor}
              isGateLocked={isGateLocked}
            />
          ))}
        </main>
      )}

      {/* Gate Detail Modal */}
      {selectedGate && (
        <GateDetailModal
          gate={selectedGate}
          isVisible={isVisible}
          isExiting={isExiting}
          isScanning={isScanning}
          showManaDetails={showManaDetails}
          hasManaGauge={!!hasManaGauge}
          onClose={handleCloseModal}
          onScanMana={handleScanMana}
          onEnter={handleEnterGate}
          getGateGlow={getGateGlow}
          getGateColor={getGateColor}
          isGateLocked={isGateLocked}
          canSeeGateDetails={canSeeGateDetails}
        />
      )}

      <GateLootModal
        show={showLootModal}
        gate={completedGate}
        loot={currentLoot}
        onClose={() => setShowLootModal(false)}
        onCollect={handleCollectLoot}
      />

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        @keyframes loading { from { width: 0%; } to { width: 100%; } }
        @keyframes crack-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes blood-drip { 0% { transform: scaleY(0); opacity: 0; } 50% { transform: scaleY(1); opacity: 1; } 100% { transform: scaleY(1); opacity: 0.3; } }
      `}} />
    </div>
  );
};

// ─── Gate Card Component ───
interface GateCardProps {
  gate: Gate;
  index: number;
  onGateClick: (gate: Gate) => void;
  getGateGlow: (rank: string) => string;
  getGateBorderColor: (rank: string) => string;
  getGateColor: (rank: string) => string;
  isGateLocked: (gate: Gate) => boolean;
}

const GateCard = ({ gate, index, onGateClick, getGateGlow, getGateBorderColor, getGateColor, isGateLocked }: GateCardProps) => {
  const { isBroken, formatted } = useGateTimer(gate.closingTime);
  const locked = isGateLocked(gate);
  const gateNum = gate.gateNumber || (index + 1);

  return (
    <div className="relative group flex flex-col items-center max-w-sm mx-auto">
      {/* Portal */}
      <div
        onClick={() => !isBroken && onGateClick(gate)}
        className={cn(
          "relative w-72 h-72 flex items-center justify-center transition-all duration-500 z-20",
          isBroken ? "cursor-not-allowed opacity-40 grayscale" : "cursor-pointer hover:scale-110 active:scale-90"
        )}
        style={{ filter: isBroken ? 'grayscale(1) brightness(0.3)' : `drop-shadow(${getGateGlow(gate.rank)})` }}
      >
        <div className={cn(
          "relative w-full h-full rounded-full overflow-hidden border-2 transition-colors",
          isBroken ? "border-red-900/80" : getGateBorderColor(gate.rank)
        )}>
          <img src="/portal.gif" alt="Portal" className={cn("w-full h-full object-cover scale-110 mix-blend-screen brightness-125", isBroken && "hue-rotate-[320deg] saturate-200 brightness-50")} />
          {isBroken && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-950/60">
              <X className="w-24 h-24 text-red-600 opacity-80" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className={cn(
        "relative w-full p-5 mt-10 z-10 border-2",
        isBroken
          ? "bg-red-950/40 border-red-700/60 shadow-[0_0_40px_rgba(220,38,38,0.3)]"
          : "bg-black/60 border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      )}>
        {/* Header Badge - RANK only */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className={cn(
            "border px-6 py-1 shadow-lg",
            isBroken
              ? "border-red-600/80 bg-red-950 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              : "border-slate-400/50 bg-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          )}>
            <h2 className={cn("text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2", isBroken ? "text-red-400" : "text-white")}>
              {isBroken && <Skull className="w-3 h-3 text-red-500 animate-pulse" />}
              RANK: <span className={cn(
                isBroken ? "text-red-500" :
                gate.rank === 'S' ? "text-red-500" : gate.rank === 'A' ? "text-purple-400" : "text-blue-400"
              )}>{gate.rank}</span>
              {locked && !isBroken && <span className="text-slate-500 ml-2">[Alpha]</span>}
            </h2>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {/* Gate Name - first info row */}
          <div className={cn("flex items-center justify-between p-3 border-b", isBroken ? "border-red-800/40" : "border-white/10")}>
            <div className="flex items-center gap-2">
              <Target className={cn("w-3.5 h-3.5", isBroken ? "text-red-500" : "text-slate-400")} />
              <p className={cn("text-[10px] uppercase font-black tracking-tighter", isBroken ? "text-red-400" : "text-slate-400")}>اسم البوابة</p>
            </div>
            <span className={cn("text-sm font-black italic", isBroken ? "text-red-400" : "text-white")}>
              البوابة {gateNum}
            </span>
          </div>

          {/* System Message */}
          <div className={cn(
            "py-2 px-3 border-l-2",
            isBroken
              ? "bg-red-950/30 border-red-600/60"
              : "bg-white/5 border-white/20"
          )}>
            {isBroken ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" />
                <p className="text-[9px] text-red-400 font-bold italic leading-relaxed uppercase tracking-tighter">
                  ⚠ تحذير: البوابة قد انهارت. تشققات بُعدية تم اكتشافها. لا يمكن الدخول.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <p className="text-[9px] text-cyan-300/80 font-bold italic leading-relaxed uppercase tracking-tighter">
                  ✦ النظام قد منح الدخول... شقّ بُعدي مستقر. اضغط على البوابة للبدء.
                </p>
              </div>
            )}
          </div>

          {/* Energy Density */}
          <div className={cn("flex justify-between items-center border-b pb-2", isBroken ? "border-red-800/40" : "border-white/10")}>
            <div className="flex items-center gap-2">
              <Zap className={cn("w-3.5 h-3.5", isBroken ? "text-red-400" : "text-yellow-400")} />
              <p className={cn("text-[10px] uppercase font-black tracking-tighter", isBroken ? "text-red-400/60" : "text-slate-400")}>Energy Density</p>
            </div>
            <p className={cn("text-base font-mono font-bold italic", isBroken ? "text-red-500/50 line-through" : "text-white")}>
              {gate.energyDensity} <span className="text-[9px] opacity-40">MP</span>
            </p>
          </div>

          {/* Danger Level */}
          <div className={cn("flex justify-between items-center border-b pb-2", isBroken ? "border-red-800/40" : "border-white/10")}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("w-3.5 h-3.5",
                isBroken ? "text-red-500" :
                gate.rank === 'S' ? "text-red-500" : gate.rank === 'A' ? "text-purple-400" : "text-blue-400"
              )} />
              <p className={cn("text-[10px] uppercase font-black tracking-tighter", isBroken ? "text-red-400/60" : "text-slate-400")}>Danger Level</p>
            </div>
            <p className={cn("text-xs font-black uppercase italic tracking-widest",
              isBroken ? "text-red-500/50 line-through" :
              gate.rank === 'S' ? "text-red-500" : gate.rank === 'A' ? "text-purple-400" : "text-blue-400"
            )}>
              {gate.danger}
            </p>
          </div>

          {/* Timer / Status - LAST info row */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Clock className={cn("w-3.5 h-3.5", isBroken ? "text-red-500" : "text-cyan-400")} />
              <p className={cn("text-[10px] uppercase font-black tracking-tighter", isBroken ? "text-red-400" : "text-slate-400")}>
                {isBroken ? "حالة البوابة" : "وقت الإغلاق"}
              </p>
            </div>
            {isBroken ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="text-xs font-black text-red-500 uppercase tracking-wider animate-[crack-pulse_1.5s_ease-in-out_infinite]">
                  كُسرت البوابة
                </span>
              </div>
            ) : (
              <span className="text-base font-mono font-bold text-cyan-400 tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                {formatted}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Gate Detail Modal ───
interface GateDetailModalProps {
  gate: Gate;
  isVisible: boolean;
  isExiting: boolean;
  isScanning: boolean;
  showManaDetails: boolean;
  hasManaGauge: boolean;
  onClose: () => void;
  onScanMana: () => void;
  onEnter: () => void;
  getGateGlow: (rank: string) => string;
  getGateColor: (rank: string) => string;
  isGateLocked: (gate: Gate) => boolean;
  canSeeGateDetails: (gate: Gate) => boolean;
}

const GateDetailModal = ({
  gate, isVisible, isExiting, isScanning, showManaDetails, hasManaGauge,
  onClose, onScanMana, onEnter, getGateGlow, getGateColor, isGateLocked, canSeeGateDetails
}: GateDetailModalProps) => {
  const { isBroken, formatted } = useGateTimer(gate.closingTime);
  const gateNum = gate.gateNumber || 1;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-[1000ms]",
      isVisible && !isExiting ? "bg-black/60" : "bg-black/0 pointer-events-none"
    )}>
      <div className={cn(
        "relative max-w-md w-full border-x shadow-lg transition-all ease-[cubic-bezier(0.2,1,0.2,1)] origin-center",
        isBroken ? "bg-[#0a0000] border-red-800/50" : "bg-[#0c0c0e] border-white/40",
        isVisible && !isExiting
          ? "opacity-100 scale-y-100 duration-[1500ms]"
          : "opacity-0 scale-y-0 duration-[800ms]"
      )} style={{ boxShadow: isBroken ? '0 0 60px rgba(220,38,38,0.4)' : getGateGlow(gate.rank) }}>

        {/* Top/Bottom lines */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[1px] shadow-lg transition-all duration-[1500ms] delay-500",
          isBroken ? "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,1)]" : "bg-white shadow-[0_0_15px_rgba(255,255,255,1)]",
          isVisible && !isExiting ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
        )} />
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[1px] shadow-lg transition-all duration-[1500ms] delay-500",
          isBroken ? "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,1)]" : "bg-white shadow-[0_0_15px_rgba(255,255,255,1)]",
          isVisible && !isExiting ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
        )} />

        <div className={cn(
          "p-6 transition-all duration-1000 delay-700",
          isVisible && !isExiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-20">
            <X className="w-4 h-4" />
          </button>

          {isScanning ? (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
              <div className="relative">
                <img src="/AnimationManaAnalysis.gif" alt="Scanning..." className="w-64 h-64 object-contain mb-4 relative z-10" />
                <div className="absolute inset-0 bg-blue-500/20 blur-[60px] animate-pulse rounded-full" />
              </div>
              <p className="text-blue-400 font-black tracking-[0.4em] text-sm animate-pulse">DECODING MANA FREQUENCY...</p>
              <div className="mt-4 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-[loading_8s_linear]" />
              </div>
            </div>
          ) : (
            <div className={cn("transition-all duration-700", showManaDetails ? "animate-in fade-in zoom-in-95" : "")}>
              {/* Gate Header */}
              <div className="text-center mb-6">
                <div className={cn("w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-4xl font-black mb-3 text-white bg-gradient-to-br",
                  isBroken ? "from-red-900 to-red-950 border border-red-700/50" : getGateColor(gate.rank)
                )}>
                  {isBroken ? <Skull className="w-10 h-10 text-red-500" /> : (!canSeeGateDetails(gate) ? "?" : gate.rank)}
                </div>
                <h2 className={cn("text-2xl font-bold uppercase", isBroken ? "text-red-500" : "text-white drop-shadow-[0_0_100px_rgba(255,255,255,0.8)]")}>
                  البوابة {gateNum} {!isBroken && (!canSeeGateDetails(gate) ? "" : `— ${gate.name}`)}
                </h2>
                <p className={cn("text-sm uppercase tracking-widest mt-1", isBroken ? "text-red-400/60" : "text-slate-400")}>
                  {isBroken ? "GATE COLLAPSED" : (!canSeeGateDetails(gate) ? "???,???" : gate.danger)}
                </p>
              </div>

              {/* Timer in modal */}
              <div className={cn(
                "flex items-center justify-center gap-3 mb-6 p-3 border rounded-lg",
                isBroken ? "bg-red-950/40 border-red-700/50" : "bg-cyan-500/5 border-cyan-500/20"
              )}>
                {isBroken ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                    <span className="text-sm font-black text-red-500 uppercase tracking-wider">كُسرت البوابة — لا يمكن الدخول</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-lg font-mono font-bold text-cyan-400 tracking-widest">{formatted}</span>
                    <span className="text-[9px] text-cyan-400/60 uppercase font-bold">حتى الإغلاق</span>
                  </>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                {showManaDetails ? (
                  <div className={cn("p-4 rounded-lg border", isBroken ? "bg-red-950/20 border-red-800/30" : "bg-black/40 border-white/20")}>
                    <div className="grid grid-cols-2 gap-4 mb-4 border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Identifier</p>
                        <p className="text-[11px] text-white font-bold truncate">{!canSeeGateDetails(gate) ? "UNKNOWN" : gate.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Class Rank</p>
                        <p className={cn("text-[11px] font-black italic", (gate.rank === 'S' || gate.rank === 'A') ? "text-red-500" : "text-blue-400")}>{gate.rank}-Grade</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Mana Signature</p>
                        <p className="text-[11px] text-white font-mono font-bold tracking-widest">{!canSeeGateDetails(gate) ? "???,???" : gate.energyDensity}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Threat Status</p>
                        <p className="text-[11px] flex items-center gap-1 font-bold">
                          {!canSeeGateDetails(gate) ? "CRITICAL" : gate.danger}
                          {(gate.rank === 'S' || gate.rank === 'A') ? <span className="text-red-500">⛔🚫</span> : <span className="text-slate-400">⚠️</span>}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <LocateFixed className="w-3 h-3 text-blue-400 animate-pulse" />
                          <span className="text-[8px] text-white font-black uppercase tracking-[0.2em]">Labyrinth Structural Mapping</span>
                        </div>
                        <span className="text-[7px] text-blue-400/60 font-mono">NODE-042</span>
                      </div>
                      <div className="h-32 w-full bg-[#050505] rounded-sm border border-blue-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#4f4f4f 1px, transparent 1px), linear-gradient(90deg, #4f4f4f 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                        <svg className="absolute inset-0 w-full h-full opacity-60">
                          <path d="M 10 120 V 100 H 40 V 80 H 20 V 50 H 60 V 70 H 90 V 40 H 120 V 90 H 150 V 60 H 180 V 100 H 210 V 20 H 250"
                                stroke="rgba(59, 130, 246, 0.7)" strokeWidth="1.5" fill="none" strokeDasharray="1000">
                            <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="8s" repeatCount="indefinite" />
                          </path>
                          <circle cx="250" cy="20" r="4" fill="#ef4444" className="animate-pulse" />
                          <circle cx="10" cy="120" r="3" fill="#ffffff" />
                        </svg>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-400/20 shadow-[0_0_10px_blue] animate-[scan_2s_linear_infinite]" />
                        <div className="absolute bottom-2 right-2 text-[6px] text-white/30 font-mono uppercase text-right leading-none">
                          Complex Pathing Detected<br/>Integrity: Stable
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={cn("flex justify-between items-center p-3 rounded-lg border text-white",
                    isBroken ? "bg-red-950/20 border-red-800/30" : "bg-white/5 border-white/10"
                  )}>
                    <span className="flex items-center gap-2 text-sm text-slate-300">كثافة الطاقة</span>
                    <span className="font-bold">{!canSeeGateDetails(gate) ? '???' : gate.energyDensity} MP</span>
                  </div>
                )}
              </div>

              {/* Rewards */}
              {!isBroken && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 mb-6">
                  <h3 className="text-sm font-bold mb-2 text-purple-400 text-center uppercase tracking-widest">المكافآت المتوقعة</h3>
                  <div className="flex justify-around text-sm font-bold text-slate-200">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> +{!canSeeGateDetails(gate) ? "?" : gate.rewards.xp} XP</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400" /> +{!canSeeGateDetails(gate) ? "?" : gate.rewards.gold} Gold</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!isScanning && (
            <>
              {hasManaGauge && !showManaDetails && !isBroken && (
                <button
                  onClick={onScanMana}
                  className="w-full py-3 mb-4 bg-blue-500/10 border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Scan className="w-4 h-4" />
                    إطلاق موجات السونار السحرية
                  </span>
                </button>
              )}

              <button
                onClick={onEnter}
                disabled={isGateLocked(gate) || isBroken}
                className={cn(
                  "w-full py-4 rounded-xl font-black text-lg transition-all text-white uppercase tracking-wider",
                  isBroken
                    ? "bg-red-950 border border-red-800/50 text-red-500/60 cursor-not-allowed"
                    : isGateLocked(gate)
                      ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r shadow-[0_10px_30px_rgba(0,0,0,0.5)] " + getGateColor(gate.rank)
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {isBroken ? (
                    <><Skull className="w-5 h-5" /> البوابة منهارة</>
                  ) : isGateLocked(gate) ? (
                    <><Skull className="w-5 h-5" /> LOCKED (RANK TOO HIGH)</>
                  ) : (
                    <><Activity className="w-5 h-5" /> ENTER DUNGEON</>
                  )}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gates;
