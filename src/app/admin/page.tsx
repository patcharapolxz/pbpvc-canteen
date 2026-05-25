'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { adminApi, newsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
import { Users, ShoppingBag, TrendingUp, Banknote, Megaphone, AlertTriangle, ShieldCheck, Clock, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAppStore();
  const [tab, setTab] = useState<'dashboard'|'news'|'reports'>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [newsMsg, setNewsMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      router.replace('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes]: any[] = await Promise.all([
        adminApi.getStats(),
        adminApi.getReports(),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (reportsRes.success) setReports(reportsRes.data || []);
    } catch {}
    setLoading(false);
  };

  const handlePostNews = async () => {
    if (!newsMsg.trim()) return;
    const res: any = await newsApi.post(newsMsg);
    if (res.success) {
      toast.success('โพสต์ประกาศเรียบร้อย');
      setNewsMsg('');
    } else {
      toast.error(res.msg);
    }
  };

  const handleClearNews = async () => {
    const res: any = await newsApi.clear();
    if (res.success) {
      toast.success('ลบประกาศทั้งหมดแล้ว');
    } else {
      toast.error(res.msg);
    }
  };

  const handleResolveReport = async (reportId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
    const res: any = await adminApi.updateReportStatus(reportId, nextStatus);
    if (res.success) {
      toast.success(nextStatus === 'Resolved' ? 'ทำเครื่องหมายแก้ไขปัญหาเรียบร้อย' : 'เปิดปัญหาใหม่อีกครั้ง');
      setReports(reports.map(r => r.id === reportId ? { ...r, status: nextStatus } : r));
    } else {
      toast.error(res.msg);
    }
  };

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return <PremiumLoading text="กำลังโหลดแดชบอร์ด..." subtext="กรุณารอสักครู่..." />;
  }

  const pendingReportsCount = reports.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Premium Admin Header */}
      <div className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white px-5 pt-8 pb-[60px] rounded-b-[24px] shadow-[0_4px_15px_rgba(30,60,114,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold flex items-center gap-2 tracking-wide leading-tight">
              <ShieldCheck size={22} className="text-white" /> ระบบดูแลส่วนกลาง
            </h1>
            <p className="text-white/70 text-[11px] font-bold mt-0.5 uppercase tracking-wider">ผู้ดูแล: {currentUser.name}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={loadData} className="w-8.5 h-8.5 rounded-xl bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 active:scale-90 transition-all">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => { logout(); router.replace('/login'); }}
              className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-white/20 transition active:scale-95 cursor-pointer">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      {/* Segment Tab Controls */}
      <div className="px-4 -mt-8 relative z-10 mb-5 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-1.5 shadow-xs flex gap-1 border border-gray-150/40 dark:border-gray-800">
          {[
            ['dashboard', '📊 แดชบอร์ดสถิติ'],
            ['news', '📢 โฆษณาข่าวสาร'],
            ['reports', `⚠️ ปัญหาและคำร้อง ${pendingReportsCount > 0 ? `(${pendingReportsCount})` : ''}`]
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                tab === k 
                  ? 'bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white shadow-md' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-850'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto">
        
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="space-y-4 animate-slide-up">
            
            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-4.5 shadow-xs border border-gray-100/60 dark:border-gray-800 grid grid-cols-2 gap-3">
              <button onClick={() => router.push('/admin/users')}
                className="p-4 bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 rounded-2xl border border-blue-150/30 dark:border-blue-900/30 flex flex-col items-center justify-center text-center transition active:scale-95 duration-100 cursor-pointer"
              >
                <Users size={24} className="text-blue-600 dark:text-blue-400 mb-1.5" />
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-250">จัดการบัญชีผู้ใช้งาน</span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-0.5 font-bold uppercase tracking-wider">ระบบ CRUD สิทธิ์ <ExternalLink size={8} /></span>
              </button>

              <button onClick={() => router.push('/admin/orders')}
                className="p-4 bg-green-50/40 hover:bg-green-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 rounded-2xl border border-green-150/30 dark:border-emerald-900/30 flex flex-col items-center justify-center text-center transition active:scale-95 duration-100 cursor-pointer"
              >
                <ShoppingBag size={24} className="text-green-600 dark:text-green-400 mb-1.5" />
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-250">ประวัติออเดอร์ทั้งหมด</span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-0.5 font-bold uppercase tracking-wider">ตรวจสอบใบเสร็จ <ExternalLink size={8} /></span>
              </button>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Banknote, color: 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400', label: 'ยอดขายรวมสะสมในระบบ', value: `${Number(stats?.total || 0).toLocaleString()} ฿` },
                { icon: ShoppingBag, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400', label: 'คำสั่งซื้อสะสมรวม', value: stats?.orders || 0 },
                { icon: Users, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400', label: 'สมาชิกในระบบทั้งหมด', value: stats?.users || 0 },
                { icon: TrendingUp, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400', label: 'ร้านค้าที่เปิดบริการ', value: stats?.shops?.length || 0 },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 border border-gray-100/60 dark:border-gray-800 shadow-xs">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-[10px] font-extrabold uppercase tracking-wider">{label}</p>
                  <p className="font-black text-lg mt-0.5 text-gray-800 dark:text-gray-200">{value}</p>
                </div>
              ))}
            </div>

            {/* Shop Leaderboard */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-5 border border-gray-100/60 dark:border-gray-800 shadow-xs">
              <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">🏆 อันดับยอดขายสะสมของแต่ละร้าน</h3>
              {stats?.shops?.length === 0 ? (
                <p className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs font-bold">ยังไม่มีข้อมูลรายการสั่งซื้อในระบบ</p>
              ) : (
                stats?.shops?.map((s: any, i: number) => (
                  <div key={s.shop} className="flex items-center gap-3 py-3.5 border-b border-dashed border-gray-100 dark:border-gray-800 last:border-0">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                      i === 0 ? 'bg-amber-400 shadow-xs' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xs text-gray-800 dark:text-gray-200 truncate">{s.shop}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">ยอดขาย {s.orders} รายการ</p>
                    </div>
                    <span className="font-black text-[#006837] dark:text-[#00a568] text-sm shrink-0">{s.revenue.toLocaleString()} ฿</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NEWS TAB */}
        {tab === 'news' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-5 border border-gray-100/60 dark:border-gray-800 shadow-xs">
              <h3 className="font-extrabold text-xs text-gray-450 dark:text-gray-500 mb-3.5 flex items-center gap-2 uppercase tracking-wider">
                <Megaphone size={16} className="text-[#1e3c72] dark:text-blue-400" /> ประกาศข่าวประชาสัมพันธ์/ประกาศแจ้งเตือน
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-3">เมื่อบันทึกข้อความแล้ว แบนเนอร์สีเหลืองวิ่งแจ้งเตือนจะเปิดแสดงทันทีในหน้าแรกของนักเรียน/ลูกค้า</p>
              <textarea
                value={newsMsg}
                onChange={e => setNewsMsg(e.target.value)}
                placeholder="ป้อนข่าวหรือประชาสัมพันธ์โรงอาหารที่ต้องการเปิดเผยต่อสมาชิกทุกคนในระบบ..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-250 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs outline-none resize-none mb-4 focus:ring-2 focus:ring-[#1e3c72]/30 font-bold dark:text-gray-200 leading-relaxed"
                rows={4}
              />
              <div className="flex gap-2">
                <button onClick={handlePostNews} className="flex-1 bg-gradient-to-r from-[#1e3c72] to-[#2a5298] hover:opacity-95 text-white py-3.5 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 duration-100 cursor-pointer">
                  📢 อัปเดตประกาศข่าวสาร
                </button>
                <button onClick={handleClearNews} className="flex-1 bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30 py-3.5 rounded-xl font-extrabold text-xs border border-red-200 dark:border-red-900/50 transition active:scale-95 duration-100 cursor-pointer">
                  🗑️ ซ่อนและล้างประกาศ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {tab === 'reports' && (
          <div className="space-y-3.5 animate-slide-up">
            {reports.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-150/40 dark:border-gray-800 shadow-sm">
                <AlertTriangle size={48} className="mx-auto mb-3 opacity-20 text-gray-400" />
                <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wide">ยังไม่ได้รับแจ้งปัญหาหรือข้อเสนอแนะใดๆ</p>
              </div>
            ) : (
              reports.map(report => {
                const isPending = report.status === 'Pending';
                return (
                  <div key={report.id} className={`bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-4 border border-gray-100/60 dark:border-gray-800/80 border-l-4 ${isPending ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          isPending ? 'bg-orange-50 text-orange-600 border border-orange-200/50 dark:bg-orange-950/20 dark:text-orange-400' : 'bg-green-50 text-green-600 border border-green-200/50 dark:bg-green-950/20 dark:text-green-400'
                        }`}>
                          {report.type}
                        </span>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1 font-bold">
                          <Clock size={9} /> {report.created_at ? new Date(report.created_at).toLocaleString('th-TH') : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleResolveReport(report.id, report.status)}
                        className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg active:scale-95 transition cursor-pointer shrink-0 ${
                          isPending ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {isPending ? 'ทำเครื่องหมายเสร็จสิ้น' : 'เปิดปัญหาใหม่อีกครั้ง'}
                      </button>
                    </div>

                    <div className="mt-2.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-bold leading-relaxed">{report.message}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                      <span>ผู้แจ้ง: <span className="text-gray-600 dark:text-gray-400 font-black">{report.name} (ID: {report.user_id})</span></span>
                      {report.contact && <span>ติดต่อกลับ: <span className="text-gray-600 dark:text-gray-400 font-black">{report.contact}</span></span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
