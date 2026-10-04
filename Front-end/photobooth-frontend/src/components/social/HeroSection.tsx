import React from 'react';
import { Star, Eye, Heart } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
  iconColor: string;
}

function StatItem({ icon, value, label, iconBg, iconColor }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-pink-50">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="text-left flex flex-col justify-center">
        <div className="font-bold text-[19px] text-zinc-800 leading-tight">
          {value} <span className="text-xs font-medium text-zinc-400 align-middle ml-1">{label.split(' ')[0] === '/5.0' ? '/ 5.0' : ''}</span>
        </div>
        <div className="text-[12px] text-zinc-500 font-medium">
          {label.replace('/5.0 ', '')}
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ stats }: { stats: { rating: number; views: string; satisfaction: string } }) {
  return (
    <section className="text-center pt-16 pb-8 px-4 bg-transparent mt-20">
      <h1 className="text-4xl font-extrabold mb-3 text-zinc-800 tracking-tight">
        Cộng Đồng Đánh Giá &{' '}
        <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-pink-500 bg-clip-text text-transparent">
          Cảm Hứng KH BOOTH
        </span>
      </h1> 
      <p className="text-zinc-600/90 max-w-xl mx-auto mb-10 text-[15px] leading-relaxed">
        Khám phá những khoảnh khắc rực rỡ và cảm hứng chân thực từ cộng đồng, nơi mỗi tấm ảnh kể một câu chuyện riêng. Xem cảm nhận chân thực, chia sẻ cảm xúc yêu thích và lựa ngay mẫu frame ưng ý để áp dụng cho lượt chụp của bạn nhé!
      </p>
      <div className="flex justify-center flex-wrap gap-4 max-w-3xl mx-auto">
        <StatItem 
          icon={<Star size={20} className="fill-current" />} 
          value={stats.rating} 
          label="/5.0 Đánh giá" 
          iconBg="bg-purple-100" 
          iconColor="text-purple-600" 
        />
        <StatItem 
          icon={<Eye size={20} />} 
          value={stats.views} 
          label="Lượt xem tuần này" 
          iconBg="bg-cyan-100" 
          iconColor="text-cyan-600" 
        />
        <StatItem 
          icon={<Heart size={20} className="fill-current" />} 
          value={stats.satisfaction} 
          label="Khách hàng hài lòng" 
          iconBg="bg-pink-100" 
          iconColor="text-pink-500" 
        />
      </div>
    </section>
  );
}
