'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { ordersApi, reviewsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Star, ChefHat, X, Store, CreditCard, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; cls: string; border: string }> = {
  Waiting:   { label: 'รอร้านรับออเดอร์', cls: 'badge-waiting', border: 'border-wait' },
  Cooking:   { label: 'กำลังปรุงอาหาร',  cls: 'badge-cooking', border: 'border-cook' },
  Ready:     { label: 'อาหารเสร็จแล้ว', cls: 'badge-ready', border: 'border-ready' },
  Completed: { label: 'เสร็จสิ้นเรียบร้อย', cls: 'badge-completed', border: 'border-ready' },
  Cancelled: { label: 'ยกเลิกออเดอร์',   cls: 'badge-cancelled', border: 'border-cancel' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('active');
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [rating,  setRating]  = useState(5);
  const [comment, setComment] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    try {
      const res: any = await ordersApi.get(loggedInUser.role, loggedInUser.id);
      if (res.success) setOrders(res.data);
    } catch {}
    setLoading(false);
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('ยืนยันการยกเลิกออเดอร์ของคุณ?')) return;
    const res: any = await ordersApi.cancel(orderId);
    if (res.success) { toast.success('ยกเลิกออเดอร์สำเร็จ'); loadOrders(); }
    else toast.error(res.msg);
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    const res: any = await reviewsApi.submit({
      orderId: reviewModal.id, shop: reviewModal.shop,
      userId: getPersistedUser()?.id || '', rating, comment,
    });
    if (res.success) { toast.success(res.msg); setReviewModal(null); setRating(5); setComment(''); loadOrders(); }
    else toast.error(res.msg);
  };

  const filtered = filter === 'all' ? orders
    : filter === 'active' ? orders.filter(o => ['Waiting','Cooking','Ready'].includes(o.status))
    : orders.filter(o => ['Completed','Cancelled'].includes(o.status));

  const currentUser = user || (mounted ? getPersistedUser() : null);

  const getProgressDetails = (status: string) => {
    switch (status) {
      case 'Waiting':
        return { pct: '25%', p1: true, p2: false, p3: false };
      case 'Cooking':
        return { pct: '60%', p1: true, p2: true, p3: false };
      case 'Ready':
      case 'Completed':
        return { pct: '100%', p1: true, p2: true, p3: true };
      default:
        return { pct: '0%', p1: false, p2: false, p3: false };
    }
  };

  if (!mounted || !currentUser) {
    return <PremiumLoading text="กำลังโหลดออเดอร์..." subtext="กรุณารอสักครู่..." />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Header bar */}
      <div className="bg-gradient-to-b from-[#36c990] to-[#00a568] text-white pt-5 pb-5 px-4 md:px-6 rounded-b-[20px] shadow-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat size={20} />
          <h1 className="text-base font-extrabold leading-tight tracking-wide">ติดตามคำสั่งซื้อ</h1>
        </div>
        <button onClick={() => router.push('/shops')} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Segment tabs */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-1.5 shadow-xs flex gap-1 border border-gray-150/40 dark:border-gray-800 max-w-md mx-auto">
          {[
            ['active','กำลังปรุงอาหาร'],
            ['done','เสร็จสิ้นแล้ว'],
            ['all','ดูทั้งหมด']
          ].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                filter === k 
                  ? 'bg-gradient-to-r from-[#006837] to-[#00a568] text-white shadow-md' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List with Order Ticket V2 Redesign */}
      <div className="px-4 mt-5 space-y-4 max-w-2xl mx-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 space-y-4 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse">
              <div className="flex justify-between"><div className="h-5 bg-gray-200 rounded w-1/3" /><div className="h-5 bg-gray-200 rounded w-1/4" /></div>
              <div className="h-8 bg-gray-200 rounded w-full" />
              <div className="h-12 bg-gray-200 rounded w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-150/40 dark:border-gray-800 shadow-sm">
            <Package size={48} className="mx-auto mb-3 opacity-20 text-gray-400" />
            <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wide">ไม่มีประวัติสั่งอาหารในหมวดหมู่นี้</p>
          </div>
        ) : filtered.map(order => {
          const st = STATUS_MAP[order.status] || STATUS_MAP.Waiting;
          const { pct, p1, p2, p3 } = getProgressDetails(order.status);
          const canCancel = order.status === 'Waiting';
          const canReview = order.status === 'Completed' && !order.review;

          return (
            <div key={order.id} className={`order-ticket-v2 ${st.border} dark:bg-[#1e1e1e] relative z-10 overflow-hidden`}>
              
              {/* Ticket header */}
              <div className="ticket-v2-header flex items-center justify-between dark:bg-[#1e1e1e]">
                <div className="flex gap-2.5 items-center">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[#00a568] shrink-0">
                    <Store size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[14px] text-gray-800 dark:text-gray-200 leading-tight">{order.shop}</h3>
                    <p className="text-[9px] text-gray-400 font-extrabold mt-0.5 tracking-wider">ออเดอร์ #{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={st.cls}>{st.label}</span>
                  <span className="text-[9px] text-gray-400 font-extrabold mt-0.5">เวลา {order.time.split(' ')[1] || order.time}</span>
                </div>
              </div>

              {/* Progress bar timeline tracker */}
              {['Waiting','Cooking','Ready'].includes(order.status) && (
                <div className="relative flex items-center justify-between my-4 px-12 animate-fade-in">
                  <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-[3.5px] bg-gray-100 dark:bg-gray-800 rounded-full z-0" />
                  <div 
                    className="absolute left-12 top-1/2 -translate-y-1/2 h-[3.5px] bg-[#00a568] rounded-full z-0 transition-all duration-500" 
                    style={{ width: `calc(${pct} - 24px)` }}
                  />
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                    p1 ? 'bg-white dark:bg-gray-900 border-[#00a568] text-[#00a568] shadow-xs' : 'bg-white border-gray-200 text-gray-300'
                  }`}>
                    <Store size={14} />
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                    p2 ? 'bg-white dark:bg-gray-900 border-[#00a568] text-[#00a568] shadow-xs' : 'bg-white border-gray-200 text-gray-300'
                  }`}>
                    <Clock size={14} />
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                    p3 ? 'bg-[#00a568] border-[#00a568] text-white shadow-xs' : 'bg-white border-gray-200 text-gray-300'
                  }`}>
                    <CheckCircle size={14} />
                  </div>
                </div>
              )}

              {/* Customer Box Details */}
              <div className="cust-box-v2 dark:bg-[#1a2e26]/30 flex items-center gap-3">
                <div className="cust-icon-circle rounded-full w-8 h-8 flex items-center justify-center text-xs font-black shrink-0 uppercase">
                  {currentUser.nick?.slice(0, 2) || currentUser.name.slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 leading-tight">ชื่อผู้สั่ง: {currentUser.nick || currentUser.name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">เบอร์โทรศัพท์ติดต่อ: {currentUser.phone || '0XX-XXX-XXXX'}</p>
                </div>
              </div>

              {/* Items Detail Area */}
              <div className="item-list-v2">
                <div className="bg-[#f8f9ff] dark:bg-gray-900/60 rounded-xl px-4 py-3 space-y-2 border border-gray-100/50 dark:border-gray-800/50">
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0">
                      <div>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">{item.name}</span>
                        {item.options && item.options.length > 0 && (
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">⚙️ {item.options.map((o: any) => o.name).join(', ')}</p>
                        )}
                        {order.note && <p className="text-[10px] text-amber-500 font-bold mt-0.5">💡 หมายเหตุ: {order.note}</p>}
                      </div>
                      <span className="font-extrabold text-gray-850 dark:text-gray-300">x{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Footer details */}
              <div className="ticket-v2-footer flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20 px-5 py-3.5">
                <div>
                  {order.slip_url !== 'เงินสด' ? (
                    <span className="bg-[#e8f5e9] text-[#2e7d32] border border-[#66bb6a] px-2.5 py-1 rounded-md text-[9px] font-bold inline-flex items-center gap-1 shadow-xs">📱 ชำระผ่าน QR</span>
                  ) : (
                    <span className="bg-[#fff8e1] text-[#f57c00] border border-[#ffb300] px-2.5 py-1 rounded-md text-[9px] font-bold inline-flex items-center gap-1 shadow-xs">💵 ชำระเงินสด</span>
                  )}
                </div>
                <span className="text-[15px] font-black text-[#00a568]">{Number(order.total).toLocaleString()} ฿</span>
              </div>

              {/* Action buttons (Cancel or Review) */}
              {(canCancel || canReview) && (
                <div className="px-5 pb-4 flex gap-2">
                  {canCancel && (
                    <button onClick={() => handleCancel(order.id)}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-extrabold hover:bg-red-50 transition active:scale-[0.98]">
                      ยกเลิกรายการออเดอร์นี้
                    </button>
                  )}
                  {canReview && (
                    <button onClick={() => { setReviewModal(order); setRating(5); }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-md active:scale-[0.98] transition">
                      <Star size={13} className="fill-white" /> ให้คะแนนความอร่อย
                    </button>
                  )}
                </div>
              )}

              {/* Display submitted reviews */}
              {order.review && (
                <div className="px-5 pb-4">
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      {Array.from({length:5}).map((_,i)=><Star key={i} size={11} className={i<order.review.rating?'text-amber-400 fill-amber-400':'text-gray-200 dark:text-gray-800'} />)}
                    </div>
                    {order.review.comment && <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 font-semibold leading-relaxed">✏️ {order.review.comment}</p>}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Glowing Interactive Rating Stars V2 Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setReviewModal(null)} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-[28px] p-6 shadow-2xl animate-slide-up border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-gray-850 dark:text-gray-150">รีวิวความอร่อย {reviewModal.shop}</h3>
              <button onClick={() => setReviewModal(null)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-550"><X size={16} strokeWidth={2.5}/></button>
            </div>
            
            {/* Interactive Stars Row */}
            <div className="flex justify-center gap-2.5 mb-6">
              {[1,2,3,4,5].map(s => (
                <button 
                  key={s} 
                  onClick={() => setRating(s)} 
                  className="transition duration-200 active:scale-90 hover:scale-110"
                >
                  <Star 
                    size={36} 
                    className={`transition-all duration-300 ${
                      s <= rating 
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] scale-110' 
                        : 'text-gray-200 dark:text-gray-850'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="อาหารอร่อยไหม? บริการประทับใจพนักงานปานใด เขียนคำชมเชยเพื่อเป็นกำลังใจและปรับปรุงได้เลย..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs outline-none resize-none placeholder-gray-400 font-semibold focus:ring-2 focus:ring-amber-400/30" rows={3} />
            
            <button onClick={handleReview} className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-[0_6px_15px_rgba(245,158,11,0.3)] mt-5 transition active:scale-[0.98]">
              ส่งแบบประเมินความพึงพอใจ
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
