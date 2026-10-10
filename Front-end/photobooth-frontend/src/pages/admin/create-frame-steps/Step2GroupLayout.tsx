import React from 'react';
import { PictureOutlined, WarningOutlined } from '@ant-design/icons';
import SpecsPanel from './SpecsPanel';

interface Props {
  groupGuests: number;
  setGroupGuests: (num: number) => void;
  selectedGroupLayout: string;
  onSelectLayout: (layout: string) => void;
}

const Step2GroupLayout: React.FC<Props> = ({ 
  groupGuests, 
  setGroupGuests, 
  selectedGroupLayout, 
  onSelectLayout 
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PictureOutlined className="text-[#d81e69]" />
            Cấu Hình Số Khách Trong Buồng
          </h2>
          <div className="flex gap-1 bg-gray-100 p-1.5 rounded-lg border border-gray-200 w-fit">
            <button className="px-4 py-1.5 bg-[#d81e69] text-white rounded-md text-xs font-semibold shadow-sm">
              Khung Theo Lượng Khách
            </button>
            <button className="px-4 py-1.5 text-gray-500 hover:text-gray-800 rounded-md text-xs font-semibold transition">
              Khung Định Biệt (Độc Lạ)
            </button>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-3 font-medium uppercase tracking-wide">Quy mô số lượng khách:</div>
          <div className="flex flex-wrap gap-3">
            {[2, 3, 4, 5, 6, 7, 8].map(num => {
              const isSelected = groupGuests === num;
              return (
                <button 
                  key={num}
                  onClick={() => {
                    setGroupGuests(num);
                    if (num === 5) onSelectLayout('5-special');
                    else onSelectLayout('default');
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                    isSelected 
                      ? 'bg-[#d81e69] text-white border-[#d81e69] shadow-md' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  {num} Người
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 mb-8 shadow-sm">
          <WarningOutlined className="text-yellow-500 text-lg mt-0.5" />
          <div>
            <div className="font-bold text-sm mb-1">Lưu ý mật về tỷ lệ khung Photobooth:</div>
            <div className="text-xs text-yellow-700 leading-relaxed">
              Nhóm từ 2-8 người có thể chọn đa dạng layout (hoặc mix layout). Đối với nhóm trên 4 người khuyến khích ưu tiên các format chia nhiều ô lớn để đảm bảo tất cả mọi người được nhìn thấy rõ ràng.
            </div>
          </div>
        </div>

        {groupGuests === 5 && (
          <div className="border border-blue-100 rounded-xl overflow-hidden mb-8 shadow-sm">
            <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Khung Hình Đề Xuất Cho Nhóm 5 Người</h3>
              <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-100 px-2 py-1 rounded">Được đề xuất nhiều nhất</span>
            </div>
            <div className="p-6 bg-white">
              <div 
                onClick={() => onSelectLayout('5-special')}
                className={`cursor-pointer border-2 rounded-xl p-5 flex flex-col md:flex-row items-center gap-6 transition-all ${
                  selectedGroupLayout === '5-special' ? 'border-[#d81e69] bg-pink-50/30' : 'border-gray-200 hover:border-pink-200'
                }`}
              >
                <div className="bg-black p-2 rounded-lg w-32 shadow-lg">
                  <div className="bg-[#d81e69] text-white text-[8px] font-bold px-2 py-0.5 mb-2 rounded w-fit uppercase">Photobooth KH</div>
                  <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                    <div className="aspect-[3/4] bg-cyan-400 rounded-sm flex items-center justify-center"><PictureOutlined className="text-white opacity-50" /></div>
                    <div className="aspect-[3/4] bg-cyan-400 rounded-sm flex items-center justify-center"><PictureOutlined className="text-white opacity-50" /></div>
                    <div className="aspect-[3/4] bg-cyan-400 rounded-sm flex items-center justify-center"><PictureOutlined className="text-white opacity-50" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="aspect-[3/4] bg-pink-500 rounded-sm flex items-center justify-center"><PictureOutlined className="text-white opacity-50" /></div>
                    <div className="aspect-[3/4] bg-pink-500 rounded-sm flex items-center justify-center"><PictureOutlined className="text-white opacity-50" /></div>
                  </div>
                </div>
                <div>
                  <div className="inline-block px-2 py-1 bg-pink-100 text-[#d81e69] rounded text-[10px] font-bold mb-2 uppercase">Layout Độc Đáo</div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Khung 5 Hình (Tỷ lệ 3 Trên - 2 Dưới)</h4>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Thiết kế độc quyền dành riêng cho nhóm 5 người. 3 khung phía trên chụp cá nhân 3 người ngồi sau. 2 khung phía dưới lớn hơn phù hợp cho 2 người ngồi phía trước, tạo sự hài hòa trong khung hình chụp chung.
                  </p>
                  <div className="flex gap-4">
                    <div className="text-xs text-gray-500">Kích thước: <span className="font-bold text-gray-800">4x6 inch</span></div>
                    <div className="text-xs text-gray-500">Khung ảnh: <span className="font-bold text-gray-800">Cắt chuẩn</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold text-gray-800 mb-4">Bộ Thư Viện Layout Tiêu Chuẩn (Hỗ trợ chuyển đổi nhanh)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { id: '2x2', cols: 2, rows: 2, label: 'Khung 4 Hình' },
              { id: '2x3', cols: 2, rows: 3, label: 'Khung 6 Hình' },
              { id: '2x4', cols: 2, rows: 4, label: 'Khung 8 Hình' },
            ].map(layout => {
              const isSelected = selectedGroupLayout === layout.id;
              return (
                <div 
                  key={layout.id}
                  onClick={() => onSelectLayout(layout.id)}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-between min-h-[140px] transition-all ${
                    isSelected 
                      ? 'border-[#00bcd4] bg-cyan-50 shadow-[0_0_15px_rgba(0,188,212,0.15)]' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`grid gap-1.5 flex-1 content-center ${
                    layout.cols === 2 ? 'grid-cols-2 w-16' : 'grid-cols-3 w-20'
                  }`}>
                    {Array.from({ length: layout.cols * layout.rows }).map((_, i) => (
                      <div key={i} className={`aspect-square ${isSelected ? 'bg-cyan-300' : 'bg-pink-100'} rounded-sm`}></div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <div className="text-sm font-bold text-gray-800">{layout.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      <SpecsPanel selectedType="group" groupGuests={groupGuests} selectedLayout={selectedGroupLayout} />
    </div>
  );
};

export default Step2GroupLayout;
