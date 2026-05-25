'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { menuApi, ordersApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
import { ArrowLeft, Plus, Minus, Star, X, Trash2, Clock, MapPin, Search, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string; name: string; price: number; cat: string;
  img: string; status: string; options: any[]; recommend: boolean;
}

export default function MenuPage() {
  const params  = useParams();
  const router  = useRouter();
  const shopName = decodeURIComponent(params.shop as string);
  const { user, cart, cartShop, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useAppStore();

  const [menu,     setMenu]     = useState<MenuItem[]>([]);
  const [cats,     setCats]     = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState('ทั้งหมด');
  const [previewImg, setPreviewImg] = useState<{ src: string; name: string } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [payMethod, setPayMethod] = useState<'cash'|'qr'>('cash');
  const [placing,  setPlacing]  = useState(false);
  const [mounted,  setMounted]  = useState(false);

  // Modifier options state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [sizeOption, setSizeOption] = useState<'normal' | 'extra'>('normal');
  const [eggOption, setEggOption] = useState<'none' | 'fried' | 'omelette'>('none');
  const [sweetness, setSweetness] = useState<string>('100%');
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    
    // ⚡ ดึงเมนูจาก Local Cache ก่อน เพื่อแสดงผลทันทีภายในไม่กี่มิลลิวินาที
    const cacheKey = `pbpvc_menu_cache_${shopName}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenu(parsed);
          const allCats = ['ทั้งหมด', ...new Set<string>(parsed.map((m: MenuItem) => m.cat).filter(Boolean))];
          setCats(allCats);
          setLoading(false); // ปิดการหมุนโหลดทันทีเมื่อมีข้อมูลเก่า
        }
      } catch (e) {}
    }

    // ดึงเมนูล่าสุดจากหลังบ้านเงียบๆ เพื่อมาอัปเดตออโตเมติก
    menuApi.get(shopName).then((r: any) => {
      if (r.success) {
        const items = r.data.filter((m: MenuItem) => m.status !== 'Hidden');
        setMenu(items);
        const allCats = ['ทั้งหมด', ...new Set<string>(items.map((m: MenuItem) => m.cat).filter(Boolean))];
        setCats(allCats);
        localStorage.setItem(cacheKey, JSON.stringify(items));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shopName, router]);

  const filteredMenu = activeCat === 'ทั้งหมด'
    ? menu
    : menu.filter(m => m.cat === activeCat);

  const cartCount = (cartShop === shopName ? cart : []).reduce((s, c) => s + c.qty, 0);
  const currentCart = cartShop === shopName ? cart : [];

  const handleOpenModifiers = (item: MenuItem) => {
    if (item.status === 'Soldout') { toast.error('เมนูนี้หมดแล้ว'); return; }
    setSelectedItem(item);
    setSizeOption('normal');
    setEggOption('none');
    setSweetness('100%');
    setCustomNote('');
  };

  const handleAddWithModifiers = () => {
    if (!selectedItem) return;
    
    // Calculate final price with modifiers
    let extraPrice = 0;
    const selectedOptions: { name: string; price?: number }[] = [];

    if (sizeOption === 'extra') {
      extraPrice += 10;
      selectedOptions.push({ name: 'พิเศษ', price: 10 });
    } else {
      selectedOptions.push({ name: 'ธรรมดา' });
    }

    if (eggOption === 'fried') {
      extraPrice += 10;
      selectedOptions.push({ name: 'เพิ่มไข่ดาว', price: 10 });
    } else if (eggOption === 'omelette') {
      extraPrice += 10;
      selectedOptions.push({ name: 'เพิ่มไข่เจียว', price: 10 });
    }

    if (selectedItem.cat === 'เครื่องดื่ม' || selectedItem.cat === 'น้ำ') {
      selectedOptions.push({ name: `หวาน ${sweetness}` });
    }

    const itemPrice = selectedItem.price + extraPrice;
    const uniqueCartId = `${selectedItem.id}-${sizeOption}-${eggOption}-${sweetness.replace('%','')}`;

    addToCart({
      id: uniqueCartId,
      name: selectedItem.name,
      price: itemPrice,
      qty: 1,
      options: selectedOptions,
      note: customNote,
      img: selectedItem.img
    }, shopName);

    toast.success(`เพิ่ม ${selectedItem.name} ลงตะกร้าแล้ว`);
    setSelectedItem(null);
  };

  const handlePlaceOrder = async () => {
    if (currentCart.length === 0) { toast.error('ตะกร้าว่างเปล่า'); return; }
    setPlacing(true);
    try {
      const loggedInUser = getPersistedUser();
      const res: any = await ordersApi.place({
        userId: user?.id || loggedInUser?.id || '',
        shop: shopName,
        items: currentCart,
        total: cartTotal(),
        note: orderNote,
        slip: payMethod === 'cash' ? 'เงินสด' : 'QR_PAYMENT',
      });
      if (res.success) {
        toast.success(`สั่งซื้อสำเร็จ! ออเดอร์ #${res.data.orderId}`);
        clearCart();
        setShowCart(false);
        router.push('/orders');
      } else {
        toast.error(res.msg);
      }
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    finally { setPlacing(false); }
  };

  if (!mounted) {
    return <PremiumLoading text="กำลังโหลดเมนูอาหาร..." subtext="กรุณารอสักครู่..." />;
  }

  const isBeverage = selectedItem && (selectedItem.cat === 'เครื่องดื่ม' || selectedItem.cat === 'น้ำ' || selectedItem.name.includes('น้ำ') || selectedItem.name.includes('ชา') || selectedItem.name.includes('กาแฟ'));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] pb-32">
      {/* Hero Cover Image */}
      <div className="relative w-full h-[220px] bg-slate-200">
        <img 
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=80" 
          alt={shopName} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        {/* Top Navbar overlapping image */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/95 dark:bg-[#1e1e1e]/95 shadow-md flex items-center justify-center text-gray-800 dark:text-gray-200 hover:scale-105 transition-all active:scale-95">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex gap-2">
            <button onClick={() => toast.success('ฟังก์ชันค้นหาในเมนูจะเปิดใช้งานเร็วๆ นี้')} className="w-9 h-9 rounded-full bg-white/95 dark:bg-[#1e1e1e]/95 shadow-md flex items-center justify-center text-gray-800 dark:text-gray-200 hover:scale-105 transition-all active:scale-95">
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Restaurant Info Card (Overlapping) */}
      <div className="relative -mt-10 bg-white dark:bg-[#1e1e1e] rounded-t-[28px] px-5 pt-6 pb-5 shadow-[0_-8px_25px_rgba(0,0,0,0.03)] z-20 border-b border-gray-100/60 dark:border-gray-800/60">
        <h1 className="font-extrabold text-2xl text-gray-900 dark:text-gray-100 tracking-tight leading-none">{shopName}</h1>
        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mt-1.5 uppercase tracking-wide">อาหารจานเดียว • ของทอด • เครื่องดื่มอร่อย</p>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <Star size={15} className="text-amber-400 fill-amber-400" />
            <span className="font-extrabold text-gray-800 dark:text-gray-200 text-xs">4.8</span>
            <span className="text-gray-400 text-[10px] font-bold">(50+ รีวิว)</span>
          </div>
          <div className="w-[1px] h-3.5 bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-gray-400" />
            <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">10-15 นาที</span>
          </div>
          <div className="w-[1px] h-3.5 bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" />
            <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">โรงอาหาร PVC</span>
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs */}
      <div className="sticky top-0 bg-white dark:bg-[#1e1e1e] z-30 px-4 py-3 flex gap-2.5 overflow-x-auto no-scrollbar border-b border-gray-100/80 dark:border-gray-800/80 shadow-xs">
        {cats.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-extrabold transition-all duration-200 ${
              activeCat === cat
                ? 'bg-gradient-to-r from-[#006837] to-[#00a568] text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items List (Grab Style) */}
      <div className="px-4 py-2 space-y-0.5 bg-white dark:bg-[#1e1e1e]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-5 flex gap-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
              </div>
              <div className="w-[100px] h-[100px] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse shrink-0" />
            </div>
          ))
        ) : filteredMenu.map((item, index) => {
          const soldOut = item.status === 'Soldout';
          return (
            <div key={item.id} className={`py-4.5 flex gap-4 border-b border-gray-100/80 dark:border-gray-800/80 last:border-0 ${soldOut ? 'opacity-50' : ''}`}>
              {/* Item Info (Left) */}
              <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-[15px] leading-snug">{item.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">อร่อยร้อนๆ ปรุงสดสะอาด ถูกสุขอนามัย เสิร์ฟทันทีจากเตา</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-extrabold text-[#006837] dark:text-[#00a568] text-base">฿{item.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Item Image & Add Button (Right) */}
              <div className="relative shrink-0 w-[100px] h-[100px]">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-gray-50 dark:bg-gray-950 border border-gray-100/60 dark:border-gray-800/60 shadow-xs cursor-zoom-in active:scale-95 duration-200 transition-all hover:shadow-sm"
                  onClick={() => item.img && setPreviewImg({ src: item.img, name: item.name })}>
                  {item.img ? (
                    <Image 
                      src={item.img} 
                      alt={item.name} 
                      width={100} 
                      height={100} 
                      className="w-full h-full object-cover hover:scale-105 duration-300 transition-all" 
                      priority={index < 4} // LCP optimization for top food items
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                  )}
                  {soldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[10px] font-extrabold px-2.5 py-1 bg-black/60 rounded-full">หมดชั่วคราว</span>
                    </div>
                  )}
                </div>

                {/* The Grab-style action button overlapping the image bottom-right */}
                {!soldOut && (
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[#1e1e1e] rounded-full p-0.5 shadow-md">
                    <button 
                      onClick={() => handleOpenModifiers(item)} 
                      className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-[#006837] to-[#00a568] text-white flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-sm"
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-width Sticky Bottom Cart Banner (Grab Style) */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 pb-safe animate-slide-up">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-[#006837] to-[#00a568] text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-md active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-extrabold">{cartCount}</span>
              <span className="font-extrabold text-sm">ดูตระกร้าสั่งอาหาร</span>
            </div>
            <span className="font-extrabold text-sm">฿{cartTotal().toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Options Modifier Bottom Sheet Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-[28px] w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border-t border-white/10">
            
            {/* Header */}
            <div className="px-5 py-4.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-4">
                <h2 className="font-extrabold text-lg text-gray-900 dark:text-gray-100 truncate">{selectedItem.name}</h2>
                <p className="text-[11px] text-[#006837] dark:text-[#00a568] font-bold mt-0.5">ราคาเริ่มต้น ฿{selectedItem.price}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modifiers List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              
              {/* Size Options (ธรรมดา / พิเศษ) */}
              <div className="opt-group">
                <h3 className="opt-title text-gray-800 dark:text-gray-200">
                  <span>เลือกขนาด</span>
                  <span className="text-[10px] bg-red-50 text-red-500 font-extrabold px-2 py-0.5 rounded">จำเป็น</span>
                </h3>
                <div className="space-y-3 mt-2.5">
                  <label className="flex items-center justify-between py-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="size" checked={sizeOption === 'normal'} onChange={() => setSizeOption('normal')} className="w-4.5 h-4.5 text-[#006837] border-gray-300 focus:ring-[#006837] accent-[#006837]" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">ธรรมดา</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400">+฿0</span>
                  </label>
                  <label className="flex items-center justify-between py-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="size" checked={sizeOption === 'extra'} onChange={() => setSizeOption('extra')} className="w-4.5 h-4.5 text-[#006837] border-gray-300 focus:ring-[#006837] accent-[#006837]" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">พิเศษ</span>
                    </div>
                    <span className="text-xs font-bold text-[#006837] dark:text-[#00a568]">+฿10</span>
                  </label>
                </div>
              </div>

              {/* Egg Options (ไข่ดาว / ไข่เจียว) - Skip for drinks */}
              {!isBeverage && (
                <div className="opt-group">
                  <h3 className="opt-title text-gray-800 dark:text-gray-200">
                    <span>เครื่องเคียงเพิ่มเติม</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">เลือกได้</span>
                  </h3>
                  <div className="space-y-3 mt-2.5">
                    <label className="flex items-center justify-between py-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="egg" checked={eggOption === 'none'} onChange={() => setEggOption('none')} className="w-4.5 h-4.5 text-[#006837] accent-[#006837]" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">ไม่รับไข่เพิ่มเติม</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">+฿0</span>
                    </label>
                    <label className="flex items-center justify-between py-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="egg" checked={eggOption === 'fried'} onChange={() => setEggOption('fried')} className="w-4.5 h-4.5 text-[#006837] accent-[#006837]" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">เพิ่มไข่ดาว</span>
                      </div>
                      <span className="text-xs font-bold text-[#006837] dark:text-[#00a568]">+฿10</span>
                    </label>
                    <label className="flex items-center justify-between py-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="egg" checked={eggOption === 'omelette'} onChange={() => setEggOption('omelette')} className="w-4.5 h-4.5 text-[#006837] accent-[#006837]" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">เพิ่มไข่เจียว</span>
                      </div>
                      <span className="text-xs font-bold text-[#006837] dark:text-[#00a568]">+฿10</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Sweetness Options (only for drinks) */}
              {isBeverage && (
                <div className="opt-group">
                  <h3 className="opt-title text-gray-800 dark:text-gray-200">
                    <span>เลือกระดับความหวาน</span>
                    <span className="text-[10px] bg-red-50 text-red-500 font-extrabold px-2 py-0.5 rounded">จำเป็น</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2.5 mt-2.5">
                    {['ไม่หวานเลย', 'หวานน้อย', 'หวานปกติ', 'หวานมาก'].map((swLabel, index) => {
                      const swVal = ['0%', '50%', '100%', '120%'][index];
                      return (
                        <button key={swVal} onClick={() => setSweetness(swVal)}
                          className={`py-2 rounded-xl text-[11px] font-extrabold border transition-all text-center ${
                            sweetness === swVal 
                              ? 'border-[#006837] bg-[#006837]/5 text-[#006837]' 
                              : 'border-gray-200 text-gray-500 dark:border-gray-800'
                          }`}
                        >
                          <div>{swLabel}</div>
                          <div className="text-[9px] opacity-75 mt-0.5">{swVal}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Note input */}
              <div className="pt-1">
                <h3 className="opt-title text-gray-800 dark:text-gray-200">คำสั่งพิเศษเพิ่มเติม</h3>
                <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value)}
                  placeholder="เช่น เผ็ดน้อย, แยกน้ำซุป, ไข่ดาวสุกๆ..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs outline-none focus:ring-2 focus:ring-[#006837]/20 placeholder-gray-400 font-medium" />
              </div>
            </div>

            {/* Confirm Add Button */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] shrink-0 pb-safe">
              <button onClick={handleAddWithModifiers}
                className="w-full bg-gradient-to-r from-[#006837] to-[#00a568] hover:bg-[#008a47] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-[0_6px_15px_rgba(0,104,55,0.25)] active:scale-[0.97] transition-all flex justify-center items-center gap-2"
              >
                <span>ใส่ตะกร้า</span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                <span>฿{(selectedItem.price + (sizeOption === 'extra' ? 10 : 0) + (eggOption !== 'none' ? 10 : 0)).toLocaleString()}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cart Sheet Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in" onClick={() => setShowCart(false)} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-[28px] w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border-t border-white/10">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-xl text-gray-850 dark:text-gray-100">รายการในตระกร้า</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 bg-gray-100 dark:bg-gray-850 rounded-full flex items-center justify-center text-gray-500">
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {currentCart.map(item => (
                <div key={item.id} className="flex items-start gap-3.5 border-b border-gray-50 dark:border-gray-800/40 pb-4 last:border-0">
                  <div className="w-16 h-16 rounded-[12px] bg-gray-100 dark:bg-gray-900 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                     {item.img ? <img src={item.img} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xl">🍲</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-gray-800 dark:text-gray-200 text-sm truncate">{item.name}</p>
                    
                    {/* Display chosen Options/Modifiers nicely */}
                    {item.options && item.options.length > 0 && (
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        ⚙️ {item.options.map(o => o.name).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-[10px] text-amber-500 font-bold mt-0.5">
                        💡 {item.note}
                      </p>
                    )}
                    
                    <p className="text-[#00a568] font-extrabold text-xs mt-1.5">฿{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-250 dark:border-gray-850">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 flex items-center justify-center text-[#00a568] hover:bg-gray-100 rounded-full"><Minus size={13} strokeWidth={3.5}/></button>
                      <span className="w-5 text-center font-extrabold text-xs text-gray-800 dark:text-gray-200">{item.qty}</span>
                      <button onClick={() => addToCart(item, shopName)} className="w-8 h-8 flex items-center justify-center text-[#00a568] hover:bg-gray-100 rounded-full"><Plus size={13} strokeWidth={3.5}/></button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-2">💡 เพิ่มหมายเหตุพิเศษรวมถึงผู้ปรุง</h3>
                <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)}
                  placeholder="เช่น ขอช้อนส้อมกระดาษ, แยกพริกป่น..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs outline-none focus:ring-2 focus:ring-[#00a568]/30 resize-none placeholder-gray-400 font-semibold" rows={2} />
              </div>

              <div className="pt-2 pb-6">
                <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-2">📱 เลือกวิธีชำระเงิน</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['cash','qr'] as const).map(m => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={`py-3 rounded-xl border-2 text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                        payMethod === m 
                          ? 'border-[#00a568] bg-[#00a568]/5 text-[#00a568]' 
                          : 'border-gray-250 text-gray-450 dark:border-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {m === 'cash' ? '💵 ชำระเงินสด' : '📱 สแกน QR (โอน)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Place Order */}
            <div className="p-4.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] shrink-0 pb-safe">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-500">ยอดรวมยอดสั่งซื้อ</span>
                <span className="font-extrabold text-xl text-gray-900 dark:text-gray-150">฿{cartTotal().toLocaleString()}</span>
              </div>
              <button onClick={handlePlaceOrder} disabled={placing} 
                className="w-full bg-gradient-to-r from-[#006837] to-[#00a568] hover:bg-[#008a47] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-[0_6px_15px_rgba(0,104,55,0.25)] active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                {placing ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'ยืนยันสั่งอาหารจานด่วน'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-zoom-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2 transition z-10 shadow-lg active:scale-95 duration-100">
              <X size={16} strokeWidth={3} />
            </button>
            <div className="relative w-full aspect-square bg-gray-100">
              <img src={previewImg.src} alt={previewImg.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-extrabold text-base text-gray-900 leading-tight">{previewImg.name}</h3>
              <p className="text-gray-400 text-[10px] font-bold mt-1.5">💡 ภาพอาหารจริง ถ่ายสดสะอาด เพื่อสุขอนามัยที่ดีของโรงอาหาร PVC</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
