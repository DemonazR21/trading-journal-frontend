import React from 'react';
import { Layout as AntLayout, Menu, Button, Space, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeycloak } from '../contexts/KeycloakContext';
import {
  DashboardOutlined,
  SignalFilled,
  DollarOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = AntLayout;
const { Text } = Typography;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { keycloak, logout } = useKeycloak();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/signals',
      icon: <SignalFilled />,
      label: 'Signals',
    },
    {
      key: '/trades',
      icon: <DollarOutlined />,
      label: 'Trades',
    },
    {
      key: '/stats',
      icon: <BarChartOutlined />,
      label: 'Statistics',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            📊 Trading Journal
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ flex: 1, minWidth: 0, border: 'none' }}
          />
        </div>
        <Space>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            {keycloak.tokenParsed?.preferred_username}
          </Text>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ background: '#fff', padding: '24px', minHeight: '280px', borderRadius: '8px' }}>
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        Trading Journal © {new Date().getFullYear()} - Powered by FastAPI & React
      </Footer>
    </AntLayout>
  );
};

export default Layout;
