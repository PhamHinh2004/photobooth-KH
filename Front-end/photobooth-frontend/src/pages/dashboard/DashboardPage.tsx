import { Card, Row, Col, Statistic, Typography, Space, Tag } from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  PictureOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth.store'

const { Title, Text } = Typography

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user)

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: 32 }}>
        <Title level={4} style={{ marginBottom: 4 }}>
          👋 Xin chào, {user?.name || 'Admin'}!
        </Title>
        <Text type="secondary">
          Đây là tổng quan hệ thống Photobooth KH.
          <Tag color="green" style={{ marginLeft: 8 }}>Active</Tag>
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Tổng Users</span>}
              value={0}
              prefix={<UserOutlined />}
              valueStyle={{ color: 'white', fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Booking hôm nay</span>}
              value={0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: 'white', fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Ảnh đã chụp</span>}
              value={0}
              prefix={<PictureOutlined />}
              valueStyle={{ color: 'white', fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Doanh thu tháng</span>}
              value={0}
              prefix={<RiseOutlined />}
              suffix="đ"
              valueStyle={{ color: 'white', fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Info */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="🚀 Hệ thống đang hoạt động" bordered={false}>
            <Space direction="vertical" size="small">
              <Text>✅ Frontend: React + Vite + TypeScript + Ant Design</Text>
              <Text>✅ State: Zustand + localStorage persistence</Text>
              <Text>✅ Routing: React Router v6 + Protected Routes</Text>
              <Text>✅ HTTP: Axios với auto Bearer token</Text>
              <Text>✅ Backend: NestJS tại <code>http://localhost:3000/api/v1</code></Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage
