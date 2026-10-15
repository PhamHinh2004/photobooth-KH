import React from 'react';
import { CheckCircleFilled, CheckOutlined, PictureOutlined } from '@ant-design/icons';

interface Props {
  selectedType: 'solo' | 'group';
  onSelectType: (type: 'solo' | 'group') => void;
}

const Step1TypeSelection: React.FC<Props> = ({ selectedType, onSelectType }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
      {/* Solo Card */}
      <div 
        onClick={() => onSelectType('solo')}
        className={`flex-1 relative cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 ${
          selectedType === 'solo' 
            ? 'border-[#d81e69] shadow-[0_0_15px_rgba(216,30,105,0.15)] bg-pink-50/20' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div className="absolute top-6 right-6">
          {selectedType === 'solo' ? (
            <CheckCircleFilled className="text-[#d81e69] text-2xl" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
          )}
        </div>
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">
          • CÁ NHÂN / ĐƠN
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Chụp Đơn (Solo Photobooth)</h2>
        <div className="bg-gray-50 rounded-lg p-6 mb-6 flex items-center min-h-[220px]">
          <div className="flex-1 flex justify-center">
            <div className="w-16 bg-white shadow-md p-1.5 flex flex-col gap-1.5 rounded-sm">
              <div className="aspect-square bg-gray-200 rounded-sm flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-gray-400 rounded-full bg-gray-100"></div></div></div>
              <div className="aspect-square bg-gray-200 rounded-sm flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-gray-400 rounded-full bg-gray-100"></div></div></div>
              <div className="aspect-square bg-gray-200 rounded-sm flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-gray-400 rounded-full bg-gray-100"></div></div></div>
              <div className="h-10 bg-[#7ce5e8] mt-1 rounded-sm flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
            </div>
          </div>
          <div className="flex-1 pl-4 border-l border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2">TỶ LỆ CHUẨN<br/>ĐA DẠNG KHUNG HÌNH</h3>
            <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
              <li>1×4 inch</li>
              <li>2×2 / 2×3 / 2×4 inch</li>
              <li>3×2 inch</li>
              <li>4×2 inch</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Dành cho cá nhân chụp tự sướng, selfie với các bộ khung photostrip kinh điển 4, 6, 8 ảnh. Tối ưu góc máy camera đơn độ trễ thấp.
        </p>
        <ul className="space-y-3">
          <li className="flex gap-3 text-sm text-gray-700">
            <div className="w-5 h-5 rounded-full border border-teal-500 text-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckOutlined className="text-[10px]" /></div>
            Hỗ trợ các layout thịnh hành hiện nay (1×4 inch & 2×2 inch).
          </li>
          <li className="flex gap-3 text-sm text-gray-700">
            <div className="w-5 h-5 rounded-full border border-teal-500 text-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckOutlined className="text-[10px]" /></div>
            Tùy biến số lần chụp theo từng khung hình linh hoạt.
          </li>
        </ul>
      </div>

      {/* Group Card */}
      <div 
        onClick={() => onSelectType('group')}
        className={`flex-1 relative cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 ${
          selectedType === 'group' 
            ? 'border-[#d81e69] shadow-[0_0_15px_rgba(216,30,105,0.15)] bg-pink-50/20' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div className="absolute top-6 right-6">
          {selectedType === 'group' ? (
            <CheckCircleFilled className="text-[#d81e69] text-2xl" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
          )}
        </div>
        <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold mb-4">
          • TẬP THỂ / NHÓM 2-8 NGƯỜI
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Chụp Nhóm (Group Room Photobooth)</h2>
        <div className="bg-gray-50 rounded-lg p-6 mb-6 flex items-center min-h-[220px]">
          <div className="flex-1 flex justify-center">
            <div className="w-32 bg-white shadow-md p-1.5 flex flex-col gap-1.5 rounded-sm">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="aspect-video bg-gray-200 rounded-sm flex items-center justify-center">
                  <div className="flex -space-x-1"><div className="w-4 h-4 rounded-full bg-gray-400"></div><div className="w-4 h-4 rounded-full bg-gray-400"></div></div>
                </div>
                <div className="aspect-video bg-blue-100 rounded-sm flex items-center justify-center">
                  <div className="flex -space-x-1"><div className="w-4 h-4 rounded-full bg-blue-400"></div><div className="w-4 h-4 rounded-full bg-blue-400"></div></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="aspect-video bg-gray-200 rounded-sm flex items-center justify-center">
                  <div className="flex -space-x-1"><div className="w-4 h-4 rounded-full bg-gray-400"></div><div className="w-4 h-4 rounded-full bg-gray-400"></div></div>
                </div>
                <div className="aspect-video bg-pink-100 rounded-sm flex items-center justify-center text-pink-500">
                  <PictureOutlined />
                </div>
              </div>
              <div className="h-2 bg-gray-200 mt-1 mx-4 rounded-full"></div>
            </div>
          </div>
          <div className="flex-1 pl-4 border-l border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2">TỶ LỆ MỞ RỘNG<br/>HÒA VÀO 1 FRAME</h3>
            <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
              <li>Toàn bộ các frame chụp đơn</li>
              <li>5 ô chụp (3 trên 2 dưới)</li>
              <li>7 ô chụp (4 trên 3 dưới)</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Dành cho nhóm bạn từ 2 đến 8 người kết hợp sắp xếp bố cục khung đa dạng mở rộng cho từng số lượng người tham gia.
        </p>
        <ul className="space-y-3">
          <li className="flex gap-3 text-sm text-gray-700">
            <div className="w-5 h-5 rounded-full border border-teal-500 text-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckOutlined className="text-[10px]" /></div>
            Đề xuất layout thông minh theo số lượng người (2-8 người).
          </li>
          <li className="flex gap-3 text-sm text-gray-700">
            <div className="w-5 h-5 rounded-full border border-teal-500 text-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckOutlined className="text-[10px]" /></div>
            Khung 5 và 7 ô độc lạ mới mẻ phù hợp với nhóm lẻ.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Step1TypeSelection;
