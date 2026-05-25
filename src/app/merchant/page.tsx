'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { menuApi, shopsApi, utilsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Camera, Sparkles, ChefHat } from 'lucide-react';
import { alert } from '@/lib/alert';

interface MenuItem { id: string; name: string; price: number; cat: string; img: string; status: string; options: any[]; recommend: boolean; }

const CATS = ['Food','Noodle','Drink','Snack','Dessert','Fruit','Other'];
const CATS_TH: Record<string, string> = {
  Food: 'อาหารจานเดียว / กับข้าว',
  Noodle: 'เมนูก๋วยเตี๋ยว / เส้น',
  Drink: 'เครื่องดื่ม / ชากาแฟ',
  Snack: 'ของทานเล่น / ของทอด',
  Dessert: 'ขนมหวาน / เบเกอรี่',
  Fruit: 'ผลไม้สด',
  Other: 'อื่นๆ'
};

export default function MerchantPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [menu,    setMenu]    = useState<MenuItem[]>([]);
  const [isOpen,  setIsOpen]  = useState(true);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<Partial<MenuItem> | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Merchant') { router.replace('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setLoading(true);
    try {
      const [menuRes, statusRes]: any[] = await Promise.all([
        menuApi.get(loggedInUser.shop),
        shopsApi.profile(loggedInUser.id),
      ]);
      if (menuRes.success) setMenu(menuRes.data);
      if (statusRes.success) setIsOpen(statusRes.data.shop_status !== 'Closed');
    } catch {}
    setLoading(false);
  };

  const toggleOpen = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    const next = !isOpen;
    const res: any = await shopsApi.toggleStatus(loggedInUser.id, next);
    if (res.success) { 
      setIsOpen(next); 
      alert.success(next ? 'เปิดหน้าร้านจำหน่ายอาหารแล้ว' : 'ปิดหน้าร้านชั่วคราวแล้ว'); 
    }
  };

  const openNew = () => {
    setModal({ name:'', price: 0, cat:'Food', status:'Available', options:[], recommend:false, img:'' });
    setImgFile(null); setImgPreview('');
  };

  const openEdit = (item: MenuItem) => {
    setModal({ ...item });
    setImgPreview(item.img || '');
    setImgFile(null);
  };

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!modal?.name?.trim()) { alert.error('กรุณาระบุชื่อเมนูอาหาร'); return; }
    if (!modal.price || modal.price <= 0) { alert.error('กรุณาระบุราคาขายที่ถูกต้อง'); return; }
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setSaving(true);
    try {
      let imgUrl = modal.img || '';
      if (imgFile) imgUrl = await utilsApi.uploadImage(imgFile, 'food');
      const res: any = await menuApi.save({ ...modal, img: imgUrl, shop: loggedInUser.shop });
      if (res.success) { 
        alert.success('บันทึกเมนูอาหารสำเร็จ'); 
        setModal(null); 
        loadData(); 
      } else {
        alert.error(res.msg);
      }
    } catch { alert.error('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    alert.confirm('ยืนยันลบเมนูอาหาร', 'คุณต้องการลบเมนูอาหารรายการนี้ออกจากระบบหรือไม่?', async () => {
      const res: any = await menuApi.delete(id);
      if (res.success) { 
        alert.success('ลบเมนูสำเร็จ'); 
        loadData(); 
      }
    });
  };

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return <PremiumLoading text="กำลังโหลดร้านค้า..." subtext="กรุณารอสักครู่..." />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Curved Emerald Header */}
      <div className="bg-gradient-to-b from-[#36c990] to-[#006837] text-white px-5 pt-8 pb-[50px] rounded-b-[24px] shadow-[0_4px_15px_rgba(0,104,55,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold leading-tight tracking-wide">{currentUser.shop || 'ร้านค้า Canteen'}</h1>
            <p className="text-white/80 text-[11px] font-bold mt-0.5 uppercase tracking-wider">แผงควบคุมการจัดการเมนูอาหาร</p>
          </div>
          
          <button onClick={toggleOpen}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold text-xs border transition-all cursor-pointer ${
              isOpen 
                ? 'border-white/40 bg-white/10 text-white hover:bg-white/20' 
                : 'border-red-400 bg-red-500/20 text-red-100 hover:bg-red-500/30'
            }`}
          >
            {isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {isOpen ? 'เปิดจำหน่าย' : 'ปิดหน้าร้าน'}
          </button>
        </div>
      </div>

      {/* Floating Action Menu Management Bar */}
      <div className="px-4 -mt-8 relative z-10 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-2 px-4.5 shadow-xs flex justify-between items-center border border-gray-100/60 dark:border-gray-800">
          <div className="font-extrabold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">จัดการรายการสินค้าในร้าน</div>
          <button onClick={openNew}
            className="bg-gradient-to-r from-[#006837] to-[#00a568] hover:bg-[#008a47] text-white py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} strokeWidth={3} /> เพิ่มเมนูอาหารใหม่
          </button>
        </div>
      </div>

      {/* Menu list */}
      <div className="px-4 mt-5 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          Array.from({length:4}).map((_,i) => (
            <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 flex gap-3 animate-pulse border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : menu.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-150/40 dark:border-gray-800 shadow-sm">
            <ChefHat size={48} className="mx-auto mb-3 opacity-20 text-gray-400" />
            <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wide">ยังไม่มีเมนูอาหาร กดปุ่ม "เพิ่มเมนูอาหารใหม่" เพื่อเพิ่มสินค้า</p>
          </div>
        ) : menu.map(item => (
          <div key={item.id}
            className={`bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs flex items-center gap-3.5 p-4 border border-gray-100/60 dark:border-gray-800/80 transition-opacity duration-200 ${item.status==='Hidden'?'opacity-50':''}`}
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 shrink-0 border border-gray-100/60 dark:border-gray-800/60 relative">
              {item.img ? (
                <Image 
                  src={item.img} 
                  alt={item.name} 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-55 dark:bg-gray-900">🍽️</div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-extrabold text-xs text-gray-800 dark:text-gray-200 truncate leading-snug">{item.name}</p>
                {item.recommend && (
                  <span className="text-[9px] bg-amber-50 text-amber-500 border border-amber-200/50 px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-0.5 shadow-xs">
                    <Sparkles size={8} className="fill-amber-400 text-amber-400" /> แนะนำ
                  </span>
                )}
              </div>
              <p className="text-[#00a568] font-black text-sm mt-1">{item.price.toLocaleString()} ฿</p>
              
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                  {CATS_TH[item.cat] || item.cat}
                </span>
                <span className="w-1.5 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                  item.status === 'Available' 
                    ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400' 
                    : item.status === 'Soldout' 
                      ? 'bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400' 
                      : 'bg-gray-100 text-gray-450 dark:bg-gray-900 dark:text-gray-500'
                }`}>
                  {item.status==='Available'?'มีสินค้าจำหน่าย':item.status==='Soldout'?'วัตถุดิบหมด':'ซ่อนสินค้าไว้'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(item)} className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 duration-100 transition-all">
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 duration-100 transition-all">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Modifying Modal Bottom Sheet */}
      {modal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setModal(null)} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-[28px] w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border-t border-white/10">
            
            <div className="px-5 py-4 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-gray-150">{modal.id ? '✏️ แก้ไขข้อมูลเมนูอาหาร' : '➕ เพิ่มเมนูอาหารรายการใหม่'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              
              {/* Image Input field */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">อัปโหลดรูปภาพตัวอย่างอาหาร</label>
                <label className="block cursor-pointer">
                  <div className="w-full h-40 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-250 dark:border-gray-800 overflow-hidden flex items-center justify-center relative hover:opacity-95 transition-opacity">
                    {imgPreview ? (
                      <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera size={28} className="mx-auto mb-1 opacity-60" />
                        <p className="text-[10px] font-bold">แตะเพื่ออัปโหลดไฟล์ภาพ</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImgChange} className="hidden" />
                </label>
              </div>

              {[
                { key:'name',  label:'ชื่อรายการเมนูอาหาร *', type:'text',   ph:'เช่น ข้าวกะเพราหมูสับไข่ดาว' },
                { key:'price', label:'ราคาขายหน่วยเป็นบาท *',  type:'number', ph:'40' },
              ].map(({key, label, type, ph}) => (
                <div key={key}>
                  <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1 block">{label}</label>
                  <input type={type} value={(modal as any)[key]} onChange={e => setModal({...modal, [key]: type==='number'?Number(e.target.value):e.target.value})}
                    placeholder={ph}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#006837]/35 dark:text-gray-200" />
                </div>
              ))}
              
              <div>
                <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1.5 block">หมวดหมู่รายการอาหาร</label>
                <select value={modal.cat} onChange={e => setModal({...modal, cat: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none dark:text-gray-200 font-bold"
                >
                  {CATS.map(c => <option key={c} value={c}>{CATS_TH[c] || c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1.5 block">สถานะสต็อกสินค้า</label>
                <select value={modal.status} onChange={e => setModal({...modal, status: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none dark:text-gray-200 font-bold"
                >
                  <option value="Available">มีวัตถุดิบจำหน่าย (Available)</option>
                  <option value="Soldout">ของหมดชั่วคราว (Sold Out)</option>
                  <option value="Hidden">ปิดการมองเห็น / ซ่อนรายการ (Hidden)</option>
                </select>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer py-1.5">
                <input type="checkbox" checked={modal.recommend} onChange={e => setModal({...modal, recommend: e.target.checked})}
                  className="w-5 h-5 accent-[#006837] dark:accent-[#00a568]" />
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">⭐ ตั้งค่าให้แสดงเป็นเมนูแนะนำร้านค้า</span>
              </label>

            </div>

            {/* Confirm buttons */}
            <div className="p-4 border-t border-gray-150 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] shrink-0 pb-safe">
              <button onClick={handleSave} disabled={saving} 
                className="w-full bg-gradient-to-r from-[#006837] to-[#00a568] hover:bg-[#008a47] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-[0_6px_15px_rgba(0,104,55,0.25)] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                {saving ? <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'บันทึกรายการเมนู'}
              </button>
            </div>

          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
