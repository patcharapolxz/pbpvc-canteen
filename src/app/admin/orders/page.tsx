'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { ordersApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Package, Clock, Eye, ShoppingBag, Search, RefreshCw, ChevronRight, X, Phone, ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; cls: string; border: string }> = {
  Waiting:   { label: 'รอรับออเดอร์', cls: 'badge-waiting', border: 'border-l-amber-500' },
  Cooking:   { label: 'กำลังปรุงอาหาร', cls: 'badge-cooking', border: 'border-l-blue-500' },
  Ready:     { label: 'พร้อมเสิร์ฟ',   cls: 'badge-ready', border: 'border-l-green-500' },
  Completed: { label: 'เสร็จสิ้นสำเร็จ', cls: 'badge-completed', border: 'border-l-gray-300 dark:border-l-gray-700' },
  Cancelled: { label: 'ยกเลิกออเดอร์', cls: 'badge-cancelled', border: 'border-l-red-500' },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      router.replace('/login');
      return;
    }
    loadOrders();
    const interval = setInterval(loadOrders, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const res: any = await ordersApi.get('Admin', '');
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch {}
    setLoading(false);
  };

  // 🖨️ Thermal Receipt Printing handler for Admin
  const handlePrint = (e: React.MouseEvent, order: any) => {
    e.stopPropagation(); // Avoid triggering card details modal click
    
    const itemsHtml = (order.items || []).map((i: any) => {
      let opts = i.options ? i.options.map((op: any) => op.name).join(' ') : '';
      if (i.note) opts += (opts ? ' ' : '') + `(${i.note})`;
      
      return `<div class="rec-item" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px;">
                <div style="width:65%; text-align: left;">${i.name} <br><span style="font-size:9px; color:#555;">${opts}</span></div>
                <div style="width:10%; text-align:center;">x${i.qty}</div>
                <div style="width:25%; text-align:right;">${(i.price * i.qty).toLocaleString()} ฿</div>
              </div>`;
    }).join('');

    let paymentText = "เงินสด";
    if (order.slip_url !== 'เงินสด') {
      paymentText = "ชำระแล้ว (QR Auto)";
    }

    const slipHtml = `
      <div class="receipt-box" style="width: 100%; max-width: 300px; margin: 0 auto; font-family: 'Courier New', monospace; padding: 15px 5px; background: white; color: black; font-size: 12px; line-height: 1.4;">
          <div class="rec-header" style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
              <h2 style="margin:0; font-size:18px; font-weight: bold;">${order.shop}</h2>
              <div style="font-size:12px; margin-top:5px; font-weight: bold;">ORDER: #${order.id.slice(-6).toUpperCase()}</div>
              <div style="font-size:10px; margin-top:3px;">${order.time}</div>
          </div>
          
          <div style="margin-bottom:10px;">${itemsHtml}</div>
          
          <div class="rec-total" style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-top: 10px; text-align: right; font-weight: bold; font-size: 15px;">
              รวมทั้งสิ้น: ${Number(order.total).toLocaleString()} ฿
          </div>
          
          <div style="margin-top:10px; font-size:11px; text-align: left;">
              <div><strong>ลูกค้า:</strong> ${order.custName} (${order.custNick || '-'})</div>
              <div><strong>เบอร์โทร:</strong> ${order.custPhone}</div>
              <div><strong>วิธีชำระ:</strong> ${paymentText}</div>
              ${order.note ? `<div style="margin-top:6px; font-weight:bold; color: #ff0000; border: 1px solid #ff0000; padding: 4px; border-radius: 4px;">** หมายเหตุ: ${order.note} **</div>` : ''}
          </div>
          
          <div class="rec-footer" style="text-align: center; font-size: 10px; margin-top: 20px; font-weight: bold; border-top: 1px dashed #000; padding-top: 8px;">
              ขอบคุณที่อุดหนุนครับ/ค่ะ<br>
              *** PBPVC Canteen ***
          </div>
      </div>
    `;

    const area = document.getElementById('print-area');
    if (!area) return;
    area.innerHTML = slipHtml;
    
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filter === 'all' || o.status === filter;
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.shop_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.custName || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.custNick || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9] dark:bg-[#121212]">
        <div className="w-12 h-12 border-4 border-[#1e3c72] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Curved Header */}
      <div className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white px-5 pt-8 pb-[60px] rounded-b-[24px] shadow-[0_4px_15px_rgba(30,60,114,0.2)]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 active:scale-90 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-wide leading-tight">ประวัติออเดอร์ทั้งหมด</h1>
            <p className="text-white/70 text-[10px] font-bold mt-0.5 uppercase tracking-wider">ติดตามดูแลความเรียบร้อยของศูนย์อาหาร</p>
          </div>
          <button onClick={() => { setLoading(true); loadOrders(); }} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0 cursor-pointer transition active:scale-95">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="px-4 -mt-8 relative z-10 mb-5 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-3 shadow-xs space-y-2.5 border border-gray-150/40 dark:border-gray-800">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาเลขออเดอร์, ร้านค้า, ชื่อผู้สั่งซื้อ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#1e3c72]/30 dark:text-gray-250 font-bold"
            />
          </div>

          {/* Scrolling filter categories */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              ['all', 'ทั้งหมด'],
              ['Waiting', 'รอรับออเดอร์'],
              ['Cooking', 'กำลังปรุง'],
              ['Ready', 'พร้อมเสิร์ฟ'],
              ['Completed', 'เสร็จสิ้น'],
              ['Cancelled', 'ยกเลิกแล้ว'],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                  filter === k 
                    ? 'bg-[#1e3c72] text-white border-[#1e3c72] shadow-xs' 
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="px-4 space-y-3.5 max-w-2xl mx-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 space-y-3 animate-pulse border border-gray-100 dark:border-gray-800">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            </div>
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-150/40 dark:border-gray-800 shadow-sm">
            <ShoppingBag size={48} className="mx-auto mb-3 opacity-20 text-gray-400" />
            <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wide">ไม่มีรายการคำสั่งซื้อตรงตามเงื่อนไข</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.Waiting;
            const items = Array.isArray(order.items) ? order.items : [];
            const payType = order.slip_url === 'เงินสด' ? '💵 เงินสด' : '📱 โอน (QR)';
            
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-4 cursor-pointer hover:shadow-sm transition-all border border-gray-100/50 dark:border-gray-800 border-l-4 ${st.border} flex items-center justify-between gap-3`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="font-extrabold text-xs text-gray-850 dark:text-gray-200">#{order.id.slice(-6).toUpperCase()}</p>
                    <span className="text-[10px] text-gray-400 font-bold">| {order.shop_name}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ml-auto ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate leading-snug">
                    {items.map((i: any) => `${i.name} x${i.qty}`).join(', ')}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 dark:text-gray-500 font-semibold flex-wrap">
                    <span>ลูกค้า: <span className="text-gray-700 dark:text-gray-350 font-extrabold">{order.custName}</span></span>
                    <span>• {payType}</span>
                    <span className="text-[#1e3c72] dark:text-blue-400 font-black">฿{Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Print button & Chevron */}
                <div className="flex items-center gap-2 shrink-0 ml-1">
                  <button 
                    onClick={(e) => handlePrint(e, order)}
                    className="w-8.5 h-8.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700 hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer shadow-xs"
                    title="พิมพ์ใบเสร็จ"
                  >
                    <Printer size={14} />
                  </button>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Modal Sheet */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-[28px] max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border-t border-white/10">
            
            <div className="sticky top-0 bg-white dark:bg-[#1e1e1e] px-5 py-4 flex items-center justify-between border-b border-gray-150 dark:border-gray-800 shrink-0 rounded-t-[28px]">
              <div>
                <h3 className="font-extrabold text-sm text-gray-850 dark:text-gray-150">🔍 รายละเอียดออเดอร์ #{selectedOrder.id.slice(-6).toUpperCase()}</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-bold">ร้าน: {selectedOrder.shop_name} • สั่งซื้อเมื่อ: {selectedOrder.time}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-8">
              
              {/* Status Banner */}
              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-4 flex justify-between items-center border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">สถานะปัจจุบัน</p>
                  <p className="font-extrabold text-xs text-gray-800 dark:text-gray-250 mt-0.5">
                    {STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                  </p>
                </div>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${STATUS_MAP[selectedOrder.status]?.cls}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100/50 dark:border-blue-950/50">
                <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold mb-1.5 uppercase">ข้อมูลสมาชิกผู้รับอาหาร</p>
                <p className="font-extrabold text-xs text-gray-800 dark:text-gray-200">
                  {selectedOrder.custName} {selectedOrder.custNick && `(${selectedOrder.custNick})`}
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500 font-bold">
                  <span>รหัส: {selectedOrder.user_id}</span>
                  {selectedOrder.custPhone && selectedOrder.custPhone !== '-' && (
                    <a href={`tel:${selectedOrder.custPhone}`} className="flex items-center gap-1 text-[#1e3c72] dark:text-blue-400">
                      <Phone size={12} /> {selectedOrder.custPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Items Summary list */}
              <div>
                <h4 className="font-extrabold text-xs text-gray-450 dark:text-gray-500 mb-2 uppercase tracking-wider">รายการสินค้าอาหาร</h4>
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-gray-800">
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0 last:pb-0">
                      <span>{item.name} <span className="text-gray-400 font-bold">×{item.qty}</span></span>
                      <span className="font-black text-gray-800 dark:text-gray-200">{(item.price * item.qty).toLocaleString()} ฿</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 font-black text-base border-t border-gray-200 dark:border-gray-800">
                    <span className="text-xs text-gray-400 dark:text-gray-550 font-bold">ราคารวมทั้งสิ้น</span>
                    <span className="text-[#1e3c72] dark:text-blue-400">{Number(selectedOrder.total).toLocaleString()} ฿</span>
                  </div>
                </div>
              </div>

              {/* Slip / Payment Method details */}
              <div>
                <h4 className="font-extrabold text-xs text-gray-450 dark:text-gray-500 mb-2 uppercase tracking-wider">การชำระเงิน</h4>
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    ช่องทาง: <span className="font-black">{selectedOrder.slip_url === 'เงินสด' ? '💵 ชำระด้วยเงินสด' : '📱 สแกน QR โอนเงิน'}</span>
                  </p>
                  {selectedOrder.slip_url && selectedOrder.slip_url !== 'เงินสด' && selectedOrder.slip_url.startsWith('http') && (
                    <div className="mt-3">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 font-bold">สลิปการทำรายการ:</p>
                      <div className="rounded-xl overflow-hidden max-w-xs mx-auto border border-gray-200 dark:border-gray-800">
                        <img src={selectedOrder.slip_url} alt="Slip Receipt" className="w-full h-auto object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Note */}
              {selectedOrder.note && (
                <div className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-950">
                  <p className="text-[10px] font-bold text-red-500">📝 หมายเหตุข้อความพิเศษ</p>
                  <p className="text-xs font-bold mt-1 leading-relaxed">{selectedOrder.note}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
