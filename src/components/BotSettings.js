import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Switch, Slider, InputNumber, Button, Space, Typography, Input, Statistic,
  Row, Col, Spin, message, Tag, Table, Tabs, Divider, Alert, Empty, Modal, Form, Tooltip
} from 'antd';
import {
  RobotOutlined, SettingOutlined, HistoryOutlined, BarChartOutlined,
  CheckCircleOutlined, StopOutlined, KeyOutlined, SafetyOutlined,
  ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined, DollarOutlined,
  EditOutlined, WalletOutlined, SyncOutlined, LoadingOutlined
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
  scalping_mode: false,
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
        <Col xs={24}>
          <Divider style={{ margin: '4px 0 12px' }} />
          <Space align="start">
            <Switch
              checked={!!form.scalping_mode}
              onChange={v => update('scalping_mode', v)}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
            <div>
              <Text strong>Scalping Mode</Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Only use T1 take profit target (close full position at first TP).
                  Tighter trades, faster turnover.
                </Text>
              </div>
            </div>
          </Space>
        </Col>
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
  const [prices, setPrices] = useState({});
  const [closing, setClosing] = useState(null);

  const loadTrades = useCallback(() => {
    setLoading(true);
    api.getBotTrades({ limit: 50 })
      .then(res => setTrades(res.data))
      .catch(() => message.error('Failed to load bot trades'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch live prices every 30 seconds
  const loadPrices = useCallback(() => {
    api.getBotPrices()
      .then(res => setPrices(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 30000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  const handleClose = async (record) => {
    Modal.confirm({
      title: `Close ${record.ticker} ${record.direction} at market?`,
      content: `A market order will be sent to Binance immediately. The trade will be closed and P&L recorded in real time.`,
      okText: 'Close Now',
      okType: 'danger',
      onOk: async () => {
        setClosing(record.id);
        try {
          const res = await api.closeBotTrade(record.id);
          const exitPrice = res.data?.exit_price;
          message.success(`${record.ticker} closed${exitPrice ? ` @ $${parseFloat(exitPrice).toFixed(4)}` : ''}`);
          loadTrades();
        } catch (err) {
          message.error(`Close failed: ${err.response?.data?.detail || err.message}`);
        } finally {
          setClosing(null);
        }
      },
    });
  };

  useEffect(() => {
    loadTrades();
    // Auto-refresh trades every 15s to pick up CLOSING→CLOSED and pending_update changes
    const interval = setInterval(loadTrades, 15000);
    return () => clearInterval(interval);
  }, [loadTrades]);

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
      title: 'Opened',
      key: 'opened',
      width: 95,
      render: (_, r) => (
        <Text style={{ fontSize: 12 }}>{dayjs(r.entry_time || r.created_at).format('DD/MM HH:mm')}</Text>
      ),
    },
    {
      title: 'Closed',
      key: 'closed',
      width: 95,
      render: (_, r) => r.status === 'CLOSED' && r.exit_time
        ? <Text style={{ fontSize: 12 }}>{dayjs(r.exit_time).format('DD/MM HH:mm')}</Text>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: 'Bot',
      dataIndex: 'bot_name',
      key: 'bot_name',
      width: 80,
      render: v => {
        if (!v) return '-';
        const label = v.includes('futures') ? 'FUT' : 'SPOT';
        const color = v.includes('futures') ? 'purple' : 'cyan';
        return <Tag color={color} style={{ fontSize: 10, margin: 0 }}>{label}</Tag>;
      },
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
      title: 'Targets',
      key: 'targets',
      render: (_, r) => {
        const t1 = r.target_1 ? fmtPrice(r.target_1) : null;
        const t2 = r.target_2 ? fmtPrice(r.target_2) : null;
        const t3 = r.target_3 ? fmtPrice(r.target_3) : null;
        return (
          <Tooltip title={
            <div>
              <div>🎯 T1 (active on Binance): {t1 || '-'}</div>
              {t2 && <div>T2 (limit order): {t2}</div>}
              {t3 && <div>T3 (limit order): {t3}</div>}
            </div>
          }>
            <Text type="success" style={{ fontSize: 12 }}>
              {t1 || '-'}
              {t2 && <Text type="secondary" style={{ fontSize: 11 }}> / {t2}</Text>}
              {t3 && <Text type="secondary" style={{ fontSize: 11 }}> / {t3}</Text>}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Current',
      key: 'current_price',
      render: (_, record) => {
        if (record.status !== 'OPEN') return record.exit_price ? fmtPrice(record.exit_price) : '-';
        const cp = prices[record.ticker];
        return cp ? <Text>{fmtPrice(cp)}</Text> : <Text type="secondary">...</Text>;
      },
    },
    {
      title: 'P&L',
      key: 'pnl',
      render: (_, record) => {
        if (record.status === 'CLOSED' && record.pnl != null) {
          const pnl = parseFloat(record.pnl);
          return <Text style={{ color: pnl >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>${pnl.toFixed(2)}</Text>;
        }
        if (record.status === 'OPEN' && record.entry_price && record.quantity) {
          const cp = prices[record.ticker];
          if (!cp) return '-';
          const entry = parseFloat(record.entry_price);
          const qty = parseFloat(record.quantity);
          const lev = record.leverage || 1;
          const pnl = record.direction === 'LONG'
            ? (cp - entry) * qty * lev
            : (entry - cp) * qty * lev;
          const pnlPct = record.direction === 'LONG'
            ? ((cp - entry) / entry * 100)
            : ((entry - cp) / entry * 100);
          return (
            <Tooltip title={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}>
              <Text style={{ color: pnl >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
              </Text>
            </Tooltip>
          );
        }
        return '-';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v, record) => {
        if (v === 'CLOSING') return <Tag icon={<LoadingOutlined />} color="orange">CLOSING</Tag>;
        if (v === 'OPEN' && record.pending_update) return <Tag icon={<SyncOutlined spin />} color="processing">UPDATING</Tag>;
        return <Tag color={v === 'OPEN' ? 'processing' : v === 'CLOSED' ? 'default' : 'warning'}>{v}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => record.status === 'OPEN' ? (
        <Space size={4}>
          <Tooltip title="Edit SL / TP (will update on Binance)">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Close at market price on Binance">
            <Button type="text" size="small" danger loading={closing === record.id} onClick={() => handleClose(record)}>
              Close
            </Button>
          </Tooltip>
        </Space>
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
        title={editingTrade ? `Edit SL/TP — ${editingTrade.ticker} ${editingTrade.direction}` : 'Edit Trade'}
        open={!!editingTrade}
        onOk={handleSaveEdit}
        onCancel={() => setEditingTrade(null)}
        confirmLoading={saving}
        okText="Save & Update Binance"
      >
        {editingTrade && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              Entry: {fmtPrice(editingTrade.entry_price)} | Qty: {parseFloat(editingTrade.quantity || 0).toFixed(4)}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Alert
                type="info"
                showIcon
                style={{ fontSize: 12 }}
                message="Saving will cancel existing Binance orders and place new ones on the next bot cycle (~60s). All 3 TPs are split 33%/33%/34% of position."
              />
            </div>
          </div>
        )}
        <Form form={editForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="stop_loss" label="Stop Loss">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="Stop Loss price" />
          </Form.Item>
          <Form.Item name="target_1" label="Take Profit 1 (33% of position)">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="TP1 price" />
          </Form.Item>
          <Form.Item name="target_2" label="Take Profit 2 (33% of position)">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="TP2 price" />
          </Form.Item>
          <Form.Item name="target_3" label="Take Profit 3 (34% of position)">
            <InputNumber style={{ width: '100%' }} step={0.0001} min={0} placeholder="TP3 price" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function BotStatsPanel() {
  const [stats, setStats] = useState(null);
  const [balances, setBalances] = useState([]);
  const [balHistory, setBalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getBotStats(),
      api.getBotBalances(),
      api.getBotBalanceHistory(30),
    ])
      .then(([statsRes, balRes, histRes]) => {
        setStats(statsRes.data);
        setBalances(balRes.data || []);
        setBalHistory(histRes.data || []);
      })
      .catch(() => message.error('Failed to load bot stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;
  if (!stats || !stats.overall || !stats.overall.total_trades) {
    return <Empty description="No bot trades yet - statistics will appear after the first trade" />;
  }

  const { overall, daily, by_ticker, per_bot } = stats;
  const pnlColor = overall.total_pnl >= 0 ? '#3f8600' : '#cf1322';

  // Build balance history pivot: [{date, futures, spot}, ...]
  const balHistoryByDate = {};
  balHistory.forEach(r => {
    if (!balHistoryByDate[r.date]) balHistoryByDate[r.date] = { date: r.date };
    const label = r.bot_name.includes('futures') ? 'futures' : 'spot';
    balHistoryByDate[r.date][label] = r.balance_usdt;
  });
  const balHistoryRows = Object.values(balHistoryByDate).sort((a, b) => b.date.localeCompare(a.date));

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
      {/* Current Balances (from Binance via bot_state) */}
      {balances.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {balances.map(b => (
            <Col key={b.bot_name} xs={24} sm={12}>
              <Card size="small" style={{ borderLeft: `4px solid ${b.bot_name.includes('futures') ? '#722ed1' : '#13c2c2'}` }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{b.bot_name}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                  <Text strong style={{ fontSize: 22, color: '#1890ff' }}>
                    ${parseFloat(b.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {b.open_positions} positions
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Updated {dayjs(b.updated_at).format('HH:mm:ss')}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}

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

      {balHistoryRows.length > 0 && (
        <Card title="Balance History (Last 30 Days — 1 snapshot/hour)" size="small" style={{ marginBottom: 16 }}>
          <Table
            dataSource={balHistoryRows}
            rowKey="date"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
              { title: 'Futures Balance', dataIndex: 'futures', key: 'futures',
                render: v => v != null
                  ? <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  : <Text type="secondary">—</Text>
              },
              { title: 'Spot Balance', dataIndex: 'spot', key: 'spot',
                render: v => v != null
                  ? <Text style={{ color: '#13c2c2', fontWeight: 'bold' }}>${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  : <Text type="secondary">—</Text>
              },
              { title: 'Total', key: 'total',
                render: (_, r) => {
                  const total = (r.futures || 0) + (r.spot || 0);
                  return total > 0
                    ? <Text strong style={{ color: '#1890ff' }}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    : <Text type="secondary">—</Text>;
                }
              },
            ]}
          />
        </Card>
      )}
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
