import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, GetAccountsParams } from '@/api/accounts.api';
import { 
  SearchOutlined, 
  CloseOutlined, 
  DownloadOutlined, 
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CrownOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Pagination } from 'antd';
import { useNavigate } from 'react-router-dom';

const AccountsPage = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState<GetAccountsParams>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [searchInput, setSearchInput] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryParams(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: metricsData } = useQuery({
    queryKey: ['accountsMetrics'],
    queryFn: () => accountsApi.getMetrics(),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounts', queryParams],
    queryFn: () => accountsApi.getAccounts(queryParams),
  });

  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams(prev => ({ ...prev, page, limit: pageSize }));
  };

  const handleRoleChange = (role: string) => {
    setQueryParams(prev => ({ ...prev, role, page: 1 }));
  };

  const handleStatusChange = (isActive: string) => {
    setQueryParams(prev => ({ ...prev, isActive, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setQueryParams({
      page: 1,
      limit: 10,
      search: '',
      role: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  // Keyboard shortcut to reset filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetFilters();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExportCSV = () => {
    accountsApi.exportCsv(queryParams);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Tài Khoản Hệ Thống</h1>
      </div>

      <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">
        HỆ THỐNG &gt; <span className="text-[#e94560]">QUẢN LÝ TÀI KHOẢN</span>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Accounts */}
        <div className="bg-white border-t-2 border-t-[#e94560] rounded-lg shadow-sm p-4 relative flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TỔNG TÀI KHOẢN</span>
            <UserOutlined className="text-[#e94560]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{metricsData?.total?.toLocaleString() || 0}</span>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">100%</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <span className="text-[#e94560] font-medium">+{metricsData?.thisWeekTotal || 0}</span> trong tuần này
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white border-t-2 border-t-[#1890ff] rounded-lg shadow-sm p-4 relative flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ĐANG HOẠT ĐỘNG</span>
            <CheckCircleOutlined className="text-[#1890ff]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{metricsData?.active?.toLocaleString() || 0}</span>
            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {metricsData?.total ? ((metricsData.active / metricsData.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1890ff]"></div>
            Trạng thái mở khóa
          </div>
        </div>

        {/* Locked Accounts */}
        <div className="bg-white border-t-2 border-t-[#ff4d4f] rounded-lg shadow-sm p-4 relative flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ĐÃ KHÓA</span>
            <StopOutlined className="text-[#ff4d4f]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-[#ff4d4f]">{metricsData?.locked?.toLocaleString() || 0}</span>
            <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
              {metricsData?.total ? ((metricsData.locked / metricsData.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2">Cần kiểm duyệt vi phạm</div>
        </div>

        {/* Admins */}
        <div className="bg-white border-t-2 border-t-[#eb2f96] rounded-lg shadow-sm p-4 relative flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">QUẢN TRỊ VIÊN</span>
            <CrownOutlined className="text-[#eb2f96]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{metricsData?.admin?.toLocaleString() || 0}</span>
            <span className="text-xs font-medium bg-pink-100 text-pink-700 px-2 py-0.5 rounded-sm">ROOT/ADMIN</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">Toàn quyền quản trị</div>
        </div>

        {/* Staffs */}
        <div className="bg-white border-t-2 border-t-[#faad14] rounded-lg shadow-sm p-4 relative flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">NHÂN VIÊN VẬN HÀNH</span>
            <TeamOutlined className="text-[#faad14]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{metricsData?.staff?.toLocaleString() || 0}</span>
            <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-sm">OPERATOR</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">Trực trạm Photobooth</div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#f8f9fc] rounded-xl flex flex-col p-4 gap-4">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-lg shadow-sm">
          <div className="relative max-w-md w-full flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <SearchOutlined />
            </span>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border-none bg-gray-50 rounded-md focus:ring-1 focus:ring-gray-300 text-sm transition-colors outline-none"
              placeholder="Tìm kiếm theo email, username hoặc tên khách hàng..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setSearchInput('')}>
                <CloseOutlined />
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 whitespace-nowrap">Sắp xếp:</span>
              <select
                className="block pl-2 pr-8 py-2 border-none bg-gray-50 rounded-md appearance-none focus:ring-1 focus:ring-gray-300 text-sm text-gray-700 outline-none font-medium"
                value={queryParams.sortBy}
                onChange={(e) => setQueryParams(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                <option value="createdAt">Ngày tạo (Mới nhất)</option>
                <option value="username">Tên người dùng</option>
              </select>
            </div>
            
            <button onClick={handleResetFilters} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors flex items-center gap-2">
              <CloseOutlined className="text-xs" /> Đặt Lại
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-6 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">VAI TRÒ:</span>
            <div className="flex gap-2">
              <button onClick={() => handleRoleChange('')} className={`px-3 py-1 rounded-full text-xs font-medium flex gap-1 items-center ${queryParams.role === '' ? 'bg-[#e94560] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                Tất Cả <span className={queryParams.role === '' ? 'bg-white/20 px-1.5 rounded-full' : ''}>{metricsData?.total || 0}</span>
              </button>
              <button onClick={() => handleRoleChange('admin')} className={`px-3 py-1 rounded-full text-xs font-medium flex gap-1 items-center ${queryParams.role === 'admin' ? 'bg-[#e94560] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                Admin <span className={queryParams.role === 'admin' ? 'bg-white/20 px-1.5 rounded-full' : ''}>{metricsData?.admin || 0}</span>
              </button>
              <button onClick={() => handleRoleChange('staff')} className={`px-3 py-1 rounded-full text-xs font-medium flex gap-1 items-center ${queryParams.role === 'staff' ? 'bg-[#e94560] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                Nhân Viên <span className={queryParams.role === 'staff' ? 'bg-white/20 px-1.5 rounded-full' : ''}>{metricsData?.staff || 0}</span>
              </button>
              <button onClick={() => handleRoleChange('customer')} className={`px-3 py-1 rounded-full text-xs font-medium flex gap-1 items-center ${queryParams.role === 'customer' ? 'bg-[#e94560] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                Khách Hàng <span className={queryParams.role === 'customer' ? 'bg-white/20 px-1.5 rounded-full' : ''}>{(metricsData?.total || 0) - (metricsData?.admin || 0) - (metricsData?.staff || 0)}</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TRẠNG THÁI:</span>
            <div className="flex gap-2">
              <button onClick={() => handleStatusChange('')} className={`px-3 py-1 rounded-full text-xs font-medium flex gap-1 items-center ${queryParams.isActive === '' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                Tất Cả
              </button>
              <button onClick={() => handleStatusChange('true')} className={`px-3 py-1 rounded-full text-xs font-medium flex gap-1 items-center ${queryParams.isActive === 'true' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#1890ff]"></div>
                Đang Hoạt Động ({metricsData?.active || 0})
              </button>
              <button onClick={() => handleStatusChange('false')} className={`px-3 py-1 rounded-full text-xs font-medium flex gap-1 items-center ${queryParams.isActive === 'false' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d4f]"></div>
                Đã Khóa ({metricsData?.locked || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col mt-2">
          
          {/* Table Header Row */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">Danh Mục Tài Khoản</h2>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-md">
                {data?.meta?.total ? data.meta.total.toLocaleString() : 0} kết quả
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 hidden sm:inline">Phím tắt nhanh: ESC để xóa lọc</span>
              <button onClick={handleExportCSV} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                <DownloadOutlined /> Xuất File CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold bg-white">
                  <th className="px-6 py-4">TÊN NGƯỜI DÙNG & AVATAR</th>
                  <th className="px-6 py-4">EMAIL</th>
                  <th className="px-6 py-4">USERNAME</th>
                  <th className="px-6 py-4">VAI TRÒ</th>
                  <th className="px-6 py-4">TRẠNG THÁI</th>
                  <th className="px-6 py-4">NGÀY TẠO</th>
                  <th className="px-6 py-4 text-center">CHI TIẾT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#e94560] rounded-full animate-spin mb-3"></div>
                        <p>Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-red-500">
                      <p>Có lỗi xảy ra khi tải dữ liệu.</p>
                    </td>
                  </tr>
                ) : data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <p>Không tìm thấy tài khoản nào.</p>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((account) => {
                    const isCustomer = account.role === 'customer';
                    const isStaff = account.role === 'staff';
                    const isAdmin = account.role === 'admin';
                    
                    return (
                      <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${account.username}`} alt="avatar" className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50" />
                            <div>
                              <div className="text-sm font-bold text-gray-900">{account.customer?.fullName || account.username}</div>
                              <div className="text-xs text-gray-500">ID: #{account.id.substring(0, 8).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {account.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex bg-gray-100 text-[#e94560] px-2 py-0.5 rounded-md text-xs font-bold font-mono">
                            @{account.username}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isAdmin && <span className="inline-flex bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold"><CrownOutlined className="mr-1"/> Admin</span>}
                          {isStaff && <span className="inline-flex bg-[#36c2ce] bg-opacity-20 text-[#36c2ce] px-3 py-1 rounded-full text-xs font-bold"><TeamOutlined className="mr-1"/> Nhân viên</span>}
                          {isCustomer && <span className="inline-flex bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">Khách hàng</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            account.isActive
                              ? 'bg-[#1890ff] bg-opacity-10 text-[#1890ff]'
                              : 'bg-red-50 text-red-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-[#1890ff]' : 'bg-red-500'}`}></span>
                            {account.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{new Date(account.createdAt).toLocaleDateString('vi-VN')}</div>
                          <div className="text-xs">{new Date(account.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button 
                            onClick={() => navigate(`/admin/accounts/${account.id}`)}
                            className="p-2 text-gray-400 hover:text-[#e94560] hover:bg-red-50 rounded-full transition-colors outline-none"
                          >
                            <EyeOutlined className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.meta && data.meta.total > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Hiển thị <span className="font-bold text-gray-900">{(data.meta.page - 1) * data.meta.limit + 1} - {Math.min(data.meta.page * data.meta.limit, data.meta.total)}</span> trong tổng số <span className="font-bold text-gray-900">{data.meta.total.toLocaleString()}</span> tài khoản
                
                <span className="ml-4 hidden md:inline">Số hàng:</span>
                <select 
                  className="bg-white border border-gray-200 rounded px-2 py-1 text-sm font-medium outline-none hidden md:block"
                  value={data.meta.limit}
                  onChange={(e) => handlePageChange(1, Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <Pagination
                current={data.meta.page}
                pageSize={data.meta.limit}
                total={data.meta.total}
                onChange={handlePageChange}
                showSizeChanger={false}
                className="!m-0"
                size="small"
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountsPage;
