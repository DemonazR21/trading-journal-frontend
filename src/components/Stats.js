import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Table, Progress } from 'antd';
import {
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

const Stats = () => {
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

  const tickerColumns = [
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Trades',
      dataIndex: 'trade_count',
      key: 'trade_count',
    },
    {
      title: 'Total P&L',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      render: (value) => (
        <span style={{ color: value >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
          ${parseFloat(value).toFixed(2)}
        </span>
      ),
      sorter: (a, b) => a.total_pnl - b.total_pnl,
    },
  ];

  const monitorColumns = [
    {
      title: 'Monitor Type',
      dataIndex: 'monitor_type',
      key: 'monitor_type',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Trades',
      dataIndex: 'trade_count',
      key: 'trade_count',
    },
    {
      title: 'Total P&L',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      render: (value) => (
        <span style={{ color: value >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
          ${parseFloat(value).toFixed(2)}
        </span>
      ),
      sorter: (a, b) => a.total_pnl - b.total_pnl,
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>Trading Statistics</Title>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
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
              title="Open Trades"
              value={stats?.open_trades || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Closed Trades"
              value={stats?.closed_trades || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cancelled Trades"
              value={stats?.cancelled_trades || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12} lg={8}>
          <Card>
            <Statistic
              title="Win Rate"
              value={stats?.win_rate || 0}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Progress
              percent={stats?.win_rate || 0}
              strokeColor={stats?.win_rate >= 50 ? '#3f8600' : '#faad14'}
              style={{ marginTop: '12px' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
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
        <Col xs={24} md={12} lg={8}>
          <Card>
            <Statistic
              title="Average P&L per Trade"
              value={
                stats?.closed_trades > 0
                  ? (stats?.total_pnl / stats?.closed_trades).toFixed(2)
                  : 0
              }
              precision={2}
              prefix="$"
              valueStyle={{
                color:
                  stats?.closed_trades > 0 && stats?.total_pnl / stats?.closed_trades >= 0
                    ? '#3f8600'
                    : '#cf1322',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Win/Loss Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Winning Trades"
              value={stats?.winning_trades || 0}
              valueStyle={{ color: '#3f8600' }}
              suffix={`/ ${stats?.closed_trades || 0}`}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Losing Trades"
              value={stats?.losing_trades || 0}
              valueStyle={{ color: '#cf1322' }}
              suffix={`/ ${stats?.closed_trades || 0}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Profit by Ticker */}
      {stats?.profit_by_ticker && stats.profit_by_ticker.length > 0 && (
        <Card
          title="Profit by Ticker"
          style={{ marginBottom: '24px' }}
        >
          <Table
            columns={tickerColumns}
            dataSource={stats.profit_by_ticker}
            rowKey="ticker"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Profit by Monitor Type */}
      {stats?.profit_by_monitor && stats.profit_by_monitor.length > 0 && (
        <Card title="Profit by Monitor Type">
          <Table
            columns={monitorColumns}
            dataSource={stats.profit_by_monitor}
            rowKey="monitor_type"
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default Stats;
