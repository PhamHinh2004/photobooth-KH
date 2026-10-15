import React, { useState } from 'react';
import { 
  FormOutlined, 
  EditOutlined, 
  PlusOutlined, 
  CheckOutlined, 
  CodeOutlined, 
  ScanOutlined,
  ReloadOutlined,
  SettingOutlined,
  LayoutOutlined,
  BlockOutlined
} from '@ant-design/icons';
import { Switch } from 'antd';
import baseFramesData from '../../../data/base_frames.json';

interface Props {
  selectedLayout: string;
  uploadedImage?: string | null;
  frameStyle?: string;
  coords: any[];
  setCoords: (coords: any[]) => void;
}

const Step4Parameters: React.FC<Props> = ({ selectedLayout, uploadedImage, frameStyle = 'gold', coords, setCoords }) => {
  const [frameName, setFrameName] = useState('KHBooth_Football Basic');
  const [activeTags, setActiveTags] = useState(['Cute', 'Y2K Retro']);
  
  // Orientation is automatically derived from the selected layout in Step 2
  const orientation = (selectedLayout === '3x2' || selectedLayout === '4x2' || selectedLayout.includes('landscape')) ? 'landscape' : 'portrait';
  
  const tags = ['Anime', 'Pokemon', 'Avenger', 'Cute', 'Y2K Retro', 'Cyberpunk'];
  
  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  const currentBaseFrame = baseFramesData.find(f => f.id === selectedLayout) || baseFramesData[0];
  const { canvas_width, canvas_height, slots } = currentBaseFrame.layout_config;
  
  const expectedHoles = slots.length;
  let baseRes = `${canvas_width}x${canvas_height}`;
  
  let frameRatioLabel = 'Tùy chỉnh';
  let frameWidth = `${canvas_width} px`;
  let frameHeight = `${canvas_height} px`;
  let canvasAspect = `aspect-[${canvas_width}/${canvas_height}]`;
  let descText = `Kích thước chuẩn từ file cấu hình`;
  
  if (selectedLayout === '1x4') {
    frameRatioLabel = '1:3';
    canvasAspect = 'aspect-[1/4]'; // visual representation
    descText = 'Kích thước 2x6 inch (Photostrip)';
  } else if (orientation === 'landscape') {
    frameRatioLabel = '3:2';
    canvasAspect = 'aspect-[3/2]';
    descText = 'Kích thước 6x4 inch panorama';
  } else {
    frameRatioLabel = '2:3';
    canvasAspect = 'aspect-[2/3]';
    descText = 'Kích thước 4x6 inch (~10x15cm)';
  }

  // Initialize coordinates based on layout
  React.useEffect(() => {
    // Initialize or reset coords when layout changes
    const newCoords = slots.map((s, i) => {
      // Determine pseudo-row/pos for the table display
      const row = Math.floor(i / 2) + 1;
      const pos = i % 2 === 0 ? 'Trái' : 'Phải';
      return {
        id: i + 1,
        row: selectedLayout === '1x4' ? i + 1 : row,
        pos: selectedLayout === '1x4' ? 'Giữa' : pos,
        x: s.x,
        y: s.y,
        w: s.width,
        h: s.height
      };
    });
    setCoords(newCoords);
  }, [selectedLayout]); // trigger only on layout change

  const handleCoordChange = (id: number, field: 'x' | 'y' | 'w' | 'h', value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setCoords(coords.map(c => c.id === id ? { ...c, [field]: numValue } : c));
  };

  const getStyleConfig = () => {
    switch(frameStyle) {
      case 'gold': return {
        container: "shadow-[0_10px_30px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden flex flex-col bg-gray-900 border-[6px] border-gray-900",
        outerBorder: <div className="absolute inset-0 z-20 pointer-events-none" style={{ border: '4px solid transparent', borderImage: 'linear-gradient(to top right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C) 1', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)' }}></div>,
      };
      case 'neon': return {
        container: "shadow-[0_0_40px_rgba(216,30,105,0.3)] rounded-lg overflow-hidden flex flex-col bg-black border-[4px] border-black",
        outerBorder: <div className="absolute inset-1 z-20 pointer-events-none border-[2px] border-[#d81e69] shadow-[inset_0_0_20px_rgba(216,30,105,0.8),0_0_20px_rgba(216,30,105,0.8)] rounded-sm"></div>,
      };
      case 'film': return {
        container: "shadow-2xl rounded-sm overflow-hidden flex flex-col bg-[#1a1a1a] border-x-[16px] border-y-[24px] border-[#1a1a1a]",
        outerBorder: null,
      };
      case 'holographic': return {
        container: "shadow-[0_10px_40px_rgba(236,72,153,0.3)] rounded-2xl overflow-hidden flex flex-col bg-white/10 backdrop-blur-md border-[2px] border-white/40",
        outerBorder: <div className="absolute inset-0 z-20 pointer-events-none border-[4px] border-white/30 rounded-2xl mix-blend-overlay"></div>,
      };
      case 'polaroid': return {
        container: "shadow-xl rounded-sm overflow-hidden flex flex-col bg-[#fdfbf7] p-2",
        outerBorder: <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"></div>,
      };
      case 'y2k': return {
        container: "shadow-[8px_8px_0px_#d81e69] rounded-3xl overflow-hidden flex flex-col bg-[#ff6b6b] border-[6px] border-[#d81e69]",
        outerBorder: null,
      };
      case 'classic': return {
        container: "shadow-2xl rounded-sm overflow-hidden flex flex-col bg-white border-[10px] border-white",
        outerBorder: null,
      };
      case 'minimal': default: return {
        container: "shadow-md rounded-xl overflow-hidden flex flex-col bg-transparent",
        outerBorder: null,
      };
    }
  };

  const styleCfg = getStyleConfig();

  return (
    <div className="animate-fade-in pb-10">
      <h2 className="text-xl font-bold text-[#d81e69] flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
        <FormOutlined /> Thiết Lập Thông Số Kỹ Thuật & Tọa Độ Ô Ảnh (Slots)
      </h2>
      
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Column: Metadata */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6 text-lg">
            <span className="text-[#d81e69]"><SettingOutlined /></span> Thuộc Tính Metadata
          </h3>
          
          <div className="space-y-6">
            {/* Frame Name */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">Tên Template Frame</label>
                <span className="text-[10px] font-bold text-[#d81e69] italic">* Bắt buộc</span>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={frameName}
                  onChange={(e) => setFrameName(e.target.value)}
                  className="w-full border-b-2 border-gray-300 focus:border-[#d81e69] outline-none py-2 text-gray-800 font-medium bg-transparent transition-colors pr-8"
                />
                <EditOutlined className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Tên hiển thị tại kiosk để phục vụ khách chọn mẫu.</p>
            </div>
            
            {/* Tags */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-bold text-gray-700">Chủ Đề & Phong Cách (Tags)</label>
                <span className="text-xs font-bold text-[#08979c]">{activeTags.length} Tag Đang Chọn</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const isActive = activeTags.includes(tag);
                  return (
                    <button 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isActive 
                          ? tag === 'Cute' ? 'bg-[#d81e69] text-white shadow-md' : 'bg-[#08979c] text-white shadow-md'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {tag} {isActive && <CheckOutlined className="ml-1" />}
                    </button>
                  );
                })}
                <button className="px-4 py-1.5 rounded-full text-xs font-bold text-[#d81e69] bg-pink-50 border border-pink-200 hover:bg-pink-100 transition-colors flex items-center gap-1">
                  <PlusOutlined /> Thêm chủ đề mới
                </button>
              </div>
            </div>
            
            {/* Selected Layout Display */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-3">Layout Khung Template <span className="text-xs font-normal text-gray-400 ml-2">(Đã chọn ở Bước trước)</span></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-[#d81e69] bg-white shadow-sm ring-1 ring-[#d81e69] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-pink-50 flex items-center justify-center border border-pink-100">
                    <div className="text-[#d81e69] font-black text-sm">{selectedLayout}</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Khung {selectedLayout} ({frameRatioLabel})</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{descText}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Layout Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">4. Số Khung Layout</div>
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <LayoutOutlined className="text-[#1890ff]" /> 1 Khung tổng thể
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">5. Cấu trúc bố cục</div>
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <BlockOutlined className="text-[#d81e69]" /> {expectedHoles} Ô hình ({selectedLayout})
                </div>
              </div>
            </div>
            
            {/* Dimensions */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">6. Kích thước</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center bg-pink-50/50 rounded-lg overflow-hidden border border-pink-100">
                  <div className="px-3 py-2 text-xs font-bold text-[#d81e69] flex-1">Chiều ngang :</div>
                  <div className="px-4 py-2 bg-[#08979c] text-white font-bold text-sm text-center min-w-[80px]">
                    {frameWidth}
                  </div>
                </div>
                <div className="flex items-center bg-gray-50/50 rounded-lg overflow-hidden border border-gray-200">
                  <div className="px-3 py-2 text-xs font-bold text-gray-500 flex-1">Chiều cao :</div>
                  <div className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-sm text-center min-w-[80px]">
                    {frameHeight}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Right Column: Coordinates */}
        <div className="w-full xl:w-[650px] space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
              <span className="text-[#1890ff]"><ScanOutlined /></span> Tọa Độ Bounding Box (Slots)
            </h3>
            <div className="flex gap-2">
              <button className="bg-[#d81e69] text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-[#b01453] transition-colors shadow-sm">
                <CodeOutlined /> JSON Config Đã Nạp ({expectedHoles} Slots)
              </button>
              <button className="bg-[#08979c] text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-[#067a7e] transition-colors shadow-sm">
                <ScanOutlined /> Tự Động Phát Hiện Từ PNG
              </button>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Canvas Area */}
            <div className="bg-gray-100 p-6 flex items-center justify-center relative min-h-[350px] flex-1 overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
              }}></div>
              
              <div className="absolute top-2 left-2 bg-[#d81e69] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm z-30">STRIP {selectedLayout}</div>
              <div className="absolute top-2 right-2 bg-[#08979c] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm z-30">
                {baseRes}
              </div>
              
              {uploadedImage ? (
                <div 
                  className={`relative ${selectedLayout === '1x4' ? 'w-[120px]' : 'w-[240px]'} ${styleCfg.container} scale-[0.85] md:scale-100 transition-all duration-500`}
                  style={{ aspectRatio: `${canvas_width} / ${canvas_height}` }}
                >
                  <img src={uploadedImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="Background" />
                  
                  {/* Bounding Boxes */}
                  <div className="absolute inset-0 z-10 p-0 overflow-hidden">
                    {coords.map((coord) => (
                      <div 
                        key={coord.id}
                        className="absolute border-[1.5px] border-[#08979c] bg-[#08979c]/30 rounded-sm flex flex-col items-center justify-center text-white backdrop-blur-sm group cursor-pointer hover:bg-[#08979c]/50 transition-colors shadow-lg"
                        style={{
                          left: `${(coord.x / parseInt(baseRes.split('x')[0])) * 100}%`,
                          top: `${(coord.y / parseInt(baseRes.split('x')[1])) * 100}%`,
                          width: `${(coord.w / parseInt(baseRes.split('x')[0])) * 100}%`,
                          height: `${(coord.h / parseInt(baseRes.split('x')[1])) * 100}%`,
                        }}
                      >
                        <div className="w-5 h-5 bg-[#08979c] text-white rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5 shadow-md">{coord.id}</div>
                        <div className="text-[7px] font-bold drop-shadow-md">Ô {coord.id}</div>
                        <div className="text-[6px] opacity-90 drop-shadow-sm font-mono mt-0.5 bg-black/40 px-1 rounded-sm">{coord.w}x{coord.h}</div>
                        
                        {/* Interactive Resize handles */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-[#08979c] rounded-full opacity-0 group-hover:opacity-100 cursor-nwse-resize"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-[#08979c] rounded-full opacity-0 group-hover:opacity-100 cursor-nesw-resize"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-[#08979c] rounded-full opacity-0 group-hover:opacity-100 cursor-nesw-resize"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-[#08979c] rounded-full opacity-0 group-hover:opacity-100 cursor-nwse-resize"></div>
                      </div>
                    ))}
                  </div>
                  
                  {styleCfg.outerBorder}
                </div>
              ) : (
                <div className="text-gray-400 font-medium z-10">Chưa tải ảnh nền lên</div>
              )}
            </div>
            
            {/* Algorithm Info Area */}
            <div className="w-full md:w-[200px] bg-gray-50 p-4 border-l border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Trạng thái thuật toán</div>
              <div className="text-xs font-bold text-gray-800 mb-4">AI</div>
              
              <div className="flex gap-2 items-start mb-6">
                <ScanOutlined className="text-[#08979c] text-xl mt-1" />
                <div>
                  <div className="text-sm font-bold text-gray-800 leading-tight">{coords.length}/{expectedHoles} Bounding Slots Configured (JSON Active)</div>
                  <div className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Cấu hình bố cục {selectedLayout} được nạp trực tiếp qua chuẩn JSON tọa độ pixel. Bounding box đã tự động định vị chính xác trên canvas.
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                <div>
                  <div className="text-[9px] text-gray-400 uppercase">Độ phân giải gốc</div>
                  <div className="text-xs font-bold text-gray-800">{baseRes} px</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase">Tỉ lệ ô ảnh (Mẫu)</div>
                  <div className="text-xs font-bold text-gray-800">{coords[0]?.w || 0} × {coords[0]?.h || 0} px</div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded p-3 flex justify-between items-center shadow-sm">
                <span className="text-[10px] font-bold text-gray-600">Bật Snap-to-Grid (Bước nhảy 10px)</span>
                <Switch defaultChecked size="small" />
              </div>
            </div>
          </div>
          
          {/* Coordinates Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Slot #</th>
                    <th className="px-4 py-3">Vị Trí Tương Đối</th>
                    <th className="px-4 py-3">X (px)</th>
                    <th className="px-4 py-3">Y (px)</th>
                    <th className="px-4 py-3">W (px)</th>
                    <th className="px-4 py-3">H (px)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coords.map((coord) => (
                    <tr key={coord.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="bg-[#d81e69] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                          #{String(coord.id).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-800">Hàng {coord.row},</div>
                        <div className="text-xs text-gray-500">{coord.pos}</div>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={coord.x} onChange={(e) => handleCoordChange(coord.id, 'x', e.target.value)} className="w-16 bg-gray-100 border-none rounded px-2 py-1 text-center font-mono text-xs focus:ring-1 focus:ring-[#08979c] outline-none hover:bg-gray-200 transition-colors" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={coord.y} onChange={(e) => handleCoordChange(coord.id, 'y', e.target.value)} className="w-16 bg-gray-100 border-none rounded px-2 py-1 text-center font-mono text-xs focus:ring-1 focus:ring-[#08979c] outline-none hover:bg-gray-200 transition-colors" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={coord.w} onChange={(e) => handleCoordChange(coord.id, 'w', e.target.value)} className="w-16 bg-gray-100 border-none rounded px-2 py-1 text-center font-mono text-xs focus:ring-1 focus:ring-[#08979c] outline-none hover:bg-gray-200 transition-colors" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={coord.h} onChange={(e) => handleCoordChange(coord.id, 'h', e.target.value)} className="w-16 bg-gray-100 border-none rounded px-2 py-1 text-center font-mono text-xs focus:ring-1 focus:ring-[#08979c] outline-none hover:bg-gray-200 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white p-3 flex justify-between items-center border-t border-gray-100">
              <div className="text-[10px] text-gray-400">* Đơn vị đo lường: Pixel (px) dựa trên khung chuẩn {baseRes} px.</div>
              <button className="text-[#08979c] text-xs font-bold hover:underline flex items-center gap-1">
                <ReloadOutlined /> Đặt Lại Về Mặc Định
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Step4Parameters;
