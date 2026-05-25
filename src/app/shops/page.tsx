'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { shopsApi, ordersApi, newsApi, notifApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
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
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
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
    
    // ⚡ โหลดรายการร้านค้าจาก Local Cache ก่อน เพื่อเปิดแอปแล้วทุกอย่างโผล่ทันที ไม่ต้องรอหน้าจอเปล่า
    const cachedShops = localStorage.getItem('pbpvc_shops_cache');
    if (cachedShops) {
      try {
        const parsed = JSON.parse(cachedShops);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShops(parsed);
          setFiltered(parsed);
          setLoading(false);
        }
      } catch (e) {}
    }

    // Load Shops
    shopsApi.list().then((r: any) => {
      if (r.success) {
        setShops(r.data);
        setFiltered(r.data);
        localStorage.setItem('pbpvc_shops_cache', JSON.stringify(r.data));
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Load News Announcements
    newsApi.getAll().then((r: any) => {
      if (r.success) setNews(r.data || []);
    });
    
    const saved = localStorage.getItem('pbpvc_favs');
    if (saved) setFavorites(JSON.parse(saved));

    // Load Active Orders & Notifications count
    // ⚡ Optimizing: Avoid network waterfalls by using Promise.all to fetch in parallel
    const loadOrdersAndNotifs = async () => {
      try {
        const [ordersRes, notifRes]: any = await Promise.all([
          ordersApi.get(loggedInUser.role, loggedInUser.id),
          notifApi.get(loggedInUser.id)
        ]);
        if (ordersRes.success) {
          setActiveOrders(ordersRes.data.filter((o: any) => ['Waiting','Cooking','Ready'].includes(o.status)));
        }
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
    return <PremiumLoading text="กำลังโหลดร้านค้า..." subtext="กรุณารอสักครู่..." />;
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
              <Image 
                src="https://yt3.googleusercontent.com/XB0JxhuEvnPiHwnQvPBZYcLaOyBLG897mi9fo7Y_H19bs1-Fbt2s92L2AWEYgxjK7acnC54RZA=s900-c-k-c0x00ffffff-no-rj" 
                alt="PBPVC Logo" 
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-white/40 shadow-sm shrink-0" 
                priority
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
                onClick={() => setShowFavoritesModal(true)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                title="ร้านค้าโปรด"
              >
                <Heart size={12} className="text-white fill-white" />
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
              sortedShops.map((shop, index) => {
                const isFav = favorites.includes(shop.name);
                return (
                  <div key={shop.name}
                    className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xs flex items-center gap-3.5 p-3.5 cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all border border-gray-100 dark:border-gray-800/80 relative"
                    onClick={() => router.push(`/menu/${encodeURIComponent(shop.name)}`)}>
                    
                    {/* Shop Square Image */}
                    <div className="relative w-[70px] h-[70px] shrink-0">
                      <div className={`w-full h-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 ${!shop.isOpen ? 'grayscale opacity-60' : ''}`}>
                        {shop.img 
                          ? (
                            <Image 
                              src={shop.img} 
                              alt={shop.name} 
                              width={70} 
                              height={70} 
                              className="w-full h-full object-cover" 
                              priority={index < 4} // LCP Performance Optimization for top shops
                            />
                          ) : <div className="w-full h-full flex items-center justify-center text-xl bg-emerald-50 dark:bg-emerald-950">🍽️</div>
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

      {/* Orders Bottom Sheet Modal (ออเดอร์ที่กำลังทำ) */}
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
  
              {/* Modal Header (ตรงภาพเป๊ะๆ) */}
              <div className="px-5 py-4 bg-white dark:bg-[#1e1e1e] flex items-center justify-between z-10 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📗</span>
                  <h1 className="text-sm font-extrabold text-gray-800 dark:text-gray-200">ออเดอร์ที่กำลังทำ</h1>
                </div>
                <button 
                  onClick={() => setShowOrdersModal(false)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} strokeWidth={2.5} />
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
                const { pct } = getProgressDetails(order.status);
                
                return (
                  <div key={order.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-150/80 dark:border-gray-800 shadow-sm overflow-hidden p-4 space-y-3.5">
                    {/* Top Row: Shop name & Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🏪</span>
                          <h3 className="font-black text-xs text-gray-800 dark:text-gray-200 leading-tight">{order.shop}</h3>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">#{order.id.slice(-5) || '41659'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-lg px-2.5 py-0.5 text-[9px] font-black">
                          {st.label}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold">
                          เวลา: {order.time ? order.time.split(' ')[1]?.slice(0,5) || '20:36' : '20:36'}
                        </span>
                      </div>
                    </div>

                    {/* Yellow Timeline Progress Tracker (ตรงตามรูปเป๊ะๆ) */}
                    <div className="relative flex items-center justify-between my-2 px-10">
                      {/* Gray Line */}
                      <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[3px] bg-gray-100 dark:bg-gray-800 rounded-full z-0" />
                      {/* Yellow Active Line */}
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 h-[3px] bg-amber-400 rounded-full z-0 transition-all duration-500" style={{ width: `calc(${pct} - 16px)` }} />
                      
                      {/* Node 1: Shop */}
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center z-10 text-[11px] shadow-xs">
                        🏪
                      </div>
                      {/* Node 2: Clock */}
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center z-10 text-[11px] shadow-xs">
                        ⏱️
                      </div>
                      {/* Node 3: Check */}
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center z-10 text-[11px] shadow-xs">
                        ✔️
                      </div>
                    </div>

                    {/* Items Details (กล่องสีเทา) */}
                    <div className="bg-[#f8f9fa] dark:bg-gray-900/60 rounded-lg p-3 space-y-1.5">
                      {(order.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-extrabold text-gray-800 dark:text-gray-200">{item.name}</span>
                            {item.note && <p className="text-[9px] text-gray-400 font-bold mt-0.5">({item.note})</p>}
                          </div>
                          <span className="font-black text-gray-700 dark:text-gray-300">x{item.qty}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer: Payment status and bold green price */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {order.slip_url !== 'เงินสด' ? (
                          <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-lg text-[9px] font-black inline-flex items-center gap-0.5">
                            🟢 จ่ายแล้ว (QR)
                          </span>
                        ) : (
                          <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-lg text-[9px] font-black inline-flex items-center gap-0.5">
                            💵 ชำระเงินสด
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {Number(order.total).toLocaleString()} ฿
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="h-4 shrink-0 bg-[#f8f9fa] dark:bg-[#121212]" />
          </div>
        </div>
      )}

      {/* Favorites Modal (ร้านที่คุณถูกใจ - ตรงตามรูปภาพเป๊ะๆ) */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-[340px] shadow-2xl overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#1e1e1e]">
              <div className="flex items-center gap-1.5">
                <span className="text-red-500 text-lg">❤️</span>
                <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-150">ร้านที่คุณถูกใจ</h3>
              </div>
              <button 
                onClick={() => setShowFavoritesModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[320px] overflow-y-auto">
              {favorites.length === 0 ? (
                <div className="text-center py-12 p-6 text-gray-400">
                  <p className="text-xs font-bold">ไม่มีร้านค้าที่คุณถูกใจ</p>
                  <p className="text-[10px] mt-1">กดหัวใจที่ร้านค้าเพื่อจัดเก็บไว้ที่นี่</p>
                </div>
              ) : (
                favorites.map(favName => {
                  const shopData = shops.find(s => s.name === favName);
                  return (
                    <div 
                      key={favName}
                      onClick={() => {
                        setShowFavoritesModal(false);
                        router.push(`/menu/${encodeURIComponent(favName)}`);
                      }}
                      className="px-4 py-3 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                    >
                      {/* Image */}
                      <div className="w-[54px] h-[54px] rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800 bg-gray-50">
                        {shopData?.img 
                          ? (
                            <Image 
                              src={shopData.img} 
                              alt={favName} 
                              width={54} 
                              height={54} 
                              className="w-full h-full object-cover" 
                            />
                          ) : <div className="w-full h-full flex items-center justify-center text-lg bg-emerald-50">🍽️</div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-gray-850 dark:text-gray-250 truncate">{favName}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                          <span className="text-[10px] font-extrabold text-gray-600 dark:text-gray-400">{shopData?.rating || '5.0'}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <span className="text-gray-300 dark:text-gray-600 text-sm shrink-0">
                        &gt;
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
