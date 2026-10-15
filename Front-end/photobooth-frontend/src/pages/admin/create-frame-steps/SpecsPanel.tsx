import React from 'react';
import { PictureOutlined, CheckCircleFilled, WarningOutlined } from '@ant-design/icons';

interface Props {
  selectedType: 'solo' | 'group';
  groupGuests: number;
  selectedLayout: string;
}

const SpecsPanel: React.FC<Props> = ({ selectedType, groupGuests, selectedLayout }) => {
  let ratio = '2:3 (Chuẩn)';
  let size = '1200 x 1800 px';
  
  if (selectedLayout === '1x4') {
    ratio = '1:3 (Strip)';
    size = '600 x 1800 px';
  } else if (selectedLayout.includes('3x2') || selectedLayout.includes('4x2')) {
    ratio = '3:2 (Ngang)';
    size = '1800 x 1200 px';
  }
  return (
    <div className="w-full lg:w-80 bg-pink-50/50 rounded-xl border border-pink-100 p-5 h-fit shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-5 bg-[#d81e69] rounded-full"></div>
        Thông Số Kỹ Thuật Bắt Buộc
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-sm text-gray-600 flex items-center gap-2"><PictureOutlined className="text-gray-400" /> Tỷ lệ khung</div>
          <div className="text-sm font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded">{ratio}</div>
        </div>
        
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-sm text-gray-600 flex items-center gap-2"><CheckCircleFilled className="text-gray-400" /> Độ phân giải</div>
          <div className="text-sm font-bold text-gray-700">300 dpi</div>
        </div>
        
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-sm text-gray-600 flex items-center gap-2"><CheckCircleFilled className="text-gray-400" /> Tổng số khách</div>
          <div className="text-sm font-bold text-gray-700">
            {selectedType === 'solo' ? 'Cá nhân' : `${groupGuests} Người`}
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-sm text-gray-600 flex items-center gap-2"><CheckCircleFilled className="text-gray-400" /> Kích thước file</div>
          <div className="text-sm font-bold text-gray-700">{size}</div>
        </div>
      </div>

      <div className="mt-5 bg-pink-100/60 p-4 rounded-lg border border-pink-200 flex gap-3">
        <WarningOutlined className="text-pink-500 mt-0.5" />
        <p className="text-xs text-pink-900 leading-relaxed">
          <span className="font-bold">Chú ý:</span> File PNG xuất ra (dành cho in ấn) phải match với kích thước frame thiết kế để không bị kéo giãn, méo mó sai tỷ lệ photostrip trong máy.
        </p>
      </div>
    </div>
  );
};

export default SpecsPanel;
