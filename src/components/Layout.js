import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Space, Typography, Drawer, Grid } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeycloak } from '../contexts/KeycloakContext';
import {
  DashboardOutlined,
  SignalFilled,
  DollarOutlined,
  BarChartOutlined,
  RobotOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = AntLayout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { keycloak, logout } = useKeycloak();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px
  const [drawerVisible, setDrawerVisible] = useState(false);

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
    {
      key: '/bot-settings',
      icon: <RobotOutlined />,
      label: 'Bots',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) {
      setDrawerVisible(false); // Close drawer on mobile after navigation
    }
  };

  const handleLogout = () => {
    logout();
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: isMobile ? '0 16px' : '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px', flex: 1 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />}
              onClick={() => setDrawerVisible(true)}
            />
          )}
          <div style={{ color: 'white', fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            📊 {isMobile ? 'TJ' : 'Trading Journal'}
          </div>
          {!isMobile && (
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ flex: 1, minWidth: 0, border: 'none' }}
            />
          )}
        </div>
        <Space size={isMobile ? 'small' : 'middle'}>
          {!isMobile && (
            <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              {keycloak.tokenParsed?.preferred_username}
            </Text>
          )}
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            size={isMobile ? 'small' : 'middle'}
          >
            {!isMobile && 'Logout'}
          </Button>
        </Space>
      </Header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={250}
      >
        <div style={{ marginBottom: '16px', padding: '8px', background: '#f0f2f5', borderRadius: '4px' }}>
          <Text strong>{keycloak.tokenParsed?.preferred_username}</Text>
        </div>
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
          >
            Logout
          </Button>
        </div>
      </Drawer>
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
