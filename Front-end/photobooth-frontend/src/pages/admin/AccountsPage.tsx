import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, GetAccountsParams } from '@/api/accounts.api';
import { SearchOutlined, FilterOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { Pagination, Dropdown, MenuProps } from 'antd';

const AccountsPage = () => {
  const [queryParams, setQueryParams] = useState<GetAccountsParams>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    isActive: '',
  });

  const [searchInput, setSearchInput] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryParams(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounts', queryParams],
    queryFn: () => accountsApi.getAccounts(queryParams),
  });

  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams(prev => ({ ...prev, page, limit: pageSize }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQueryParams(prev => ({ ...prev, role: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQueryParams(prev => ({ ...prev, isActive: e.target.value, page: 1 }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách tài khoản quản trị và nhân viên trong hệ thống.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap">
          <PlusOutlined />
          Thêm tài khoản
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar (Search & Filters) */}
        <div className="p-4 md:p-5 border-b border-gray-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <SearchOutlined />
            </span>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 text-sm transition-colors bg-gray-50 hover:bg-white focus:bg-white outline-none"
              placeholder="Tìm kiếm theo email, username..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-36">
              <select
                className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-red-100 focus:border-red-500 text-sm bg-gray-50 hover:bg-white text-gray-700 outline-none"
                value={queryParams.role || ''}
                onChange={handleRoleChange}
              >
                <option value="">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <div className="relative w-full md:w-40">
              <select
                className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-red-100 focus:border-red-500 text-sm bg-gray-50 hover:bg-white text-gray-700 outline-none"
                value={queryParams.isActive === undefined ? '' : queryParams.isActive.toString()}
                onChange={handleStatusChange}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 bg-white transition-colors" title="Bộ lọc nâng cao">
              <FilterOutlined />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-medium">Tài khoản</th>
                <th className="px-6 py-4 font-medium">Vai trò</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium">Ngày tạo</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mb-3"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                    <p>Có lỗi xảy ra khi tải dữ liệu.</p>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <p>Không tìm thấy tài khoản nào.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.data.map((account) => {
                  const items: MenuProps['items'] = [
                    { key: 'edit', label: 'Chỉnh sửa' },
                    { key: 'reset', label: 'Reset mật khẩu' },
                    { type: 'divider' },
                    { key: 'toggle', label: account.isActive ? 'Khóa tài khoản' : 'Mở khóa', danger: account.isActive },
                  ];

                  return (
                    <tr key={account.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-50 text-red-600 flex items-center justify-center font-bold text-sm shadow-sm border border-red-100">
                              {account.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{account.username}</div>
                            <div className="text-sm text-gray-500">{account.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          account.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {account.role.charAt(0).toUpperCase() + account.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          account.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          {account.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(account.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                          <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none">
                            <MoreOutlined className="text-lg" />
                          </button>
                        </Dropdown>
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
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
            <div className="text-sm text-gray-500 hidden sm:block">
              Hiển thị <span className="font-medium text-gray-900">{(data.meta.page - 1) * data.meta.limit + 1}</span> đến{' '}
              <span className="font-medium text-gray-900">
                {Math.min(data.meta.page * data.meta.limit, data.meta.total)}
              </span>{' '}
              trong tổng số <span className="font-medium text-gray-900">{data.meta.total}</span> tài khoản
            </div>
            <Pagination
              current={data.meta.page}
              pageSize={data.meta.limit}
              total={data.meta.total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
              className="!m-0"
              size="small"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage;
