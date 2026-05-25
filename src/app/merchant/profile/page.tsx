'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { shopsApi, utilsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Camera, Save, LogOut, Eye, EyeOff, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MerchantProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useAppStore();
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
        toast.success('บันทึกข้อมูลแล้ว');
      } else toast.error(res.msg);
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

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
      <div className="bg-[#006837] text-white px-5 pt-10 pb-[60px] rounded-b-[25px] shadow-[0_4px_15px_rgba(0,104,55,0.2)]">
        <h1 className="text-xl font-bold">ตั้งค่าร้านค้า</h1>
        <p className="text-white/70 text-sm">{currentUser.shop}</p>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Shop image */}
        <div className="bg-white rounded-2xl shadow-(--card-shadow) p-5">
          <h3 className="font-bold text-gray-800 mb-3">รูปร้านค้า</h3>
          <label className="block cursor-pointer">
            <div className="w-full h-40 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center relative">
              {imgPreview
                ? <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                : <div className="text-center text-gray-400"><Camera size={32} className="mx-auto mb-1" /><p className="text-sm">แตะเพื่อเลือกรูป</p></div>
              }
              <div className="absolute bottom-3 right-3 bg-[#006837] text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg">
                <Camera size={16} />
              </div>
            </div>
            <input type="file" accept="image/*" onChange={handleImgChange} className="hidden" />
          </label>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-2xl shadow-(--card-shadow) p-5 space-y-3">
          <h3 className="font-bold text-gray-800 mb-1">ข้อมูลส่วนตัว</h3>
          {[
            { k:'name', label:'ชื่อ-นามสกุล', type:'text' },
            { k:'nick', label:'ชื่อเล่น',       type:'text' },
            { k:'email', label:'อีเมล',         type:'email' },
            { k:'shopName', label:'ชื่อร้านค้า', type:'text' },
          ].map(({ k, label, type }) => (
            <div key={k}>
              <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
              <input type={type} value={(form as any)[k]}
                onChange={e => setForm({...form, [k]: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#006837]/30" />
            </div>
          ))}
          <div className="relative">
            <label className="text-sm font-medium text-gray-600 mb-1 block">รหัสผ่านใหม่</label>
            <input type={showPwd ? 'text' : 'password'} value={form.pwd}
              onChange={e => setForm({...form, pwd: e.target.value})}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#006837]/30" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-9 text-gray-400">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Shop hours */}
        <div className="bg-white rounded-2xl shadow-(--card-shadow) p-5 space-y-3">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Clock size={16} />เวลาเปิด-ปิดร้าน</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">เวลาเปิด</label>
              <input type="time" value={form.open} onChange={e => setForm({...form, open: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#006837]/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">เวลาปิด</label>
              <input type="time" value={form.close} onChange={e => setForm({...form, close: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#006837]/30" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">สถานะร้าน</label>
            <div className="flex gap-2">
              {['Open','Closed'].map(s => (
                <button key={s} onClick={() => setForm({...form, status: s})}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    form.status === s
                      ? s === 'Open' ? 'border-[#006837] bg-green-50 text-[#006837]' : 'border-red-400 bg-red-50 text-red-500'
                      : 'border-gray-200 text-gray-400'}`}>
                  {s === 'Open' ? <><ToggleRight size={18} />เปิด</> : <><ToggleLeft size={18} />ปิด</>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex items-center justify-center gap-2">
          <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลทั้งหมด'}
        </button>

        <button onClick={() => { logout(); router.replace('/login'); }}
          className="w-full bg-white border-2 border-red-200 text-red-500 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2">
          <LogOut size={18} /> ออกจากระบบ
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
