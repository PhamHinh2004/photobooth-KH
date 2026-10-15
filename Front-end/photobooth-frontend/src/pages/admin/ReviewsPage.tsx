import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { reviewsAdminApi, GetReviewsParams } from '@/api/reviews.admin.api';
import { 
  SearchOutlined, 
  ReloadOutlined,
  ExportOutlined,
  StarFilled,
  HeartFilled,
  MessageFilled,
  EyeFilled,
  CheckCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  PushpinOutlined,
  PushpinFilled
} from '@ant-design/icons';
import { Spin, Select, message, Popconfirm } from 'antd';

const { Option } = Select;

const ReviewsPage = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<GetReviewsParams>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    rating: undefined,
    sortBy: 'created_at',
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
    queryKey: ['adminReviewsMetrics'],
    queryFn: reviewsAdminApi.getMetrics
  });

  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['adminReviews', params],
    queryFn: () => reviewsAdminApi.getReviews(params),
    placeholderData: keepPreviousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => reviewsAdminApi.updateStatus(id, status),
    onSuccess: () => {
      message.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminReviewsMetrics'] });
    }
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string, isPinned: boolean }) => reviewsAdminApi.updatePin(id, isPinned),
    onSuccess: () => {
      message.success('Cập nhật ghim thành công');
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsAdminApi.deleteReview(id),
    onSuccess: () => {
      message.success('Đã xóa bài viết');
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminReviewsMetrics'] });
    }
  });

  const handleExport = async () => {
    try {
      const blob = await reviewsAdminApi.exportCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reviews_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed', error);
      message.error('Xuất CSV thất bại');
    }
  };

  const handleReset = () => {
    setSearchInput('');
    setParams({
      page: 1,
      limit: 10,
      search: '',
      status: '',
      rating: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Danh Sách Đánh Giá & Bài Viết</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">HỆ THỐNG</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-bold text-[#e94560] uppercase tracking-wider">QUẢN LÝ ĐÁNH GIÁ & BÀI VIẾT</span>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TỔNG BÀI ĐÁNH GIÁ</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  {isMetricsLoading ? <Spin size="small" /> : metrics?.totalPosts.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">BÀI ĐÃ ẨN</span>
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <StopOutlined />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-red-500">
                  {isMetricsLoading ? <Spin size="small" /> : metrics?.pendingPosts.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  cần xử lý
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ĐIỂM TRUNG BÌNH</span>
                <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
                  <StarFilled />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  {isMetricsLoading ? <Spin size="small" /> : `${metrics?.averageRating}/5`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TỔNG LƯỢT TƯƠNG TÁC</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <HeartFilled />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  {isMetricsLoading ? <Spin size="small" /> : (metrics?.totalInteractions || 0) > 1000 ? `${((metrics?.totalInteractions || 0)/1000).toFixed(1)}K` : metrics?.totalInteractions}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm relative z-20">
          <div className="relative w-full lg:w-[500px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchOutlined className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e94560] focus:border-transparent sm:text-sm transition-all font-medium"
              placeholder="Tìm kiếm theo nội dung, ID ảnh..."
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
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TRẠNG THÁI</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { label: 'Tất cả', value: '' },
                { label: 'Đã duyệt', value: 'published' },
                { label: 'Đã ẩn', value: 'hidden' }
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setParams(prev => ({ ...prev, status: opt.value, page: 1 }))}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    (params.status || '') === opt.value 
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
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">SỐ SAO</span>
             <Select
                value={params.rating || ''}
                onChange={(val) => setParams(prev => ({ ...prev, rating: val === '' ? undefined : Number(val), page: 1 }))}
                style={{ width: 150 }}
                size="middle"
                className="font-medium"
             >
                <Option value="">Tất cả</Option>
                <Option value="5">5 Sao</Option>
                <Option value="4">4 Sao</Option>
                <Option value="3">3 Sao</Option>
                <Option value="2">2 Sao</Option>
                <Option value="1">1 Sao</Option>
             </Select>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">SẮP XẾP</span>
             <Select
                value={params.sortBy || 'created_at'}
                onChange={(val) => setParams(prev => ({ ...prev, sortBy: val, page: 1 }))}
                style={{ width: 180 }}
                size="middle"
                className="font-medium"
             >
                <Option value="created_at">Mới nhất</Option>
                <Option value="likes_count">Tương tác nhiều nhất</Option>
                <Option value="rating">Đánh giá cao nhất</Option>
             </Select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden border border-gray-100 border-t-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Bài viết & Ảnh chụp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Tác giả & Điểm</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100">Nội dung ý kiến</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Tương tác</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isReviewsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Spin size="large" />
                    </td>
                  </tr>
                ) : reviewsData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                      Không tìm thấy đánh giá nào phù hợp
                    </td>
                  </tr>
                ) : (
                  reviewsData?.data?.map((post: any) => (
                    <tr key={post.id} className={`hover:bg-gray-50/80 transition-colors group ${post.is_pinned ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-6 py-4 w-[280px]">
                        <div className="flex items-start gap-3">
                          <img 
                            src={post.cover_image_url}
                            alt="Cover"
                            className="w-16 h-20 rounded-md object-cover border border-gray-200 flex-shrink-0"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#e94560] mb-0.5 uppercase tracking-wider break-all">#{post.id.substring(0, 8)}</div>
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{post.session?.photo?.frame?.name || 'Không dùng Frame'}</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(post.created_at).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-800">{post.account?.username}</span>
                        </div>
                        <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          Đánh giá: 
                          <span className="text-yellow-400 flex items-center">
                            {post.rating || 0} <StarFilled className="ml-0.5 text-[10px]" />
                          </span>
                        </div>
                        <div className="mt-1">
                           <span className="text-[9px] font-bold text-[#36c2ce] bg-[#36c2ce] bg-opacity-10 px-1.5 py-0.5 rounded uppercase">
                             {post.session?.session_type === 'SINGLE' ? 'CHỤP ĐƠN' : 'CHỤP NHÓM'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[250px]">
                        <p className="text-sm text-gray-600 line-clamp-3">"{post.caption || 'Không có nội dung'}"</p>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1 items-center justify-center">
                           <div className="flex items-center gap-1 text-xs font-bold text-red-500"><HeartFilled /> {post.likes_count}</div>
                           <div className="flex items-center gap-1 text-xs font-bold text-blue-500"><MessageFilled /> {post.comments_count}</div>
                           <div className="flex items-center gap-1 text-xs font-bold text-gray-500"><EyeFilled /> {post.views_count}</div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {post.status === 'published' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#36c2ce] bg-opacity-10 text-[#2597a1] uppercase border border-[#36c2ce]/20">
                            ĐANG HIỂN THỊ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase border border-gray-200">
                            ĐÃ ẨN
                          </span>
                        )}
                        {post.is_pinned && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-yellow-400 text-white uppercase">
                              PINNED
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => pinMutation.mutate({ id: post.id, isPinned: !post.is_pinned })}
                            className={`w-7 h-7 rounded border flex items-center justify-center transition-colors shadow-sm ${post.is_pinned ? 'bg-yellow-50 border-yellow-300 text-yellow-500 hover:bg-yellow-100' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
                            title={post.is_pinned ? 'Bỏ ghim' : 'Ghim bài'}
                          >
                            {post.is_pinned ? <PushpinFilled className="text-xs" /> : <PushpinOutlined className="text-xs" />}
                          </button>
                          
                          {post.status === 'hidden' && (
                            <button 
                              onClick={() => statusMutation.mutate({ id: post.id, status: 'published' })}
                              className="w-7 h-7 rounded bg-white border border-gray-200 text-green-500 hover:border-green-300 hover:bg-green-50 flex items-center justify-center transition-colors shadow-sm"
                              title="Hiện bài"
                            >
                              <CheckCircleOutlined className="text-xs" />
                            </button>
                          )}
                          
                          {post.status === 'published' && (
                            <button 
                              onClick={() => statusMutation.mutate({ id: post.id, status: 'hidden' })}
                              className="w-7 h-7 rounded bg-white border border-gray-200 text-orange-500 hover:border-orange-300 hover:bg-orange-50 flex items-center justify-center transition-colors shadow-sm"
                              title="Ẩn bài"
                            >
                              <StopOutlined className="text-xs" />
                            </button>
                          )}

                          <Popconfirm
                            title="Xóa bài viết"
                            description="Bạn có chắc chắn muốn xóa bài viết này không?"
                            onConfirm={() => deleteMutation.mutate(post.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <button 
                              className="w-7 h-7 rounded bg-white border border-gray-200 text-red-500 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
                              title="Xóa"
                            >
                              <DeleteOutlined className="text-xs" />
                            </button>
                          </Popconfirm>
                        </div>
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
              Hiển thị <span className="font-bold text-gray-900">{(params.page! - 1) * params.limit! + (reviewsData?.data?.length ? 1 : 0)}</span> - <span className="font-bold text-gray-900">{Math.min(params.page! * params.limit!, reviewsData?.total || 0)}</span> trong số <span className="font-bold text-gray-900">{reviewsData?.total || 0}</span> đánh giá
            </div>
            <div className="flex gap-1">
              <button
                disabled={params.page === 1}
                onClick={() => setParams(prev => ({ ...prev, page: prev.page! - 1 }))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 transition-colors font-medium"
              >
                &lt;
              </button>
              
              {[...Array(reviewsData?.totalPages || 1)].map((_, i) => (
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
                return i === 0 || i === (reviewsData?.totalPages || 1) - 1 || Math.abs(i + 1 - p) <= 1;
              })}
              
              <button
                disabled={params.page === (reviewsData?.totalPages || 1)}
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

export default ReviewsPage;
