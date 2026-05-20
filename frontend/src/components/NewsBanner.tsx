'use client';

import { useEffect, useState } from 'react';
import { newsApi } from '@/lib/api';
import { X, Megaphone } from 'lucide-react';

export default function NewsBanner() {
  const [news, setNews]       = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    newsApi.get().then((r: any) => { if (r.success && r.data) setNews(r.data); });
  }, []);

  if (!news || !visible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 animate-fade-in">
      <Megaphone size={16} className="text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800 font-medium flex-1 truncate">{news}</p>
      <button onClick={() => setVisible(false)} className="text-amber-500 hover:text-amber-700">
        <X size={16} />
      </button>
    </div>
  );
}
