import { useState, useRef, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { BottomNav } from '@/components/BottomNav';
import { PlayerQRCode } from '@/components/PlayerQRCode';
import { cn } from '@/lib/utils';
import { 
  User, Dumbbell, Brain, Heart, Zap, Shield, Menu, Copy, LogOut, 
  Fingerprint, Activity, Star, Search, ScanLine, UserPlus, MessageSquare, 
  Sword, ShieldCheck, Camera, ChevronRight, Settings, History, Users, 
  Scan, QrCode, Sparkles, Crown, Target, Flame, Award, Swords, Eye,
  ShieldAlert, ShieldOff, Wifi, WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Floating particle component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
    size: `${1 + Math.random() * 2}px`,
    opacity: 0.1 + Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary animate-float"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

// Use shared rank utility
import { getRankFromLevel } from '@/lib/ranks';
const getRankData = (level: number) => getRankFromLevel(level);

const Profile = () => {
  const { gameState } = useGameState();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('main');
  const [showResult, setShowResult] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  const rankData = getRankData(gameState.totalLevel);
  const completedGates = gameState.gates?.filter(g => g.completed).length || 0;
  const completedQuests = gameState.quests?.filter(q => q.completed).length || 0;
  
  // Discord linking is not part of the current profile schema
  const isDiscordLinked = false;

  const stats = [
    { key: 'strength', label: 'STR', icon: Dumbbell, value: gameState.levels.strength, color: 'from-red-600 to-red-400', textColor: 'text-red-400', bgColor: 'bg-red-500' },
    { key: 'mind', label: 'INT', icon: Brain, value: gameState.levels.mind, color: 'from-blue-600 to-blue-400', textColor: 'text-blue-400', bgColor: 'bg-blue-500' },
    { key: 'spirit', label: 'SPR', icon: Heart, value: gameState.levels.spirit, color: 'from-violet-600 to-violet-400', textColor: 'text-violet-400', bgColor: 'bg-violet-500' },
    { key: 'agility', label: 'AGI', icon: Zap, value: gameState.levels.agility || 0, color: 'from-emerald-600 to-emerald-400', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  ];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Avatar upload not yet wired to schema; informational toast only.
    const file = e.target.files?.[0];
    if (file) {
      toast({ title: t('profile.avatarUpdated') });
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-background overflow-hidden flex flex-col">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.1),transparent_60%)]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)/0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)/0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
        <FloatingParticles />
      </div>

      {/* Header */}
      <header className={cn(
        "relative z-20 flex justify-between items-center px-5 py-4 transition-all duration-700",
        animateIn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", rankData.textColor.replace('text-', 'bg-'))} />
            <h1 className="text-xs font-black tracking-[0.3em] uppercase text-foreground/80">System.Hunter_License</h1>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
             <div className={cn("w-1 h-1 rounded-full", isDiscordLinked ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
             <span className={cn("text-[7px] font-bold uppercase tracking-widest", isDiscordLinked ? "text-emerald-500/70" : "text-red-500/70")}>
               {isDiscordLinked ? t('profile.manaSyncActive') : t('profile.manaSyncDisconnected')}
             </span>
          </div>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="p-2.5 bg-card/50 border border-border/50 rounded-xl backdrop-blur-md transition-all active:scale-90 hover:border-primary/50">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent className="bg-background/95 backdrop-blur-xl border-l border-border">
            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-card/40">
                <span className="text-sm font-bold">{t('common.language')}</span>
                <LanguageSwitcher />
              </div>
              <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl" onClick={() => navigate('/stats')}>
                <Activity className="w-5 h-5 text-primary" /> <span>{t('nav.stats')}</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl">
                <Settings className="w-5 h-5 text-muted-foreground" /> <span>{t('profile.settings')}</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl">
                <Users className="w-5 h-5 text-muted-foreground" /> <span>{t('profile.friends')}</span>
              </Button>
              <div className="pt-4 border-t border-border/50">
                <Button variant="destructive" className="w-full rounded-2xl h-12" onClick={signOut}>
                  <LogOut className="w-4 h-4 ml-2" /> {t('profile.signOut')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto z-10 px-4 pb-24 space-y-5">

        {/* ═══════════════ MANA ENCRYPTION STATUS ═══════════════ */}
        {!isDiscordLinked ? (
          <div className="animate-in fade-in slide-in-from-top duration-700">
            <div className="relative overflow-hidden bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4">
              <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
              <div className="bg-red-500/20 p-2 rounded-lg">
                <ShieldOff className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-red-500 uppercase tracking-tighter">{t('profile.manaSyncDisconnected')}</h4>
                <p className="text-[10px] text-red-400/80 font-bold">{t('profile.manaSyncWarning')}</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-[10px] border-red-500/40 text-red-500 hover:bg-red-500/20">{t('profile.activate')}</Button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-[0.1em]">{t('profile.manaSyncActive')}</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
               <span className="text-[8px] font-mono text-emerald-500/60 font-bold tracking-widest leading-none">{t('profile.secure')}</span>
            </div>
          </div>
        )}

        {/* ═══════════════ HERO CARD ═══════════════ */}
        <div className={cn(
          "relative rounded-3xl overflow-hidden transition-all duration-1000",
          rankData.glow,
          animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          {/* Aura Effect */}
          <div className="absolute inset-0 rounded-3xl" style={{ background: `radial-gradient(ellipse at 50% 0%, ${rankData.auraColor}, transparent 70%)` }} />
          
          {/* Card Body */}
          <div className={cn("relative border-2 bg-card/80 backdrop-blur-xl rounded-3xl p-6", rankData.borderColor)}>
            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line" />
            </div>

            {/* Top: QR + Rank Badge */}
            <div className="flex justify-between items-start mb-6">
              <div className="p-1.5 bg-card/80 rounded-xl border border-border/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                {profile && <PlayerQRCode playerId={profile.id_player} playerName={profile.name_player} size={36} />}
              </div>
              
              {/* Rank Badge - Dramatic */}
              <div className={cn("relative group")}>
                <div className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-20 blur-xl transition-all group-hover:opacity-40",
                  rankData.gradient
                )} />
                <div className={cn(
                  "relative w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm shadow-inner",
                  rankData.borderColor
                )}>
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-0.5">Rank</span>
                  <span className={cn(
                    "text-4xl font-black italic bg-gradient-to-br bg-clip-text text-transparent drop-shadow-lg",
                    rankData.gradient
                  )}>
                    {rankData.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar + Identity */}
            <div className="flex items-center gap-5 mb-6">
              {/* Avatar with Aura Ring */}
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "absolute -inset-1.5 rounded-full bg-gradient-to-br opacity-60 blur-sm animate-glow-pulse",
                  rankData.gradient
                )} />
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-card bg-card shadow-2xl">
                  <img src="/setvoid.png" className="w-full h-full object-cover" alt="avatar" />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="absolute -bottom-1 -right-1 p-2 bg-primary rounded-full shadow-lg border-2 border-card active:scale-90 transition-transform hover:bg-primary/80"
                >
                  <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              {/* Name + Title + Level */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('profile.hunterName')}</p>
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight truncate drop-shadow-sm">
                  {gameState.playerName}
                </h2>
                <p className={cn("text-xs font-bold italic drop-shadow-[0_0_5px_currentColor]", rankData.textColor)}>
                  {rankData.title}
                </p>
                {gameState.equippedTitle && (
                  <div className="flex items-center gap-1 mt-1 bg-amber-500/10 w-fit px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400/80">{gameState.equippedTitle}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Level Display - Cinematic */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{t('profile.combatLevel')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase">LV.</span>
                  <span className={cn(
                    "text-5xl font-black tabular-nums leading-none bg-gradient-to-b bg-clip-text text-transparent filter drop-shadow-md",
                    rankData.gradient
                  )}>
                    {gameState.totalLevel}
                  </span>
                </div>
              </div>

              {/* System ID */}
              <div 
                className="flex flex-col items-end gap-1.5"
                onClick={() => { navigator.clipboard.writeText(profile?.id_player || ''); toast({ title: t('profile.copied') }); }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 rounded-xl border border-border/50 cursor-pointer hover:border-primary/30 transition-all group">
                  <Fingerprint className="w-3.5 h-3.5 text-primary/50" />
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">{profile?.id_player}</span>
                  <Copy className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* HP & Energy Bars */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card/60 border border-border/30 rounded-2xl p-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-1.5 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">HP</span>
                  </div>
                  <span className="text-[10px] font-bold text-foreground tabular-nums">{Math.round(gameState.hp)}/{gameState.maxHp}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden relative z-10">
                  <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(239,68,68,0.4)]" style={{ width: `${(gameState.hp / gameState.maxHp) * 100}%` }} />
                </div>
              </div>

              <div className="bg-card/60 border border-border/30 rounded-2xl p-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-amber-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-1.5 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Energy</span>
                  </div>
                  <span className="text-[10px] font-bold text-foreground tabular-nums">{Math.round(gameState.energy)}/{gameState.maxEnergy}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden relative z-10">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(245,158,11,0.4)]" style={{ width: `${(gameState.energy / gameState.maxEnergy) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ POWER STATS ═══════════════ */}
        <div className={cn(
          "transition-all duration-700 delay-200",
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Swords className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/70">{t('profile.powerLevels')}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <div 
                key={stat.key}
                className={cn(
                  "relative bg-card/60 border border-border/30 rounded-2xl p-4 transition-all duration-500 hover:border-primary/30 group overflow-hidden",
                )}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <stat.icon className="w-12 h-12" />
                </div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className={cn("p-2 rounded-xl bg-card border border-border/50 transition-all group-hover:scale-110", )}>
                    <stat.icon className={cn("w-4 h-4", stat.textColor)} />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-foreground tabular-nums">{stat.value}</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] relative z-10">{stat.label}</span>
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden relative z-10">
                  <div 
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", stat.color)}
                    style={{ width: `${Math.min(stat.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════ BATTLE RECORDS ═══════════════ */}
        <div className={cn(
          "transition-all duration-700 delay-300",
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/70">{t('profile.battleRecords')}</h3>
            </div>
            <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest">{t('profile.liveSync')}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Flame, label: t('profile.stats.streak'), value: gameState.streakDays, suffix: 'd', color: 'text-orange-400' },
              { icon: Target, label: t('profile.stats.gates'), value: completedGates, suffix: '', color: 'text-purple-400' },
              { icon: Award, label: t('profile.stats.quests'), value: completedQuests, suffix: '', color: 'text-blue-400' },
              { icon: Crown, label: t('profile.stats.gold'), value: gameState.gold, suffix: '', color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={item.label} className="bg-card/60 border border-border/30 rounded-2xl p-3 text-center transition-all hover:border-primary/20 hover:-translate-y-1">
                <item.icon className={cn("w-4 h-4 mx-auto mb-1.5 drop-shadow-[0_0_5px_currentColor]", item.color)} />
                <p className="text-lg font-black text-foreground tabular-nums leading-none">{item.value}{item.suffix}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════ ACTION BUTTONS ═══════════════ */}
        <div className={cn(
          "grid grid-cols-2 gap-3 transition-all duration-700 delay-400",
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <Dialog onOpenChange={(open) => !open && (setSearchMode('main'), setShowResult(false))}>
            <DialogTrigger asChild>
              <Button className="h-16 bg-primary hover:bg-primary/90 rounded-2xl border-none shadow-[0_8px_30px_hsl(var(--primary)/0.3)] transition-all active:scale-95 flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 -skew-x-12" />
                <div className="p-2 bg-primary-foreground/20 rounded-xl relative z-10"><Scan className="w-5 h-5 text-primary-foreground" /></div>
                <span className="text-xs font-black uppercase tracking-[0.15em] text-primary-foreground relative z-10">{t('profile.scan')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] bg-card border-border rounded-3xl p-0 overflow-hidden text-foreground shadow-2xl">
              {searchMode === 'main' && (
                <div className="p-8 space-y-6">
                  <h2 className="text-center font-black text-primary italic text-2xl tracking-tighter">{t('profile.search.hub')}</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => setSearchMode('id')} className="h-24 bg-card border border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all group">
                      <Fingerprint className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black tracking-widest uppercase text-foreground/80">{t('profile.search.idEntry')}</span>
                    </button>
                    <button onClick={() => setSearchMode('qr')} className="h-24 bg-card border border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all group">
                      <QrCode className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black tracking-widest uppercase text-foreground/80">{t('profile.search.qrScanner')}</span>
                    </button>
                  </div>
                </div>
              )}
              {showResult && (
                <div className="p-6">
                  <div className="bg-card border border-border rounded-3xl p-8 text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-primary/30 overflow-hidden shadow-2xl">
                      <img src="/setvoid.png" className="w-full h-full object-cover" alt="result" />
                    </div>
                    <h3 className="text-2xl font-black mb-6 uppercase italic text-foreground">Shadow Hunter</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Button className="h-14 bg-primary rounded-2xl"><UserPlus /></Button>
                      <Button variant="secondary" className="h-14 rounded-2xl"><MessageSquare /></Button>
                      <Button variant="destructive" className="h-14 rounded-2xl"><Sword /></Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {[
            { icon: Settings, label: t('profile.settings'), action: () => {} },
            { icon: History, label: t('profile.history'), action: () => {} },
            { icon: Users, label: t('profile.friends'), action: () => {} },
          ].map((btn) => (
            <Button 
              key={btn.label}
              variant="ghost" 
              className="h-16 bg-card/40 border border-border/30 rounded-2xl flex items-center gap-3 transition-all active:scale-95 hover:bg-card hover:border-primary/20"
              onClick={btn.action}
            >
              <div className="p-2 bg-card rounded-xl border border-border/50"><btn.icon className="w-4 h-4 text-muted-foreground" /></div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{btn.label}</span>
            </Button>
          ))}
        </div>

        {/* Footer Protocol */}
        <div className={cn(
          "flex justify-between items-center px-2 py-3 border-t border-border/20 text-muted-foreground/40 transition-all duration-700 delay-500",
          animateIn ? "opacity-100" : "opacity-0"
        )}>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">{t('profile.encryption')}: {isDiscordLinked ? t('profile.secure') : t('profile.vulnerable')}</span>
          </div>
          <span className="text-[8px] font-mono font-bold uppercase">v0.1-DARK_SYSTEM</span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
