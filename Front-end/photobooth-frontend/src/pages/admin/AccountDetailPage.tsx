import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsApi } from '@/api/accounts.api';
import { socialApi } from '@/api/social.api';
import { 
  ArrowLeftOutlined, 
  SafetyCertificateOutlined,
  LinkOutlined,
  CameraOutlined,
  GoogleOutlined,
  MailOutlined,
  CheckCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Spin, Modal } from 'antd';
import { PostCard } from '@/components/social/PostCard';

const AccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: account, isLoading, isError } = useQuery({
    queryKey: ['accountDetail', id],
    queryFn: () => accountsApi.getAccountDetail(id!),
    enabled: !!id,
  });

  const { data: postsData } = useQuery({
    queryKey: ['userPosts', id],
    queryFn: () => socialApi.getUserPosts(id!, 1, 1),
    enabled: !!id,
  });

  const latestPost = postsData?.data?.[0];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Không thể tải thông tin chi tiết hoặc tài khoản không tồn tại.</p>
        <button onClick={() => navigate('/admin/accounts')} className="mt-4 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const shortId = account.id.substring(0, 8).toUpperCase();
  const roleDisplay = account.role === 'admin' ? 'Admin' : account.role === 'staff' ? 'Nhân viên' : 'Khách hàng';
  const roleSubDisplay = account.role === 'admin' ? 'ROOT' : account.role === 'staff' ? 'OPERATOR' : 'MEMBER';

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chi Tiết Khách Hàng</h1>
        <div className="flex items-center text-sm">
          <button onClick={() => navigate('/admin/accounts')} className="text-[#e94560] hover:underline flex items-center gap-1 font-medium">
            <ArrowLeftOutlined /> Quay lại danh sách khách hàng
          </button>
          <span className="text-gray-300 mx-2">/</span>
          <span className="text-gray-500 font-medium">KH-CUST-VIEW</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Hồ sơ khách hàng #CUST_{shortId}</h2>
          <span className="bg-[#36c2ce] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            ĐÃ LIÊN KẾT TÀI KHOẢN
          </span>
        </div>
        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
          Read-only access
        </span>
      </div>

      {/* Warning Box */}
      <div className="bg-[#fffbe6] border border-[#ffe58f] rounded-lg p-4 flex gap-4 items-start shadow-sm">
        <div className="bg-[#faad14] text-white p-2 rounded-lg flex-shrink-0">
          <SafetyCertificateOutlined className="text-xl" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm mb-1">Chế độ xem bảo mật phân quyền Admin (Read-only)</h3>
          <p className="text-gray-600 text-sm">
            Bản ghi khách hàng được bảo vệ theo giao thức PII GDPR/PDPA. Thao tác chỉnh sửa xóa dữ liệu trực tiếp từ Portal bị khóa để bảo đảm tính toàn vẹn.
          </p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer DB */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">ID: {shortId}</span>
            </div>
            
            <div className="text-xs font-bold text-[#e94560] uppercase tracking-wider mb-6">Cơ sở dữ liệu khách hàng</div>
            
            <div className="flex items-center gap-4 mb-8">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${account.username}`} alt="avatar" className="w-20 h-20 rounded-2xl shadow-sm border-2 border-pink-50" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full">NỮ</span>
                  <span className="text-xs text-gray-500">22 Tuổi (2002)</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{account.customer?.fullName || account.username}</h3>
                <div className="text-sm text-[#e94560] font-medium">{account.email}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  TP. Hồ Chí Minh, Việt Nam
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 border-dashed">
                <span className="text-sm text-gray-500 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"></path></svg> Ngày sinh</span>
                <span className="text-sm font-bold text-gray-800">{account.customer?.dateOfBirth ? new Date(account.customer.dateOfBirth).toLocaleDateString('vi-VN') : '24/10/2002'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 border-dashed">
                <span className="text-sm text-gray-500 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> Số điện thoại</span>
                <span className="text-sm font-bold text-gray-800">{account.customer?.phoneNumber || '0918 234 888'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Khởi tạo hồ sơ</span>
                <span className="text-sm font-bold text-gray-800">{new Date(account.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Account Info & Metrics */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Linked App Account */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#36c2ce] bg-opacity-10 text-[#36c2ce] flex justify-center items-center">
                  <LinkOutlined className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Tài khoản ứng dụng đã liên kết</h3>
              </div>
              <span className={`px-4 py-1 rounded-full text-xs font-bold ${account.isActive ? 'bg-[#36c2ce] text-white' : 'bg-red-500 text-white'}`}>
                {account.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">USERNAME ĐỊNH DANH</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-[#e94560]">@{account.username}</span>
                  <CheckCircleOutlined className="text-[#36c2ce]" />
                </div>
                <div className="text-xs text-gray-400">Mã tài khoản: ACC_{shortId}</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">VAI TRÒ NGƯỜI DÙNG</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-gray-800">{roleDisplay}</span>
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">{roleSubDisplay}</span>
                </div>
                <div className="text-xs text-gray-400">Cấp đặc quyền tiêu chuẩn</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">NGÀY LIÊN KẾT LẦN ĐẦU</div>
                <div className="text-base font-bold text-gray-800 mb-1">{new Date(account.createdAt).toLocaleDateString('vi-VN')}</div>
                <div className="text-xs text-gray-400">Khớp với ngày đăng ký</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PHƯƠNG THỨC ĐĂNG NHẬP</div>
                <div className="flex gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-bold text-gray-600">
                    <MailOutlined className="text-[#e94560]" /> Email OTP
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-bold text-gray-600">
                    <GoogleOutlined className="text-blue-500" /> Google OAuth
                  </span>
                </div>
                <div className="text-xs text-gray-400">Bảo mật 2 lớp kích hoạt</div>
              </div>
            </div>
          </div>

          {/* Photobooth Usage Metrics - Mock Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-50 text-[#e94560] flex justify-center items-center">
                  <CameraOutlined className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Chỉ số sử dụng Photobooth</h3>
                  <p className="text-xs text-gray-500">Lịch sử sử dụng KH Photobooth</p>
                </div>
              </div>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-bold">
                48 LẦN SỬ DỤNG
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 border-r border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TỔNG LẦN CHỤP</div>
                <div className="text-3xl font-bold text-[#e94560]">48 <span className="text-sm text-gray-400 font-medium">phiên</span></div>
              </div>
              <div className="text-center p-4 border-r border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">CHỤP ĐƠN</div>
                <div className="text-3xl font-bold text-[#36c2ce]">17 <span className="text-sm text-gray-400 font-medium">phiên</span></div>
              </div>
              <div className="text-center p-4 border-r border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">CHỤP NHÓM</div>
                <div className="text-3xl font-bold text-[#faad14]">31 <span className="text-sm text-gray-400 font-medium">phiên</span></div>
              </div>
              <div className="text-center p-4">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">SỐ FEEDBACK</div>
                <div className="text-3xl font-bold text-gray-800">12 <span className="text-sm text-gray-400 font-medium">lần</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#e94560] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {latestPost ? '1' : '0'}
                </div>
                <div>
                  {latestPost ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-800">
                          Lần chụp gần nhất: {new Date(latestPost.created_at).toLocaleDateString('vi-VN')}
                        </span>
                        {latestPost.session?.photo?.frame?.name && (
                          <span className="bg-[#36c2ce] bg-opacity-20 text-[#36c2ce] px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {latestPost.session.photo.frame.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        Rating: <span className="text-yellow-400">★★★★★</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 max-w-md line-clamp-1">
                        Nội dung đánh giá: {latestPost.caption || 'Không có nội dung'}
                      </p>
                    </>
                  ) : (
                    <div className="text-sm font-bold text-gray-500">Chưa có bài đánh giá nào</div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                disabled={!latestPost}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <EyeOutlined /> Xem lại đánh giá
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        title="Chi tiết bài đăng đánh giá"
        open={isReviewModalOpen}
        onCancel={() => setIsReviewModalOpen(false)}
        footer={null}
        centered
        width={500}
        destroyOnClose
        className="post-review-modal"
      >
        <div className="mt-4">
          {latestPost && (
            <PostCard post={latestPost} hideApplyButton />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AccountDetailPage;
