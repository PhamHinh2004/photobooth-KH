import { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { socialApi } from '../../api/social.api';
import { useNavigate } from 'react-router-dom';

export default function MyPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const navigate = useNavigate();

  const fetchPosts = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const res = await socialApi.getMyPosts(page, limit);
      setPosts(res.data || []);
      setPagination({
        current: page,
        pageSize: limit,
        total: res.total || 0,
      });
    } catch (error) {
      console.error('Failed to load my posts', error);
      message.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchPosts(pagination.current, pagination.pageSize);
  };

  const handleDelete = async (id: string) => {
    try {
      await socialApi.deletePost(id);
      message.success('Xóa bài viết thành công');
      fetchPosts(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to delete post', error);
      message.error('Có lỗi xảy ra khi xóa bài viết');
    }
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'cover_image_url',
      key: 'cover_image_url',
      render: (url: string) => (
        <img src={url} alt="Cover" className="w-16 h-20 object-cover rounded-md border border-gray-200" />
      ),
    },
    {
      title: 'Loại chụp',
      key: 'capture_type',
      render: (_: any, record: any) => {
        const isGroup = record.session?.session_type === 'group';
        const groupName = record.session?.room?.name || record.session?.room?.room_code;
        return (
          <Space direction="vertical" size={2}>
            <Tag color={isGroup ? 'magenta' : 'cyan'}>{isGroup ? 'Chụp Nhóm' : 'Chụp Đơn'}</Tag>
            {isGroup && <span className="max-w-40 truncate text-xs text-zinc-500">{groupName || 'Phòng nhóm'}</span>}
          </Space>
        );
      },
    },
    {
      title: 'Nội dung',
      dataIndex: 'caption',
      key: 'caption',
      render: (text: string) => (
        <div className="max-w-xs line-clamp-2" title={text}>
          {text || <span className="text-gray-400 italic">Không có nội dung</span>}
        </div>
      ),
    },
    {
      title: 'Tương tác',
      key: 'stats',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tag color="magenta">❤️ {record.likes_count}</Tag>
          <Tag color="blue">💬 {record.comments_count}</Tag>
        </Space>
      ),
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            onClick={() => navigate(`/reviews/${record.id}`)}
          >
            Xem
          </Button>
          <Popconfirm
            title="Xóa bài viết"
            description="Bạn có chắc chắn muốn xóa bài viết này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
          <h1 className="text-2xl font-bold text-zinc-800 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-500">article</span>
            Quản lý bài viết của bạn
          </h1>
          <Table 
            columns={columns} 
            dataSource={posts} 
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
          />
        </div>
      </div>
    </div>
  );
}
