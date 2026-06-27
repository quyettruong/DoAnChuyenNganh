import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App';
import { Provider } from 'react-redux'
import { store } from '@/redux/store';
import { App as AntdApp, ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import './styles/reset.scss';
import "leaflet/dist/leaflet.css";


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorSuccess: '#059669',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorText: '#172033',
          colorTextSecondary: '#667085',
          colorBorder: '#d9e1ec',
          colorBgLayout: '#f5f7fb',
          borderRadius: 8,
          fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif",
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 38,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 8,
            boxShadowTertiary: '0 10px 24px rgba(15, 23, 42, 0.06)',
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Table: {
            borderColor: '#e6edf5',
            headerBg: '#f8fafc',
            headerColor: '#334155',
            rowHoverBg: '#f8fbff',
          },
          Modal: {
            borderRadiusLG: 8,
          },
        },
      }}
    >
      <AntdApp>
        <Provider store={store}>
          <App />
        </Provider>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
)
