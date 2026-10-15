import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { customersAdminApi, GetCustomersParams } from '@/api/customers.admin.api';
import { 
  SearchOutlined, 
  ReloadOutlined,
  ExportOutlined,
  ArrowRightOutlined,
  ManOutlined,
  WomanOutlined,
  LinkOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Spin, Select } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const CustomersPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useState<GetCustomersParams>({
    page: 1,
    limit: 10,
    search: '',
    gender: '',
    city: '',
    hasAccount: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  const [searchInput, setSearchInput] = useState('');

  // Handle debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['adminCustomersMetrics'],
    queryFn: customersAdminApi.getMetrics
  });

  const { data: customersData, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['adminCustomers', params],
    queryFn: () => customersAdminApi.getCustomers(params),
    placeholderData: keepPreviousData,
  });

  const handleExport = async () => {
    try {
      const blob = await customersAdminApi.exportCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const handleReset = () => {
    setSearchInput('');
    setParams({
      page: 1,
      limit: 10,
      search: '',
      gender: '',
      city: '',
      hasAccount: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Danh Sách Khách Hàng Hệ Thống</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">HỆ THỐNG</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-bold text-[#e94560] uppercase tracking-wider">QUẢN LÝ KHÁCH HÀNG</span>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TỔNG SỐ KHÁCH HÀNG</span>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserOutlined />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  {isMetricsLoading ? <Spin size="small" /> : metrics?.totalCustomers.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +12.4% <span className="text-gray-400 font-medium">so với tháng trước</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ĐÃ LIÊN KẾT TÀI KHOẢN</span>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <LinkOutlined />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  {isMetricsLoading ? <Spin size="small" /> : metrics?.linkedAccounts.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-indigo-500">
                  ({metrics?.linkedPercentage || 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${metrics?.linkedPercentage || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TỶ LỆ GỬI FEEDBACK</span>
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  {isMetricsLoading ? <Spin size="small" /> : (Math.round((metrics?.totalCustomers || 0) * ((metrics?.feedbackRate || 0)/100))).toLocaleString()}
                </span>
                <span className="text-sm font-bold text-amber-500">
                  {metrics?.feedbackRate || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${metrics?.feedbackRate || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-pink-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TỶ LỆ CHỤP QUAY LẠI</span>
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  {isMetricsLoading ? <Spin size="small" /> : `${metrics?.returnRate || 0}%`}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2 font-medium">
                • Chu kỳ: 12.5 ngày/lần
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm relative z-20">
          <div className="relative w-full lg:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchOutlined className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e94560] focus:border-transparent sm:text-sm transition-all font-medium"
              placeholder="Tìm kiếm theo họ tên, số điện thoại, ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            <button 
              onClick={handleReset}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-bold transition-colors border border-gray-200"
            >
              <ReloadOutlined /> Đặt lại
            </button>
            <button 
              onClick={handleExport}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <ExportOutlined /> Xuất CSV
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white px-6 py-4 flex flex-wrap items-center gap-6 border-b border-gray-100 shadow-sm relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">GIỚI TÍNH</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { label: 'Tất cả', value: '' },
                { label: 'Nam', value: 'male' },
                { label: 'Nữ', value: 'female' },
                { label: 'Khác', value: 'others' }
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setParams(prev => ({ ...prev, gender: opt.value, page: 1 }))}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    (params.gender || '') === opt.value 
                      ? 'bg-[#e94560] text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">THÀNH PHỐ</span>
             <Select
                value={params.city || ''}
                onChange={(val) => setParams(prev => ({ ...prev, city: val, page: 1 }))}
                style={{ width: 150 }}
                size="middle"
                className="font-medium"
             >
                <Option value="">Tất cả thành phố</Option>
                <Option value="Hà Nội">Hà Nội</Option>
                <Option value="Hồ Chí Minh">TP. Hồ Chí Minh</Option>
                <Option value="Đà Nẵng">Đà Nẵng</Option>
                <Option value="Hải Phòng">Hải Phòng</Option>
             </Select>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">SẮP XẾP</span>
             <Select
                value={params.sortBy || 'createdAt'}
                onChange={(val) => setParams(prev => ({ ...prev, sortBy: val, page: 1 }))}
                style={{ width: 180 }}
                size="middle"
                className="font-medium"
             >
                <Option value="createdAt">Mới nhất (Check-in)</Option>
                <Option value="fullName">Tên (A-Z)</Option>
             </Select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden border border-gray-100 border-t-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Khách Hàng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Số Điện Thoại</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Tỉnh/Thành Phố</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Giới Tính</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Trạng Thái Liên Kết</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Check-in Đầu Tiên</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isCustomersLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Spin size="large" />
                    </td>
                  </tr>
                ) : customersData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                      Không tìm thấy khách hàng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  customersData?.data?.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={customer.image || `https://api.dicebear.com/7.x/initials/svg?seed=${customer.fullName}`}
                            alt={customer.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${customer.fullName}`;
                            }}
                          />
                          <div>
                            <div className="text-sm font-bold text-gray-900">{customer.fullName}</div>
                            <div className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase">ID: {customer.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-700">{customer.phoneNumber || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-medium">{customer.account?.email || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-700">{customer.city || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {customer.gender === 'male' ? (
                          <ManOutlined className="text-blue-500 text-lg" title="Nam" />
                        ) : customer.gender === 'female' ? (
                          <WomanOutlined className="text-pink-500 text-lg" title="Nữ" />
                        ) : (
                          <span className="text-gray-400 font-medium text-sm">Khác</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {customer.account_id ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#36c2ce] bg-opacity-20 text-[#2597a1]">
                            ĐÃ CÓ TÀI KHOẢN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                            CHƯA LIÊN KẾT
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">
                          {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate(`/admin/customers/${customer.id}`)}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-[#e94560] hover:text-white flex items-center justify-center transition-colors border border-gray-200 hover:border-[#e94560] shadow-sm ml-auto"
                          title="Xem chi tiết"
                        >
                          <ArrowRightOutlined className="text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500 font-medium">
              Hiển thị <span className="font-bold text-gray-900">{(params.page! - 1) * params.limit! + 1}</span> - <span className="font-bold text-gray-900">{Math.min(params.page! * params.limit!, customersData?.meta?.total || 0)}</span> trong số <span className="font-bold text-gray-900">{customersData?.meta?.total || 0}</span> khách hàng
            </div>
            <div className="flex gap-1">
              <button
                disabled={params.page === 1}
                onClick={() => setParams(prev => ({ ...prev, page: prev.page! - 1 }))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 transition-colors font-medium"
              >
                &lt;
              </button>
              
              {[...Array(customersData?.meta?.totalPages || 1)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setParams(prev => ({ ...prev, page: i + 1 }))}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    params.page === i + 1 
                      ? 'bg-[#e94560] text-white shadow-sm border border-[#e94560]' 
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              )).filter((_, i) => {
                const p = params.page || 1;
                return i === 0 || i === (customersData?.meta?.totalPages || 1) - 1 || Math.abs(i + 1 - p) <= 1;
              })}
              
              <button
                disabled={params.page === (customersData?.meta?.totalPages || 1)}
                onClick={() => setParams(prev => ({ ...prev, page: prev.page! + 1 }))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 transition-colors font-medium"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomersPage;
