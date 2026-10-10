import React from 'react';
import { PictureOutlined, WarningOutlined } from '@ant-design/icons';
import SpecsPanel from './SpecsPanel';

interface Props {
  selectedSoloLayout: string;
  onSelectLayout: (layout: string) => void;
}

const Step2SoloLayout: React.FC<Props> = ({ selectedSoloLayout, onSelectLayout }) => {
  const layouts = [
    { id: '1x4', cols: 1, rows: 4, label: '1x4', sub: '2x6 inch' },
    { id: '2x2', cols: 2, rows: 2, label: '2x2', sub: 'Vuông' },
    { id: '2x3', cols: 2, rows: 3, label: '2x3', sub: 'Tiêu chuẩn' },
    { id: '2x4', cols: 2, rows: 4, label: '2x4', sub: 'Hẹp dài' },
    { id: '3x2', cols: 3, rows: 2, label: '3x2', sub: 'Ngang' },
    { id: '4x2', cols: 4, rows: 2, label: '4x2', sub: 'Ngang dài' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <PictureOutlined className="text-[#d81e69]" />
          Cấu Hình Từng Frame
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {layouts.map(layout => {
            const isSelected = selectedSoloLayout === layout.id;
            return (
              <div 
                key={layout.id}
                onClick={() => onSelectLayout(layout.id)}
                className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-between min-h-[220px] transition-all relative overflow-hidden group ${
                  isSelected 
                    ? 'border-[#00bcd4] bg-cyan-50 shadow-[0_0_15px_rgba(0,188,212,0.3)] ring-2 ring-[#00bcd4]' 
                    : 'border-gray-200 hover:border-[#00bcd4] bg-[#7a1215]' // Dark red background mimicking the screenshot
                }`}
              >
                {/* Visual Representation matching user's image */}
                <div className="flex-1 w-full flex items-center justify-center p-2 mt-2">
                  <div className={`bg-[#e5e5e5] p-1 pb-4 shadow-md flex flex-col ${
                    layout.cols === 1 ? 'w-[40px]' : 
                    layout.cols === 2 ? 'w-[80px]' : 
                    layout.cols === 3 ? 'w-[120px]' : 'w-[150px]'
                  }`}>
                    <div className={`grid gap-1 flex-1 ${
                      layout.cols === 1 ? 'grid-cols-1' : 
                      layout.cols === 2 ? 'grid-cols-2' : 
                      layout.cols === 3 ? 'grid-cols-3' : 'grid-cols-4'
                    }`}>
                      {Array.from({ length: layout.cols * layout.rows }).map((_, i) => (
                        <div key={i} className="aspect-square bg-[#999999]"></div>
                      ))}
                    </div>
                    <div className="text-[5px] font-black mt-2 text-black ml-0.5">KH Booth</div>
                  </div>
                </div>

                <div className={`text-center w-full py-1.5 rounded-b-lg absolute bottom-0 left-0 right-0 ${isSelected ? 'bg-[#00bcd4] text-white' : 'bg-black/50 text-white backdrop-blur-sm group-hover:bg-black/70'}`}>
                  <div className="text-xs font-bold">{layout.label}</div>
                  <div className="text-[9px] opacity-80">{layout.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 mt-8 shadow-sm">
          <WarningOutlined className="text-yellow-500 text-lg mt-0.5" />
          <div>
            <div className="font-bold text-sm mb-1">Lưu ý mật về tỷ lệ khung Photobooth:</div>
            <div className="text-xs text-yellow-700 leading-relaxed">
              Chọn đúng format layout cần thiết nếu in trực tiếp layout này để thay thế khung nhạc định dạng!
            </div>
          </div>
        </div>
      </div>
      
      <SpecsPanel selectedType="solo" groupGuests={1} selectedLayout={selectedSoloLayout} />
    </div>
  );
};

export default Step2SoloLayout;
