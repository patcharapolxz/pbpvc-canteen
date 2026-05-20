'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { utilsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, User, Save, LogOut, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useAppStore();
  const [form,    setForm]    = useState({ name:'', nick:'', phone:'', email:'', pwd:'' });
  const [saving,  setSaving]  = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    setForm({ name: loggedInUser.name, nick: loggedInUser.nick, phone: loggedInUser.phone, email: loggedInUser.email, pwd: '' });
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('กรุณากรอกชื่อ'); return; }
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setSaving(true);
    try {
      const res: any = await utilsApi.saveStudentProfile({ uid: loggedInUser.id, ...form });
      if (res.success) {
        setUser({ ...loggedInUser, name: form.name, nick: form.nick, phone: form.phone, email: form.email });
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

  const roleLabel: Record<string, string> = { Student: 'นักเรียน', Merchant: 'แม่ค้า', Admin: 'ผู้ดูแล' };
  const roleColor: Record<string, string> = { Student: 'bg-blue-100 text-blue-600', Merchant: 'bg-green-100 text-green-600', Admin: 'bg-red-100 text-red-600' };

  return (
    <div className="min-h-screen bg-[#f4f7f9] pb-nav">
      <div className="bg-[#006837] text-white px-5 pt-10 pb-[60px] rounded-b-[25px] shadow-[0_4px_15px_rgba(0,104,55,0.2)]">
        <h1 className="text-xl font-bold">โปรไฟล์</h1>
      </div>

      <div className="px-4 -mt-8">
        {/* Avatar card */}
        <div className="bg-white rounded-3xl shadow-(--card-shadow) p-6 text-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#006837] to-[#36c990] flex items-center justify-center mx-auto mb-3">
            <User size={36} className="text-white" />
          </div>
          <h2 className="font-bold text-lg text-gray-800">{currentUser.name}</h2>
          <p className="text-gray-400 text-sm">{currentUser.id}</p>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleColor[currentUser.role]}`}>
            {roleLabel[currentUser.role]}
          </span>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl shadow-(--card-shadow) p-5 mb-4">
          <h3 className="font-bold text-gray-800 mb-4">แก้ไขข้อมูล</h3>
          <div className="space-y-3">
            {[
              { k:'name',  label:'ชื่อ-นามสกุล', type:'text',  ph:'' },
              { k:'nick',  label:'ชื่อเล่น',       type:'text',  ph:'' },
              { k:'phone', label:'เบอร์โทร',       type:'tel',   ph:'08x-xxx-xxxx' },
              { k:'email', label:'อีเมล',          type:'email', ph:'' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
                <input type={type} value={(form as any)[k]} onChange={e => setForm({...form, [k]: e.target.value})}
                  placeholder={ph}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#006837]/30 focus:border-[#006837]" />
              </div>
            ))}
            <div className="relative">
              <label className="text-sm font-medium text-gray-600 mb-1 block">รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label>
              <input type={showPwd ? 'text' : 'password'} value={form.pwd}
                onChange={e => setForm({...form, pwd: e.target.value})}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#006837]/30" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-9 text-gray-400">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex items-center justify-center gap-2 mt-2">
              <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </div>

        <button onClick={() => { logout(); router.replace('/login'); }}
          className="w-full bg-white border-2 border-red-200 text-red-500 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2">
          <LogOut size={18} /> ออกจากระบบ
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
