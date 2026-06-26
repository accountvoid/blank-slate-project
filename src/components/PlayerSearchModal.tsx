import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFriendships } from '@/hooks/useFriendships';
import { toast } from '@/hooks/use-toast';
import { Search, User, MessageCircle, UserPlus, UserCheck, Clock, Swords, Loader2, QrCode, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerProfile {
  user_id: string;
  name_player: string;
  id_player: string;
  avatar_url: string | null;
  created_at: string;
}

interface PlayerSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlayerSearchModal = ({ open, onOpenChange }: PlayerSearchModalProps) => {
  const { user } = useAuth();
  const { getFriendshipStatus, sendFriendRequest, refresh } = useFriendships();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState<PlayerProfile | null>(null);
  const [mode, setMode] = useState<'search' | 'result'>('search');
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setFoundPlayer(null);
      setMode('search');
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: 'أدخل معرف اللاعب', variant: 'destructive' });
      return;
    }

    setIsSearching(true);

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('user_id, id_player, name_player, created_at')
      .eq('id_player', searchQuery.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      toast({ title: 'خطأ في البحث', description: error.message, variant: 'destructive' });
      setIsSearching(false);
      return;
    }

    if (!data) {
      toast({ title: 'لم يتم العثور على اللاعب', description: 'تأكد من صحة المعرف', variant: 'destructive' });
      setIsSearching(false);
      return;
    }

    setFoundPlayer({ ...(data as { user_id: string; id_player: string; name_player: string; created_at: string }), avatar_url: null });
    setMode('result');
    setIsSearching(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleAddFriend = async () => {
    if (!foundPlayer) return;
    setAddingFriend(true);
    const { error } = await sendFriendRequest(foundPlayer.user_id);
    if (error) {
      const msg = error.message?.includes('duplicate') ? 'طلب الصداقة موجود بالفعل' : 'فشل إرسال الطلب';
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } else {
      toast({ title: 'تم الإرسال', description: 'تم إرسال طلب الصداقة بنجاح' });
      await refresh();
    }
    setAddingFriend(false);
  };

  const isOwnProfile = foundPlayer && user && foundPlayer.user_id === user.id;
  const friendStatus = foundPlayer ? getFriendshipStatus(foundPlayer.user_id) : 'none';

  const renderAddButton = () => {
    if (isOwnProfile) return null;

    if (friendStatus === 'accepted') {
      return (
        <Button variant="outline" disabled className="flex flex-col items-center gap-1 h-auto py-3 border-green-500/30">
          <UserCheck className="w-5 h-5 text-green-400" />
          <span className="text-[10px] text-green-400">أصدقاء</span>
        </Button>
      );
    }

    if (friendStatus === 'pending_sent') {
      return (
        <Button variant="outline" disabled className="flex flex-col items-center gap-1 h-auto py-3 border-yellow-500/30">
          <Clock className="w-5 h-5 text-yellow-400" />
          <span className="text-[10px] text-yellow-400">تم الإرسال</span>
        </Button>
      );
    }

    if (friendStatus === 'pending_received') {
      return (
        <Button variant="outline" disabled className="flex flex-col items-center gap-1 h-auto py-3 border-blue-500/30">
          <Clock className="w-5 h-5 text-blue-400" />
          <span className="text-[10px] text-blue-400">بانتظارك</span>
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        onClick={handleAddFriend}
        disabled={addingFriend}
        className="flex flex-col items-center gap-1 h-auto py-3 border-green-500/30 hover:bg-green-500/10"
      >
        {addingFriend ? <Loader2 className="w-5 h-5 animate-spin text-green-400" /> : <UserPlus className="w-5 h-5 text-green-400" />}
        <span className="text-[10px] text-green-400">إضافة</span>
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-primary/30 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-primary/20 bg-primary/5">
          <DialogTitle className="text-sm font-bold tracking-wider uppercase text-primary text-center flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            البحث عن لاعب
          </DialogTitle>
        </DialogHeader>

        {mode === 'search' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-primary/20">
              <QrCode className="w-5 h-5 text-primary" />
              <p className="text-xs text-muted-foreground">أدخل معرف اللاعب (مثال: SV-XXXXXXXX)</p>
            </div>

            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="SV-XXXXXXXX"
                className="text-center text-lg font-bold tracking-widest bg-muted/30 border-primary/30 focus:border-primary h-14"
                dir="ltr"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  بحث
                </>
              )}
            </Button>
          </div>
        )}

        {mode === 'result' && foundPlayer && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4 text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                {foundPlayer.avatar_url ? (
                  <img src={foundPlayer.avatar_url} alt={foundPlayer.name_player} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              
              <h3 className="text-xl font-black text-foreground mb-1">{foundPlayer.name_player}</h3>
              <p className="text-xs text-primary font-mono tracking-wider mb-2">{foundPlayer.id_player}</p>
              <p className="text-xs text-muted-foreground">انضم في {formatDate(foundPlayer.created_at)}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => toast({ title: 'قريباً', description: 'ميزة المراسلة ستكون متاحة قريباً' })}
                className="flex flex-col items-center gap-1 h-auto py-3 border-blue-500/30 hover:bg-blue-500/10 relative"
              >
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span className="absolute -top-1 -left-1 text-[8px] bg-blue-500 text-white px-1 rounded">قريباً</span>
                <span className="text-[10px] text-blue-400">مراسلة</span>
              </Button>

              {renderAddButton()}

              <Button
                variant="outline"
                onClick={() => toast({ title: 'قريباً', description: 'ميزة المبارزة ستكون متاحة قريباً' })}
                className="flex flex-col items-center gap-1 h-auto py-3 border-orange-500/30 hover:bg-orange-500/10 relative"
              >
                <Swords className="w-5 h-5 text-orange-400" />
                <span className="text-[10px] text-orange-400">1V1</span>
                <span className="absolute -top-1 -right-1 text-[8px] bg-orange-500 text-white px-1 rounded">قريباً</span>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setMode('search')}
              className="w-full text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              بحث جديد
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
