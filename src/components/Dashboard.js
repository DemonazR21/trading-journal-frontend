import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, Space, Typography, Spin, Grid } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  PlusOutlined,
  SignalFilled,
} from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const Dashboard = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: isMobile ? '16px' : '0' }}>Dashboard</Title>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto', marginTop: isMobile ? '8px' : '0' }}>
          <Button
            type="primary"
            icon={<SignalFilled />}
            onClick={() => navigate('/signals')}
            block={isMobile}
            size={isMobile ? 'large' : 'middle'}
          >
            View Signals
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/trades')}
            block={isMobile}
            size={isMobile ? 'large' : 'middle'}
          >
            New Trade
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Trades"
              value={stats?.total_trades || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Win Rate"
              value={stats?.win_rate || 0}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total P&L"
              value={stats?.total_pnl || 0}
              precision={2}
              prefix={stats?.total_pnl >= 0 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ color: stats?.total_pnl >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Open Trades"
              value={stats?.open_trades || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {stats?.profit_by_ticker && stats.profit_by_ticker.length > 0 && (
        <Card
          title="Profit by Ticker"
          style={{ marginTop: '24px' }}
        >
          <Row gutter={[16, 16]}>
            {stats.profit_by_ticker.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.ticker}>
                <Card size="small">
                  <Statistic
                    title={item.ticker}
                    value={item.total_pnl}
                    precision={2}
                    valueStyle={{
                      color: item.total_pnl >= 0 ? '#3f8600' : '#cf1322',
                      fontSize: '18px',
                    }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                    {item.trade_count} trades
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {stats?.profit_by_monitor && stats.profit_by_monitor.length > 0 && (
        <Card
          title="Profit by Monitor Type"
          style={{ marginTop: '24px' }}
        >
          <Row gutter={[16, 16]}>
            {stats.profit_by_monitor.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.monitor_type}>
                <Card size="small">
                  <Statistic
                    title={item.monitor_type}
                    value={item.total_pnl}
                    precision={2}
                    valueStyle={{
                      color: item.total_pnl >= 0 ? '#3f8600' : '#cf1322',
                      fontSize: '18px',
                    }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                    {item.trade_count} trades
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
