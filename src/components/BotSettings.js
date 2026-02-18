import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Switch, Slider, InputNumber, Button, Space, Typography, Input, Statistic,
  Row, Col, Spin, message, Tag, Table, Tabs, Divider, Alert, Empty, Modal, Form, Tooltip
} from 'antd';
import {
  RobotOutlined, SettingOutlined, HistoryOutlined, BarChartOutlined,
  CheckCircleOutlined, StopOutlined, KeyOutlined, SafetyOutlined,
  ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined, DollarOutlined,
  EditOutlined, WalletOutlined
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

function ApiKeysSection({ botName }) {
  const [keyInfo, setKeyInfo] = useState({ has_keys: false, api_key_masked: '' });
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.getBotKeys(botName)
      .then(res => setKeyInfo(res.data))
      .catch(() => {});
  }, [botName]);

  const handleSave = async () => {
    if (!apiKey || !apiSecret) {
      message.warning('Both API Key and Secret are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.saveBotKeys(botName, { api_key: apiKey, api_secret: apiSecret });
      setKeyInfo(res.data);
      setApiKey('');
      setApiSecret('');
      setEditing(false);
      message.success('API keys saved to Vault');
    } catch (err) {
      message.error(`Failed to save keys: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 8 }}>
      <Space style={{ marginBottom: 12 }}>
        <KeyOutlined />
        <Text strong>API Keys</Text>
        {keyInfo.has_keys ? (
          <Tag icon={<SafetyOutlined />} color="green">Stored in Vault</Tag>
        ) : (
          <Tag color="warning">Not configured</Tag>
        )}
      </Space>

      {keyInfo.has_keys && !editing && (
        <div>
          <Text type="secondary">Key: {keyInfo.api_key_masked}</Text>
          <Button type="link" size="small" onClick={() => setEditing(true)} style={{ marginLeft: 8 }}>
            Update
          </Button>
        </div>
      )}

      {(!keyInfo.has_keys || editing) && (
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <Input.Password
              placeholder="API Key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Input.Password
              placeholder="API Secret"
              value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
            />
          </Col>
          <Col xs={24}>
            <Space>
              <Button
                type="primary"
                icon={<SafetyOutlined />}
                onClick={handleSave}
                loading={saving}
                size="small"
              >
                Save to Vault
              </Button>
              {editing && (
                <Button size="small" onClick={() => { setEditing(false); setApiKey(''); setApiSecret(''); }}>
                  Cancel
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      )}
    </div>
  );
}

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

      <Divider style={{ margin: '16px 0 8px' }} />
      <ApiKeysSection botName={botDef.name} />
    </Card>
  );
}

function BotBalanceCards() {
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    api.getBotBalances()
      .then(res => setBalances(res.data))
      .catch(() => {});
  }, []);

  if (!balances.length) return null;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {balances.map(b => (
        <Col xs={24} sm={12} key={b.bot_name}>
          <Card size="small">
            <Statistic
              title={<span><WalletOutlined /> {b.bot_name}</span>}
              value={b.balance}
              precision={2}
              prefix="$"
              suffix="USDT"
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {b.open_positions} open positions | Updated {dayjs(b.updated_at).format('HH:mm:ss')}
            </Text>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function BotTradesTable() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTrade, setEditingTrade] = useState(null);
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const loadTrades = useCallback(() => {
    setLoading(true);
    api.getBotTrades({ limit: 50 })
      .then(res => setTrades(res.data))
      .catch(() => message.error('Failed to load bot trades'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  const handleEdit = (record) => {
    setEditingTrade(record);
    editForm.setFieldsValue({
      stop_loss: record.stop_loss ? parseFloat(record.stop_loss) : null,
      target_1: record.target_1 ? parseFloat(record.target_1) : null,
      target_2: record.target_2 ? parseFloat(record.target_2) : null,
      target_3: record.target_3 ? parseFloat(record.target_3) : null,
    });
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      await api.updateBotTrade(editingTrade.id, values);
      message.success('Trade targets updated');
      setEditingTrade(null);
      loadTrades();
    } catch (err) {
      if (err.response) {
        message.error(`Failed: ${err.response?.data?.detail || err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const fmtPrice = (v) => {
    if (!v) return '-';
    const p = parseFloat(v);
    return p < 1 ? `$${p.toFixed(6)}` : p < 10 ? `$${p.toFixed(4)}` : `$${p.toFixed(2)}`;
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: v => dayjs(v).format('DD/MM HH:mm'),
      width: 100,
    },
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      render: (v, r) => <span><Text strong>{v}</Text> <Tag color={r.direction === 'LONG' ? 'green' : 'red'} style={{fontSize: 10}}>{r.direction}</Tag></span>,
    },
    {
      title: 'Entry',
      dataIndex: 'entry_price',
      key: 'entry_price',
      render: fmtPrice,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (v, record) => {
        if (!v) return '-';
        const qty = parseFloat(v);
        const coin = record.ticker ? record.ticker.replace('-USD', '') : '';
        return <span>{qty < 1 ? qty.toFixed(6) : qty < 100 ? qty.toFixed(2) : qty.toFixed(0)} <Text type="secondary">{coin}</Text></span>;
      },
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => {
        if (!record.quantity || !record.entry_price) return '-';
        const val = parseFloat(record.quantity) * parseFloat(record.entry_price);
        return `$${val.toFixed(2)}`;
      },
    },
    {
      title: 'SL',
      dataIndex: 'stop_loss',
      key: 'stop_loss',
      render: v => v ? <Text type="danger">{fmtPrice(v)}</Text> : '-',
    },
    {
      title: 'TP1 / TP2 / TP3',
      key: 'targets',
      render: (_, r) => {
        const t1 = r.target_1 ? fmtPrice(r.target_1) : '-';
        const t2 = r.target_2 ? fmtPrice(r.target_2) : '-';
        const t3 = r.target_3 ? fmtPrice(r.target_3) : '-';
        return <Text type="success" style={{fontSize: 12}}>{t1} / {t2} / {t3}</Text>;
      },
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
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_, record) => record.status === 'OPEN' ? (
        <Tooltip title="Edit SL / TP">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Tooltip>
      ) : null,
    },
  ];

  return (
    <>
      <BotBalanceCards />
      <Table
        dataSource={trades}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: 'No bot trades yet' }}
        scroll={{ x: 900 }}
      />
      <Modal
        title={editingTrade ? `Edit SL/TP - ${editingTrade.ticker} ${editingTrade.direction}` : 'Edit Trade'}
        open={!!editingTrade}
        onOk={handleSaveEdit}
        onCancel={() => setEditingTrade(null)}
        confirmLoading={saving}
        okText="Save"
      >
        {editingTrade && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Entry: {fmtPrice(editingTrade.entry_price)} | Qty: {parseFloat(editingTrade.quantity || 0).toFixed(4)}
            </Text>
          </div>
        )}
        <Form form={editForm} layout="vertical">
          <Form.Item name="stop_loss" label="Stop Loss">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="Stop Loss price" />
          </Form.Item>
          <Form.Item name="target_1" label="Take Profit 1">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="TP1 price" />
          </Form.Item>
          <Form.Item name="target_2" label="Take Profit 2">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="TP2 price" />
          </Form.Item>
          <Form.Item name="target_3" label="Take Profit 3">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="TP3 price" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function BotStatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBotStats()
      .then(res => setStats(res.data))
      .catch(() => message.error('Failed to load bot stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;
  if (!stats || !stats.overall || !stats.overall.total_trades) {
    return <Empty description="No bot trades yet - statistics will appear after the first trade" />;
  }

  const { overall, daily, by_ticker, per_bot } = stats;
  const pnlColor = overall.total_pnl >= 0 ? '#3f8600' : '#cf1322';

  const dailyColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
    { title: 'Trades', dataIndex: 'trades', key: 'trades', width: 70 },
    { title: 'Wins', dataIndex: 'wins', key: 'wins', width: 60,
      render: v => <Text type="success">{v}</Text> },
    { title: 'Losses', dataIndex: 'losses', key: 'losses', width: 70,
      render: v => <Text type="danger">{v}</Text> },
    { title: 'P&L', dataIndex: 'daily_pnl', key: 'daily_pnl',
      render: v => (
        <Text style={{ color: v >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
          {v >= 0 ? '+' : ''}${v.toFixed(2)}
        </Text>
      )},
  ];

  const tickerColumns = [
    { title: 'Ticker', dataIndex: 'ticker', key: 'ticker',
      render: v => <Text strong>{v}</Text> },
    { title: 'Trades', dataIndex: 'trades', key: 'trades', width: 70 },
    { title: 'Wins', dataIndex: 'wins', key: 'wins', width: 60 },
    { title: 'P&L', dataIndex: 'ticker_pnl', key: 'ticker_pnl',
      render: v => (
        <Text style={{ color: v >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
          {v >= 0 ? '+' : ''}${v.toFixed(2)}
        </Text>
      )},
  ];

  const botColumns = [
    { title: 'Bot', dataIndex: 'bot_name', key: 'bot_name', render: v => <Tag>{v}</Tag> },
    { title: 'Type', dataIndex: 'trade_type', key: 'trade_type',
      render: v => <Tag color={v === 'SPOT' ? 'blue' : 'purple'}>{v}</Tag> },
    { title: 'Total', dataIndex: 'total_trades', key: 'total_trades', width: 60 },
    { title: 'Open', dataIndex: 'open_trades', key: 'open_trades', width: 60 },
    { title: 'Closed', dataIndex: 'closed_trades', key: 'closed_trades', width: 70 },
    { title: 'Win Rate', dataIndex: 'win_rate', key: 'win_rate', width: 80,
      render: v => v != null ? `${v}%` : '-' },
    { title: 'P&L', dataIndex: 'total_pnl', key: 'total_pnl',
      render: v => (
        <Text style={{ color: v >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
          {v >= 0 ? '+' : ''}${v.toFixed(2)}
        </Text>
      )},
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total P&L"
              value={overall.total_pnl}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: pnlColor }}
              suffix={overall.total_pnl >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Win Rate" value={overall.win_rate} suffix="%" prefix={<TrophyOutlined />}
              valueStyle={{ color: overall.win_rate >= 50 ? '#3f8600' : '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Trades" value={overall.total_trades} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {overall.open_trades} open / {overall.closed_trades} closed
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Best Trade" value={overall.best_trade} precision={2} prefix="$"
              valueStyle={{ color: '#3f8600' }} />
            <Statistic title="Worst Trade" value={overall.worst_trade} precision={2} prefix="$"
              valueStyle={{ color: '#cf1322', fontSize: 14, marginTop: 4 }} />
          </Card>
        </Col>
      </Row>

      {per_bot.length > 0 && (
        <Card title="Per Bot Performance" size="small" style={{ marginBottom: 16 }}>
          <Table dataSource={per_bot} columns={botColumns} rowKey="bot_name"
            size="small" pagination={false} />
        </Card>
      )}

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="Daily P&L (Last 30 Days)" size="small" style={{ marginBottom: 16 }}>
            <Table dataSource={daily} columns={dailyColumns} rowKey="date"
              size="small" pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'No closed trades yet' }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="P&L by Ticker" size="small" style={{ marginBottom: 16 }}>
            <Table dataSource={by_ticker} columns={tickerColumns} rowKey="ticker"
              size="small" pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'No closed trades yet' }} />
          </Card>
        </Col>
      </Row>
    </>
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
            description="Configure your automated trading bots. Changes take effect within 60 seconds. API keys are stored securely in HashiCorp Vault."
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
      key: 'stats',
      label: <span><BarChartOutlined /> Statistics</span>,
      children: <BotStatsPanel />,
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
