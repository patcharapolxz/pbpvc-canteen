'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { menuApi, ordersApi, utilsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Plus, Minus, Star, X, Trash2, Clock, MapPin, Search } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    menuApi.get(shopName).then((r: any) => {
      if (r.success) {
        const items = r.data.filter((m: MenuItem) => m.status !== 'Hidden');
        setMenu(items);
        const allCats = ['ทั้งหมด', ...new Set<string>(items.map((m: MenuItem) => m.cat).filter(Boolean))];
        setCats(allCats);
      }
      setLoading(false);
    });
  }, [shopName, router]);

  const filteredMenu = activeCat === 'ทั้งหมด'
    ? menu
    : menu.filter(m => m.cat === activeCat);

  const cartCount = (cartShop === shopName ? cart : []).reduce((s, c) => s + c.qty, 0);
  const currentCart = cartShop === shopName ? cart : [];

  const handleAdd = (item: MenuItem) => {
    if (item.status === 'Soldout') { toast.error('เมนูนี้หมดแล้ว'); return; }
    addToCart({ id: item.id, name: item.name, price: item.price, qty: 1, options: [], img: item.img }, shopName);
    toast.success(`เพิ่ม ${item.name}`, { duration: 1000, position: 'bottom-center' });
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Hero Cover Image */}
      <div className="relative w-full h-[240px] bg-gray-200">
        <img 
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=80" 
          alt={shopName} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        {/* Top Navbar overlapping image */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800 hover:bg-white transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800 hover:bg-white transition">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Restaurant Info Card (Overlapping) */}
      <div className="relative -mt-12 bg-white rounded-t-3xl px-5 pt-6 pb-4 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-20">
        <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">{shopName}</h1>
        <p className="text-gray-500 text-sm mt-1">อาหารตามสั่ง • เครื่องดื่ม • ของทานเล่น</p>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <Star size={16} className="text-[#f1c40f] fill-[#f1c40f]" />
            <span className="font-bold text-gray-800 text-sm">4.8</span>
            <span className="text-gray-400 text-xs">(100+ รีวิว)</span>
          </div>
          <div className="w-[1px] h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-gray-400" />
            <span className="font-bold text-gray-800 text-sm">10-15 นาที</span>
          </div>
          <div className="w-[1px] h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <MapPin size={16} className="text-gray-400" />
            <span className="font-bold text-gray-800 text-sm">โรงอาหาร</span>
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs */}
      <div className="sticky top-0 bg-white z-30 px-4 py-3 flex gap-2.5 overflow-x-auto no-scrollbar border-b border-gray-100 shadow-sm">
        {cats.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeCat === cat
                ? 'bg-[#00a568] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items List (Grab Style) */}
      <div className="px-4 py-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-5 flex gap-4 border-b border-gray-100">
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              </div>
              <div className="w-[110px] h-[110px] bg-gray-200 rounded-xl animate-pulse shrink-0" />
            </div>
          ))
        ) : filteredMenu.map(item => {
          const qty = currentCart.find(c => c.id === item.id)?.qty || 0;
          const soldOut = item.status === 'Soldout';
          return (
            <div key={item.id} className={`py-5 flex gap-4 border-b border-gray-100 ${soldOut ? 'opacity-50' : ''}`}>
              {/* Item Info (Left) */}
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-bold text-gray-900 text-[16px] leading-tight">{item.name}</h3>
                <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">อร่อยถูกใจ ปรุงสดใหม่ทุกจาน วัตถุดิบคุณภาพ ({item.cat})</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-extrabold text-gray-900 text-[15px]">฿{item.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Item Image & Add Button (Right) */}
              <div className="relative shrink-0 w-[110px] h-[110px]">
                <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 border border-gray-100 cursor-zoom-in active:scale-95 duration-200 transition-all shadow-sm hover:shadow"
                  onClick={() => item.img && setPreviewImg({ src: item.img, name: item.name })}>
                  {item.img ? (
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover hover:scale-105 duration-300 transition-all" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                  )}
                  {soldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold px-2 py-1 bg-black/60 rounded">หมด</span>
                    </div>
                  )}
                </div>

                {/* The Grab-style action button overlapping the image bottom-right */}
                {!soldOut && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-md">
                    {qty > 0 ? (
                      <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm overflow-hidden">
                        <button onClick={() => updateQty(item.id, qty - 1)} className="w-8 h-8 flex items-center justify-center text-[#00a568] hover:bg-gray-50">
                          <Minus size={16} strokeWidth={3} />
                        </button>
                        <span className="w-6 text-center font-bold text-[14px] text-gray-800">{qty}</span>
                        <button onClick={() => handleAdd(item)} className="w-8 h-8 flex items-center justify-center text-white bg-[#00a568] hover:bg-[#008a47]">
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleAdd(item)} className="w-9 h-9 rounded-full bg-[#00a568] text-white flex items-center justify-center hover:bg-[#008a47] shadow-sm">
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-width Sticky Bottom Cart Banner (Grab Style) */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 pb-safe animate-slide-up">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-[#00a568] text-white rounded-xl px-5 py-3.5 flex items-center justify-between shadow-md active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-[15px] font-extrabold">{cartCount}</span>
              <span className="font-extrabold text-[15px]">ดูตะกร้า</span>
            </div>
            <span className="font-extrabold text-[15px]">฿{cartTotal().toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Cart Sheet Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-xl text-gray-800">สรุปการสั่งซื้อ</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <h3 className="font-bold text-gray-800 mb-2">รายการอาหาร ({cartCount})</h3>
              {currentCart.map(item => (
                <div key={item.id} className="flex items-start gap-3 border-b border-gray-50 pb-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                     {item.img ? <img src={item.img} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center">🍲</div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-[15px]">{item.name}</p>
                    <p className="text-[#00a568] font-bold mt-1">฿{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center bg-gray-50 rounded-full border border-gray-200">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 flex items-center justify-center text-[#00a568]"><Minus size={16} strokeWidth={3}/></button>
                      <span className="w-6 text-center font-bold text-[14px]">{item.qty}</span>
                      <button onClick={() => addToCart(item, shopName)} className="w-8 h-8 flex items-center justify-center text-[#00a568]"><Plus size={16} strokeWidth={3}/></button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <h3 className="font-bold text-gray-800 mb-2">หมายเหตุถึงร้าน (ถ้ามี)</h3>
                <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)}
                  placeholder="เช่น ไม่ใส่ผัก, ขอเผ็ดน้อย..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#00a568]/30 resize-none placeholder-gray-400 font-medium" rows={2} />
              </div>

              <div className="pt-2 pb-6">
                <h3 className="font-bold text-gray-800 mb-2">วิธีชำระเงิน</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['cash','qr'] as const).map(m => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={`py-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        payMethod === m ? 'border-[#00a568] bg-[#00a568]/5 text-[#00a568]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {m === 'cash' ? '💵 เงินสด' : '📱 สแกนจ่าย (QR)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Place Order */}
            <div className="p-5 border-t border-gray-100 bg-white shrink-0 pb-safe">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-600">ยอดรวมทั้งหมด</span>
                <span className="font-extrabold text-2xl text-gray-900">฿{cartTotal().toLocaleString()}</span>
              </div>
              <button onClick={handlePlaceOrder} disabled={placing} 
                className="w-full bg-[#00a568] hover:bg-[#008a47] text-white font-extrabold text-[16px] py-4 rounded-xl shadow-[0_8px_20px_rgba(0,165,104,0.3)] active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                {placing ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'ยืนยันสั่งอาหาร'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-zoom-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2.5 transition z-10 shadow-lg active:scale-95 duration-100">
              <X size={18} strokeWidth={3} />
            </button>
            <div className="relative w-full aspect-square bg-gray-100">
              <img src={previewImg.src} alt={previewImg.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-extrabold text-lg text-gray-900 leading-tight">{previewImg.name}</h3>
              <p className="text-gray-400 text-[11px] font-semibold mt-1">💡 ภาพถ่ายโคลสอัพจริงของเมนูนี้ ปรุงสดสะอาด ร้อนๆ ทุกจานจากทางร้าน</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
