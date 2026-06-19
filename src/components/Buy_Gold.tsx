import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Coins, Loader2, Shield, Zap, CheckCircle2 } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const OFFERS = [
  { gold: 1000, usd: 1 },
  { gold: 5000, usd: 4 },
  { gold: 15000, usd: 10 },
  { gold: 50000, usd: 30 }
];

export default function Buy_Gold() {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [step, setStep] = useState("offers");

  const playerId = "test123"; // اربطه مع gameState لاحقاً

  const createPayment = async (offer) => {
    try {
      setLoading(true);
      setStep("paying");

      const { data, error } = await supabase.functions.invoke(
        "create-payment",
        {
          body: {
            id_player: playerId,
            amount_usd: offer.usd,
            gold_amount: offer.gold
          }
        }
      );

      if (error) throw error;

      const url =
        data?.payment?.invoice_url ||
        data?.payment?.payment_url ||
        data?.payment?.pay_address;

      setPaymentUrl(url || "");
      setStep("done");
    } catch (err) {
      console.error(err);
      alert("Payment failed");
      setStep("offers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">

      {/* HEADER */}
      <div className="text-center mt-10 mb-8">
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <Coins className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-widest">
            GOLD EXCHANGE
          </h1>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          SETVOID Payment Gateway
        </p>
      </div>

      {/* OFFERS */}
      {step === "offers" && (
        <div className="w-full max-w-md space-y-4">
          {OFFERS.map((offer, i) => (
            <div
              key={i}
              onClick={() => createPayment(offer)}
              className="border border-yellow-500/30 p-4 cursor-pointer bg-yellow-500/5 hover:bg-yellow-500/10 transition"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Coins className="text-yellow-400" />
                  <div>
                    <p className="font-bold">{offer.gold} GOLD</p>
                    <p className="text-xs text-gray-400">${offer.usd}</p>
                  </div>
                </div>

                <Zap className="text-blue-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LOADING */}
      {step === "paying" && (
        <div className="flex flex-col items-center mt-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
          <p className="text-sm mt-4 text-gray-400">
            Creating payment gateway...
          </p>
        </div>
      )}

      {/* DONE */}
      {step === "done" && (
        <div className="w-full max-w-md mt-10 space-y-4">

          <div className="p-4 border border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 />
              <p className="font-bold">Payment Created</p>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Complete payment to receive Gold instantly
            </p>
          </div>

          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-center bg-blue-600 py-3 font-bold"
          >
            OPEN PAYMENT
          </a>

          <button
            onClick={() => setStep("offers")}
            className="w-full text-xs text-gray-400"
          >
            Back
          </button>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-auto text-[10px] text-gray-600 mb-4 flex items-center gap-2">
        <Shield className="w-3 h-3" />
        SECURE SETVOID TRANSACTION LAYER
      </div>
    </div>
  );
}
