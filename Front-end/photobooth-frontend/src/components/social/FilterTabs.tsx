import React from 'react';

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'single', label: 'Chụp đơn' },
  { value: 'couple', label: 'Chụp đôi' },
  { value: 'group', label: 'Chụp nhóm' },
];

export function FilterTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === tab.value ? 'bg-pink-500 text-white shadow-md' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
