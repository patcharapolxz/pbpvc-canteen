import { supabase } from './supabase';

// Generic wrapper to match the old PHP API format
async function wrap<T>(promise: Promise<{ data: any; error: any }>, successMsg = 'Success', defaultData: any = null): Promise<{ success: boolean; data: T; msg: string }> {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return { success: true, data: data ?? defaultData, msg: successMsg };
  } catch (err: any) {
    return { success: false, data: defaultData, msg: err.message || 'Error' };
  }
}

// ─── HELPER: Send in-app notification ────────────────────────
async function sendNotification(userId: string, title: string, message: string) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, message }),
    });
  } catch { /* silent fail */ }
}

// ─── AUTH ────────────────────────────────────────────────────
export const authApi = {
  login: (id: string, pwd: string) =>
    wrap(supabase.from('users').select('*').eq('id', id).eq('password', pwd).single()),

  register: (form: any) =>
    wrap(supabase.from('users').insert([{ ...form, role: 'Student' }])),

  forgotPassword: (id: string, phone: string) =>
    wrap(supabase.from('users').select('password').eq('id', id).eq('phone', phone).single()),
};

// ─── SHOPS ───────────────────────────────────────────────────
export const shopsApi = {
  /** ดึงร้านค้าทั้งหมด พร้อม rating จาก reviews และสถานะเปิด/ปิดตามเวลา */
  list: async () => {
    try {
      const [usersRes, reviewsRes, menuRes] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'Merchant'),
        supabase.from('reviews').select('shop_name, rating'),
        supabase.from('menu').select('name, category, shop_name, status').neq('status', 'Hidden'),
      ]);

      if (usersRes.error) throw usersRes.error;

      // Build ratings map
      const ratings: Record<string, { total: number; count: number }> = {};
      (reviewsRes.data || []).forEach((r: any) => {
        if (!ratings[r.shop_name]) ratings[r.shop_name] = { total: 0, count: 0 };
        ratings[r.shop_name].total += r.rating;
        ratings[r.shop_name].count++;
      });

      // Build menus map for search
      const shopMenus: Record<string, string[]> = {};
      const shopCats: Record<string, Set<string>> = {};
      const catMap: Record<string, string> = {
        Food: 'ร้านข้าว', Rice: 'ร้านข้าว',
        Noodle: 'ร้านก๋วยเตี๋ยว',
        Drink: 'ร้านน้ำ', Beverage: 'ร้านน้ำ',
        Snack: 'ของทานเล่น',
        Dessert: 'ขนมหวาน', Sweet: 'ขนมหวาน',
        Fruit: 'ร้านผลไม้',
        Other: 'ทั่วไป',
      };
      (menuRes.data || []).forEach((m: any) => {
        if (!shopMenus[m.shop_name]) shopMenus[m.shop_name] = [];
        shopMenus[m.shop_name].push(m.name);
        if (m.category) {
          if (!shopCats[m.shop_name]) shopCats[m.shop_name] = new Set();
          shopCats[m.shop_name].add(catMap[m.category] || m.category);
        }
      });

      // Compute isOpen based on time
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const toMin = (t: string | null) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const shops = (usersRes.data || [])
        .filter((u: any) => u.shop_name)
        .map((u: any) => {
          const shopName = u.shop_name;
          const stats = ratings[shopName] || { total: 0, count: 0 };
          const avgRating = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : '0.0';

          const openMin = toMin(u.open_time);
          const closeMin = toMin(u.close_time);
          let isTimeOpen = true;
          if (openMin !== null && closeMin !== null) {
            if (openMin < closeMin) {
              if (nowMin < openMin || nowMin >= closeMin) isTimeOpen = false;
            } else {
              if (nowMin < openMin && nowMin >= closeMin) isTimeOpen = false;
            }
          }
          const isOpen = u.shop_status !== 'Closed' && isTimeOpen;

          const catSet = shopCats[shopName];
          const tags = catSet && catSet.size > 0 ? Array.from(catSet).join(' • ') : 'ทั่วไป';
          const menuSearch = (shopMenus[shopName] || []).join(' ');

          return {
            id: u.id,
            name: shopName,
            img: u.shop_image || '',
            rating: avgRating,
            reviews: stats.count,
            tags,
            menuSearch,
            isOpen,
          };
        });

      return { success: true, data: shops, msg: 'OK' };
    } catch (e: any) {
      return { success: false, data: [], msg: e.message };
    }
  },

  profile: (uid: string) =>
    wrap(supabase.from('users').select('*').eq('id', uid).single()),

  toggleStatus: (uid: string, isOpen: boolean) =>
    wrap(supabase.from('users').update({ shop_status: isOpen ? 'Open' : 'Closed' }).eq('id', uid)),

  saveConfig: (uid: string, open: string, close: string) =>
    wrap(supabase.from('users').update({ open_time: open || null, close_time: close || null }).eq('id', uid)),

  saveProfile: (form: any) => {
    const payload: any = {
      password:   form.pwd,
      name:       form.name,
      nickname:   form.nick,
      email:      form.email,
      shop_name:  form.shopName,
      open_time:  form.open   || null,
      close_time: form.close  || null,
      shop_status: form.status || 'Open',
    };
    if (form.img && !form.img.startsWith('blob:')) payload.shop_image = form.img;
    return wrap(supabase.from('users').update(payload).eq('id', form.uid));
  },
};

// ─── MENU ────────────────────────────────────────────────────
export const menuApi = {
  get: (shop: string) =>
    wrap(supabase.from('menu').select('*').eq('shop_name', shop)),

  save: (item: any) => {
    const payload = {
      name:         item.name,
      price:        item.price,
      category:     item.cat,
      image:        item.img,
      status:       item.status || 'Available',
      shop_name:    item.shop,
      options:      item.options || [],
      is_recommend: item.recommend || false,
    };
    if (item.id) {
      return wrap(supabase.from('menu').update(payload).eq('id', item.id));
    } else {
      const id = 'M' + Date.now();
      return wrap(supabase.from('menu').insert([{ id, ...payload }]));
    }
  },

  delete: (id: string) =>
    wrap(supabase.from('menu').delete().eq('id', id)),
};

// ─── ORDERS ──────────────────────────────────────────────────
export const ordersApi = {
  get: async (role: string, userId: string) => {
    if (role === 'Student') {
      // Fetch orders and reviews separately to avoid missing Foreign Key relation error (400 Bad Request)
      const [ordersRes, reviewsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('reviews').select('order_id, rating, comment').eq('user_id', userId)
      ]);

      if (ordersRes.error) return { success: false, data: [], msg: ordersRes.error.message };

      const reviewsMap: Record<string, { rating: number; comment: string }> = {};
      (reviewsRes.data || []).forEach((r: any) => {
        reviewsMap[r.order_id] = { rating: r.rating, comment: r.comment };
      });

      const mapped = (ordersRes.data || []).map((o: any) => ({
        ...o,
        time: o.created_at ? new Date(o.created_at).toLocaleString('th-TH') : '',
        shop: o.shop_name,
        slip: o.slip_url,
        review: reviewsMap[o.id] || null,
      }));
      return { success: true, data: mapped, msg: 'OK' };
    } else if (role === 'Merchant') {
      const { data: user } = await supabase.from('users').select('shop_name').eq('id', userId).single();
      if (!user?.shop_name) return { success: false, data: [], msg: 'No shop name' };

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, users!orders_user_id_fkey(name, nickname, phone)')
        .eq('shop_name', user.shop_name)
        .order('created_at', { ascending: false });
      if (error) return { success: false, data: [], msg: error.message };

      const mapped = (orders || []).map((o: any) => ({
        ...o,
        time: o.created_at ? new Date(o.created_at).toLocaleString('th-TH') : '',
        shop: o.shop_name,
        slip: o.slip_url,
        custName:  o.users?.name || 'ไม่ระบุ',
        custNick:  o.users?.nickname || '-',
        custPhone: o.users?.phone || '-',
      }));
      return { success: true, data: mapped, msg: 'OK' };
    } else {
      // Admin: all orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, users!orders_user_id_fkey(name, nickname, phone)')
        .order('created_at', { ascending: false });
      if (error) return { success: false, data: [], msg: error.message };

      const mapped = (orders || []).map((o: any) => ({
        ...o,
        time: o.created_at ? new Date(o.created_at).toLocaleString('th-TH') : '',
        shop: o.shop_name,
        slip: o.slip_url,
        custName:  o.users?.name || 'ไม่ระบุ',
        custNick:  o.users?.nickname || '-',
        custPhone: o.users?.phone || '-',
      }));
      return { success: true, data: mapped, msg: 'OK' };
    }
  },

  place: async (data: any) => {
    const id = 'ORD' + Date.now();
    const payload = {
      id,
      user_id:   data.userId,
      items:     data.items,
      total:     data.total,
      note:      data.note || '',
      status:    'Waiting',
      slip_url:  data.slip || 'เงินสด',
      shop_name: data.shop,
    };

    const { error } = await supabase.from('orders').insert([payload]);
    if (error) return { success: false, data: null, msg: error.message };

    // Notify merchant
    try {
      const { data: merchantUser } = await supabase
        .from('users')
        .select('id')
        .eq('shop_name', data.shop)
        .eq('role', 'Merchant')
        .single();

      const itemsSummary = (data.items || []).map((i: any) => `${i.name} ×${i.qty}`).join(', ');
      const shortId = id.slice(-5);

      if (merchantUser?.id) {
        await sendNotification(
          merchantUser.id,
          `🔔 ออเดอร์ใหม่ #${shortId}`,
          `<p>มีออเดอร์ใหม่จากลูกค้า<br><strong>${itemsSummary}</strong><br>ยอด: <strong>${Number(data.total).toLocaleString()} ฿</strong>${data.note ? `<br>หมายเหตุ: ${data.note}` : ''}</p>`
        );
      }

      // Notify student
      await sendNotification(
        data.userId,
        `✅ สั่งซื้อสำเร็จ #${shortId}`,
        `<p>ออเดอร์ของคุณถูกส่งไปยังร้าน <strong>${data.shop}</strong> แล้ว<br>${itemsSummary}<br>ยอด: <strong>${Number(data.total).toLocaleString()} ฿</strong></p>`
      );
    } catch { /* silent */ }

    return { success: true, data: { orderId: id }, msg: 'OK' };
  },

  updateStatus: async (orderId: string, status: string) => {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('user_id, shop_name, status')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) return { success: false, data: null, msg: 'ไม่พบออเดอร์' };
    if (order.status === status) return { success: true, data: null, msg: 'Same status' };

    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) return { success: false, data: null, msg: error.message };

    // Send notification to student
    const shortId = orderId.slice(-5);
    const notifMap: Record<string, { title: string; msg: string }> = {
      Cooking:   { title: '🍳 ร้านรับออเดอร์แล้ว!', msg: `<p>ร้าน <strong>${order.shop_name}</strong> กำลังเตรียมอาหารออเดอร์ #${shortId}</p>` },
      Ready:     { title: '✅ อาหารพร้อมแล้ว!',     msg: `<p>เมนูจากร้าน <strong>${order.shop_name}</strong> ทำเสร็จแล้ว<br>กรุณามารับที่ร้านได้เลยครับ 🍽️</p>` },
      Completed: { title: '🎉 ออเดอร์สำเร็จ',        msg: `<p>ขอบคุณที่ใช้บริการร้าน <strong>${order.shop_name}</strong> ครับ</p>` },
      Cancelled: { title: '❌ ออเดอร์ถูกยกเลิก',     msg: `<p>ออเดอร์ #${shortId} จากร้าน <strong>${order.shop_name}</strong> ถูกยกเลิก<br>โปรดติดต่อร้านค้าสำหรับรายละเอียด</p>` },
    };

    const notif = notifMap[status];
    if (notif) {
      await sendNotification(order.user_id, notif.title, notif.msg);
    }

    return { success: true, data: null, msg: 'Updated' };
  },

  cancel: async (orderId: string) => {
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, shop_name, status')
      .eq('id', orderId)
      .single();

    if (!order || ['Completed', 'Cancelled'].includes(order.status)) {
      return { success: false, data: null, msg: 'ยกเลิกไม่ได้' };
    }

    const { error } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId);
    if (error) return { success: false, data: null, msg: error.message };

    const shortId = orderId.slice(-5);
    await sendNotification(
      order.user_id,
      '❌ ยกเลิกออเดอร์สำเร็จ',
      `<p>คุณได้ยกเลิกออเดอร์ #${shortId} ของร้าน <strong>${order.shop_name}</strong> เรียบร้อยแล้ว</p>`
    );

    return { success: true, data: null, msg: 'Cancelled' };
  },
};

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const notifApi = {
  get: (userId: string) =>
    wrap(supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })),

  markRead: (userId: string) =>
    wrap(supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)),
};

// ─── NEWS ────────────────────────────────────────────────────
export const newsApi = {
  get: () =>
    wrap(supabase.from('news').select('*').eq('status', 'Active').order('created_at', { ascending: false }).limit(1)),

  getAll: () =>
    wrap(supabase.from('news').select('*').order('created_at', { ascending: false })),

  post: (msg: string) =>
    wrap(supabase.from('news').insert([{ id: 'N' + Date.now(), message: msg, status: 'Active' }])),

  clear: () =>
    wrap(supabase.from('news').update({ status: 'Inactive' }).eq('status', 'Active')),
};

// ─── REVIEWS ─────────────────────────────────────────────────
export const reviewsApi = {
  submit: async (data: any) => {
    // Check duplicate
    const { data: existing } = await supabase.from('reviews').select('id').eq('order_id', data.orderId).single();
    if (existing) return { success: false, data: null, msg: 'คุณรีวิวออเดอร์นี้ไปแล้ว' };

    const id = 'REV' + Date.now();
    return wrap(supabase.from('reviews').insert([{
      id,
      order_id:  data.orderId,
      shop_name: data.shop,
      user_id:   data.userId,
      rating:    data.rating,
      comment:   data.comment || '',
    }]));
  },

  get: (shop: string) =>
    wrap(supabase.from('reviews').select('*').eq('shop_name', shop).order('created_at', { ascending: false })),
};

// ─── ADMIN ───────────────────────────────────────────────────
export const adminApi = {
  getUsers: () =>
    wrap(supabase.from('users').select('*').order('created_at', { ascending: false })),

  saveUser: (user: any) => {
    const payload: any = {
      password:  user.pwd || user.password,
      name:      user.name,
      nickname:  user.nick || user.nickname,
      phone:     user.phone,
      role:      user.role,
      shop_name: user.shop || user.shop_name,
      email:     user.email,
    };
    // Check if exists
    return wrap(supabase.from('users').upsert([{ id: user.id, ...payload }]));
  },

  deleteUser: (id: string) =>
    wrap(supabase.from('users').delete().eq('id', id)),

  getStats: async () => {
    try {
      const [uRes, oRes, mRes, revRes, orderFullRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('menu').select('id', { count: 'exact' }),
        supabase.from('users').select('id').eq('role', 'Merchant'),
        supabase.from('orders').select('shop_name, total, status').neq('status', 'Cancelled'),
      ]);

      // Total revenue & per-shop stats
      let totalRevenue = 0;
      const shopMap: Record<string, { orders: number; revenue: number }> = {};
      (orderFullRes.data || []).forEach((o: any) => {
        const amt = Number(o.total) || 0;
        totalRevenue += amt;
        if (!shopMap[o.shop_name]) shopMap[o.shop_name] = { orders: 0, revenue: 0 };
        shopMap[o.shop_name].orders++;
        shopMap[o.shop_name].revenue += amt;
      });

      const shops = Object.entries(shopMap)
        .map(([shop, s]) => ({ shop, ...s }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        success: true,
        data: {
          total: totalRevenue,
          users: uRes.count || 0,
          orders: oRes.count || 0,
          menu: mRes.count || 0,
          merchants: (revRes.data || []).length,
          shops,
        },
        msg: 'OK',
      };
    } catch (e: any) {
      return { success: false, data: { total: 0, users: 0, orders: 0, menu: 0, merchants: 0, shops: [] }, msg: e.message };
    }
  },

  getReports: () =>
    wrap(supabase.from('reports').select('*').order('created_at', { ascending: false })),

  updateReportStatus: (id: string, status: string) =>
    wrap(supabase.from('reports').update({ status }).eq('id', id)),
};

// ─── UTILS ───────────────────────────────────────────────────
export const utilsApi = {
  uploadImage: async (file: File, type: 'food' | 'slip' | 'shop'): Promise<string> => {
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return '';
    }
  },

  getFavorites: async (uid: string) => {
    const res = await wrap(supabase.from('users').select('favorites').eq('id', uid).single());
    return { ...res, data: (res.data as any)?.favorites || [] };
  },

  saveFavorites: (uid: string, favs: string[]) =>
    wrap(supabase.from('users').update({ favorites: favs }).eq('id', uid)),

  saveStudentProfile: (form: any) => {
    const payload: any = {
      name:     form.name,
      nickname: form.nick,
      phone:    form.phone,
      email:    form.email,
    };
    if (form.pwd && form.pwd.trim()) payload.password = form.pwd;
    return wrap(supabase.from('users').update(payload).eq('id', form.uid || form.id));
  },

  reportIssue: (data: any) => {
    const id = 'RPT' + Date.now();
    return wrap(supabase.from('reports').insert([{
      id,
      user_id: data.uid,
      name:    data.name,
      type:    data.type,
      message: data.msg,
      contact: data.contact || '',
      status:  'Pending',
    }]));
  },

  exportHistory: async (uid: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) return { success: false, data: null, msg: error.message };
    return { success: true, data, msg: 'OK' };
  },
};
