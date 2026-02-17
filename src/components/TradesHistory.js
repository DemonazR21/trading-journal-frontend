import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Select,
  Input,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  DatePicker,
  Grid,
} from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, CheckOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/client';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const TradesHistory = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined,
    ticker: undefined,
    direction: undefined,
    date_from: undefined,
    date_to: undefined,
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTrades();
  }, [filters]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.ticker) params.ticker = filters.ticker;
      if (filters.direction) params.direction = filters.direction;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await api.getTrades(params);
      setTrades(response.data);
    } catch (error) {
      console.error('Failed to load trades:', error);
      message.error('Failed to load trades');
    } finally {
      setLoading(false);
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

  const handleEditTrade = (trade) => {
    setSelectedTrade(trade);
    form.setFieldsValue({
      exit_price: trade.exit_price,
      status: trade.status,
      notes: trade.notes,
    });
    setEditModalVisible(true);
  };

  const handleCloseTrade = (trade) => {
    setSelectedTrade(trade);
    form.setFieldsValue({
      exit_price: null,
      status: 'CLOSED',
      notes: trade.notes,
    });
    setEditModalVisible(true);
  };

  const handleSubmitUpdate = async (values) => {
    try {
      await api.updateTrade(selectedTrade.id, values);
      message.success('Trade updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      setSelectedTrade(null);
      loadTrades();
    } catch (error) {
      console.error('Failed to update trade:', error);
      message.error('Failed to update trade');
    }
  };

  const handleDeleteTrade = async (id) => {
    try {
      await api.deleteTrade(id);
      message.success('Trade deleted successfully');
      loadTrades();
    } catch (error) {
      console.error('Failed to delete trade:', error);
      message.error('Failed to delete trade');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'blue';
      case 'CLOSED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  };

  const calculatePnL = (trade) => {
    if (!trade.exit_price || !trade.entry_price) return null;
    const multiplier = trade.direction === 'LONG' ? 1 : -1;
    const pnl = multiplier * (parseFloat(trade.exit_price) - parseFloat(trade.entry_price)) * parseFloat(trade.quantity);
    return pnl;
  };

  const calculatePnLPercentage = (trade) => {
    if (!trade.exit_price || !trade.entry_price) return null;
    const multiplier = trade.direction === 'LONG' ? 1 : -1;
    const pnlPct = multiplier * ((parseFloat(trade.exit_price) - parseFloat(trade.entry_price)) / parseFloat(trade.entry_price)) * 100;
    return pnlPct;
  };

  // Mobile card view
  const renderMobileCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {trades.map((trade) => {
        const pnl = calculatePnL(trade);
        const pnlPct = calculatePnLPercentage(trade);

        return (
          <Card
            key={trade.id}
            size="small"
            style={{ borderLeft: `4px solid ${trade.direction === 'LONG' ? '#52c41a' : '#ff4d4f'}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <Tag color={trade.monitor_type === 'crypto' ? 'gold' : trade.monitor_type === 'etf' ? 'green' : 'blue'}>
                    {trade.monitor_type?.toUpperCase()}
                  </Tag>
                  <strong style={{ fontSize: '16px' }}>{trade.ticker}</strong>
                  <Tag color={trade.direction === 'LONG' ? 'green' : 'red'}>{trade.direction}</Tag>
                  <Tag color={getStatusColor(trade.status)}>{trade.status}</Tag>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {dayjs(trade.entry_time || trade.created_at).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#666' }}>Entry:</span> ${parseFloat(trade.entry_price).toFixed(2)}
                </div>
                <div>
                  <span style={{ color: '#666' }}>Qty:</span> {parseFloat(trade.quantity).toFixed(4)}
                </div>
                {trade.exit_price && (
                  <>
                    <div>
                      <span style={{ color: '#666' }}>Exit:</span> ${parseFloat(trade.exit_price).toFixed(2)}
                    </div>
                    <div>
                      <span style={{ color: '#666' }}>P&L:</span>{' '}
                      <span style={{ color: pnl >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                        ${pnl?.toFixed(2)} ({pnlPct?.toFixed(2)}%)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Space size="small" style={{ width: '100%', justifyContent: 'flex-end' }}>
              {trade.status === 'OPEN' && (
                <Button
                  type="primary"
                  size="small"
                  icon={<DollarOutlined />}
                  onClick={() => handleCloseTrade(trade)}
                >
                  Close
                </Button>
              )}
              <Button
                type="default"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditTrade(trade)}
              />
              <Popconfirm
                title="Delete trade?"
                description="This action cannot be undone."
                onConfirm={() => handleDeleteTrade(trade.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </Card>
        );
      })}
    </div>
  );

  const columns = [
    {
      title: 'Entry Time',
      dataIndex: 'entry_time',
      key: 'entry_time',
      render: (text, record) => dayjs(text || record.created_at).format('YYYY-MM-DD HH:mm'),
      width: 150,
    },
    {
      title: 'Type',
      dataIndex: 'monitor_type',
      key: 'monitor_type',
      render: (text) => (
        <Tag color={text === 'crypto' ? 'gold' : text === 'etf' ? 'green' : 'blue'}>
          {text?.toUpperCase()}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      render: (text) => <strong>{text}</strong>,
      width: 100,
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      render: (text) => (
        <Tag color={text === 'LONG' ? 'green' : 'red'}>
          {text}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={getStatusColor(text)}>
          {text}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Entry',
      dataIndex: 'entry_price',
      key: 'entry_price',
      render: (text) => `$${parseFloat(text).toFixed(2)}`,
      width: 100,
    },
    {
      title: 'Exit',
      dataIndex: 'exit_price',
      key: 'exit_price',
      render: (text) => text ? `$${parseFloat(text).toFixed(2)}` : '-',
      width: 100,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text) => parseFloat(text).toFixed(2),
      width: 100,
    },
    {
      title: 'P&L',
      key: 'pnl',
      render: (_, record) => {
        const pnl = calculatePnL(record);
        const pnlPct = calculatePnLPercentage(record);

        if (pnl === null) return '-';

        return (
          <div style={{ color: pnl >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
            ${pnl.toFixed(2)}
            <div style={{ fontSize: '11px' }}>({pnlPct.toFixed(2)}%)</div>
          </div>
        );
      },
      width: 120,
    },
    {
      title: 'SL / Targets',
      key: 'targets',
      render: (_, record) => (
        <div style={{ fontSize: '11px' }}>
          {record.stop_loss && <div>SL: ${parseFloat(record.stop_loss).toFixed(2)}</div>}
          {record.target_1 && <div>T1: ${parseFloat(record.target_1).toFixed(2)}</div>}
          {record.target_2 && <div>T2: ${parseFloat(record.target_2).toFixed(2)}</div>}
          {record.target_3 && <div>T3: ${parseFloat(record.target_3).toFixed(2)}</div>}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'OPEN' && (
            <Button
              type="primary"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleCloseTrade(record)}
            >
              Close
            </Button>
          )}
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTrade(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this trade?"
            onConfirm={() => handleDeleteTrade(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="default"
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
      width: 180,
      fixed: 'right',
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>Trades History</Title>
          <Button
            type="default"
            icon={<SearchOutlined />}
            onClick={loadTrades}
          >
            Refresh
          </Button>
        </div>

        <Space style={{ marginBottom: '16px', width: isMobile ? '100%' : 'auto' }} wrap direction={isMobile ? 'vertical' : 'horizontal'}>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: isMobile ? '100%' : 120 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="OPEN">Open</Option>
            <Option value="CLOSED">Closed</Option>
            <Option value="CANCELLED">Cancelled</Option>
          </Select>

          <Select
            placeholder="Direction"
            allowClear
            style={{ width: isMobile ? '100%' : 120 }}
            value={filters.direction}
            onChange={(value) => setFilters({ ...filters, direction: value })}
          >
            <Option value="LONG">Long</Option>
            <Option value="SHORT">Short</Option>
          </Select>

          <Input
            placeholder="Ticker"
            allowClear
            style={{ width: isMobile ? '100%' : 150 }}
            value={filters.ticker}
            onChange={(e) => setFilters({ ...filters, ticker: e.target.value })}
          />

          <RangePicker
            style={{ width: isMobile ? '100%' : 280 }}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
        </Space>
      </Card>

      {isMobile ? (
        loading ? (
          <Card><div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div></Card>
        ) : trades.length === 0 ? (
          <Card><div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No trades found</div></Card>
        ) : (
          renderMobileCards()
        )
      ) : (
        <Table
          columns={columns}
          dataSource={trades}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} trades`,
          }}
          scroll={{ x: 1400 }}
        />
      )}

      <Modal
        title={`${selectedTrade?.status === 'OPEN' ? 'Close' : 'Edit'} Trade`}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setSelectedTrade(null);
        }}
        footer={null}
        width={isMobile ? '100%' : 500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitUpdate}
        >
          <Form.Item
            label="Exit Price"
            name="exit_price"
            rules={[
              { required: form.getFieldValue('status') === 'CLOSED', message: 'Please enter exit price' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              step={0.01}
              placeholder="Enter exit price to close trade"
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Option value="OPEN">Open</Option>
              <Option value="CLOSED">Closed</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
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
                Update Trade
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                form.resetFields();
                setSelectedTrade(null);
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

export default TradesHistory;
