'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, UserPlus, KeyRound } from 'lucide-react';
import Image from 'next/image';

type Tab = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const router  = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [tab, setTab]       = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const user = getPersistedUser();
    if (user) {
      const role = user.role;
      router.replace(role === 'Admin' ? '/admin' : role === 'Merchant' ? '/merchant' : '/shops');
    }
  }, []);

  // Forms
  const [loginForm, setLoginForm] = useState({ id: '', pwd: '' });
  const [regForm,   setRegForm]   = useState({ id: '', pwd: '', name: '', nick: '', phone: '', email: '' });
  const [forgotForm, setForgotForm] = useState({ id: '', phone: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.id || !loginForm.pwd) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', loginForm.id)
        .eq('password', loginForm.pwd)
        .single();

      if (data) {
        // Map DB columns → User interface (nickname→nick, shop_name→shop)
        setUser({
          id:    data.id,
          name:  data.name,
          nick:  data.nickname || '',
          phone: data.phone || '',
          role:  data.role,
          shop:  data.shop_name || '',
          email: data.email || '',
        });
        toast.success(`ยินดีต้อนรับ ${data.nickname || data.name}!`);
        const role = data.role;
        router.push(role === 'Admin' ? '/admin' : role === 'Merchant' ? '/merchant' : '/shops');
      } else {
        toast.error('ID หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.id || !regForm.pwd || !regForm.name) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    setLoading(true);
    try {
      // Check if user exists
      const { data: existingUser } = await supabase.from('users').select('id').eq('id', regForm.id).single();
      
      if (existingUser) {
        toast.error('รหัสนักเรียน/ผู้ใช้นี้ มีในระบบแล้ว');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('users').insert([{
        id: regForm.id,
        password: regForm.pwd,
        name: regForm.name,
        nickname: regForm.nick,
        phone: regForm.phone,
        email: regForm.email,
        role: 'Student'
      }]);

      if (!error) {
        toast.success('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        setTab('login');
      } else {
        toast.error('สมัครไม่สำเร็จ: ' + error.message);
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('password')
        .eq('id', forgotForm.id)
        .eq('phone', forgotForm.phone)
        .single();

      if (data) {
        toast.success(`รหัสผ่านของคุณคือ: ${data.password}`, { duration: 8000 });
        setTab('login');
      } else {
        toast.error('ไม่พบข้อมูลที่ตรงกัน');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden select-none">
      {/* Background Image with layered premium overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-out"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1565895405139-e188df996e0b?auto=format&fit=crop&w=1000&q=80')" }}
      />
      {/* Dark premium gradient overlay to make the card POP beautifully */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/20 via-black/35 to-black/50" />

      {/* Card with interactive hovering scale and glorious glassmorphism */}
      <div className="w-full max-w-[400px] z-10">
        <div className="bg-white/95 rounded-[32px] shadow-[0_20px_50px_rgba(0,104,55,0.12),0_10px_30px_rgba(0,0,0,0.08)] p-8 border border-white/60 backdrop-blur-xl animate__animated animate__zoomIn text-center hover:shadow-[0_25px_60px_rgba(0,104,55,0.16)] transition-all duration-500">
          
          {/* Circular School Logo with elegant layered pulse glow */}
          <div className="w-[96px] h-[96px] rounded-full bg-gradient-to-tr from-[#006837]/15 to-emerald-500/15 flex items-center justify-center mx-auto mb-5 p-1.5 shadow-[0_8px_30px_rgba(0,104,55,0.12)] hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-1 shadow-sm">
              <img 
                src="https://yt3.googleusercontent.com/XB0JxhuEvnPiHwnQvPBZYcLaOyBLG897mi9fo7Y_H19bs1-Fbt2s92L2AWEYgxjK7acnC54RZA=s900-c-k-c0x00ffffff-no-rj" 
                className="rounded-full w-full h-full object-cover" 
                alt="PBPVC Logo" 
              />
            </div>
          </div>

          {/* Heading with elegant typography */}
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">PBPVC Canteen</h1>
          <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mt-1">ระบบสั่งอาหารวิทยาลัย</p>

          {/* LOGIN TAB */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 mt-6 animate-slide-up">
              <div>
                <input
                  type="text"
                  value={loginForm.id}
                  onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                  placeholder="รหัสนักศึกษา / ร้านค้า"
                  className="w-full px-6 py-3.5 rounded-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006837]/10 focus:border-[#006837] transition-all duration-300 text-sm text-left placeholder-gray-400 text-gray-800 shadow-sm"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={loginForm.pwd}
                  onChange={(e) => setLoginForm({ ...loginForm, pwd: e.target.value })}
                  placeholder="รหัสผ่าน"
                  className="w-full px-6 py-3.5 rounded-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006837]/10 focus:border-[#006837] transition-all duration-300 text-sm text-left placeholder-gray-400 text-gray-800 shadow-sm"
                />
              </div>
              
              {/* Submit Button with elegant green gradient and hover lift */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#008a47] to-[#006837] hover:shadow-[0_8px_25px_rgba(0,104,55,0.3)] hover:-translate-y-[1px] active:scale-98 text-white font-extrabold transition-all duration-300 shadow-md text-sm mt-4 tracking-wide"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'เข้าสู่ระบบ'}
              </button>

              {/* Bottom links */}
              <div className="text-xs text-gray-400 font-bold mt-6 flex items-center justify-center gap-3">
                <button type="button" onClick={() => setTab('register')} className="text-[#006837] hover:text-[#004d28] hover:underline transition-colors">ลงทะเบียน</button>
                <span className="text-gray-200">|</span>
                <button type="button" onClick={() => setTab('forgot')} className="text-gray-400 hover:text-gray-600 hover:underline transition-colors">ลืมรหัสผ่าน</button>
              </div>
            </form>
          )}

          {/* REGISTER TAB */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 mt-6 animate-slide-up">
              {[
                { key: 'id',    placeholder: 'รหัสนักศึกษา',     type: 'text' },
                { key: 'name',  placeholder: 'ชื่อ-นามสกุล',      type: 'text' },
                { key: 'nick',  placeholder: 'ชื่อเล่น',             type: 'text' },
                { key: 'email', placeholder: 'อีเมล (เพื่อรับแจ้งเตือน)', type: 'email' },
                { key: 'phone', placeholder: 'เบอร์โทร',       type: 'tel' },
                { key: 'pwd',   placeholder: 'ตั้งรหัสผ่าน',          type: 'password' },
              ].map(({ key, placeholder, type }) => (
                <div key={key}>
                  <input
                    type={type}
                    value={regForm[key as keyof typeof regForm]}
                    onChange={(e) => setRegForm({ ...regForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-6 py-2.5 rounded-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006837]/10 focus:border-[#006837] transition-all duration-300 text-sm text-left placeholder-gray-400 text-gray-800 shadow-sm"
                  />
                </div>
              ))}
              
              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#008a47] to-[#006837] hover:shadow-[0_8px_25px_rgba(0,104,55,0.3)] hover:-translate-y-[1px] active:scale-98 text-white font-extrabold transition-all duration-300 shadow-md text-sm mt-4 tracking-wide"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'ยืนยันสมัคร'}
              </button>

              {/* Back button */}
              <div className="text-xs font-bold mt-5">
                <button type="button" onClick={() => setTab('login')} className="text-gray-400 hover:text-gray-600 hover:underline transition-colors">กลับ</button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD TAB */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4 mt-6 animate-slide-up">
              <h2 className="text-xl font-extrabold text-gray-700 tracking-tight mt-2">กู้คืนรหัสผ่าน</h2>
              <div>
                <input
                  type="text"
                  value={forgotForm.id}
                  onChange={(e) => setForgotForm({ ...forgotForm, id: e.target.value })}
                  placeholder="รหัสนักศึกษา"
                  className="w-full px-6 py-3.5 rounded-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006837]/10 focus:border-[#006837] transition-all duration-300 text-sm text-left placeholder-gray-400 text-gray-800 shadow-sm"
                />
              </div>
              <div>
                <input
                  type="tel"
                  value={forgotForm.phone}
                  onChange={(e) => setForgotForm({ ...forgotForm, phone: e.target.value })}
                  placeholder="เบอร์โทร"
                  className="w-full px-6 py-3.5 rounded-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006837]/10 focus:border-[#006837] transition-all duration-300 text-sm text-left placeholder-gray-400 text-gray-800 shadow-sm"
                />
              </div>

              {/* Submit Button (Gray premium gradient) */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#8e9aa8] to-[#707a89] hover:shadow-[0_8px_25px_rgba(112,122,137,0.25)] hover:-translate-y-[1px] active:scale-98 text-white font-extrabold transition-all duration-300 shadow-md text-sm mt-4 tracking-wide"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'ตรวจสอบ'}
              </button>

              {/* Back button */}
              <div className="text-xs font-bold mt-4">
                <button type="button" onClick={() => setTab('login')} className="text-gray-500 hover:underline">กลับ</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
