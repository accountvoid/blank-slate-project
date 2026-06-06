import React, { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { BottomNav } from '@/components/BottomNav';
import { Coins, Loader2, AlertTriangle, ShieldAlert, X, Zap, CreditCard, Wallet, Image as ImageIcon, CheckCircle2, QrCode, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const Market = () => {
  const { gameState, purchaseItem, mergeCuttingStones } = useGameState();
  const { playPurchase } = useSoundEffects();
  const { t } = useTranslation();
  const cuttingStonesOwned = (gameState.inventory || []).find(i => i.id === 'cutting_stones')?.quantity || 0;
  const CUTTING_NEED = 5;
  
  const [isScanning, setIsScanning] = useState(false);
  const [isExiting, setIsExiting] = useState(false); 
  const [isVisible, setIsVisible] = useState(false);
  const [scanResult, setScanResult] = useState<'idle' | 'searching' | 'failed'>('idle');
  const [activeItem, setActiveItem] = useState(null);

  // --- حالات متجر الذهب الجبارة ---
  const [showGoldShop, setShowGoldShop] = useState(false);
  const [goldShopExiting, setGoldShopExiting] = useState(false);
  const [paymentStep, setPaymentStep] = useState('offers'); // offers, details, confirm
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const GOLD_OFFERS = [
    { id: 'g1', gold: 1000, price: 0.5, rarity: 'E' },
    { id: 'g2', gold: 5000, price: 2.0, rarity: 'C' },
    { id: 'g3', gold: 15000, price: 5.0, rarity: 'B' },
    { id: 'g4', gold: 50000, price: 15.0, rarity: 'A' },
  ];

  const RARITY_CONFIG = {
    S: { border: 'border-gray-900', text: 'text-gray-400', locked: true },
    A: { border: 'border-purple-500', text: 'text-purple-400', locked: true },
    B: { border: 'border-blue-500', text: 'text-blue-400', locked: false },
    C: { border: 'border-white/50', text: 'text-white', locked: false },
    E: { border: 'border-gray-600', text: 'text-gray-400', locked: false },
  };

  const SOLO_ITEMS = [
    { id: 'hp_elixir',      i18nKey: 'items.hp_elixir',      category: 'consumable',       difficulty: 'E', price: 300,   icon: '🧪', rankLevel: 0, extra: t('items.stats.useOnly') },
    { id: 'mp_elixir',      i18nKey: 'items.mp_elixir',      category: 'consumable',       difficulty: 'E', price: 300,   icon: '⚡', rankLevel: 0, extra: t('items.stats.useOnly') },
    { id: 'xp_book',        i18nKey: 'items.xp_book',        category: 'consumable',       difficulty: 'E', price: 250,   icon: '📚', rankLevel: 0, extra: t('items.stats.useOnly') },
    { id: 'stone_dagger',   i18nKey: 'items.stone_dagger',   category: 'weapon',           difficulty: 'D', price: 600,   icon: '🗡️', rankLevel: 0, extra: `+16 ${t('items.stats.health')} · +23 ${t('items.stats.damage')} · 150 ${t('items.stats.blows')}` },
    { id: 'shadow_dagger',  i18nKey: 'items.shadow_dagger',  category: 'weapon',           difficulty: 'B', price: 11000, icon: '🗡️', rankLevel: 0, extra: `+92 ${t('items.stats.health')} · +231 ${t('items.stats.damage')} · 600 ${t('items.stats.blows')}` },
    { id: 'cutting_stones', i18nKey: 'items.cutting_stones', category: 'special_material', difficulty: 'C', price: 7000,  icon: '💎', rankLevel: 0, extra: '' },
    { id: 'mana_analyst',   i18nKey: 'items.mana_analyst',   category: 'utility',          difficulty: 'D', price: 1000,  icon: '📊', rankLevel: 0, extra: t('items.stats.usesCount', { count: 2 }) },
  ].map(i => ({
    ...i,
    name: t(`${i.i18nKey}.name`),
    arabicName: t(`${i.i18nKey}.name`),
    description: t(`${i.i18nKey}.description`),
  }));

  const getPlayerRank = () => {
    const level = gameState.totalLevel || 1;
    if (level >= 96) return 'S';
    if (level >= 71) return 'A';
    if (level >= 46) return 'B';
    if (level >= 26) return 'C';
    if (level >= 11) return 'D';
    return 'E';
  };

  const rankOrder = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
  const playerRank = getPlayerRank();
  const canSeeItem = (item) => rankOrder[playerRank] >= rankOrder[item.difficulty];
  const visibleItems = SOLO_ITEMS;

  const openGoldShop = () => {
    setShowGoldShop(true);
    setGoldShopExiting(false);
  };

  const closeGoldShop = () => {
    setGoldShopExiting(true);
    setTimeout(() => {
      setShowGoldShop(false);
      setPaymentStep('offers');
      setSelectedOffer(null);
      setPaymentMethod('');
    }, 600);
  };

  const startSystemScan = (item) => {
    setActiveItem(item);
    setIsScanning(true);
    setIsExiting(false);
    setScanResult('searching');
    setTimeout(() => setIsVisible(true), 50);
    setTimeout(() => {
      setScanResult('failed');
    }, 3000);
  };

  const closeScanModal = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsExiting(false);
      setIsVisible(false);
      setScanResult('idle');
      setActiveItem(null);
    }, 800);
  };

  const handlePurchase = (item) => {
    if (!canSeeItem(item)) { startSystemScan(item); return; }
    if (gameState.gold >= item.price) {
      purchaseItem(item.id);
      playPurchase();
      toast({ title: t('common.successTitle'), description: t('market.successAcquired', { name: item.name }) });
    } else {
      toast({ title: t('common.warningTitle'), description: t('market.insufficientGold'), variant: 'destructive' });
    }
  };

  const handleMaxPurchase = (item) => {
    if (!canSeeItem(item)) { startSystemScan(item); return; }
    const maxAffordable = Math.floor(gameState.gold / item.price);
    if (maxAffordable > 0) {
      for (let i = 0; i < maxAffordable; i++) purchaseItem(item.id);
      playPurchase();
      toast({ title: t('common.successTitle'), description: t('market.maxAcquired', { count: maxAffordable, name: item.name }) });
    } else {
      toast({ title: t('common.warningTitle'), description: t('market.insufficientGold'), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white p-3 font-sans selection:bg-blue-500/30 pb-24 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,78,216,0.15),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
      </div>

      {showGoldShop && (
        <div className={cn(
          "fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 sm:p-4 backdrop-blur-xl transition-all duration-500",
          goldShopExiting ? "bg-black/0" : "bg-black/80"
        )}>
          <div className={cn(
            "relative w-full max-w-lg bg-[#050b18] border-t-2 sm:border-2 border-blue-500/40 shadow-[0_-20px_50px_rgba(59,130,246,0.2)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            goldShopExiting ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
          )}>
            <div className="p-4 border-b border-blue-500/20 flex justify-between items-center bg-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Coins className="w-6 h-6 text-yellow-500 animate-pulse" />
                  <div className="absolute inset-0 blur-md bg-yellow-500/50" />
                </div>
                <h2 className="text-sm font-black tracking-[0.2em] uppercase italic text-blue-100">
                  Gold Exchange <span className="text-blue-500">Terminal</span>
                </h2>
              </div>
              <button onClick={closeGoldShop} className="p-2 hover:bg-white/5 transition-colors text-slate-400"><X /></button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {paymentStep === 'offers' && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-[10px] text-blue-400/60 uppercase font-bold tracking-[0.3em] mb-2">Available Credits:</p>
                  {GOLD_OFFERS.map((offer) => (
                    <div 
                      key={offer.id}
                      onClick={() => { setSelectedOffer(offer); setPaymentStep('details'); }}
                      className="group relative cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div className="absolute -inset-1 bg-blue-500/10 blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <div className="relative bg-black/40 border border-slate-200/20 p-4 flex justify-between items-center overflow-hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-900/20 border border-blue-500/30 flex items-center justify-center">
                             <Coins className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                          </div>
                          <div>
                            <div className="text-lg font-mono font-black text-white">{offer.gold.toLocaleString()} <span className="text-[10px] text-yellow-500">GOLD</span></div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest italic">Difficulty: {offer.rarity}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 font-black text-sm">${offer.price}</div>
                          <div className="text-[8px] text-blue-500/50 uppercase">Instant Sync</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paymentStep === 'details' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="bg-blue-500/5 border border-blue-500/20 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 opacity-10"><ShieldAlert className="w-16 h-16" /></div>
                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Player Identity</span>
                          <span className="text-xs font-mono text-blue-200">{gameState.playerName || "Player_Unknown"}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">System ID</span>
                          <span className="text-xs font-mono text-blue-400">#88-XC-2026</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Selected Amount</span>
                          <span className="text-sm font-mono text-yellow-500 font-black">{selectedOffer?.gold.toLocaleString()} GOLD</span>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] text-blue-400/60 uppercase font-bold tracking-[0.3em]">Payment Protocol:</p>
                      {[
                        { id: 'bank', name: 'Bank Transfer', icon: <CreditCard className="w-4 h-4"/>, info: 'IBAN: IQ77 ALIF 0000 9988 7766 5544' },
                        { id: 'crypto', name: 'USDT (TRC20)', icon: <Wallet className="w-4 h-4"/>, info: 'Wallet: TQw9xPzR8yMv2B...jK1L0p (Verify Network!)' },
                        { id: 'zain', name: 'Zain Cash / AsiaPay', icon: <Zap className="w-4 h-4"/>, info: 'Mobile Number: 0770 123 4567' }
                      ].map(method => (
                        <div key={method.id} className="space-y-2">
                           <button 
                              onClick={() => setPaymentMethod(method.id)}
                              className={cn(
                                "w-full flex items-center justify-between p-4 border transition-all duration-300",
                                paymentMethod === method.id ? "bg-blue-600/20 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-black/40 border-white/10 text-slate-500"
                              )}
                           >
                              <div className="flex items-center gap-3">
                                {method.icon}
                                <span className="text-xs font-bold uppercase tracking-widest">{method.name}</span>
                              </div>
                              {paymentMethod === method.id && <div className="w-2 h-2 bg-blue-400 animate-ping rounded-full" />}
                           </button>
                           {paymentMethod === method.id && (
                             <div className="p-4 bg-black/60 border-x border-b border-blue-500/30 text-[10px] font-mono text-blue-200 leading-relaxed animate-in slide-in-from-top-2">
                                <p className="mb-1 text-slate-500 uppercase">[SYSTEM DATA]:</p>
                                {method.info}
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                   
                   <button 
                    disabled={!paymentMethod}
                    onClick={() => setPaymentStep('confirm')}
                    className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-[0.4em] text-[10px] disabled:opacity-20 flex items-center justify-center gap-2 group"
                  >
                    Initialize Transfer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {paymentStep === 'confirm' && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="bg-red-500/5 border border-red-500/20 p-4">
                    <p className="text-[10px] text-red-400 font-bold uppercase leading-relaxed">
                      Verification required: Upload the transaction receipt and enter the ID to finalize the synchronization.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase font-black">Transaction Hash / Bill ID</label>
                        <input 
                            type="text" 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full bg-black/40 border-2 border-slate-200/20 p-4 text-sm focus:border-blue-500 outline-none font-mono text-blue-400 transition-all"
                            placeholder="TX-8829-100X"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase font-black">Proof of Acquisition (Image)</label>
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200/10 hover:border-blue-500/40 cursor-pointer transition-all bg-black/20 group">
                            <ImageIcon className="w-10 h-10 text-slate-600 group-hover:text-blue-500 transition-colors mb-2" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Select Decrypted Image</span>
                            <input type="file" className="hidden" />
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPaymentStep('details')}
                            className="px-4 bg-slate-900 border border-slate-800 text-slate-500 uppercase text-[10px] font-bold"
                        >
                            Back
                        </button>
                        <button 
                            onClick={() => {
                                toast({ title: "Verifying...", description: "Request sent to the Shadows." });
                                closeGoldShop();
                            }}
                            className="flex-1 py-4 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
                        >
                            Finalize Request
                        </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className={cn(
            "relative bg-[#050b18] border-2 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)] p-6 max-w-sm w-full font-mono overflow-hidden",
            isExiting ? "animate-[foldVertical_0.5s_ease-in_forwards]" : "animate-[unfoldVertical_0.4s_ease-out_forwards]"
          )}>
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />
            
            <div className="text-center space-y-4">
              <h2 className="text-blue-400 text-lg font-bold tracking-[0.2em] uppercase italic">
                {scanResult === 'searching' ? 'Analyzing Data...' : '[Access Denied]'}
              </h2>
              
              {scanResult === 'searching' ? (
                <div className="py-10 flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-[8px] animate-pulse text-blue-300">SCN</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-200 animate-pulse tracking-[0.3em] uppercase">Bypassing Encryption...</p>
                </div>
              ) : (
                <div className="py-2 flex flex-col items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
                  {(() => {
                    const playerLevel = gameState.totalLevel || 1;
                    const requiredLevel = (activeItem?.rankLevel || 0) * 10;
                    const levelDiff = requiredLevel - playerLevel;

                    const revealText = (text, diff) => {
                      if (diff <= 5) return text;
                      if (diff <= 15) return text.substring(0, 3) + ".".repeat(text.length - 3);
                      if (diff <= 30) return text[0] + "?".repeat(text.length - 1);
                      return "UNKNOWN DATA";
                    };

                    const powerLevels = { 'S': '80%', 'SS': '92%', 'EX': '100%' };
                    const itemPower = powerLevels[activeItem?.difficulty] || '60%';

                    return (
                      <div className="w-full space-y-4">
                        <div className="w-full border border-blue-500/30 p-4 bg-blue-950/20 relative">
                          <div className="absolute top-0 right-0 p-1">
                            <ShieldAlert className="w-4 h-4 text-red-500/50" />
                          </div>
                          
                          <div className="mb-3 border-b border-blue-500/30 pb-2">
                            <span className="text-[9px] text-blue-400 block mb-1">DATA_STREAM_NAME:</span>
                            <span className="text-sm font-bold text-white tracking-wider">
                              {revealText(activeItem?.name || "???", levelDiff)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] text-blue-400 block mb-1">DIFFICULTY:</span>
                              <span className="text-xs font-bold text-red-400">
                                {levelDiff <= 15 ? activeItem?.difficulty : '??'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-blue-400 block mb-1">CATEGORY:</span>
                              <span className="text-xs font-bold text-white uppercase">
                                {revealText(activeItem?.category || "???", levelDiff)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="w-full border border-red-900/40 p-3 bg-red-950/10 space-y-3">
                          <div className="flex items-center gap-2 border-b border-red-900/20 pb-1">
                            <Zap className="w-3 h-3 text-red-500" />
                            <span className="text-[8px] font-bold text-red-400 uppercase">Structural Power Analysis</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border border-red-500/20 flex items-center justify-center bg-black/40">
                              <span className="text-2xl filter blur-[2px] opacity-40">{activeItem?.icon}</span>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-[7px] text-slate-400 uppercase">
                                <span>Mana Output:</span>
                                <span className="text-red-500 font-bold tracking-widest">{itemPower}</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-red-600 shadow-[0_0_8px_red]" style={{ width: itemPower }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-left bg-red-950/20 border border-red-900/50 p-3">
                          <p className="text-[10px] text-red-400 leading-relaxed font-bold uppercase tracking-tighter">
                            Warning: Player level [{playerLevel}] is insufficient to decrypt this entry. 
                            Minimum level required: {requiredLevel}.
                          </p>
                        </div>

                        <button 
                          onClick={closeScanModal}
                          className="w-full py-2 mt-2 bg-blue-500/10 border border-blue-500/40 text-blue-300 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all active:scale-95"
                        >
                          <X className="w-3 h-3 inline-block mr-1" /> Terminate Connection
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="relative z-10 flex justify-center items-center mb-6 pt-4 gap-4">
        <div className="h-[1px] w-12 bg-blue-500/50" />
        <h1 className="text-xl font-bold tracking-[0.1em] uppercase italic text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">
          {t('market.systemStore')}
        </h1>
        <div className="h-[1px] w-12 bg-blue-500/50" />
        <div onClick={openGoldShop} className="absolute right-0 cursor-pointer bg-blue-950/40 border border-blue-400/50 px-3 py-1 flex items-center gap-2 hover:border-blue-300 transition-all active:scale-95">
          <Coins className="w-3.5 h-3.5 text-yellow-400 group-hover:rotate-12 transition-transform" />
          <span className="font-mono font-bold text-blue-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] text-sm">
            {gameState.gold.toLocaleString()}
          </span>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto space-y-12 animate-in fade-in duration-1000">
        {visibleItems.map((item) => {
          const isAlphaLocked = item.difficulty === 'S' || item.difficulty === 'A';
          const rarity = RARITY_CONFIG[item.difficulty] || RARITY_CONFIG.E;
          const isRevealed = canSeeItem(item);
          
          return (
            <div key={item.id} className="relative group">
              <div className="absolute -inset-0.5 bg-blue-500/20 blur-sm opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-black/60 border-2 border-slate-200/90 p-4 shadow-[0_0_20px_rgba(30,58,138,0.3)] transition-all active:scale-[0.98]">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <img src="/SETVOIDUI.png" alt="logo" className="w-3/4 object-contain" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-center mb-4 mt-[-1.5rem]">
                      <div className="border border-slate-400/50 px-4 py-0.5 bg-slate-900/90 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        <h2 className="text-xs font-bold tracking-widest text-white uppercase italic">
                          ITEM: <span className="text-blue-100">{isRevealed ? (item.arabicName || item.name) : t('market.notFound')}</span>
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 border border-slate-500/50 flex items-center justify-center bg-black/40 relative">
                          {!isRevealed ? (
                            <span className="text-4xl opacity-20 grayscale">❓</span>
                          ) : item.id === 'mana_meter' ? (
                            <img src={item.icon} alt="icon" className="w-16 h-16 grayscale brightness-200" />
                          ) : (
                            <span className="text-4xl grayscale brightness-200">{item.icon}</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 font-mono uppercase text-[10px]">
                          <div className="flex justify-between border-b border-white/10 pb-1">
                            <span className="text-slate-400">{t('market.rank')}:</span>
                            <span className={cn("font-bold", rarity.text)}>{isRevealed ? item.difficulty : '??'}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/10 pb-1">
                            <span className="text-slate-400">{t('market.type')}:</span>
                            <span className="text-white">{isRevealed ? item.category : '??'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="py-2 border-t border-slate-700/50">
                        <p className="text-lg font-bold text-center text-blue-50 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                          Gold: {isRevealed ? item.price.toLocaleString() : '????'}
                        </p>
                      </div>

                      <div className="text-center px-1">
                        <p className="text-[10px] text-slate-300 italic leading-tight">
                          {isRevealed ? item.description : t('market.analysisFailed')}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={isAlphaLocked && isRevealed}
                          className={cn(
                            "flex-1 mt-2 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all border",
                            !isRevealed ? "bg-blue-900/40 border-blue-500/50 text-blue-400" :
                            isAlphaLocked ? "bg-slate-900/50 border-slate-800 text-slate-600" :
                            gameState.gold >= item.price ? "bg-blue-500/10 border-blue-400/40 text-blue-300" : "bg-red-900/20 border-red-500/30 text-red-400"
                          )}
                        >
                          {!isRevealed ? t('market.analyze') : isAlphaLocked ? t('market.lockedShort') : t('market.purchase')}
                        </button>
                        {isRevealed && !isAlphaLocked && (
                          <button onClick={() => handleMaxPurchase(item)} className="mt-2 px-4 bg-yellow-600/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-black uppercase transition-all active:scale-90">
                            {t('market.max')}
                          </button>
                        )}
                      </div>

                      {isRevealed && item.id === 'cutting_stones' && (
                        <div className="mt-2 p-3 border border-cyan-500/30 bg-cyan-950/20">
                          <div className="flex items-center justify-between text-[10px] text-cyan-300 font-mono mb-2">
                            <span className="uppercase tracking-widest">🔮 {t('marketExt.merge')}</span>
                            <span>{t('marketExt.mergeProgress', { have: cuttingStonesOwned, need: CUTTING_NEED })}</span>
                          </div>
                          <button
                            onClick={() => {
                              const ok = mergeCuttingStones();
                              toast({
                                title: ok ? t('common.successTitle') : t('common.warningTitle'),
                                description: ok ? t('marketExt.mergedSuccess') : t('marketExt.mergedFailed', { need: CUTTING_NEED }),
                                variant: ok ? undefined : 'destructive',
                              });
                            }}
                            disabled={cuttingStonesOwned < CUTTING_NEED}
                            className={cn(
                              "w-full py-2 text-[10px] font-black uppercase tracking-widest border",
                              cuttingStonesOwned >= CUTTING_NEED
                                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200 active:scale-95"
                                : "bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed"
                            )}
                          >
                            {cuttingStonesOwned >= CUTTING_NEED ? t('marketExt.mergeReady') : t('marketExt.merge')}
                          </button>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <BottomNav />
      <style>{`
        @keyframes unfoldVertical {
          0% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        @keyframes foldVertical {
          0% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Market;
