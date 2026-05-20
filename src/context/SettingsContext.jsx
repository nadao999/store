import { createContext, useState, useEffect } from 'react';
import axiosInstance from '../axios';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // ألوان وسمية افتراضية قبل ما يجاوب الباكاند
  const [settings, setSettings] = useState({
    siteName: '9ri3a Hunter',
    themeColors: { primary: '#FF5733' },
    adminWhatsApp: ''
  });

  // 🔄 دالة كتجيب الإعدادات من الداتابيز
  const fetchSettings = async () => {
    try {
      const { data } = await axiosInstance.get('/api/settings');
      if (data) {
        setSettings({
          siteName: data.siteName || '9ri3a Hunter',
          themeColors: { primary: data.themeColor || '#FF5733' },
          adminWhatsApp: data.adminWhatsApp || ''
        });
      }
    } catch (error) {
      console.error('مشكل فجلب الإعدادات من السيرفر');
    }
  };

  useEffect(() => {
    // جيب الإعدادات ملي يتحل السيت
    fetchSettings();
    
    // 🔥 تصنت على السينيال لي كيصيفطو الأدمين ملي كيبدل الألوان (باش السيت يتبدل لايڤ)
    window.addEventListener('settingsUpdated', fetchSettings);
    
    return () => window.removeEventListener('settingsUpdated', fetchSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};