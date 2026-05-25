'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { ordersApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Package, Clock, ChefHat, CheckCircle, XCircle, Phone, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; cls: string; border: string; next?: string; nextLabel?: string }> = {
  Waiting:   { label: 'รอรับออเดอร์', cls: 'badge-waiting',   border: 'border-wait',   next: 'Cooking',   nextLabel: '🍳 รับออเดอร์แล้วทำอาหาร' },
  Cooking:   { label: 'กำลังปรุงอาหาร', cls: 'badge-cooking',   border: 'border-cook',   next: 'Ready',     nextLabel: '✅ ปรุงเสร็จพร้อมเสิร์ฟ' },
  Ready:     { label: 'พร้อมรับอาหาร', cls: 'badge-ready',     border: 'border-ready',  next: 'Completed', nextLabel: '🎉 ลูกค้ารับของสำเร็จ' },
  Completed: { label: 'เสร็จสิ้นสำเร็จ', cls: 'badge-completed', border: 'border-ready' },
  Cancelled: { label: 'ยกเลิกออเดอร์', cls: 'badge-cancelled', border: 'border-cancel' },
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
    const iv = setInterval(loadOrders, 10000); // Poll every 10 seconds for new orders
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
    if (res.success) { 
      toast.success('อัพเดทสถานะออเดอร์แล้ว'); 
      loadOrders(); 
    } else {
      toast.error(res.msg);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('ยืนยันปฏิเสธหรือยกเลิกออเดอร์นี้หรือไม่?')) return;
    const res: any = await ordersApi.cancel(orderId);
    if (res.success) { 
      toast.success('ยกเลิกออเดอร์สำเร็จ'); 
      loadOrders(); 
    } else {
      toast.error(res.msg);
    }
  };

  // 🖨️ Thermal Receipt Printing handler
  const handlePrint = (order: any) => {
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
    
    // Tiny delay to ensure styles and contents are bound correctly
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const filtered = filter === 'active'
    ? orders.filter(o => ['Waiting','Cooking','Ready'].includes(o.status))
    : orders.filter(o => ['Completed','Cancelled'].includes(o.status));

  const waitingCount = orders.filter(o => o.status === 'Waiting').length;

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9] dark:bg-[#121212]">
        <div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Curved Emerald Header */}
      <div className="bg-gradient-to-b from-[#36c990] to-[#006837] text-white px-5 pt-8 pb-[50px] rounded-b-[24px] shadow-[0_4px_15px_rgba(0,104,55,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold leading-tight tracking-wide">{currentUser.shop || 'ร้านค้า Canteen'}</h1>
            <p className="text-white/80 text-[11px] font-bold mt-0.5 uppercase tracking-wider">แผงควบคุมการรับออเดอร์อาหาร</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-xs font-extrabold text-white">กำลังอัปเดตสด</span>
          </div>
        </div>
        {waitingCount > 0 && (
          <div className="mt-4 bg-amber-400 text-white text-xs font-black px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md animate-bounce">
            🔔 มีออเดอร์ใหม่รอคุณยืนยัน {waitingCount} รายการ!
          </div>
        )}
      </div>

      {/* Segment Tab Selector */}
      <div className="px-4 -mt-8 relative z-10 mb-5">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-1.5 shadow-xs flex gap-1 border border-gray-150/40 dark:border-gray-800 max-w-md mx-auto">
          {[
            ['active','ออเดอร์ที่กำลังปรุง'],
            ['done','ออเดอร์ที่ขายเสร็จแล้ว']
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

      {/* Orders List containing Order Ticket V2 and Print Button */}
      <div className="px-4 space-y-4 max-w-2xl mx-auto">
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
            <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wide">ไม่มีออเดอร์อาหารในขั้นตอนนี้</p>
          </div>
        ) : filtered.map(order => {
          const st = STATUS_MAP[order.status] || STATUS_MAP.Waiting;
          const payType = order.slip === 'เงินสด' ? '💵 เงินสด' : '📱 สแกน QR (โอน)';
          
          return (
            <div key={order.id} className={`order-ticket-v2 ${st.border} dark:bg-[#1e1e1e] relative z-10 overflow-hidden`}>
              
              {/* Card Header details */}
              <div className="ticket-v2-header flex items-center justify-between dark:bg-[#1e1e1e]">
                <div>
                  <p className="font-extrabold text-sm text-gray-850 dark:text-gray-200 leading-tight">ออเดอร์ #{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-[9px] text-gray-400 font-extrabold mt-0.5 tracking-wider">วันเวลา {order.time}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Print Button (Print Icon) */}
                  <button 
                    onClick={() => handlePrint(order)}
                    className="w-8.5 h-8.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 active:scale-90 transition-all shadow-xs"
                    title="พิมพ์ใบเสร็จความร้อน"
                  >
                    <Printer size={15} />
                  </button>
                  <span className={st.cls}>{st.label}</span>
                </div>
              </div>

              {/* Customer Box Details */}
              <div className="cust-box-v2 dark:bg-[#1a2e26]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="cust-icon-circle rounded-full w-8.5 h-8.5 flex items-center justify-center text-xs font-black shrink-0 uppercase">
                    {order.custNick?.slice(0,2) || order.custName?.slice(0,2) || 'C'}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 leading-tight">ชื่อผู้สั่ง: {order.custName} ({order.custNick || 'ทั่วไป'})</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">วิธีชำระ: {payType}</p>
                  </div>
                </div>
                {order.custPhone && order.custPhone !== '-' && (
                  <a href={`tel:${order.custPhone}`}
                    className="w-8 h-8 bg-gradient-to-tr from-[#006837] to-[#00a568] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm">
                    <Phone size={13} strokeWidth={2.5} />
                  </a>
                )}
              </div>

              {/* Items List Detail Area */}
              <div className="item-list-v2">
                <div className="bg-[#f8f9ff] dark:bg-gray-900/60 rounded-xl px-4 py-3 space-y-2 border border-gray-100/50 dark:border-gray-800/50">
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-dashed border-gray-250/30 dark:border-gray-800 last:border-0">
                      <div className="pr-2">
                        <span className="font-extrabold text-gray-850 dark:text-gray-250">{item.name}</span>
                        {item.options && item.options.length > 0 && (
                          <p className="text-[9px] text-gray-400 font-bold mt-0.5">⚙️ {item.options.map((o: any) => o.name).join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-extrabold text-gray-400">×{item.qty}</span>
                        <span className="font-extrabold text-gray-700 dark:text-gray-300">{(item.price * item.qty).toLocaleString()} ฿</span>
                      </div>
                    </div>
                  ))}
                  
                  {order.note && (
                    <div className="mt-2.5 text-[11px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-3 py-2.5 rounded-lg border border-red-100 dark:border-red-950 font-bold leading-relaxed">
                      📝 คำสั่งพิเศษ: {order.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom / Action Area */}
              <div className="ticket-v2-footer flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                  รวมมูลค่าสินค้าทั้งหมด
                </div>
                <div className="text-base font-black text-[#00a568]">
                  {Number(order.total).toLocaleString()} ฿
                </div>
              </div>

              {st.next && (
                <div className="px-5 pb-4 flex gap-2.5">
                  <button onClick={() => handleStatus(order.id, st.next!)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#006837] to-[#00a568] hover:bg-[#008a47] text-white font-extrabold text-xs shadow-md hover:scale-[1.01] active:scale-95 duration-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    {st.nextLabel}
                  </button>
                  {order.status === 'Waiting' && (
                    <button onClick={() => handleCancel(order.id)}
                      className="px-4.5 py-3 rounded-xl border border-red-200 text-red-500 dark:border-red-950/50 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 duration-100 transition-all cursor-pointer">
                      ปฏิเสธรับออเดอร์
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
