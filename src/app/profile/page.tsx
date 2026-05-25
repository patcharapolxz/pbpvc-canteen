'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { utilsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
import { ArrowLeft, User, Save, LogOut, Eye, EyeOff, AlertTriangle, Download, X, ChevronRight, FileText, Send, Moon, Sun, Type } from 'lucide-react';
import { alert } from '@/lib/alert';

const ISSUE_TYPES = ['เมนูไม่ถูกต้อง', 'ออเดอร์มีปัญหา', 'การชำระเงินผิดพลาด', 'ร้านค้ามีปัญหา', 'ปัญหาด้านระบบ', 'อื่นๆ'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, theme, setTheme, fontSize, setFontSize } = useAppStore();
  const [form,    setForm]    = useState({ name:'', nick:'', phone:'', email:'', pwd:'' });
  const [saving,  setSaving]  = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'none'|'report'|'history'>('none');

  // Report form
  const [reportForm, setReportForm] = useState({ type: ISSUE_TYPES[0], msg: '', contact: '' });
  const [reporting,  setReporting]  = useState(false);

  // History export
  const [history,    setHistory]    = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    setForm({ name: loggedInUser.name || '', nick: loggedInUser.nick || '', phone: loggedInUser.phone || '', email: loggedInUser.email || '', pwd: '' });
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) { alert.error('กรุณากรอกชื่อ'); return; }
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setSaving(true);
    try {
      const res: any = await utilsApi.saveStudentProfile({ uid: loggedInUser.id, ...form });
      if (res.success) {
        setUser({ ...loggedInUser, name: form.name, nick: form.nick, phone: form.phone, email: form.email });
        alert.success('บันทึกข้อมูลส่วนตัวเรียบร้อย');
      } else alert.error(res.msg);
    } catch { alert.error('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  const handleReport = async () => {
    if (!reportForm.msg.trim()) { alert.error('กรุณาอธิบายปัญหาของคุณ'); return; }
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setReporting(true);
    try {
      const res: any = await utilsApi.reportIssue({
        uid: loggedInUser.id,
        name: loggedInUser.name,
        type: reportForm.type,
        msg: reportForm.msg,
        contact: reportForm.contact,
      });
      if (res.success) {
        alert.success('ส่งเรื่องร้องเรียนสำเร็จ ขอบคุณสำหรับข้อมูลครับ!');
        setReportForm({ type: ISSUE_TYPES[0], msg: '', contact: '' });
        setActiveSheet('none');
      } else alert.error(res.msg);
    } catch { alert.error('เกิดข้อผิดพลาด'); }
    setReporting(false);
  };

  const handleLoadHistory = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setLoadingHist(true);
    try {
      const res: any = await utilsApi.exportHistory(loggedInUser.id);
      if (res.success) setHistory(res.data || []);
    } catch {}
    setLoadingHist(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    alert.success(theme === 'dark' ? 'เปิดโหมดสว่าง' : 'เปิดโหมดกลางคืน');
  };

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return <PremiumLoading text="กำลังโหลดโปรไฟล์..." subtext="กรุณารอสักครู่..." />;
  }

  const roleLabel: Record<string, string> = { Student: 'นักเรียน/นักศึกษา', Merchant: 'ผู้ประกอบการร้านอาหาร', Admin: 'ผู้ดูแลระบบส่วนกลาง' };
  const roleColor: Record<string, string> = { Student: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400', Merchant: 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400', Admin: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' };

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Curved Top emerald header */}
      <div className="bg-gradient-to-b from-[#36c990] to-[#006837] text-white px-5 pt-8 pb-[50px] rounded-b-[24px] shadow-[0_4px_15px_rgba(0,104,55,0.2)]">
        <h1 className="text-lg font-extrabold tracking-wide">จัดการบัญชีผู้ใช้</h1>
      </div>

      <div className="px-4 -mt-8 space-y-4 max-w-2xl mx-auto">
        
        {/* Avatar Display Card */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-xs p-6 text-center border border-gray-100/60 dark:border-gray-800">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#006837] to-[#36c990] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <User size={30} className="text-white" />
          </div>
          <h2 className="font-extrabold text-base text-gray-800 dark:text-gray-200 leading-tight">{currentUser.name}</h2>
          <p className="text-gray-400 text-xs mt-1">รหัสประจำตัว: {currentUser.id}</p>
          <span className={`mt-2.5 inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${roleColor[currentUser.role]}`}>
            {roleLabel[currentUser.role]}
          </span>
        </div>

        {/* Accessibility & Theme Settings Card */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-5 border border-gray-100/60 dark:border-gray-800">
          <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-4">⚙️ การตั้งค่าระบบและการเข้าถึง</h3>
          <div className="space-y-4">
            
            {/* Theme Toggle switch */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#006837] flex items-center justify-center">
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">โหมดกลางคืน (Dark Mode)</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${
                  theme === 'dark' ? 'bg-[#00a568]' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 ${
                  theme === 'dark' ? 'translate-x-5.5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Font Sizer Selector */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#006837] flex items-center justify-center">
                  <Type size={16} />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">ขนาดตัวอักษรของแอป</span>
              </div>
              <select 
                value={fontSize} 
                onChange={(e) => setFontSize(e.target.value as 'sm'|'md'|'lg')}
                className="text-xs font-extrabold text-gray-700 dark:text-gray-300 bg-gray-55 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="sm">เล็ก (Compact)</option>
                <option value="md">ปกติ (Standard)</option>
                <option value="lg">ใหญ่ (Large)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Edit User Information form */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-5 border border-gray-100/60 dark:border-gray-800">
          <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-4">✏️ แก้ไขข้อมูลส่วนบุคคล</h3>
          <div className="space-y-3.5">
            {[
              { k:'name',  label:'ชื่อ-นามสกุล', type:'text',  ph:'กรอกชื่อจริงของคุณ' },
              { k:'nick',  label:'ชื่อเล่น / ชื่อเรียกสำหรับตั๋วออเดอร์', type:'text',  ph:'ระบุชื่อเล่น' },
              { k:'phone', label:'หมายเลขเบอร์โทรศัพท์ติดต่อ', type:'tel',   ph:'08x-xxx-xxxx' },
              { k:'email', label:'ที่อยู่อีเมลเพื่อแจ้งเตือนระบบ', type:'email', ph:'student@example.com' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
                <input type={type} value={(form as any)[k]} onChange={e => setForm({...form, [k]: e.target.value})}
                  placeholder={ph}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#006837]/35 focus:border-[#006837] dark:text-gray-200" />
              </div>
            ))}
            
            <div className="relative">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">รหัสผ่านบัญชีใหม่ (เว้นว่างไว้เพื่อคงเดิม)</label>
              <input type={showPwd ? 'text' : 'password'} value={form.pwd}
                onChange={e => setForm({...form, pwd: e.target.value})}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#006837]/35 focus:border-[#006837] dark:text-gray-200" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-8.5 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex items-center justify-center gap-2 mt-4 text-xs">
              <Save size={16} /> {saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกแก้ไขข้อมูล'}
            </button>
          </div>
        </div>

        {/* Extra operational sheets link */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs overflow-hidden border border-gray-100/60 dark:border-gray-800">
          {[
            { icon: AlertTriangle, label: 'แจ้งเรื่องร้องเรียน / ปัญหา', sub: 'แจ้งออเดอร์ตกหล่น ปัญหาการชำระเงิน หรือข้อปรับปรุงระบบ', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400', action: () => setActiveSheet('report') },
            { icon: Download,      label: 'สถิติการสั่งซื้อย้อนหลัง', sub: 'ตรวจสอบและดาวน์โหลดประวัติออเดอร์และใบเสร็จเก่า', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',   action: () => { setActiveSheet('history'); handleLoadHistory(); } },
          ].map(({ icon: Icon, label, sub, color, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-55 dark:hover:bg-gray-900 transition border-b border-gray-100 dark:border-gray-800 last:border-0 text-left">
              <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-xs text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate font-semibold">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>

        <button onClick={() => {
          alert.confirm('ยืนยันออกจากระบบ', 'คุณต้องการออกจากระบบ canteen ใช่หรือไม่?', () => {
            logout();
            router.replace('/login');
          });
        }}
          className="w-full bg-white dark:bg-[#1e1e1e] border border-red-200 dark:border-red-955/60 text-red-500 py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-red-55 dark:hover:bg-red-955/25 active:scale-95 transition-all shadow-xs duration-200 cursor-pointer">
          <LogOut size={16} /> ออกจากระบบ canteen
        </button>
      </div>

      <BottomNav />

      {/* REPORT ISSUE SHEET */}
      {activeSheet === 'report' && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setActiveSheet('none')} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-gray-150 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" /> แจ้งปัญหาหรือร้องเรียน
              </h3>
              <button onClick={() => setActiveSheet('none')} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 block">หมวดหมู่ปัญหาหลัก</label>
                <div className="grid grid-cols-2 gap-2">
                  {ISSUE_TYPES.map(t => (
                    <button key={t} onClick={() => setReportForm({ ...reportForm, type: t })}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-extrabold transition-all text-left ${
                        reportForm.type === t 
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400' 
                          : 'border-gray-200 dark:border-gray-800 text-gray-550'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">รายละเอียดปัญหาที่คุณพบ *</label>
                <textarea value={reportForm.msg} onChange={e => setReportForm({ ...reportForm, msg: e.target.value })}
                  placeholder="เขียนอธิบายลำดับเหตุการณ์หรือรายละเอียดของปัญหา เช่น เลขที่ออเดอร์, จำนวนเงินที่ผิดพลาด หรือชื่อเมนู..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-250 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-amber-400/20 resize-none dark:text-gray-200"
                  rows={4} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1 block">หมายเลขช่องทางการติดต่อกลับ</label>
                <input type="text" value={reportForm.contact} onChange={e => setReportForm({ ...reportForm, contact: e.target.value })}
                  placeholder="เบอร์โทรศัพท์ หรือ LINE ID สำหรับเจ้าหน้าที่ติดต่อกลับ..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-250 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-amber-400/20 dark:text-gray-200" />
              </div>
              <button onClick={handleReport} disabled={reporting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-xl shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 text-xs cursor-pointer">
                {reporting ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> ยืนยันส่งรายละเอียดปัญหา</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY SHEET */}
      {activeSheet === 'history' && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setActiveSheet('none')} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-150 dark:border-gray-800 shrink-0">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-gray-150 flex items-center gap-2">
                <FileText size={20} className="text-blue-500" /> ประวัติการสั่งซื้ออาหารย้อนหลัง
              </h3>
              <button onClick={() => setActiveSheet('none')} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-550">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingHist ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  </div>
                ))
              ) : history.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-extrabold text-xs uppercase tracking-wider text-gray-400">ไม่มีข้อมูลใบสั่งอาหารในประวัติ</p>
                </div>
              ) : history.map((o: any) => {
                const statusColor: Record<string,string> = {
                  Waiting:'badge-waiting', Cooking:'badge-cooking',
                  Ready:'badge-ready', Completed:'badge-completed', Cancelled:'badge-cancelled'
                };
                const statusLabel: Record<string,string> = {
                  Waiting:'รอรับออเดอร์', Cooking:'กำลังปรุง', Ready:'ปรุงเสร็จ', Completed:'สำเร็จ', Cancelled:'ยกเลิก'
                };
                const items = Array.isArray(o.items) ? o.items : [];
                return (
                  <div key={o.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-extrabold text-xs text-gray-800 dark:text-gray-250">{o.shop_name}</p>
                        <p className="text-[9px] text-gray-400 font-extrabold mt-0.5 uppercase tracking-wide">#{o.id.slice(-6)} • {o.created_at ? new Date(o.created_at).toLocaleDateString('th-TH') : ''}</p>
                      </div>
                      <span className={`${statusColor[o.status] || 'badge-completed'}`}>
                        {statusLabel[o.status] || o.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-2 leading-relaxed">
                      📋 {items.map((i: any) => `${i.name} (${i.qty})`).join(', ')}
                    </p>
                    <p className="font-black text-sm text-[#006837] dark:text-[#00a568]">{Number(o.total).toLocaleString()} ฿</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
