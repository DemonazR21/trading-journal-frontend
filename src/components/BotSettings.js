import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Switch, Slider, InputNumber, Button, Space, Typography,
  Row, Col, Spin, message, Tag, Table, Tabs, Divider, Alert
} from 'antd';
import {
  RobotOutlined, SettingOutlined, HistoryOutlined,
  CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import { api } from '../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DEFAULT_CONFIG = {
  enabled: false,
  max_daily_trades: 20,
  max_open_positions: 5,
  balance_utilization: 0.95,
  risk_per_trade: 0.02,
  leverage: 10,
};

const BOT_DEFINITIONS = [
  {
    name: 'spot-trader-uat',
    label: 'Spot Trader (UAT)',
    description: 'Testnet spot trading - BUY only',
    type: 'SPOT',
    showLeverage: false,
  },
  {
    name: 'futures-trader-uat',
    label: 'Futures Trader (UAT)',
    description: 'Testnet futures - LONG & SHORT, isolated margin',
    type: 'FUTURES',
    showLeverage: true,
  },
];

function BotConfigCard({ botDef, config, onSave, saving }) {
  const [form, setForm] = useState({ ...DEFAULT_CONFIG, ...config });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({ ...DEFAULT_CONFIG, ...config });
    setDirty(false);
  }, [config]);

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    await onSave(botDef.name, form);
    setDirty(false);
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>{botDef.label}</span>
          {form.enabled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">Enabled</Tag>
          ) : (
            <Tag icon={<StopOutlined />} color="default">Disabled</Tag>
          )}
        </Space>
      }
      extra={
        <Switch
          checked={form.enabled}
          onChange={v => update('enabled', v)}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      }
      style={{ marginBottom: 16 }}
    >
      <Text type="secondary">{botDef.description}</Text>
      <Divider style={{ margin: '12px 0' }} />

      <Row gutter={[24, 16]}>
        <Col xs={24} sm={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Max Daily Trades</Text>
          </div>
          <InputNumber
            min={1} max={100}
            value={form.max_daily_trades}
            onChange={v => update('max_daily_trades', v)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Max Open Positions</Text>
          </div>
          <InputNumber
            min={1} max={20}
            value={form.max_open_positions}
            onChange={v => update('max_open_positions', v)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Balance Utilization: {Math.round(form.balance_utilization * 100)}%</Text>
          </div>
          <Slider
            min={10} max={100} step={5}
            value={Math.round(form.balance_utilization * 100)}
            onChange={v => update('balance_utilization', v / 100)}
            marks={{ 10: '10%', 50: '50%', 95: '95%', 100: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Risk Per Trade: {(form.risk_per_trade * 100).toFixed(1)}%</Text>
          </div>
          <Slider
            min={0.5} max={10} step={0.5}
            value={form.risk_per_trade * 100}
            onChange={v => update('risk_per_trade', v / 100)}
            marks={{ 0.5: '0.5%', 2: '2%', 5: '5%', 10: '10%' }}
          />
        </Col>
        {botDef.showLeverage && (
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Leverage: {form.leverage}x</Text>
            </div>
            <Slider
              min={1} max={50} step={1}
              value={form.leverage}
              onChange={v => update('leverage', v)}
              marks={{ 1: '1x', 10: '10x', 25: '25x', 50: '50x' }}
            />
          </Col>
        )}
      </Row>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={handleSave}
          loading={saving}
          disabled={!dirty}
        >
          Save Settings
        </Button>
      </div>
    </Card>
  );
}

function BotTradesTable() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBotTrades({ limit: 50 })
      .then(res => setTrades(res.data))
      .catch(() => message.error('Failed to load bot trades'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: v => dayjs(v).format('DD/MM HH:mm'),
      width: 100,
    },
    {
      title: 'Bot',
      dataIndex: 'bot_name',
      key: 'bot_name',
      render: v => <Tag>{v}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'trade_type',
      key: 'trade_type',
      render: v => <Tag color={v === 'SPOT' ? 'blue' : 'purple'}>{v}</Tag>,
    },
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      render: v => <Text strong>{v}</Text>,
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      render: v => <Tag color={v === 'LONG' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: 'Entry',
      dataIndex: 'entry_price',
      key: 'entry_price',
      render: v => v ? `$${parseFloat(v).toFixed(2)}` : '-',
    },
    {
      title: 'P&L',
      dataIndex: 'pnl',
      key: 'pnl',
      render: v => v ? (
        <Text type={parseFloat(v) >= 0 ? 'success' : 'danger'}>
          ${parseFloat(v).toFixed(2)}
        </Text>
      ) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => <Tag color={v === 'OPEN' ? 'processing' : v === 'CLOSED' ? 'default' : 'warning'}>{v}</Tag>,
    },
  ];

  return (
    <Table
      dataSource={trades}
      columns={columns}
      rowKey="id"
      loading={loading}
      size="small"
      pagination={{ pageSize: 20 }}
      locale={{ emptyText: 'No bot trades yet' }}
    />
  );
}

function BotSettings() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfigs = useCallback(async () => {
    try {
      const res = await api.getBotConfigs();
      const configMap = {};
      (res.data || []).forEach(c => { configMap[c.bot_name] = c; });
      setConfigs(configMap);
    } catch (err) {
      // No configs yet is normal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const handleSave = async (botName, formData) => {
    setSaving(true);
    try {
      await api.updateBotConfig(botName, formData);
      message.success(`${botName} settings saved`);
      await loadConfigs();
    } catch (err) {
      message.error(`Failed to save: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;
  }

  const tabItems = [
    {
      key: 'settings',
      label: <span><SettingOutlined /> Settings</span>,
      children: (
        <>
          <Alert
            message="Bot Configuration"
            description="Configure your automated trading bots. Changes take effect within 60 seconds. UAT bots trade on Binance testnet with fake money."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          {BOT_DEFINITIONS.map(botDef => (
            <BotConfigCard
              key={botDef.name}
              botDef={botDef}
              config={configs[botDef.name] || {}}
              onSave={handleSave}
              saving={saving}
            />
          ))}
        </>
      ),
    },
    {
      key: 'trades',
      label: <span><HistoryOutlined /> Bot Trades</span>,
      children: <BotTradesTable />,
    },
  ];

  return (
    <div>
      <Title level={3}><RobotOutlined /> Bot Settings</Title>
      <Tabs items={tabItems} />
    </div>
  );
}

export default BotSettings;
