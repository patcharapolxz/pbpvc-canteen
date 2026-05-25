'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { shopsApi, ordersApi, newsApi, notifApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Search, Star, Heart, MapPin, Bell, Clock, Utensils, Store, ChefHat, X, Package, CheckCircle, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface Shop {
  name: string; img: string; rating: string;
  reviews: number; tags: string; menuSearch: string; isOpen: boolean;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Waiting:   { label: 'รอร้านรับ', cls: 'badge-waiting' },
  Cooking:   { label: 'กำลังปรุง',  cls: 'badge-cooking' },
  Ready:     { label: 'พร้อมเสิร์ฟ', cls: 'badge-ready' },
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
  const [news,     setNews]     = useState<any[]>([]);

  // Scroll states for Compact Header
  const [isCompact, setIsCompact] = useState(false);

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

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

  // Handle Scroll to toggle Compact Mode
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsCompact(true);
      } else {
        setIsCompact(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hook global move/end events for robust dragging
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

    // Load News Announcements
    newsApi.getAll().then((r: any) => {
      if (r.success) setNews(r.data || []);
    });
    
    const saved = localStorage.getItem('pbpvc_favs');
    if (saved) setFavorites(JSON.parse(saved));

    // Load Active Orders & Notifications count
    const loadOrdersAndNotifs = async () => {
      try {
        const res: any = await ordersApi.get(loggedInUser.role, loggedInUser.id);
        if (res.success) {
          setActiveOrders(res.data.filter((o: any) => ['Waiting','Cooking','Ready'].includes(o.status)));
        }
        const notifRes: any = await notifApi.get(loggedInUser.id);
        if (notifRes.success) {
          const unread = (notifRes.data || []).filter((n: any) => !n.is_read).length;
          setUnreadNotifs(unread);
        }
      } catch {}
    };
    loadOrdersAndNotifs();
    const interval = setInterval(loadOrdersAndNotifs, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    const lq = q.toLowerCase();
    setFiltered(shops.filter(s =>
      s.name.toLowerCase().includes(lq) ||
      (s.tags || '').toLowerCase().includes(lq) ||
      (s.menuSearch || '').toLowerCase().includes(lq)
    ));
  }, [shops]);

  const toggleFav = (e: React.MouseEvent, shopName: string) => {
    e.stopPropagation();
    const next = favorites.includes(shopName)
      ? favorites.filter(f => f !== shopName)
      : [...favorites, shopName];
    setFavorites(next);
    localStorage.setItem('pbpvc_favs', JSON.stringify(next));
    toast.success(favorites.includes(shopName) ? 'ยกเลิกถูกใจแล้ว' : 'เพิ่มในรายการโปรดแล้ว');
  };

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]">
        <div className="w-12 h-12 border-4 border-[#00a568] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filtered by Favorites if any special tag or search matches
  const sortedShops = [...filtered].sort((a, b) => {
    const aFav = favorites.includes(a.name) ? 1 : 0;
    const bFav = favorites.includes(b.name) ? 1 : 0;
    return bFav - aFav; // Show favorites first
  });

  return (
    <div className="min-h-screen relative pb-nav overflow-x-hidden bg-[#f4f7f9] dark:bg-[#121212]">
      {/* Background image blur overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30 dark:opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1565895405139-e188df996e0b?auto=format&fit=crop&w=1000&q=80')" }}
      />

      <div className="relative z-10">
        
        {/* News Announcement Ticker Banner */}
        {news.length > 0 && (
          <div className="bg-[#ffeeba] text-[#856404] py-2.5 px-4 font-bold text-xs sticky top-0 z-50 shadow-sm border-b border-[#ffe39a] flex items-center gap-2 overflow-hidden shrink-0">
            <Megaphone size={14} className="animate-bounce text-[#b58900] shrink-0" />
            <div className="w-full overflow-hidden whitespace-nowrap relative">
              <div className="inline-block animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
                {news.map((n, idx) => (
                  <span key={idx} className="mr-16">📢 {n.message}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Premium solid header with location, greetings, controls and search bar */}
        <div 
          className="bg-[#00a568] dark:bg-[#006837] text-white z-40 transition-all duration-300 shadow-md pt-5 pb-6 px-4 md:px-6 rounded-b-[24px]"
        >
          {/* Top Row: Logo, Title, and Buttons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2 items-center min-w-0">
              <img 
                src="https://yt3.googleusercontent.com/XB0JxhuEvnPiHwnQvPBZYcLaOyBLG897mi9fo7Y_H19bs1-Fbt2s92L2AWEYgxjK7acnC54RZA=s900-c-k-c0x00ffffff-no-rj" 
                alt="PBPVC Logo" 
                className="w-8 h-8 rounded-full border border-white/40 shadow-sm shrink-0" 
              />
              <div className="min-w-0">
                <h1 className="text-sm font-black leading-tight tracking-wide truncate">PBPVC Canteen</h1>
                <div className="flex items-center gap-1 opacity-90 mt-0.5">
                  <MapPin size={9} className="text-[#f1c40f] shrink-0" />
                  <p className="text-[9px] font-semibold truncate text-white/90">โรงอาหารวิทยาลัยอาชีวศึกษาเพชรบุรี</p>
                </div>
              </div>
            </div>
            
            {/* Header controls (Favorite, Notification, History) */}
            <div className="flex gap-1.5 shrink-0">
              <button 
                onClick={() => toast.success(`ชื่นชอบร้านโปรดได้ง่ายๆ เพียงกดไอคอนหัวใจบนร้านค้า`)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-md transition-colors"
                title="ร้านค้าโปรด"
              >
                <Heart size={12} className="text-white fill-white/10" />
              </button>
              
              <button 
                onClick={() => router.push('/notifications')}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-md transition-colors relative cursor-pointer"
                title="การแจ้งเตือน"
              >
                <Bell size={12} className="text-white" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              <button 
                onClick={() => router.push('/orders')}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                title="ประวัติการสั่งซื้อ"
              >
                <Clock size={12} className="text-white" />
              </button>
            </div>
          </div>

          {/* User greeting and subtext row */}
          <div className="flex items-end justify-between mb-4 mt-2 px-1">
            <div>
              <h2 className="text-base font-extrabold tracking-tight">สวัสดี {currentUser.nick || currentUser.name}</h2>
            </div>
            <div>
              <span className="text-[10px] text-emerald-100 font-bold opacity-90">หิวหรือยัง? สั่งเลย!</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-full flex items-center px-4 py-2 text-gray-800 shadow-sm transition-shadow focus-within:shadow-md">
            <Search size={14} className="text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" 
              value={query} 
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ค้นหาร้าน, เมนูอาหาร..."
              className="flex-1 bg-transparent outline-none text-xs font-semibold placeholder-gray-400 min-w-0" 
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 md:px-6 mt-4 space-y-4 max-w-7xl mx-auto mb-8 relative z-10">
          
          {/* Active Orders Tracker Card (ถอดแบบติดตามออเดอร์จากรูปเป๊ะๆ) */}
          {activeOrders.length > 0 && (
            <div 
              className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-emerald-800/25 dark:border-emerald-500/20 p-3 flex items-center justify-between shadow-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252525] transition-all" 
              onClick={() => setShowOrdersModal(true)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#00a568]">
                  <Utensils size={15} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200">ติดตามออเดอร์</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">กำลังดำเนินการ...</p>
                </div>
              </div>
              <span className="bg-[#dc3545] text-white text-[9px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                {activeOrders.length} รายการ
              </span>
            </div>
          )}

          {/* Shop Grid (2 Columns as shown in desktop screenshot) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-xl p-3.5 flex gap-3 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="w-[75px] h-[75px] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))
            ) : sortedShops.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white/90 dark:bg-[#1e1e1e]/90 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                <Store size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
                <p className="font-bold text-gray-500">ไม่พบร้านค้าที่ตรงกับการค้นหา</p>
              </div>
            ) : (
              sortedShops.map((shop) => {
                const isFav = favorites.includes(shop.name);
                return (
                  <div key={shop.name}
                    className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xs flex items-center gap-3.5 p-3.5 cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all border border-gray-100 dark:border-gray-800/80 relative"
                    onClick={() => router.push(`/menu/${encodeURIComponent(shop.name)}`)}>
                    
                    {/* Shop Square Image */}
                    <div className="relative w-[70px] h-[70px] shrink-0">
                      <div className={`w-full h-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 ${!shop.isOpen ? 'grayscale opacity-60' : ''}`}>
                        {shop.img 
                          ? <img src={shop.img} alt={shop.name} className="w-full h-full object-cover" /> 
                          : <div className="w-full h-full flex items-center justify-center text-xl bg-emerald-50 dark:bg-emerald-950">🍽️</div>
                        }
                      </div>
                    </div>
                    
                    {/* Shop Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-extrabold text-gray-850 dark:text-gray-200 text-xs truncate leading-snug">{shop.name}</h3>
                        <button 
                          onClick={(e) => toggleFav(e, shop.name)}
                          className="text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-auto p-0.5"
                        >
                          <Heart size={12} className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-300 dark:text-gray-600'} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-[10px] font-extrabold text-gray-700 dark:text-gray-300">{shop.rating}</span>
                        <span className="text-[9px] text-gray-400 font-bold">({shop.reviews})</span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate font-bold">{shop.tags || 'ทั่วไป'}</p>
                    </div>
                    
                    {/* Closed Shop Overlay badge */}
                    {!shop.isOpen && (
                      <div className="absolute right-3.5 bottom-3.5 z-10">
                        <span className="bg-[#788290] text-white text-[8px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                          <Store size={8} /> ร้านปิด
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Orders Bottom Sheet Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowOrdersModal(false)} />
          <div 
            className="relative bg-[#f8f9fa] dark:bg-[#121212] rounded-t-[28px] w-full max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
            style={{
              transform: `translateY(${currentY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            
            {/* Draggable Header Section */}
            <div 
              className="cursor-grab active:cursor-grabbing select-none shrink-0 bg-white dark:bg-[#1e1e1e] rounded-t-[28px] touch-none"
              onTouchStart={handleDragStart} 
              onMouseDown={handleDragStart}
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
 
              {/* Modal Header */}
              <div className="px-5 py-4 bg-white dark:bg-[#1e1e1e] flex items-center justify-between shadow-xs z-10 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <ChefHat className="text-[#00a568]" size={22} />
                  <h1 className="text-base font-extrabold text-gray-800 dark:text-gray-200">ความคืบหน้าออเดอร์</h1>
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
                <div className="text-center py-12 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-bold text-gray-500 text-sm">ไม่มีออเดอร์ที่กำลังดำเนินการ</p>
                </div>
              ) : activeOrders.map(order => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.Waiting;
                const { pct, p1, p2, p3 } = getProgressDetails(order.status);
                
                return (
                  <div key={order.id} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
                    {/* Top Row */}
                    <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                      <div className="flex gap-2 items-start">
                        <Store size={18} className="text-gray-700 dark:text-gray-300 mt-0.5" />
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-200 leading-tight">{order.shop}</h3>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">#{order.id.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={st.cls}>{st.label}</span>
                        <span className="text-[10px] text-gray-400 font-bold mt-0.5">เวลา: {order.time.split(' ')[1] || order.time}</span>
                      </div>
                    </div>

                    {/* Timeline Progress Tracker */}
                    <div className="relative flex items-center justify-between my-2 px-12">
                      <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-[3.5px] bg-gray-100 dark:bg-gray-800 rounded-full z-0" />
                      <div className="absolute left-12 top-1/2 -translate-y-1/2 h-[3.5px] bg-[#00a568] rounded-full z-0 transition-all duration-500" style={{ width: `calc(${pct} - 24px)` }} />
                      
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${p1 ? 'bg-white dark:bg-gray-900 border-[#00a568] text-[#00a568] shadow-xs' : 'bg-white border-gray-200 text-gray-300'}`}>
                        <Store size={14} />
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${p2 ? 'bg-white dark:bg-gray-900 border-[#00a568] text-[#00a568] shadow-xs' : 'bg-white border-gray-200 text-gray-300'}`}>
                        <Clock size={14} />
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${p3 ? 'bg-[#00a568] border-[#00a568] text-white shadow-xs' : 'bg-white border-gray-200 text-gray-300'}`}>
                        <CheckCircle size={14} />
                      </div>
                    </div>

                    {/* Items Details */}
                    <div className="px-5 py-2">
                      <div className="bg-[#f8f9fa] dark:bg-gray-900 rounded-xl px-4 py-3 space-y-2">
                        {(order.items || []).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0">
                            <div>
                              <span className="font-extrabold text-gray-800 dark:text-gray-200">{item.name}</span>
                              {order.note && <p className="text-[10px] text-gray-400 mt-0.5">💡 {order.note}</p>}
                            </div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                      <div>
                        {order.slip_url !== 'เงินสด' ? (
                          <span className="bg-[#e8f5e9] text-[#2e7d32] border border-[#66bb6a] px-2.5 py-1 rounded-md text-[9px] font-bold inline-flex items-center gap-1 shadow-xs">📱 โอนเงิน (QR)</span>
                        ) : (
                          <span className="bg-[#fff8e1] text-[#f57c00] border border-[#ffb300] px-2.5 py-1 rounded-md text-[9px] font-bold inline-flex items-center gap-1 shadow-xs">💵 ชำระเงินสด</span>
                        )}
                      </div>
                      <span className="text-sm font-extrabold text-[#00a568]">{Number(order.total).toLocaleString()} ฿</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="h-4 shrink-0 bg-[#f8f9fa] dark:bg-[#121212]" />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
