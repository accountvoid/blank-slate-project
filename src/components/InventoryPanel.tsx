import { useState } from 'react';
import { X, Package, Zap, Eye, Key, FlaskConical, Crown, Star, Lock, BarChart3, Gem, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ItemUseModal } from './ItemUseModal';
import { ItemAnalysisModal } from './ItemAnalysisModal';
import { StoneUseModal } from './StoneUseModal';
import { ManaStoneModal } from './ManaStoneModal';
import { GameState, StatType, InventoryItem } from '@/types/game';

// نظام ألوان الندرة
const RARITY_CONFIG = {
  S: {
    label: 'أسطوري',
    rank: 'S',
    color: 'from-black via-gray-900 to-black',
    border: 'border-gray-900',
    text: 'text-gray-400',
    glow: 'shadow-[0_0_20px_rgba(0,0,0,0.8)]',
    locked: true,
  },
  A: {
    label: 'ملحمي',
    rank: 'A',
    color: 'from-purple-900 via-purple-800 to-purple-900',
    border: 'border-purple-500',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    locked: true,
  },
  B: {
    label: 'نادر',
    rank: 'B',
    color: 'from-blue-900 via-blue-800 to-blue-900',
    border: 'border-blue-500',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    locked: false,
  },
  C: {
    label: 'غير شائع',
    rank: 'C',
    color: 'from-white/10 via-gray-200/20 to-white/10',
    border: 'border-white/50',
    text: 'text-white',
    glow: 'shadow-[0_0_15px_rgba(255,255,255,0.2)]',
    locked: false,
  },
  D: {
    label: 'عادي',
    rank: 'D',
    color: 'from-gray-700 via-gray-600 to-gray-700',
    border: 'border-gray-500',
    text: 'text-gray-300',
    glow: '',
    locked: false,
  },
  E: {
    label: 'أساسي',
    rank: 'E',
    color: 'from-gray-800 via-gray-700 to-gray-800',
    border: 'border-gray-600',
    text: 'text-gray-400',
    glow: '',
    locked: false,
  },
};

// قائمة العناصر المتوفرة في المتجر
interface ShopItem {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  category: string;
  rarity: keyof typeof RARITY_CONFIG;
  icon: React.ReactNode;
  effect?: string;
  price: number;
  isTitle?: boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  // رتبة E-D (رمادي فاتح)
  {
    id: 'hp_potion',
    name: 'Blood Elixir',
    arabicName: 'إكسير الدم',
    description: 'يستعيد 50% من الصحة القصوى',
    category: 'Elixir',
    rarity: 'E',
    icon: <FlaskConical className="w-6 h-6" />,
    effect: '+50% HP',
    price: 500,
  },
  {
    id: 'mp_potion',
    name: 'Energy Elixir',
    arabicName: 'إكسير الطاقة',
    description: 'يستعيد 50% من الطاقة القصوى',
    category: 'Elixir',
    rarity: 'E',
    icon: <FlaskConical className="w-6 h-6" />,
    effect: '+50% MP',
    price: 500,
  },
  // رتبة C (أبيض)
  {
    id: 'mana_meter',
    name: 'Mana Gauge',
    arabicName: 'مقياس المانا',
    description: 'جهاز قياس طاقة البوابات والعناصر',
    category: 'Tool',
    rarity: 'C',
    icon: <Zap className="w-6 h-6" />,
    effect: 'كشف الطاقة',
    price: 2000,
  },
  {
    id: 'awakened_title',
    name: 'Awakened One',
    arabicName: 'المستيقظ الواعي',
    description: 'لقب يُظهر أنك من المستيقظين',
    category: 'Title',
    rarity: 'C',
    icon: <Crown className="w-6 h-6" />,
    effect: '+5% XP',
    price: 3000,
    isTitle: true,
  },
  // رتبة B (أزرق)
  {
    id: 'power_eye_title',
    name: 'Eye of Power',
    arabicName: 'عين القوة',
    description: 'لقب نادر يكشف قوة الأعداء',
    category: 'Title',
    rarity: 'B',
    icon: <Eye className="w-6 h-6" />,
    effect: 'رؤية إحصائيات العدو',
    price: 10000,
    isTitle: true,
  },
  {
    id: 'storm_hand_title',
    name: 'Hand of Storm',
    arabicName: 'يد العاصفة',
    description: 'لقب نادر يزيد ضرر الهجمات',
    category: 'Title',
    rarity: 'B',
    icon: <Star className="w-6 h-6" />,
    effect: '+10% ضرر',
    price: 15000,
    isTitle: true,
  },
  {
    id: 'return_key',
    name: 'Return Key',
    arabicName: 'مفتاح العودة',
    description: 'يتيح الخروج من البوابة دون إكمالها',
    category: 'Key',
    rarity: 'B',
    icon: <Key className="w-6 h-6" />,
    effect: 'خروج آمن',
    price: 8000,
  },
  {
    id: 'cutting_stones',
    name: 'Cutting Stones',
    arabicName: 'أحجار القطع',
    description: 'ادمج 5 منها في السوق لصنع حجر مانا',
    category: 'Material',
    rarity: 'C',
    icon: <Gem className="w-6 h-6" />,
    effect: '5 → حجر مانا',
    price: 7000,
  },
  {
    id: 'mana_stone',
    name: 'Mana Stone',
    arabicName: 'حجر المانا',
    description: 'حجر نادر يمنحك إجراءً قوياً واحداً',
    category: 'Stone',
    rarity: 'B',
    icon: <Sparkles className="w-6 h-6" />,
    effect: 'إجراء خاص',
    price: 0,
  },
];

interface InventoryPanelProps {
  inventory: InventoryItem[];
  gameState: GameState;
  onUseItem?: (itemId: string, quantity: number, statAllocation?: Partial<Record<StatType, number>>) => void;
  onEquipTitle?: (itemId: string) => void;
  onResetXP?: () => void;
  onRename?: (newName: string) => void;
  onConsumeItem?: (itemId: string, quantity: number) => void;
}

export const InventoryPanel = ({ inventory, gameState, onUseItem, onEquipTitle, onResetXP, onRename, onConsumeItem }: InventoryPanelProps) => {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showUseModal, setShowUseModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [showStoneModal, setShowStoneModal] = useState(false);
  const [stoneItem, setStoneItem] = useState<InventoryItem | null>(null);

  // الحصول على كمية العنصر في المخزون
  const getItemQuantity = (itemId: string): number => {
    const item = inventory.find(i => i.id === itemId);
    return item?.quantity || 0;
  };

  // العناصر الموجودة في المخزون فقط
  const ownedItems = SHOP_ITEMS.filter(item => getItemQuantity(item.id) > 0);
  
  // جميع العناصر مع حالة القفل
  const allItems = SHOP_ITEMS.map(item => ({
    ...item,
    quantity: getItemQuantity(item.id),
    isOwned: getItemQuantity(item.id) > 0,
  }));

  const rarityConfig = selectedItem ? RARITY_CONFIG[selectedItem.rarity] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* العناصر المملوكة */}
      {ownedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-l-2 border-blue-400 pl-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold tracking-widest text-blue-100 uppercase">
              Owned Items ({ownedItems.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ownedItems.map((item) => {
              const config = RARITY_CONFIG[item.rarity];
              const quantity = getItemQuantity(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "relative p-4 border bg-gradient-to-br transition-all active:scale-95",
                    config.color,
                    config.border,
                    config.glow,
                    "hover:brightness-110"
                  )}
                >
                  {/* Badge quantity */}
                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    x{quantity}
                  </div>
                  {/* Rank badge */}
                  <div className={cn(
                    "absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 border",
                    config.border,
                    config.text
                  )}>
                    {config.rank}
                  </div>
                  <div className={cn("mb-2", config.text)}>
                    {item.icon}
                  </div>
                  <div className={cn("text-xs font-bold truncate", config.text)}>
                    {item.arabicName}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">{item.category}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* جميع العناصر المتوفرة */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-l-2 border-slate-400 pl-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">
            All Items Catalog
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {allItems.map((item) => {
            const config = RARITY_CONFIG[item.rarity];
            const isLocked = config.locked;
            const isOwned = item.isOwned;
            
            return (
              <button
                key={item.id}
                onClick={() => !isLocked && setSelectedItem(item)}
                disabled={isLocked}
                className={cn(
                  "relative p-4 border bg-gradient-to-br transition-all",
                  isLocked 
                    ? "grayscale opacity-50 cursor-not-allowed" 
                    : "hover:brightness-110 active:scale-95",
                  config.color,
                  config.border,
                  !isLocked && config.glow
                )}
              >
                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Lock className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                {/* Owned badge */}
                {isOwned && (
                  <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    x{item.quantity}
                  </div>
                )}
                {/* Rank badge */}
                <div className={cn(
                  "absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 border",
                  config.border,
                  config.text
                )}>
                  {config.rank}
                </div>
                <div className={cn("mb-2", isLocked ? "text-slate-600" : config.text)}>
                  {item.icon}
                </div>
                <div className={cn("text-xs font-bold truncate", isLocked ? "text-slate-600" : config.text)}>
                  {isLocked ? '???' : item.arabicName}
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {isLocked ? 'مقفل' : item.category}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* No items message */}
      {ownedItems.length === 0 && (
        <div className="text-center py-8 border border-slate-700/50 bg-black/40">
          <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">لا توجد عناصر في المخزون</p>
          <p className="text-xs text-slate-600 mt-1">اشترِ من المتجر لإضافة عناصر</p>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && rarityConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div 
            className="absolute inset-0"
            onClick={() => setSelectedItem(null)}
          />
          <div className={cn(
            "relative max-w-sm w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 p-6 animate-scale-in",
            rarityConfig.border,
            rarityConfig.glow
          )}>
            {/* Corner decorations */}
            <div className={cn("absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2", rarityConfig.border)} />
            <div className={cn("absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2", rarityConfig.border)} />
            <div className={cn("absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2", rarityConfig.border)} />
            <div className={cn("absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2", rarityConfig.border)} />

            {/* Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className={cn(
                "inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase mb-4 border",
                rarityConfig.border,
                rarityConfig.text
              )}>
                {rarityConfig.label} • {rarityConfig.rank}
              </div>
              <div className={cn(
                "w-20 h-20 mx-auto rounded-sm border flex items-center justify-center mb-4 bg-gradient-to-br",
                rarityConfig.color,
                rarityConfig.border,
                rarityConfig.glow
              )}>
                <div className={rarityConfig.text}>
                  {selectedItem.icon}
                </div>
              </div>
              <h2 className={cn("text-xl font-bold", rarityConfig.text)}>
                {selectedItem.arabicName}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{selectedItem.name}</p>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-white/5 rounded-sm">
                <p className="text-sm text-slate-300 text-center leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {selectedItem.effect && (
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-xs text-slate-400 uppercase">التأثير</span>
                  <span className={cn("text-sm font-bold", rarityConfig.text)}>
                    {selectedItem.effect}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                <span className="text-xs text-slate-400 uppercase">الكمية</span>
                <span className="text-lg font-bold text-white">
                  x{getItemQuantity(selectedItem.id)}
                </span>
              </div>

              {/* Buttons for items */}
              {getItemQuantity(selectedItem.id) > 0 && (
                <div className="flex gap-2">
                  {/* Use button */}
                  {!selectedItem.isTitle && onUseItem && (
                    <button
                      onClick={() => {
                        const invItem = inventory.find(i => i.id === selectedItem.id);
                        if (invItem) {
                          // Special stones get their own modal
                          const specialStoneIds = ['rename_stone', 'gate_exit_stone', 'grand_quest_stone', 'central_activation_stone'];
                          if (specialStoneIds.includes(selectedItem.id)) {
                            setStoneItem(invItem);
                            setShowStoneModal(true);
                            setSelectedItem(null);
                          } else {
                            setSelectedInventoryItem(invItem);
                            setShowUseModal(true);
                            setSelectedItem(null);
                          }
                        }
                      }}
                      className={cn(
                        "flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-all active:scale-95 border",
                        rarityConfig.border,
                        rarityConfig.text,
                        "bg-gradient-to-r",
                        rarityConfig.color,
                        "hover:brightness-110"
                      )}
                    >
                      استخدام
                    </button>
                  )}
                  
                  {/* Analyze button */}
                  {!selectedItem.isTitle && (
                    <button
                      onClick={() => {
                        const invItem = inventory.find(i => i.id === selectedItem.id);
                        if (invItem) {
                          setSelectedInventoryItem(invItem);
                          setShowAnalysisModal(true);
                          setSelectedItem(null);
                        }
                      }}
                      className="px-4 py-3 bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-600/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 text-sm font-bold">تحليل</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Use Modal */}
      {showUseModal && selectedInventoryItem && (
        <ItemUseModal
          item={selectedInventoryItem}
          gameState={gameState}
          onClose={() => {
            setShowUseModal(false);
            setSelectedInventoryItem(null);
          }}
          onUseItem={(itemId, quantity, statAllocation) => {
            onUseItem?.(itemId, quantity, statAllocation);
            setShowUseModal(false);
            setSelectedInventoryItem(null);
          }}
          onEquipTitle={(itemId) => {
            onEquipTitle?.(itemId);
            setShowUseModal(false);
            setSelectedInventoryItem(null);
          }}
          onAnalyze={() => {
            setShowUseModal(false);
            setShowAnalysisModal(true);
          }}
          onResetXP={() => {
            onResetXP?.();
            setShowUseModal(false);
            setSelectedInventoryItem(null);
          }}
        />
      )}

      {/* Item Analysis Modal */}
      {showAnalysisModal && selectedInventoryItem && (
        <ItemAnalysisModal
          item={selectedInventoryItem}
          onClose={() => {
            setShowAnalysisModal(false);
            setSelectedInventoryItem(null);
          }}
        />
      )}

      {/* Stone Use Modal */}
      {showStoneModal && stoneItem && (
        <StoneUseModal
          item={stoneItem}
          onClose={() => {
            setShowStoneModal(false);
            setStoneItem(null);
          }}
          onUse={(data) => {
            if (stoneItem.id === 'rename_stone' && data?.newName) {
              onRename?.(data.newName);
              onConsumeItem?.('rename_stone', 1);
            } else {
              // Other stones - just consume
              onConsumeItem?.(stoneItem.id, 1);
            }
            setShowStoneModal(false);
            setStoneItem(null);
          }}
        />
      )}
    </div>
  );
};
