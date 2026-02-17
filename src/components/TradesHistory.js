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
} from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/client';

const { Title } = Typography;
const { Option } = Select;

const TradesHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined,
    ticker: undefined,
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

      const response = await api.getTrades(params);
      setTrades(response.data);
    } catch (error) {
      console.error('Failed to load trades:', error);
      message.error('Failed to load trades');
    } finally {
      setLoading(false);
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

  const columns = [
    {
      title: 'Entry Time',
      dataIndex: 'entry_time',
      key: 'entry_time',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      width: 150,
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
      dataIndex: 'pnl',
      key: 'pnl',
      render: (text) => text ? (
        <span style={{ color: text >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
          ${parseFloat(text).toFixed(2)}
        </span>
      ) : '-',
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
              icon={<CheckOutlined />}
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

        <Space style={{ marginBottom: '16px' }} wrap>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="OPEN">Open</Option>
            <Option value="CLOSED">Closed</Option>
            <Option value="CANCELLED">Cancelled</Option>
          </Select>

          <Input
            placeholder="Ticker"
            allowClear
            style={{ width: 150 }}
            value={filters.ticker}
            onChange={(e) => setFilters({ ...filters, ticker: e.target.value })}
          />
        </Space>
      </Card>

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

      <Modal
        title={`${selectedTrade?.status === 'OPEN' ? 'Close' : 'Edit'} Trade`}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setSelectedTrade(null);
        }}
        footer={null}
        width={500}
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
