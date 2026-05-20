import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx'; // 👈 زدنا هادي
import { Toaster } from 'react-hot-toast'; // 👈 وزدنا هادي

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <SocketProvider>
          {/* Toaster هو لي كيرسم الإشعارات فالشاشة */}
          <Toaster /> 
          <App />
        </SocketProvider>
      </AuthProvider>
    </SettingsProvider>
  </React.StrictMode>,
);