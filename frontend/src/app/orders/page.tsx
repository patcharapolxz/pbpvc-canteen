'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { ordersApi, reviewsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Star, ChefHat, X, Store, CreditCard, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Waiting:   { label: 'รอร้านรับ', cls: 'bg-[#ffa700] text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
  Cooking:   { label: 'กำลังทำ',  cls: 'bg-[#0288d1] text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
  Ready:     { label: 'เสร็จแล้ว', cls: 'bg-[#00a568] text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
  Completed: { label: 'สำเร็จ',   cls: 'bg-gray-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
  Cancelled: { label: 'ยกเลิก',   cls: 'bg-red-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm' },
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
    if (!confirm('ยืนยันการยกเลิกออเดอร์?')) return;
    const res: any = await ordersApi.cancel(orderId);
    if (res.success) { toast.success('ยกเลิกออเดอร์แล้ว'); loadOrders(); }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-12 h-12 border-4 border-[#00a568] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Header (Screenshot Style) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-4 flex items-center justify-between shadow-[0_1px_5px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <ChefHat className="text-[#00a568]" size={22} />
          <h1 className="text-base font-extrabold text-gray-800">ออเดอร์ที่กำลังทำ</h1>
        </div>
        <button onClick={() => router.push('/shops')} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Filter Floating */}
      <div className="px-4 mt-3 mb-4">
        <div className="bg-white rounded-xl p-1 shadow-sm flex gap-1 border border-gray-100 max-w-md mx-auto">
          {[['active','กำลังดำเนินการ'],['done','เสร็จสิ้น'],['all','ทั้งหมด']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === k ? 'bg-[#00a568] text-white shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 space-y-4 max-w-4xl mx-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 space-y-4 border border-gray-100 shadow-sm animate-pulse">
              <div className="flex justify-between"><div className="h-5 bg-gray-200 rounded w-1/3" /><div className="h-5 bg-gray-200 rounded w-1/4" /></div>
              <div className="h-8 bg-gray-200 rounded w-full" />
              <div className="h-12 bg-gray-200 rounded w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-500 text-sm">ไม่มีออเดอร์ในหมวดนี้</p>
          </div>
        ) : filtered.map(order => {
          const st = STATUS_MAP[order.status] || STATUS_MAP.Waiting;
          const { pct, p1, p2, p3 } = getProgressDetails(order.status);
          const canCancel = order.status === 'Waiting';
          const canReview = order.status === 'Completed' && !order.review;

          return (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
              
              {/* Top Row: Shop details & Badge */}
              <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                <div className="flex gap-2 items-start">
                  <div className="p-2 bg-emerald-50 rounded-lg text-[#00a568]">
                    <Store size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-gray-800 leading-tight">{order.shop}</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1">#{order.id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={st.cls}>{st.label}</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-0.5">เวลา: {order.time.split(' ')[1] || order.time}</span>
                </div>
              </div>

              {/* Middle Row: The Timeline Progress Bar */}
              <div className="relative flex items-center justify-between my-3 px-10">
                {/* Gray Background Line */}
                <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[3.5px] bg-gray-100 rounded-full z-0" />
                
                {/* Active Yellow Progress Line */}
                <div 
                  className="absolute left-10 top-1/2 -translate-y-1/2 h-[3.5px] bg-[#ffa700] rounded-full z-0 transition-all duration-500" 
                  style={{ width: `calc(${pct} - 20px)` }}
                />
                
                {/* Point 1: Store/Shop */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                  p1 ? 'bg-white border-[#ffa700] text-[#ffa700] shadow-sm' : 'bg-white border-gray-200 text-gray-300'
                }`}>
                  <Store size={13} />
                </div>

                {/* Point 2: Timer/Clock */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                  p2 ? 'bg-white border-[#ffa700] text-[#ffa700] shadow-sm' : 'bg-white border-gray-200 text-gray-300'
                }`}>
                  <Clock size={13} />
                </div>

                {/* Point 3: Check/Done */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                  p3 ? 'bg-[#00a568] border-[#00a568] text-white shadow-sm' : 'bg-white border-gray-200 text-gray-300'
                }`}>
                  <CheckCircle size={13} />
                </div>
              </div>

              {/* Details Row (Light gray card style) */}
              <div className="px-5 py-2">
                <div className="bg-[#f8f9fa] rounded-lg px-4 py-2.5 space-y-2">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-[13px] py-1 border-b border-dashed border-gray-200/60 last:border-0">
                      <div>
                        <span className="font-extrabold text-gray-800">{item.name}</span>
                        {order.note && <p className="text-[11px] text-gray-400 mt-0.5">💡 {order.note}</p>}
                      </div>
                      <span className="font-bold text-gray-500">x{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Footer: Payment status & Price */}
              <div className="px-5 py-3.5 border-t border-gray-50 flex items-center justify-between">
                <div>
                  {order.slip === 'QR_PAYMENT' ? (
                    <span className="bg-[#00a568] text-white px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-sm">
                      ✔ จ่ายแล้ว (QR)
                    </span>
                  ) : (
                    <span className="bg-[#ffa700] text-white px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-sm">
                      💵 จ่ายเงินสด
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[15px] font-extrabold text-[#00a568]">{Number(order.total).toLocaleString()} ฿</span>
                </div>
              </div>

              {/* Cancel or Review Action Area */}
              {(canCancel || canReview) && (
                <div className="px-5 pb-4 flex gap-2">
                  {canCancel && (
                    <button onClick={() => handleCancel(order.id)}
                      className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition active:scale-[0.98]">
                      ยกเลิกออเดอร์
                    </button>
                  )}
                  {canReview && (
                    <button onClick={() => { setReviewModal(order); setRating(5); }}
                      className="flex-1 py-2.5 rounded-lg bg-amber-400 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm active:scale-[0.98] transition">
                      <Star size={13} className="fill-white" /> เขียนรีวิวร้านนี้
                    </button>
                  )}
                </div>
              )}

              {/* Review content if reviewed */}
              {order.review && (
                <div className="px-5 pb-4">
                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      {Array.from({length:5}).map((_,i)=><Star key={i} size={12} className={i<order.review.rating?'text-amber-400 fill-amber-400':'text-gray-200'} />)}
                    </div>
                    {order.review.comment && <p className="text-xs text-gray-600 mt-1 font-medium">{order.review.comment}</p>}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative bg-white rounded-t-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-gray-800">รีวิวร้าน {reviewModal.shop}</h3>
              <button onClick={() => setReviewModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"><X size={18} strokeWidth={2.5}/></button>
            </div>
            <div className="flex justify-center gap-2.5 mb-6">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="transition hover:scale-110">
                  <Star size={36} className={s<=rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="เขียนความคิดเห็นเพื่อแนะนำร้านค้าและปรับปรุงคุณภาพการบริการ..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none resize-none placeholder-gray-400 font-medium focus:ring-2 focus:ring-amber-400/30" rows={3} />
            <button onClick={handleReview} className="w-full bg-amber-400 hover:bg-amber-500 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md mt-5 transition active:scale-[0.98]">
              ส่งรีวิวร้านค้า
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
