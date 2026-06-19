import React, { useState, useEffect, useRef } from 'react';
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

  const fileRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scanResult, setScanResult] = useState('idle');
  const [activeItem, setActiveItem] = useState(null);

  const [showGoldShop, setShowGoldShop] = useState(false);
  const [goldShopExiting, setGoldShopExiting] = useState(false);
  const [paymentStep, setPaymentStep] = useState('offers');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const GOLD_OFFERS = [
    { id: 'g1', gold: 1000, price: 0.5, rarity: 'E' },
    { id: 'g2', gold: 5000, price: 2.0, rarity: 'C' },
    { id: 'g3', gold: 15000, price: 5.0, rarity: 'B' },
    { id: 'g4', gold: 50000, price: 15.0, rarity: 'A' },
  ];

  const openGoldShop = () => {
    setShowGoldShop(true);
    setGoldShopExiting(false);
  };

  const closeGoldShop = () => {
    if (isProcessing) return;

    setGoldShopExiting(true);
    setTimeout(() => {
      setShowGoldShop(false);
      setPaymentStep('offers');
      setSelectedOffer(null);
      setPaymentMethod('');
      setTransactionId('');
    }, 600);
  };

  const handleFinalizePayment = async () => {
    if (!transactionId || !paymentMethod) {
      toast({
        title: "Missing Data",
        description: "Complete all fields first",
        variant: "destructive"
      });
      return;
    }

    const file = fileRef.current?.files?.[0];

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("transactionId", transactionId);
      formData.append("paymentMethod", paymentMethod);
      formData.append("offerId", selectedOffer?.id || "");
      if (file) formData.append("receipt", file);

      const res = await fetch("/api/gold/topup", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      toast({
        title: "Success",
        description: "Gold will be added shortly 🔥"
      });

      closeGoldShop();
    } catch (err) {
      toast({
        title: "Failed",
        description: "Transaction rejected or server error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white p-3 font-sans pb-24 overflow-x-hidden">

      {/* ===== GOLD SHOP ===== */}
      {showGoldShop && (
        <div className={cn(
          "fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 sm:p-4 backdrop-blur-xl",
          goldShopExiting ? "bg-black/0" : "bg-black/80"
        )}>
          <div className="relative w-full max-w-lg bg-[#050b18] border border-blue-500/40">

            {/* STEP 3 - CONFIRM (MODIFIED ONLY PART) */}
            {paymentStep === 'confirm' && (
              <div className="space-y-6 p-6">
                
                <div>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full p-3 bg-black border border-white/20 text-blue-400"
                    placeholder="Transaction ID"
                  />
                </div>

                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    className="w-full text-sm"
                  />
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleFinalizePayment}
                  className="w-full py-3 bg-white text-black font-bold disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Finalize Payment"}
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Market;
