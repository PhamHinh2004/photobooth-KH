import React from 'react';

interface StatItemProps {
  icon: string;
  value: string | number;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
      <div className="text-left">
        <div className="font-bold text-lg text-zinc-800">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

export function HeroSection({ stats }: { stats: { rating: number; views: string; satisfaction: string } }) {
  return (
    <section className="text-center py-16 px-4" style={{ background: 'var(--gradient-social-hero)' }}>
      <h1 className="text-4xl font-extrabold mb-3 text-zinc-800">
        Cộng đồng đánh giá &{' '}
        <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Cảm hứng KH BOOTH
        </span>
      </h1> 
      <p className="text-zinc-600 max-w-xl mx-auto mb-8">
        Khám phá những khoảnh khắc rực rỡ và cảm hứng chân thực từ cộng đồng, nơi mỗi tấm ảnh kể một câu chuyện riêng.
      </p>
      <div className="flex justify-center flex-wrap gap-8">
        <StatItem icon="⭐" value={stats.rating} label="/5.0 đánh giá" />
        <StatItem icon="👁" value={stats.views} label="Lượt xem tuần này" />
        <StatItem icon="💗" value={stats.satisfaction} label="Khách hài lòng" />
      </div>
    </section>
  );
}
