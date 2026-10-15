import React, { useState, useRef } from 'react';
import { 
  CloudUploadOutlined, 
  CheckCircleFilled, 
  CloseCircleFilled,
  FileImageOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  BlockOutlined,
  PictureOutlined
} from '@ant-design/icons';

interface Props {
  selectedType: 'solo' | 'group';
  selectedLayout: string;
  uploadedImage: string | null;
  setUploadedImage: (img: string | null) => void;
  frameStyle: 'classic' | 'gold' | 'neon' | 'minimal' | 'film' | 'holographic' | 'polaroid' | 'y2k';
  setFrameStyle: (style: any) => void;
}

const Step3UploadPNG: React.FC<Props> = ({ 
  selectedType, 
  selectedLayout, 
  uploadedImage, 
  setUploadedImage,
  frameStyle,
  setFrameStyle
}) => {
  const [hasUploaded, setHasUploaded] = useState(!!uploadedImage);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string>('uploaded_image.png');
  const [fileSize, setFileSize] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock layout info based on props
  const layoutName = selectedType === 'solo' 
    ? `Chụp Đơn - Khung ${selectedLayout} inch` 
    : `Chụp Nhóm - Layout ${selectedLayout}`;
    
  const expectedHoles = selectedLayout === '2x3' ? 6 : (selectedLayout === '1x4' ? 4 : 5);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasUploaded(true);
    }, 2000); // Simulate AI analysis delay
  };

  const handleRemove = () => {
    setHasUploaded(false);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // frameStyle state is now lifted up

  // ... (keep all the other handlers the same, just updating the return JSX)

  const renderStyleSelector = () => (
    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex gap-2 overflow-x-auto hide-scrollbar">
      {[
        { id: 'classic', label: 'Classic', color: 'bg-white border-gray-200 text-gray-700' },
        { id: 'gold', label: 'Royal Gold', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-800' },
        { id: 'neon', label: 'Cyberpunk', color: 'bg-gray-900 border-[#d81e69] text-cyan-400' },
        { id: 'minimal', label: 'Minimal', color: 'bg-transparent border-dashed border-gray-300 text-gray-500' },
        { id: 'film', label: 'Vintage Film', color: 'bg-[#1a1a1a] border-gray-600 text-white' },
        { id: 'holographic', label: 'Holographic', color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 border-white text-purple-900 shadow-sm' },
        { id: 'polaroid', label: 'Polaroid', color: 'bg-[#fdfbf7] border-gray-300 text-gray-800 shadow-[0_2px_4px_rgba(0,0,0,0.1)]' },
        { id: 'y2k', label: 'Y2K Pop', color: 'bg-[#ff6b6b] border-[#d81e69] border-2 text-white shadow-[2px_2px_0px_#d81e69]' }
      ].map(s => (
        <button
          key={s.id}
          onClick={() => setFrameStyle(s.id as any)}
          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase whitespace-nowrap transition-all border ${s.color} ${frameStyle === s.id ? 'ring-2 ring-offset-1 ring-blue-400 shadow-sm scale-105' : 'opacity-70 hover:opacity-100'}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  const getStyleConfig = () => {
    switch(frameStyle) {
      case 'gold': return {
        container: "shadow-[0_10px_30px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden flex flex-col bg-gray-900 border-[6px] border-gray-900",
        holeWrapper: "shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-sm",
        holeBg: <div className="absolute inset-0 bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728]"></div>,
        holeInner: "absolute inset-[3px] md:inset-[4px] rounded-[1px] overflow-hidden shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]",
        glass: <div className="absolute inset-[4px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none z-10"></div>,
        outerBorder: <div className="absolute inset-0 z-20 pointer-events-none" style={{ border: '4px solid transparent', borderImage: 'linear-gradient(to top right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C) 1', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)' }}></div>,
        text: "text-gray-600 font-bold mix-blend-multiply"
      };
      case 'neon': return {
        container: "shadow-[0_0_40px_rgba(216,30,105,0.3)] rounded-lg overflow-hidden flex flex-col bg-black border-[4px] border-black",
        holeWrapper: "shadow-[0_0_15px_rgba(0,255,255,0.5)] rounded-md",
        holeBg: <div className="absolute inset-0 bg-black border-2 border-cyan-400 rounded-md"></div>,
        holeInner: "absolute inset-[2px] rounded-md overflow-hidden shadow-[inset_0_0_20px_rgba(216,30,105,0.8)]",
        glass: <div className="absolute inset-0 border-2 border-[#d81e69] opacity-50 z-10 pointer-events-none mix-blend-screen rounded-md"></div>,
        outerBorder: <div className="absolute inset-1 z-20 pointer-events-none border-[2px] border-[#d81e69] shadow-[inset_0_0_20px_rgba(216,30,105,0.8),0_0_20px_rgba(216,30,105,0.8)] rounded-sm"></div>,
        text: "text-cyan-300 font-black drop-shadow-[0_0_8px_rgba(0,255,255,0.9)]"
      };
      case 'classic': return {
        container: "shadow-2xl rounded-sm overflow-hidden flex flex-col bg-white border-[10px] border-white",
        holeWrapper: "rounded-sm",
        holeBg: <div className="absolute inset-0 bg-white"></div>,
        holeInner: "absolute inset-[4px] rounded-sm overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]",
        glass: null,
        outerBorder: null,
        text: "text-gray-300 font-bold"
      };
      case 'minimal': return {
        container: "shadow-md rounded-xl overflow-hidden flex flex-col bg-transparent",
        holeWrapper: "rounded-xl",
        holeBg: null,
        holeInner: "absolute inset-0 rounded-xl overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] backdrop-blur-[2px]",
        glass: null,
        outerBorder: null,
        text: "text-white font-bold drop-shadow-md"
      };
      case 'film': return {
        container: "shadow-2xl rounded-sm overflow-hidden flex flex-col bg-[#1a1a1a] border-x-[16px] border-y-[24px] border-[#1a1a1a]",
        holeWrapper: "rounded-md",
        holeBg: <div className="absolute inset-0 bg-[#333] border-[2px] border-[#555]"></div>,
        holeInner: "absolute inset-[3px] rounded-sm overflow-hidden shadow-[inset_0_10px_20px_rgba(0,0,0,1)]",
        glass: <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10 mix-blend-overlay"></div>,
        outerBorder: null,
        text: "text-[#555] font-bold tracking-[0.2em]"
      };
      case 'holographic': return {
        container: "shadow-[0_10px_40px_rgba(236,72,153,0.3)] rounded-2xl overflow-hidden flex flex-col bg-white/10 backdrop-blur-md border-[2px] border-white/40",
        holeWrapper: "rounded-xl shadow-[0_8px_32px_rgba(31,38,135,0.2)]",
        holeBg: <div className="absolute inset-0 bg-gradient-to-tr from-[#ff9a9e] via-[#fecfef] to-[#a1c4fd] opacity-80"></div>,
        holeInner: "absolute inset-[4px] rounded-lg overflow-hidden shadow-[inset_0_2px_15px_rgba(255,255,255,0.9)] bg-white/50 backdrop-blur-sm",
        glass: <div className="absolute inset-0 bg-gradient-to-bl from-white/60 via-transparent to-transparent z-10 pointer-events-none"></div>,
        outerBorder: <div className="absolute inset-0 z-20 pointer-events-none border-[4px] border-white/30 rounded-2xl mix-blend-overlay"></div>,
        text: "text-purple-600 font-bold mix-blend-color-burn"
      };
      case 'polaroid': return {
        container: "shadow-xl rounded-sm overflow-hidden flex flex-col bg-[#fdfbf7] p-2",
        holeWrapper: "rounded-sm shadow-[0_2px_5px_rgba(0,0,0,0.1)]",
        holeBg: <div className="absolute inset-0 bg-[#fdfbf7]"></div>,
        holeInner: "absolute inset-[2px] rounded-sm overflow-hidden shadow-[inset_0_3px_10px_rgba(0,0,0,0.4)]",
        glass: null,
        outerBorder: <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"></div>,
        text: "text-gray-300 font-medium font-serif"
      };
      case 'y2k': return {
        container: "shadow-[8px_8px_0px_#d81e69] rounded-3xl overflow-hidden flex flex-col bg-[#ff6b6b] border-[6px] border-[#d81e69]",
        holeWrapper: "rounded-2xl shadow-[4px_4px_0px_#d81e69]",
        holeBg: <div className="absolute inset-0 bg-[#feca57] border-[4px] border-[#d81e69] rounded-2xl"></div>,
        holeInner: "absolute inset-[4px] rounded-xl overflow-hidden bg-white",
        glass: <div className="absolute inset-[4px] rounded-xl border-4 border-white z-10 pointer-events-none opacity-50"></div>,
        outerBorder: null,
        text: "text-[#d81e69] font-black italic"
      };
    }
  };

  const styleCfg = getStyleConfig();

  return (
    <div className="animate-fade-in">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg" 
        className="hidden" 
      />

      {/* Top Banner */}
      <div className="bg-[#e6f7ff] border border-[#91d5ff] rounded-lg p-4 flex gap-4 items-center mb-6 shadow-sm">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1890ff] shadow-sm flex-shrink-0">
          <SafetyCertificateOutlined className="text-xl" />
        </div>
        <div>
          <div className="text-sm text-gray-800 font-medium">
            <span className="font-bold">Cấu hình đích:</span> <span className="text-[#d81e69] underline decoration-pink-200 underline-offset-4">{layoutName}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Quy chuẩn kỹ thuật bắt buộc: <span className="font-bold text-gray-700">1200 x 1800 px</span> | Alpha Channel: <span className="font-bold text-gray-700">Định dạng .PNG / .JPG trong suốt (Transparent slots)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Upload & Status */}
        <div className="flex-1">
          {/* Dropzone */}
          {!hasUploaded && !isAnalyzing && (
            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-pink-50 hover:border-pink-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all mb-6 min-h-[260px]"
            >
              <div className="w-16 h-16 bg-pink-100 text-[#d81e69] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <CloudUploadOutlined className="text-3xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">Kéo và thả file PNG / JPG template vào đây</h3>
              <p className="text-sm text-gray-500 mb-6">hoặc <span className="text-[#d81e69] font-medium underline">click để duyệt file từ máy tính</span></p>
              
              <div className="flex gap-3">
                <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">PNG / JPG (Có Alpha Channel)</span>
                <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">Kích thước 1200x1800 px</span>
                <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">Tối đa 15 MB</span>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="border-2 border-dashed border-pink-300 bg-pink-50 rounded-xl p-10 flex flex-col items-center justify-center mb-6 min-h-[260px]">
              <div className="w-12 h-12 border-4 border-pink-200 border-t-[#d81e69] rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-bold text-[#d81e69]">Đang phân tích file bằng AI...</h3>
              <p className="text-sm text-pink-600/80">Tự động nhận diện vùng cắt (cutout) và kích thước</p>
            </div>
          )}

          {hasUploaded && (
            <div className="mb-6 animate-fade-in">
              <div className="flex justify-between items-end mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileImageOutlined className="text-[#1890ff]" /> Tệp Tin Đang Tải Lên
                </h3>
                <span className="px-2 py-1 bg-pink-100 text-[#d81e69] text-[10px] font-bold rounded uppercase tracking-wider">
                  Tự động phân tích
                </span>
              </div>
              
              {/* File Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <PictureOutlined className="text-xl" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-gray-800 line-clamp-1">{fileName} <span className="text-gray-400 font-normal text-xs ml-2">{fileSize}</span></div>
                    <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium transition-colors flex-shrink-0">
                      Mô phỏng lỗi
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#52c41a] font-medium">
                    <CheckCircleFilled />
                    <span>Hợp lệ: 1200 × 1800 px - {expectedHoles} Vùng trong suốt phát hiện tự động, đúng layout {selectedLayout}</span>
                  </div>
                </div>
                <button 
                  onClick={handleRemove}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  <DeleteOutlined />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Độ phân giải</div>
                  <div className="text-sm font-bold text-gray-800">1200 × 1800 PX</div>
                </div>
                <div className="bg-[#e6f7ff] border border-[#91d5ff] rounded-lg p-3 text-center">
                  <div className="text-[10px] font-bold text-[#1890ff] uppercase mb-1">Vùng cutout Alpha</div>
                  <div className="text-sm font-bold text-[#096dd9]">{expectedHoles} / {expectedHoles} Ô TRỐNG</div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kênh màu</div>
                  <div className="text-sm font-bold text-gray-800">Xanh lá + trắng</div>
                </div>
              </div>
            </div>
          )}

          {/* Strict Rules Alert */}
          <div className="bg-[#fff1f0] border border-[#ffa39e] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#f5222d]"></div>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-[#cf1322] flex items-center gap-2">
                <BlockOutlined /> QUY TẮC TỰ ĐỘNG XÁC THỰC TEMPLATE
              </h4>
              <span className="bg-[#cf1322] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">Strict System Rules</span>
            </div>
            <p className="text-sm text-[#cf1322]/80 mb-3 leading-relaxed">
              Nếu tải lên sai kích thước (ví dụ 800×1200px) hoặc cấu trúc file không đủ {expectedHoles} ô cutout trong suốt và sai layout, hệ thống sẽ từ chối:
            </p>
            <div className="bg-white/60 border border-[#ffa39e]/50 rounded p-3 flex gap-2 items-start text-xs text-[#cf1322]">
              <CloseCircleFilled className="mt-0.5" />
              <span>"File ảnh không phù hợp với template đã chọn (Số ô trong suốt phát hiện: 4/{expectedHoles}, Kích thước không khớp)". Vui lòng kiểm tra lại file đồ họa.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Render Canvas */}
        <div className="w-full lg:w-[380px] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Live Render Canvas</div>
              <h3 className="font-bold text-gray-800">Kiểm Tra Trực Quan</h3>
            </div>
            <div className="text-[10px] bg-pink-100 text-[#d81e69] px-2 py-1 rounded font-bold uppercase animate-pulse">
              AI Powered
            </div>
          </div>
          
          {/* AI Style Presets */}
          {renderStyleSelector()}
          
          <div className="flex-1 bg-gray-50/50 p-6 flex items-center justify-center relative overflow-hidden">
            {/* Checkerboard background pattern for transparency visualization */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
            }}></div>
            
            {hasUploaded && uploadedImage ? (
              <div className={`relative w-full aspect-[2/3] ${styleCfg.container} transition-all duration-500`}>
                {/* The actual uploaded frame image as background */}
                <img 
                  src={uploadedImage} 
                  alt="Uploaded Frame" 
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />

                {/* AI Generated Layout Holes (overlaying on top of the solid background) */}
                <div 
                  className={`absolute inset-0 p-4 pb-16 grid gap-3 z-10 pointer-events-none ${
                    selectedLayout === '1x4' ? 'grid-cols-1' : 
                    selectedLayout === '3x2' ? 'grid-cols-3' : 
                    selectedLayout === '4x2' ? 'grid-cols-4' : 
                    'grid-cols-2'
                  }`}
                >
                  {Array.from({ length: expectedHoles }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`relative overflow-hidden flex items-center justify-center group ${styleCfg.holeWrapper}`}
                    >
                      {styleCfg.holeBg}
                      
                      {/* The Punched-out Hole */}
                      <div className={styleCfg.holeInner}>
                        {/* Checkerboard background */}
                        <div className="absolute inset-0" style={{
                          backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                        }}></div>
                      </div>
                      
                      {styleCfg.glass}
                      
                      <span className={`relative z-20 font-mono text-sm tracking-wider drop-shadow-md ${styleCfg.text}`}>ẢNH KH {i+1}</span>
                    </div>
                  ))}
                </div>
                
                {styleCfg.outerBorder}
              </div>
            ) : (
              <div className="w-full aspect-[2/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white/50 relative z-10">
                <PictureOutlined className="text-4xl mb-3 text-gray-300" />
                <p className="text-sm font-medium">Canvas trống</p>
                <p className="text-xs mt-1 text-center px-4">Tải template lên để xem trước ảnh phủ</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className={`w-2 h-2 rounded-full ${hasUploaded ? 'bg-[#52c41a]' : 'bg-gray-300'}`}></div>
              <span className={hasUploaded ? 'text-gray-700' : 'text-gray-400'}>
                {hasUploaded ? `${expectedHoles} Khung ảnh rỗng khớp cấu hình Bước 2` : 'Chưa có dữ liệu canvas'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3UploadPNG;

