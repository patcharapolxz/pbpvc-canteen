'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { shopsApi, utilsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
import { Camera, Save, LogOut, Eye, EyeOff, Clock, ToggleLeft, ToggleRight, Moon, Sun, Type, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MerchantProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, theme, setTheme, fontSize, setFontSize } = useAppStore();
  const [form, setForm] = useState({
    uid:'', pwd:'', name:'', nick:'', email:'',
    shopName:'', open:'', close:'', status:'Open', img:''
  });
  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Merchant') { router.replace('/login'); return; }
    shopsApi.profile(loggedInUser.id).then((r: any) => {
      if (r.success) {
        const d = r.data;
        setForm({ uid: loggedInUser.id, pwd: d.pwd||'', name: d.name||'', nick: d.nick||'', email: d.email||'',
          shopName: d.shopName||'', open: d.open||'', close: d.close||'', status: d.status||'Open', img: d.img||'' });
        setImgPreview(d.img || '');
      }
    });
  }, []);

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setSaving(true);
    try {
      let imgUrl = form.img;
      if (imgFile) imgUrl = await utilsApi.uploadImage(imgFile, 'shop');
      const res: any = await shopsApi.saveProfile({ ...form, img: imgUrl });
      if (res.success) {
        setUser({ ...loggedInUser, name: form.name, nick: form.nick, shop: form.shopName, email: form.email });
        toast.success('บันทึกการตั้งค่าร้านค้าเรียบร้อย');
      } else toast.error(res.msg);
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    toast.success(theme === 'dark' ? 'เปิดโหมดสว่าง' : 'เปิดโหมดกลางคืน');
  };

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return <PremiumLoading text="กำลังโหลดการตั้งค่า..." subtext="กรุณารอสักครู่..." />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Curved Header */}
      <div className="bg-gradient-to-b from-[#36c990] to-[#006837] text-white px-5 pt-8 pb-[50px] rounded-b-[24px] shadow-[0_4px_15px_rgba(0,104,55,0.2)]">
        <h1 className="text-lg font-extrabold tracking-wide">จัดการและตั้งค่าร้านค้า</h1>
        <p className="text-white/80 text-[11px] font-bold mt-0.5 uppercase tracking-wider">{form.shopName || currentUser.shop || 'ร้านค้า Canteen'}</p>
      </div>

      <div className="px-4 -mt-8 space-y-4 max-w-2xl mx-auto">
        
        {/* Shop Image Header Card */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-xs p-5 border border-gray-100/60 dark:border-gray-800">
          <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-3">🖼️ ภาพป้ายหน้าร้านอาหาร</h3>
          <label className="block cursor-pointer">
            <div className="w-full h-44 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-250 dark:border-gray-800 overflow-hidden flex items-center justify-center relative hover:opacity-95 transition-opacity">
              {imgPreview ? (
                <img src={imgPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400">
                  <Camera size={32} className="mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs font-bold">แตะเพื่ออัปโหลดรูปร้านค้า</p>
                </div>
              )}
              <div className="absolute bottom-3 right-3 bg-gradient-to-tr from-[#006837] to-[#00a568] text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-md">
                <Camera size={16} />
              </div>
            </div>
            <input type="file" accept="image/*" onChange={handleImgChange} className="hidden" />
          </label>
        </div>

        {/* Accessibility settings */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-5 border border-gray-100/60 dark:border-gray-800">
          <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-4">⚙️ การตั้งค่าระบบและการเข้าถึง</h3>
          <div className="space-y-4">
            
            {/* Theme Toggle Switch */}
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
                className="text-xs font-extrabold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-255 dark:border-gray-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="sm">เล็ก (Compact)</option>
                <option value="md">ปกติ (Standard)</option>
                <option value="lg">ใหญ่ (Large)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Operating status & hours */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-5 border border-gray-100/60 dark:border-gray-800 space-y-4">
          <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2"><Clock size={15} /> เวลาทำการ & สถานะเปิดปิดแผงร้าน</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1.5 block">เวลาเปิดจำหน่ายอาหาร</label>
              <input type="time" value={form.open} onChange={e => setForm({...form, open: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#006837]/35 focus:border-[#006837] dark:text-gray-250 font-bold" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1.5 block">เวลาปิดจำหน่ายอาหาร</label>
              <input type="time" value={form.close} onChange={e => setForm({...form, close: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#006837]/35 focus:border-[#006837] dark:text-gray-250 font-bold" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-2 block">สถานะร้านอาหารปัจจุบัน</label>
            <div className="flex gap-3">
              {['Open','Closed'].map(s => (
                <button key={s} onClick={() => setForm({...form, status: s})}
                  className={`flex-1 py-3 rounded-xl border-2 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    form.status === s
                      ? s === 'Open' 
                        ? 'border-[#006837] bg-green-50 text-[#006837] dark:bg-green-950/20 dark:text-green-400' 
                        : 'border-red-400 bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400'
                      : 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {s === 'Open' ? <><ToggleRight size={18} /> ร้านกำลังเปิดจำหน่าย</> : <><ToggleLeft size={18} /> ปิดหน้าร้านชั่วคราว</>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shop & Merchant Details info */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-5 border border-gray-100/60 dark:border-gray-800 space-y-3.5">
          <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-2">👤 รายละเอียดผู้ใช้และบัญชีร้าน</h3>
          
          {[
            { k:'name', label:'ชื่อจริงผู้จัดการร้านอาหาร', type:'text' },
            { k:'nick', label:'ชื่อเล่น', type:'text' },
            { k:'email', label:'ที่อยู่อีเมลติดต่อร้านค้า', type:'email' },
            { k:'shopName', label:'ชื่อแผงร้านค้าอย่างเป็นทางการ', type:'text' },
          ].map(({ k, label, type }) => (
            <div key={k}>
              <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1 block">{label}</label>
              <input type={type} value={(form as any)[k]}
                onChange={e => setForm({...form, [k]: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#006837]/35 dark:text-gray-200" />
            </div>
          ))}

          <div className="relative">
            <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1 block">รหัสผ่านใหม่ (เว้นว่างไว้เพื่อคงเดิม)</label>
            <input type={showPwd ? 'text' : 'password'} value={form.pwd}
              onChange={e => setForm({...form, pwd: e.target.value})}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#006837]/35 dark:text-gray-200" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-8 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit and Signout buttons */}
        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex items-center justify-center gap-2 text-xs">
          <Save size={16} /> {saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าร้านค้าทั้งหมด'}
        </button>

        <button onClick={() => { logout(); router.replace('/login'); }}
          className="w-full bg-white dark:bg-[#1e1e1e] border-2 border-red-200 dark:border-red-950 text-red-500 py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all shadow-xs duration-200">
          <LogOut size={16} /> ออกจากระบบ canteen
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
