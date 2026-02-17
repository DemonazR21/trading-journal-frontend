import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Select, Input, Modal, Form, InputNumber, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/client';

const { Title } = Typography;
const { Option } = Select;

const SignalsList = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    monitor_type: undefined,
    ticker: undefined,
    signal: undefined,
    limit: 50,
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
      ticker: signal.ticker,
      direction: signal.signal === 'BUY' ? 'LONG' : 'SHORT',
      entry_price: signal.price,
      quantity: 1,
    });
    setTradeModalVisible(true);
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
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>RSI: {record.rsi ? parseFloat(record.rsi).toFixed(2) : 'N/A'}</div>
          <div>MACD: {record.macd ? parseFloat(record.macd).toFixed(4) : 'N/A'}</div>
        </div>
      ),
      width: 120,
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

        <Space style={{ marginBottom: '16px' }} wrap>
          <Select
            placeholder="Monitor Type"
            allowClear
            style={{ width: 150 }}
            value={filters.monitor_type}
            onChange={(value) => setFilters({ ...filters, monitor_type: value })}
          >
            <Option value="STOCK">Stock</Option>
            <Option value="ETF">ETF</Option>
            <Option value="CRYPTO">Crypto</Option>
          </Select>

          <Input
            placeholder="Ticker"
            allowClear
            style={{ width: 150 }}
            value={filters.ticker}
            onChange={(e) => setFilters({ ...filters, ticker: e.target.value })}
          />

          <Select
            placeholder="Signal Type"
            allowClear
            style={{ width: 120 }}
            value={filters.signal}
            onChange={(value) => setFilters({ ...filters, signal: value })}
          >
            <Option value="BUY">BUY</Option>
            <Option value="SELL">SELL</Option>
          </Select>

          <Select
            placeholder="Limit"
            style={{ width: 100 }}
            value={filters.limit}
            onChange={(value) => setFilters({ ...filters, limit: value })}
          >
            <Option value={20}>20</Option>
            <Option value={50}>50</Option>
            <Option value={100}>100</Option>
            <Option value={200}>200</Option>
          </Select>
        </Space>
      </Card>

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
          >
            <Select>
              <Option value="LONG">LONG</Option>
              <Option value="SHORT">SHORT</Option>
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
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0.01}
              step={1}
            />
          </Form.Item>

          <Form.Item
            label="Stop Loss"
            name="stop_loss"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            label="Target 1"
            name="target_1"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            label="Target 2"
            name="target_2"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            label="Target 3"
            name="target_3"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
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
