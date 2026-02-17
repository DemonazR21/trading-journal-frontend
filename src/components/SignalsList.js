import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Select, Input, Modal, Form, InputNumber, message, Grid, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/client';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const SignalsList = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px

  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    monitor_type: undefined,
    ticker: undefined,
    signal: undefined,
    limit: 50,
    date_from: undefined,
    date_to: undefined,
  });
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSignals();
  }, [filters]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.monitor_type) params.monitor_type = filters.monitor_type.toLowerCase();
      if (filters.ticker) params.ticker = filters.ticker;
      if (filters.signal) params.signal = filters.signal;
      if (filters.limit) params.limit = filters.limit;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await api.getSignals(params);

      // Transform backend data to frontend format
      const transformedData = response.data.map(signal => ({
        ...signal,
        monitor_type: signal.source ? signal.source.toUpperCase() : null,
        price: signal.current_price,
        timestamp: signal.created_at,
      }));

      setSignals(transformedData);
    } catch (error) {
      console.error('Failed to load signals:', error);
      message.error('Failed to load signals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrade = (signal) => {
    setSelectedSignal(signal);
    form.setFieldsValue({
      signal_id: signal.id,
      monitor_type: signal.monitor_type ? signal.monitor_type.toLowerCase() : 'stock',
      ticker: signal.ticker,
      direction: signal.signal === 'BUY' ? 'LONG' : 'SHORT',
      entry_price: signal.price,
      quantity: 0.01,
      amount: null,
      target_1: signal.target_1 || null,
      target_2: signal.target_2 || null,
      target_3: signal.target_3 || null,
      stop_loss: signal.stop_loss || null,
    });
    setTradeModalVisible(true);
  };

  // Calculate quantity from dollar amount
  const handleAmountChange = (amount) => {
    const entryPrice = form.getFieldValue('entry_price');
    if (amount && entryPrice && entryPrice > 0) {
      const calculatedQuantity = amount / entryPrice;
      form.setFieldsValue({ quantity: parseFloat(calculatedQuantity.toFixed(4)) });
    }
  };

  // Calculate amount from quantity
  const handleQuantityChange = (quantity) => {
    const entryPrice = form.getFieldValue('entry_price');
    if (quantity && entryPrice && entryPrice > 0) {
      const calculatedAmount = quantity * entryPrice;
      form.setFieldsValue({ amount: parseFloat(calculatedAmount.toFixed(2)) });
    }
  };

  const handleSubmitTrade = async (values) => {
    try {
      await api.createTrade(values);
      message.success('Trade created successfully');
      setTradeModalVisible(false);
      form.resetFields();
      setSelectedSignal(null);
    } catch (error) {
      console.error('Failed to create trade:', error);
      message.error('Failed to create trade');
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        date_from: dates[0].format('YYYY-MM-DD'),
        date_to: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({
        ...filters,
        date_from: undefined,
        date_to: undefined,
      });
    }
  };

  // Helper to render indicator with color (shared between table and cards)
  const renderIndicator = (label, score, desc) => {
    if (score === null || score === undefined) return null;

    let color = '#999';
    if (score > 0) color = '#52c41a';
    if (score < 0) color = '#ff4d4f';

    const shortDesc = desc ? (desc.length > 15 ? desc.substring(0, 15) + '...' : desc) : '';

    return (
      <span key={label} style={{ color, fontWeight: score !== 0 ? 'bold' : 'normal', marginRight: '8px', fontSize: '11px' }}>
        {label}: {score} {shortDesc && <span style={{ fontSize: '9px', fontWeight: 'normal' }}>({shortDesc})</span>}
      </span>
    );
  };

  // Mobile card view
  const renderMobileCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {signals.map((signal) => {
        const isCrypto = signal.monitor_type === 'CRYPTO';

        return (
          <Card key={signal.id} size="small" style={{ borderLeft: `4px solid ${signal.signal === 'BUY' ? '#52c41a' : signal.signal === 'SELL' ? '#ff4d4f' : '#d9d9d9'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Tag color={isCrypto ? 'gold' : signal.monitor_type === 'ETF' ? 'green' : 'blue'}>{signal.monitor_type}</Tag>
                  <strong style={{ fontSize: '16px' }}>{signal.ticker}</strong>
                  {signal.signal && <Tag color={signal.signal === 'BUY' ? 'green' : 'red'}>{signal.signal}</Tag>}
                </div>
                {signal.company && (
                  <div style={{ fontSize: '12px', color: '#333', marginBottom: '2px', fontWeight: '500' }}>
                    {signal.company.length > 30 ? signal.company.substring(0, 30) + '...' : signal.company}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {dayjs(signal.timestamp).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  ${parseFloat(signal.price).toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Indicators:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {renderIndicator('RSI', signal.rsi, signal.rsi_desc)}
                {isCrypto ? (
                  <>
                    {renderIndicator('EMA', signal.ema_score, signal.ema_desc)}
                    {renderIndicator('STRUCT', signal.struct_score, signal.struct_desc)}
                    {renderIndicator('VOL', signal.vol_score, signal.vol_desc)}
                    {renderIndicator('LIQ', signal.liq_score, signal.liq_desc)}
                  </>
                ) : (
                  <>
                    {renderIndicator('MACD', signal.macd, signal.macd_desc)}
                    {renderIndicator('BOX', signal.box_score, signal.box_desc)}
                    {renderIndicator('VOL', signal.vol_score, signal.vol_desc)}
                    {renderIndicator('FIB', signal.fib_score, signal.fib_desc)}
                  </>
                )}
              </div>
            </div>

            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleCreateTrade(signal)}
              block
            >
              Create Trade
            </Button>
          </Card>
        );
      })}
    </div>
  );

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
    },
    {
      title: 'Monitor',
      dataIndex: 'monitor_type',
      key: 'monitor_type',
      render: (text) => (
        <Tag color={text === 'STOCK' ? 'blue' : text === 'ETF' ? 'green' : 'gold'}>
          {text}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      render: (text) => <strong>{text}</strong>,
      width: 100,
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      ellipsis: true,
      width: 180,
    },
    {
      title: 'Signal',
      dataIndex: 'signal',
      key: 'signal',
      render: (text) => (
        <Tag color={text === 'BUY' ? 'green' : 'red'}>
          {text}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (text) => `$${parseFloat(text).toFixed(2)}`,
      width: 100,
    },
    {
      title: 'Indicators',
      key: 'indicators',
      render: (_, record) => {
        const isCrypto = record.monitor_type === 'CRYPTO';

        const renderTableIndicator = (label, score, desc) => {
          if (score === null || score === undefined) return `${label}: N/A`;

          let color = '#999';
          if (score > 0) color = '#52c41a';
          if (score < 0) color = '#ff4d4f';

          const shortDesc = desc ? (desc.length > 20 ? desc.substring(0, 20) + '...' : desc) : '';

          return (
            <div key={label} style={{ color, fontWeight: score !== 0 ? 'bold' : 'normal' }}>
              {label}: {score} {shortDesc && <span style={{ fontSize: '10px', fontWeight: 'normal' }}>({shortDesc})</span>}
            </div>
          );
        };

        return (
          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
            {renderTableIndicator('RSI', record.rsi, record.rsi_desc)}
            {isCrypto ? (
              <>
                {renderTableIndicator('EMA', record.ema_score, record.ema_desc)}
                {renderTableIndicator('STRUCT', record.struct_score, record.struct_desc)}
                {renderTableIndicator('VOL', record.vol_score, record.vol_desc)}
                {renderTableIndicator('LIQ', record.liq_score, record.liq_desc)}
              </>
            ) : (
              <>
                {renderTableIndicator('MACD', record.macd, record.macd_desc)}
                {renderTableIndicator('BOX', record.box_score, record.box_desc)}
                {renderTableIndicator('VOL', record.vol_score, record.vol_desc)}
                {renderTableIndicator('FIB', record.fib_score, record.fib_desc)}
              </>
            )}
          </div>
        );
      },
      width: 180,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleCreateTrade(record)}
        >
          Trade
        </Button>
      ),
      width: 100,
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>Signals</Title>
          <Button
            type="default"
            icon={<SearchOutlined />}
            onClick={loadSignals}
          >
            Refresh
          </Button>
        </div>

        <Space style={{ marginBottom: '16px', width: isMobile ? '100%' : 'auto' }} wrap direction={isMobile ? 'vertical' : 'horizontal'}>
          <Select
            placeholder="Monitor Type"
            allowClear
            style={{ width: isMobile ? '100%' : 150 }}
            value={filters.monitor_type}
            onChange={(value) => setFilters({ ...filters, monitor_type: value })}
          >
            <Option value="STOCK">Stock</Option>
            <Option value="ETF">ETF</Option>
            <Option value="CRYPTO">Crypto</Option>
          </Select>

          <Input
            placeholder="Ticker or Company"
            allowClear
            style={{ width: isMobile ? '100%' : 180 }}
            value={filters.ticker}
            onChange={(e) => setFilters({ ...filters, ticker: e.target.value })}
          />

          <Select
            placeholder="Signal Type"
            allowClear
            style={{ width: isMobile ? '100%' : 120 }}
            value={filters.signal}
            onChange={(value) => setFilters({ ...filters, signal: value })}
          >
            <Option value="BUY">BUY</Option>
            <Option value="SELL">SELL</Option>
          </Select>

          <Select
            placeholder="Limit"
            style={{ width: isMobile ? '100%' : 100 }}
            value={filters.limit}
            onChange={(value) => setFilters({ ...filters, limit: value })}
          >
            <Option value={20}>20</Option>
            <Option value={50}>50</Option>
            <Option value={100}>100</Option>
            <Option value={200}>200</Option>
          </Select>

          <RangePicker
            style={{ width: isMobile ? '100%' : 280 }}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            placeholder={['Start Date', 'End Date']}
          />
        </Space>
      </Card>

      {isMobile ? (
        loading ? (
          <Card><div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div></Card>
        ) : signals.length === 0 ? (
          <Card><div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No signals found</div></Card>
        ) : (
          renderMobileCards()
        )
      ) : (
        <Table
          columns={columns}
          dataSource={signals}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} signals`,
          }}
          scroll={{ x: 1000 }}
        />
      )}

      <Modal
        title="Create Trade from Signal"
        open={tradeModalVisible}
        onCancel={() => {
          setTradeModalVisible(false);
          form.resetFields();
          setSelectedSignal(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitTrade}
        >
          <Form.Item name="signal_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="monitor_type" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Ticker"
            name="ticker"
            rules={[{ required: true, message: 'Please enter ticker' }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Direction"
            name="direction"
            rules={[{ required: true, message: 'Please select direction' }]}
            help="You can choose any direction regardless of the signal"
          >
            <Select>
              <Option value="LONG">LONG (Buy)</Option>
              <Option value="SHORT">SHORT (Sell)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Entry Price"
            name="entry_price"
            rules={[{ required: true, message: 'Please enter entry price' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            label="Amount ($)"
            name="amount"
            help="Optional: Enter dollar amount to auto-calculate quantity"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={100}
              placeholder="e.g., 1000"
              onChange={handleAmountChange}
              prefix="$"
            />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
            help="Supports fractional values (e.g., 0.5, 0.01)"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={4}
              min={0.0001}
              step={0.01}
              onChange={handleQuantityChange}
            />
          </Form.Item>

          <Form.Item
            label="Stop Loss (Your SL)"
            name="stop_loss"
            help={selectedSignal?.stop_loss ? `Algorithm suggested: $${parseFloat(selectedSignal.stop_loss).toFixed(2)}` : 'Set your own stop loss price'}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
              placeholder="Your stop loss"
            />
          </Form.Item>

          <Form.Item
            label="Target 1 (Take Profit 1)"
            name="target_1"
            help={selectedSignal?.target_1 ? `Algorithm suggested: $${parseFloat(selectedSignal.target_1).toFixed(2)}` : 'Optional: First profit target'}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
              placeholder="Target 1"
            />
          </Form.Item>

          <Form.Item
            label="Target 2 (Take Profit 2)"
            name="target_2"
            help={selectedSignal?.target_2 ? `Algorithm suggested: $${parseFloat(selectedSignal.target_2).toFixed(2)}` : 'Optional: Second profit target'}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
              placeholder="Target 2"
            />
          </Form.Item>

          <Form.Item
            label="Target 3 (Take Profit 3)"
            name="target_3"
            help={selectedSignal?.target_3 ? `Algorithm suggested: $${parseFloat(selectedSignal.target_3).toFixed(2)}` : 'Optional: Third profit target'}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
              placeholder="Target 3"
            />
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Trade
              </Button>
              <Button onClick={() => {
                setTradeModalVisible(false);
                form.resetFields();
                setSelectedSignal(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SignalsList;
