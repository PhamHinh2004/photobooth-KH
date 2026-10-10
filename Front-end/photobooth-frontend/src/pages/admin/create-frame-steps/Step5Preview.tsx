import React, { useRef } from 'react';
import { CheckCircleFilled, UploadOutlined, DownloadOutlined, PictureOutlined } from '@ant-design/icons';
import { message } from 'antd';
import html2canvas from 'html2canvas';
import baseFramesData from '../../../data/base_frames.json';
import { adminApi } from '../../../api/admin.api';

interface Props {
  selectedLayout: string;
  uploadedImage: string | null;
  frameStyle: string;
  coords: any[];
}

const Step5Preview: React.FC<Props> = ({ selectedLayout, uploadedImage, frameStyle, coords }) => {
  const currentBaseFrame = baseFramesData.find(f => f.id === selectedLayout) || baseFramesData[0];
  const { canvas_width, canvas_height } = currentBaseFrame.layout_config;
  const frameRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  
  const expectedHoles = coords?.length || 0;
  const isLandscape = selectedLayout === '3x2' || selectedLayout === '4x2' || selectedLayout.includes('landscape');

  // Punch holes in the background image
  React.useEffect(() => {
    if (uploadedImage && bgCanvasRef.current) {
      const canvas = bgCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = canvas_width;
        canvas.height = canvas_height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas_width, canvas_height);
        
        // Punch transparent holes using exact coordinates
        ctx.globalCompositeOperation = 'destination-out';
        coords.forEach(coord => {
          ctx.fillRect(coord.x, coord.y, coord.w, coord.h);
        });
        ctx.globalCompositeOperation = 'source-over';
      };
      img.src = uploadedImage;
    }
  }, [uploadedImage, coords, canvas_width, canvas_height]);

  const handleSaveToDevice = () => {
    const configData = {
      layout: selectedLayout,
      style: frameStyle,
      base_width: canvas_width,
      base_height: canvas_height,
      slots: coords
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `frame_config_${selectedLayout}_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Đã tải cấu hình Template (.json) về máy!');
  };

  const handleDownloadImage = async () => {
    if (!frameRef.current) {
      message.error('Không tìm thấy hình ảnh để tải về!');
      return;
    }
    try {
      setIsExporting(true);
      message.loading({ content: 'Đang kết xuất hình ảnh Frame chuẩn...', key: 'downloadImage' });
      
      // Wait for React to re-render and hide placeholders
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const canvas = await html2canvas(frameRef.current, {
        backgroundColor: null, // Ensure transparent background
        scale: 2, 
        useCORS: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `frame_transparent_${selectedLayout}_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success({ content: 'Đã tải thành công ảnh Frame đục lỗ (PNG trong suốt)!', key: 'downloadImage', duration: 4 });
    } catch (error) {
      console.error(error);
      message.error({ content: 'Lỗi khi kết xuất hình ảnh.', key: 'downloadImage', duration: 3 });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePublish = async () => {
    if (!frameRef.current) {
      message.error('Không tìm thấy hình ảnh để xuất bản!');
      return;
    }
    
    try {
      setIsExporting(true);
      message.loading({ content: 'Đang kết xuất và xuất bản lên Server...', key: 'publish' });
      
      // Đợi component render xong trạng thái ẩn placeholder
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const canvas = await html2canvas(frameRef.current, {
        backgroundColor: null,
        scale: 2, 
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          message.error({ content: 'Lỗi tạo file ảnh.', key: 'publish', duration: 3 });
          return;
        }
        
        try {
          const formData = new FormData();
          formData.append('name', `Frame ${selectedLayout} - ${frameStyle}`);
          formData.append('aspect_ratio', selectedLayout);
          formData.append('session_type_supported', 'both');
          formData.append('sort_order', '0');
          
          const layoutConfig = {
            canvas_width: canvas_width,
            canvas_height: canvas_height,
            slots: coords.map(c => ({
              x: c.x,
              y: c.y,
              width: c.w,
              height: c.h
            }))
          };
          formData.append('layout_config', JSON.stringify(layoutConfig));
          
          // Gắn file blob vừa tạo
          formData.append('file', blob, `frame_${selectedLayout}_${new Date().getTime()}.png`);
          
          await adminApi.createFrame(formData);
          message.success({ content: 'Xuất bản thành công! Template đã sẵn sàng trên Kiosk.', key: 'publish', duration: 3 });
        } catch (error: any) {
          console.error('Publish error:', error);
          message.error({ content: 'Lỗi xuất bản: ' + (error?.response?.data?.message || error.message), key: 'publish', duration: 3 });
        } finally {
          setIsExporting(false);
        }
      }, 'image/png');
    } catch (error) {
      console.error(error);
      message.error({ content: 'Lỗi khi kết xuất hình ảnh.', key: 'publish', duration: 3 });
      setIsExporting(false);
    }
  };

  const getStyleConfig = () => {
    switch(frameStyle) {
      case 'gold': return {
        container: "shadow-[0_10px_30px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden flex flex-col bg-gray-900 border-[6px] border-gray-900",
        holeWrapper: "shadow-inner rounded-sm",
        holeBg: <div className="absolute inset-0 bg-[#BF953F] opacity-10"></div>,
        holeInner: "absolute inset-[1px] rounded-sm overflow-hidden shadow-[inset_0_0_10px_rgba(191,149,63,0.5)]",
        glass: <div className="absolute inset-0 border-[1px] border-[#FCF6BA] opacity-30 z-10 pointer-events-none mix-blend-overlay"></div>,
        outerBorder: <div className="absolute inset-0 z-20 pointer-events-none" style={{ border: '4px solid transparent', borderImage: 'linear-gradient(to top right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C) 1', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)' }}></div>,
        text: "text-[#B38728] font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
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
      case 'minimal': default: return {
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

  // Fake user images
  const sampleImages = [
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1506869640319-ce1a18f9df0d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400'
  ];

  return (
    <div className="animate-fade-in pb-10 flex flex-col items-center">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          <CheckCircleFilled />
        </div>
        <h2 className="text-2xl font-black text-gray-800">Hoàn Tất Cấu Hình Template!</h2>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">
          Dưới đây là bản xem trước của Frame khi áp dụng ảnh thực tế của khách hàng chụp tại Kiosk Photobooth.
        </p>
      </div>

      <div className="bg-gray-100 rounded-2xl p-8 w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
        }}></div>

        <div 
          ref={frameRef}
          className={`relative ${
            selectedLayout === '1x4' ? 'h-[500px]' : 
            isLandscape ? 'w-full max-w-[500px]' : 
            'h-[500px]'
          } ${styleCfg.container} rounded-lg shadow-2xl z-10 overflow-hidden`}
          style={{ aspectRatio: `${canvas_width} / ${canvas_height}` }}
        >
          {/* Dummy slots placed ON TOP of the background at z-20 to ensure visibility */}
          <div className="absolute inset-0 z-20 p-0 overflow-hidden pointer-events-none">
            {coords && coords.map((coord, i) => (
              <div 
                key={coord.id} 
                className={`absolute overflow-hidden flex items-center justify-center group ${styleCfg.holeWrapper}`}
                style={{
                  left: `${(coord.x / canvas_width) * 100}%`,
                  top: `${(coord.y / canvas_height) * 100}%`,
                  width: `${(coord.w / canvas_width) * 100}%`,
                  height: `${(coord.h / canvas_height) * 100}%`,
                }}
              >
                  {styleCfg.holeBg}
                
                {!isExporting && (
                  <>
                    {/* The Punched-out Hole Checkerboard */}
                    <div className={styleCfg.holeInner}>
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                      }}></div>
                    </div>
                    
                    {/* Placeholder Text */}
                    <div className={`relative z-10 uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 ${styleCfg.text}`}>
                      <div className="hidden md:block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-current opacity-70"></div>
                      ẢNH KH {coord.id}
                      <div className="hidden md:block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-current opacity-70"></div>
                    </div>
                  </>
                )}
                
                {styleCfg.glass}
              </div>
            ))}
          </div>

          {/* Frame Background at z-10 (BEHIND SLOTS) */}
          <canvas 
            ref={bgCanvasRef}
            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
          />
          {styleCfg.outerBorder}
        </div>
        
        <div className="z-10 bg-white rounded-xl shadow-lg p-6 w-full md:w-[300px]">
          <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Thông tin Publish</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-1">Layout</div>
              <div className="font-bold text-[#d81e69]">{selectedLayout} ({isLandscape ? 'Ngang' : 'Dọc'})</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Style Effect</div>
              <div className="font-bold capitalize">{frameStyle}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Trạng thái tọa độ</div>
              <div className="font-bold text-[#08979c] flex items-center gap-1"><CheckCircleFilled /> Đã cấu hình ({expectedHoles} Slots)</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex gap-2">
              <button 
                onClick={handleSaveToDevice}
                className="flex-1 bg-white text-[#08979c] border-2 border-[#08979c] font-bold py-2 rounded-lg shadow-sm hover:bg-[#08979c]/10 transition-all hover:-translate-y-1 flex items-center justify-center text-xs"
                title="Tải cấu hình JSON"
              >
                <DownloadOutlined className="mr-1.5" /> Config
              </button>
              <button 
                onClick={handleDownloadImage}
                disabled={!uploadedImage}
                className="flex-1 bg-white text-[#d81e69] border-2 border-[#d81e69] font-bold py-2 rounded-lg shadow-sm hover:bg-[#d81e69]/10 transition-all hover:-translate-y-1 flex items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Tải hình ảnh PNG"
              >
                <PictureOutlined className="mr-1.5" /> Ảnh PNG
              </button>
            </div>
            <button 
              onClick={handlePublish}
              className="w-full bg-[#d81e69] text-white font-bold py-3 rounded-lg shadow-md hover:bg-[#b01453] transition-all hover:-translate-y-1 flex items-center justify-center"
            >
              <UploadOutlined className="mr-2" /> Xuất bản lên Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5Preview;
