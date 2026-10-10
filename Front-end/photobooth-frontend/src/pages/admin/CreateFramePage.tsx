import React, { useState } from 'react';
import {
  CloseOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  SaveOutlined
} from '@ant-design/icons';
import Step1TypeSelection from './create-frame-steps/Step1TypeSelection';
import Step2SoloLayout from './create-frame-steps/Step2SoloLayout';
import Step2GroupLayout from './create-frame-steps/Step2GroupLayout';
import Step3UploadPNG from './create-frame-steps/Step3UploadPNG';
import Step4Parameters from './create-frame-steps/Step4Parameters';
import Step5Preview from './create-frame-steps/Step5Preview';

const CreateFramePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<'solo' | 'group'>('solo');
  
  // Step 2 State
  const [selectedSoloLayout, setSelectedSoloLayout] = useState<string>('2x3');
  const [groupGuests, setGroupGuests] = useState<number>(5);
  const [selectedGroupLayout, setSelectedGroupLayout] = useState<string>('5-special');

  // Step 3 State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [frameStyle, setFrameStyle] = useState<'classic' | 'gold' | 'neon' | 'minimal' | 'film' | 'holographic' | 'polaroid' | 'y2k'>('minimal');
  const [coords, setCoords] = useState<any[]>([]);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderSteps = () => {
    const steps = [
      { num: 1, title: 'Chọn thể loại chụp' },
      { num: 2, title: 'Chọn khung template' },
      { num: 3, title: 'Upload file PNG' },
      { num: 4, title: 'Nhập thông số khung' },
      { num: 5, title: 'Xem Trước Frame' }
    ];

    return (
      <div className="flex gap-2 mb-8">
        {steps.map(step => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;

          if (isActive) {
            return (
              <div key={step.num} className="flex-1 bg-[#d81e69] rounded-md p-3 flex items-center gap-3 text-white shadow-md">
                <div className="w-6 h-6 rounded-full bg-white text-[#d81e69] flex items-center justify-center text-xs font-bold">
                  {step.num}
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] uppercase font-bold opacity-90">Hiện tại</div>
                  <div className="text-sm font-medium">{step.title}</div>
                </div>
              </div>
            );
          }

          if (isCompleted) {
            return (
              <div key={step.num} className="flex-1 bg-teal-50 rounded-md p-3 flex items-center gap-3 border border-teal-200">
                <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  <CheckOutlined />
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] uppercase font-bold text-teal-600">Hoàn thành</div>
                  <div className="text-sm font-medium text-teal-800">{step.title}</div>
                </div>
              </div>
            );
          }

          // Pending
          return (
            <div key={step.num} className="flex-1 bg-gray-100 rounded-md p-3 flex items-center gap-3 text-gray-400">
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                {step.num}
              </div>
              <div className="leading-tight">
                <div className="text-[10px] uppercase font-bold opacity-0 hidden">Bước {step.num}</div>
                <div className="text-sm font-medium">Bước {step.num}<br/><span className="text-xs font-normal">{step.title}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getNextButtonText = () => {
    if (currentStep === 1) return 'Tiếp tục sang Bước 2';
    if (currentStep === 2) return 'Xác nhận Layout & Tiếp tục';
    if (currentStep === 3) return 'Tiếp tục sang Bước 4 (Nhập thông số)';
    if (currentStep === 4) return 'Xem Trước Frame (Bước 5)';
    return 'Hoàn thành';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Header Area */}
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tạo Frame Mới</h1>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto bg-gray-50/30">
        {/* Breadcrumb & Steps Info */}
        <div className="flex justify-between items-end mb-4">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Hệ Thống &gt; <span className="text-[#d81e69]">Quản lý tạo frame</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Quy trình: {currentStep} / 5 Bước cấu hình
          </div>
        </div>

        {renderSteps()}

        {currentStep === 1 && (
          <Step1TypeSelection 
            selectedType={selectedType} 
            onSelectType={setSelectedType} 
          />
        )}
        
        {currentStep === 2 && selectedType === 'solo' && (
          <Step2SoloLayout 
            selectedSoloLayout={selectedSoloLayout} 
            onSelectLayout={setSelectedSoloLayout} 
          />
        )}
        
        {currentStep === 2 && selectedType === 'group' && (
          <Step2GroupLayout 
            groupGuests={groupGuests}
            setGroupGuests={setGroupGuests}
            selectedGroupLayout={selectedGroupLayout}
            onSelectLayout={setSelectedGroupLayout}
          />
        )}

        {currentStep === 3 && (
          <Step3UploadPNG 
            selectedType={selectedType}
            selectedLayout={selectedType === 'solo' ? selectedSoloLayout : selectedGroupLayout}
            uploadedImage={uploadedImage}
            setUploadedImage={setUploadedImage}
            frameStyle={frameStyle}
            setFrameStyle={setFrameStyle}
          />
        )}
        
        {currentStep === 4 && (
          <Step4Parameters 
            selectedLayout={selectedType === 'solo' ? selectedSoloLayout : selectedGroupLayout}
            uploadedImage={uploadedImage}
            frameStyle={frameStyle}
            coords={coords}
            setCoords={setCoords}
          />
        )}
        
        {currentStep === 5 && (
          <Step5Preview 
            selectedLayout={selectedType === 'solo' ? selectedSoloLayout : selectedGroupLayout}
            uploadedImage={uploadedImage}
            frameStyle={frameStyle}
            coords={coords}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t p-5 flex justify-between items-center bg-white rounded-b-lg shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {currentStep > 1 ? (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md font-medium transition-colors"
          >
            <ArrowLeftOutlined className="text-xs" />
            Quay lại Bước {currentStep - 1}
          </button>
        ) : (
          <button 
            onClick={() => {}}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-400 rounded-md font-medium cursor-not-allowed"
          >
            <CloseOutlined className="text-xs" />
            Hủy bỏ
          </button>
        )}
        
        {currentStep === 3 && (
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 px-4 py-2 rounded-full border border-teal-100">
            <CheckOutlined /> FILE TEMPLATE ĐẠT TIÊU CHUẨN NẠP DỮ LIỆU
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md font-medium transition-colors">
            <SaveOutlined className="text-xs text-gray-500" />
            Lưu nháp
          </button>
          
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#d81e69] hover:bg-[#c01a5d] text-white rounded-md font-medium transition-colors shadow-md"
          >
            {getNextButtonText()}
            <ArrowRightOutlined className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFramePage;

