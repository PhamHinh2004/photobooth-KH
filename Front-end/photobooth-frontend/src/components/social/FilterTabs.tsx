import React from 'react';
import { Search } from 'lucide-react';

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'group', label: 'Chụp Nhóm' },
  { value: 'single', label: 'Chụp Đơn' },
];

export function FilterTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
        <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all ${
                active === tab.value 
                  ? 'bg-[#0f627a] text-white shadow-sm' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-[320px]">
          <input 
            type="text" 
            placeholder="Tìm theo tên bài viết, người chụp, filter..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0f627a]/20 focus:border-[#0f627a] transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        </div>
      </div>
    </div>
  );
}
