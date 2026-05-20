'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { ordersApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Package, Clock, ChefHat, CheckCircle, XCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; cls: string; next?: string; nextLabel?: string }> = {
  Waiting:   { label: 'รอรับออเดอร์', cls: 'badge-waiting',   next: 'Cooking',   nextLabel: '🍳 รับออเดอร์' },
  Cooking:   { label: 'กำลังทำ',     cls: 'badge-cooking',   next: 'Ready',     nextLabel: '✅ พร้อมเสิร์ฟ' },
  Ready:     { label: 'พร้อมแล้ว',   cls: 'badge-ready',     next: 'Completed', nextLabel: '🎉 รับของแล้ว' },
  Completed: { label: 'สำเร็จ',      cls: 'badge-completed' },
  Cancelled: { label: 'ยกเลิก',      cls: 'badge-cancelled' },
};

export default function MerchantOrdersPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('active');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Merchant') { router.replace('/login'); return; }
    loadOrders();
    const iv = setInterval(loadOrders, 15000);
    return () => clearInterval(iv);
  }, []);

  const loadOrders = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    try {
      const res: any = await ordersApi.get('Merchant', loggedInUser.id);
      if (res.success) setOrders(res.data);
    } catch {}
    setLoading(false);
  };

  const handleStatus = async (orderId: string, status: string) => {
    const res: any = await ordersApi.updateStatus(orderId, status);
    if (res.success) { toast.success('อัพเดทสถานะแล้ว'); loadOrders(); }
    else toast.error(res.msg);
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('ยืนยันยกเลิกออเดอร์?')) return;
    const res: any = await ordersApi.cancel(orderId);
    if (res.success) { toast.success('ยกเลิกแล้ว'); loadOrders(); }
  };

  const filtered = filter === 'active'
    ? orders.filter(o => ['Waiting','Cooking','Ready'].includes(o.status))
    : orders.filter(o => ['Completed','Cancelled'].includes(o.status));

  const waitingCount = orders.filter(o => o.status === 'Waiting').length;

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]">
        <div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] pb-nav">
      {/* LINE MAN Style Header */}
      <div className="bg-linear-to-br from-[#43a047] to-[#006837] text-white px-5 pt-10 pb-[60px] rounded-b-[30px] shadow-[0_10px_30px_rgba(0,104,55,0.2)]">
        <h1 className="text-xl font-bold">จัดการออเดอร์</h1>
        {waitingCount > 0 && (
          <div className="mt-2 bg-amber-400 text-white text-sm font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-sm">
            🔔 มีออเดอร์รอรับ {waitingCount} รายการ
          </div>
        )}
      </div>

      {/* Floating Status Filter */}
      <div className="px-4 -mt-8 relative z-10 mb-4">
        <div className="bg-white rounded-[50px] p-1 shadow-[0_4px_15px_rgba(0,0,0,0.05)] flex gap-1 border border-gray-100">
          {[['active','กำลังดำเนินการ'],['done','เสร็จสิ้น']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`flex-1 py-2.5 rounded-[50px] text-sm font-bold transition-all ${
                filter === k ? 'bg-[#006837] text-white shadow-[0_4px_10px_rgba(0,104,55,0.3)]' : 'bg-transparent text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
              <div className="skeleton h-5 w-1/3" /><div className="skeleton h-4 w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">ไม่มีออเดอร์</p>
          </div>
        ) : filtered.map(order => {
          const st = STATUS_MAP[order.status] || STATUS_MAP.Waiting;
          const payType = order.slip === 'เงินสด' ? '💵 เงินสด' : '📱 โอนเงิน';
          return (
            <div key={order.id} className={`bg-white rounded-2xl shadow-(--card-shadow) overflow-hidden animate-slide-up border-l-4 ${
              order.status === 'Waiting' ? 'border-amber-400' : 
              order.status === 'Cooking' ? 'border-blue-400' : 
              order.status === 'Ready' ? 'border-green-400' : 'border-gray-200'}`}>
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-base">#{order.id}</p>
                  <p className="text-xs text-gray-400">{order.time}</p>
                </div>
                <span className={st.cls}>{st.label}</span>
              </div>

              {/* Customer info */}
              <div className="px-5 py-3 bg-blue-50/50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{order.custName} ({order.custNick})</p>
                  <p className="text-xs text-gray-500">{payType}</p>
                </div>
                {order.custPhone && order.custPhone !== '-' && (
                  <a href={`tel:${order.custPhone}`}
                    className="w-9 h-9 bg-[#006837] text-white rounded-full flex items-center justify-center">
                    <Phone size={16} />
                  </a>
                )}
              </div>

              {/* Items */}
              <div className="px-5 py-4">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1.5 border-b border-dashed border-gray-100 last:border-0">
                    <span>{item.name} <span className="text-gray-400 font-bold">×{item.qty}</span></span>
                    <span className="font-medium">{(item.price * item.qty).toLocaleString()} ฿</span>
                  </div>
                ))}
                <div className="flex justify-between mt-3 font-bold text-base">
                  <span>รวม</span>
                  <span className="text-[#006837]">{Number(order.total).toLocaleString()} ฿</span>
                </div>
                {order.note && <p className="mt-2 text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">📝 {order.note}</p>}
              </div>

              {/* Action buttons */}
              {st.next && (
                <div className="px-5 pb-4 flex gap-2">
                  <button onClick={() => handleStatus(order.id, st.next!)}
                    className="flex-1 py-3 rounded-xl bg-[#006837] text-white font-semibold text-sm">
                    {st.nextLabel}
                  </button>
                  {order.status === 'Waiting' && (
                    <button onClick={() => handleCancel(order.id)}
                      className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-500 text-sm font-medium">
                      ยกเลิก
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
