import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, title, message } = await req.json();
    if (!userId || !title) {
      return NextResponse.json({ success: false, msg: 'Missing fields' }, { status: 400 });
    }

    const id = 'NOT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const { error } = await supabase.from('notifications').insert([{
      id,
      user_id: userId,
      title,
      message: message || '',
      is_read: false,
    }]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, msg: e.message }, { status: 500 });
  }
}
