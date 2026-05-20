'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { shopsApi, ordersApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Search, Star, Heart, MapPin, Bell, Clock, Utensils, Store, ChefHat, X, Package, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Shop {
  name: string; img: string; rating: string;
  reviews: number; tags: string; menuSearch: string; isOpen: boolean;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Waiting:   { label: 'รอร้านรับ', cls: 'bg-[#ffa700] text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
  Cooking:   { label: 'กำลังทำ',  cls: 'bg-[#0288d1] text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
  Ready:     { label: 'เสร็จแล้ว', cls: 'bg-[#00a568] text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
};

const getProgressDetails = (status: string) => {
  switch (status) {
    case 'Waiting': return { pct: '25%', p1: true, p2: false, p3: false };
    case 'Cooking': return { pct: '60%', p1: true, p2: true, p3: false };
    case 'Ready':   return { pct: '100%', p1: true, p2: true, p3: true };
    default:        return { pct: '0%', p1: false, p2: false, p3: false };
  }
};

export default function ShopsPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [shops,    setShops]    = useState<Shop[]>([]);
  const [filtered, setFiltered] = useState<Shop[]>([]);
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Drag states for Bottom Sheet
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setIsDragging(true);
  };

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging || startY === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  }, [isDragging, startY]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentY > 120) {
      setShowOrdersModal(false);
    }
    setStartY(null);
    setCurrentY(0);
  }, [isDragging, currentY]);

  // Hook global move/end events for robust mouse dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    
    // Load Shops
    shopsApi.list().then((r: any) => {
      if (r.success) { setShops(r.data); setFiltered(r.data); }
      setLoading(false);
    }).catch(() => setLoading(false));
    
    const saved = localStorage.getItem('pbpvc_favs');
    if (saved) setFavorites(JSON.parse(saved));

    // Load Active Orders
    const loadOrders = async () => {
      try {
        const res: any = await ordersApi.get(loggedInUser.role, loggedInUser.id);
        if (res.success) {
          setActiveOrders(res.data.filter((o: any) => ['Waiting','Cooking','Ready'].includes(o.status)));
        }
      } catch {}
    };
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    const lq = q.toLowerCase();
    setFiltered(shops.filter(s =>
      s.name.toLowerCase().includes(lq) ||
      s.tags.toLowerCase().includes(lq) ||
      s.menuSearch.toLowerCase().includes(lq)
    ));
  }, [shops]);

  const toggleFav = (shopName: string) => {
    const next = favorites.includes(shopName)
      ? favorites.filter(f => f !== shopName)
      : [...favorites, shopName];
    setFavorites(next);
    localStorage.setItem('pbpvc_favs', JSON.stringify(next));
  };

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]">
        <div className="w-12 h-12 border-4 border-[#00a568] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-[80px] overflow-x-hidden bg-[#f4f7f9]">
      {/* Crisp Background Image (No blur) */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1565895405139-e188df996e0b?auto=format&fit=crop&w=1000&q=80')" }}
      />
      <div className="fixed inset-0 z-0 bg-white/40" />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-[#00a568] text-white pt-6 pb-6 px-4 md:px-6 rounded-b-[24px] shadow-md">
          {/* Top Bar */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-2 items-center">
              <img src="https://yt3.googleusercontent.com/XB0JxhuEvnPiHwnQvPBZYcLaOyBLG897mi9fo7Y_H19bs1-Fbt2s92L2AWEYgxjK7acnC54RZA=s900-c-k-c0x00ffffff-no-rj" alt="logo" className="w-10 h-10 rounded-full border-2 border-white/50 shadow-sm" />
              <div>
                <h1 className="text-lg font-extrabold leading-tight tracking-wide">PBPVC Canteen</h1>
                <div className="flex items-center gap-1 opacity-90 mt-0.5">
                  <MapPin size={11} className="text-[#f1c40f]" />
                  <p className="text-[11px] font-medium">โรงอาหารวิทยาลัยอาชีวศึกษาเพชรบุรี</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-colors"><Heart size={15} /></button>
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-colors"><Bell size={15} /></button>
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-colors"><Clock size={15} /></button>
            </div>
          </div>

          {/* Greeting */}
          <div className="flex items-end justify-between mb-3 px-1">
            <h2 className="text-xl font-bold">สวัสดี {currentUser.nick || currentUser.name}</h2>
            <p className="text-[13px] font-bold opacity-90 cursor-pointer hover:underline">หิวหรือยัง? สั่งเลย</p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-full flex items-center px-4 py-3 text-gray-800 shadow-sm transition-shadow focus-within:shadow-md">
            <Search size={18} className="text-gray-400 mr-2 shrink-0" />
            <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
              placeholder="ค้นหาร้าน, เมนูอาหาร..."
              className="flex-1 bg-transparent outline-none text-[13px] font-medium placeholder-gray-400 min-w-0" />
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 md:px-6 mt-4 space-y-4 max-w-7xl mx-auto mb-8">
          
          {/* Track Order Banner */}
          {activeOrders.length > 0 && (
            <div 
              className="bg-white/95 backdrop-blur-md rounded-xl border border-[#00a568] p-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-all animate-fade-in" 
              onClick={() => setShowOrdersModal(true)}
            >
              <div className="flex items-center gap-3">
                <Utensils className="text-[#00a568]" size={20} />
                <div>
                  <p className="text-[13px] font-bold text-gray-800">ติดตามออเดอร์</p>
                  <p className="text-[11px] text-gray-500 font-medium">กำลังดำเนินการ...</p>
                </div>
              </div>
              <span className="bg-[#dc3545] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                {activeOrders.length} รายการ
              </span>
            </div>
          )}

          {/* Shop list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/90 rounded-xl p-3 flex gap-3 shadow-sm border border-white/50">
                  <div className="w-[70px] h-[70px] rounded-lg bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-2 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50">
                <p className="text-5xl">🔍</p>
                <p className="mt-3 font-bold text-gray-600">ไม่พบร้านที่ค้นหา</p>
              </div>
            ) : filtered.map((shop) => (
              <div key={shop.name}
                className="bg-white/95 backdrop-blur-md rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center gap-3 p-3 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all border border-white/50"
                onClick={() => router.push(`/menu/${encodeURIComponent(shop.name)}`)}>
                
                <div className="relative w-[70px] h-[70px] shrink-0">
                  <div className={`w-full h-full rounded-[10px] overflow-hidden bg-gray-100 shadow-inner ${!shop.isOpen ? 'grayscale opacity-70' : ''}`}>
                    {shop.img 
                      ? <img src={shop.img} alt={shop.name} className="w-full h-full object-cover" /> 
                      : <div className="w-full h-full flex items-center justify-center text-2xl bg-emerald-50">🍽️</div>
                    }
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-bold text-gray-800 text-[14px] truncate">{shop.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="text-[#f1c40f] fill-[#f1c40f]" />
                    <span className="text-[11px] font-extrabold text-gray-800">{shop.rating}</span>
                    <span className="text-[10px] text-gray-400 font-medium">({shop.reviews})</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 truncate font-medium">{shop.tags}</p>
                </div>
                
                {!shop.isOpen && (
                  <div className="shrink-0 pl-1">
                    <span className="bg-gray-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Store size={10} /> ร้านปิด
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Bottom Sheet Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" onClick={() => setShowOrdersModal(false)} />
          <div 
            className="relative bg-[#f8f9fa] rounded-t-[28px] w-full max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
            style={{
              transform: `translateY(${currentY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            
            {/* Draggable Header Section */}
            <div 
              className="cursor-grab active:cursor-grabbing select-none shrink-0 bg-white rounded-t-[28px] touch-none"
              onTouchStart={handleDragStart} 
              onMouseDown={handleDragStart}
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              {/* Modal Header */}
              <div className="px-5 py-4 bg-white flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10">
                <div className="flex items-center gap-2">
                  <ChefHat className="text-[#00a568]" size={22} />
                  <h1 className="text-base font-extrabold text-gray-800">ออเดอร์ที่กำลังทำ</h1>
                </div>
                <button 
                  onClick={() => setShowOrdersModal(false)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={22} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Scrollable Orders Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {activeOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-bold text-gray-500 text-sm">ไม่มีออเดอร์ที่กำลังดำเนินการ</p>
                </div>
              ) : activeOrders.map(order => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.Waiting;
                const { pct, p1, p2, p3 } = getProgressDetails(order.status);
                
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Top Row */}
                    <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                      <div className="flex gap-2 items-start">
                        <Store size={18} className="text-gray-700 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-[14px] text-gray-800 leading-tight">{order.shop}</h3>
                          <p className="text-[11px] text-gray-400 font-bold mt-0.5">#{order.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={st.cls}>{st.label}</span>
                        <span className="text-[10px] text-gray-400 font-bold mt-0.5">เวลา: {order.time.split(' ')[1] || order.time}</span>
                      </div>
                    </div>

                    {/* Timeline Progress */}
                    <div className="relative flex items-center justify-between my-2 px-10">
                      <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[3.5px] bg-gray-100 rounded-full z-0" />
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 h-[3.5px] bg-[#ffa700] rounded-full z-0 transition-all duration-500" style={{ width: `calc(${pct} - 20px)` }} />
                      
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all ${p1 ? 'bg-white border-[#ffa700] text-[#ffa700] shadow-sm' : 'bg-white border-gray-200 text-gray-300'}`}>
                        <Store size={13} />
                      </div>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all ${p2 ? 'bg-white border-[#ffa700] text-[#ffa700] shadow-sm' : 'bg-white border-gray-200 text-gray-300'}`}>
                        <Clock size={13} />
                      </div>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all ${p3 ? 'bg-[#00a568] border-[#00a568] text-white shadow-sm' : 'bg-white border-gray-200 text-gray-300'}`}>
                        <CheckCircle size={13} />
                      </div>
                    </div>

                    {/* Items Details */}
                    <div className="px-5 py-2">
                      <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 space-y-2">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[13px] py-1 border-b border-dashed border-gray-200/60 last:border-0">
                            <div>
                              <span className="font-extrabold text-gray-800">{item.name}</span>
                              {order.note && <p className="text-[11px] text-gray-400 mt-0.5">💡 {order.note}</p>}
                            </div>
                            <span className="font-bold text-gray-800">x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        {order.slip === 'QR_PAYMENT' ? (
                          <span className="bg-[#00a568] text-white px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-sm">✔ จ่ายแล้ว (QR)</span>
                        ) : (
                          <span className="bg-[#ffa700] text-white px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-sm">💵 จ่ายเงินสด</span>
                        )}
                      </div>
                      <span className="text-[15px] font-extrabold text-[#00a568]">{Number(order.total).toLocaleString()} ฿</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Spacer for bottom nav if needed */}
            <div className="h-4 shrink-0 bg-[#f8f9fa]" />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

