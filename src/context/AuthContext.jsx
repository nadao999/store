import { createContext, useState } from 'react';
import axiosInstance from '../axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🔥 الحل السحري: كنقراو من الـ LocalStorage ديريكت فالبدية (Synchronous)
  // هكا فاش كيدير السيت ريفريش، اليوزر كيكون واجد فالبلاصة بلا حتى جزء من الثانية ديال التأخير
  const [user, setUser] = useState(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

  // دالة الدخول (Login)
  const login = async (email, password) => {
    try {
      const { data } = await await axiosInstance.post('/api/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data)); 
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'مشكل فالدخول';
    }
  };

  // دالة التسجيل (Register)
  const register = async (userData) => {
    try {
      const { data } = await await axiosInstance.post('/api/auth/register', userData);
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'مشكل فالتسجيل';
    }
  };
// دالة لتحديث باقة المستخدم ديريكت فالـ State
const updateSubscription = (newPlan) => {
  if (user) {
    const updatedUser = { ...user, subscriptionPlan: newPlan };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser)); // كنقيدوها حتى فالفلاش
  }
};
// بدل الدالة القديمة بهادي باش تولي تحديث عام لليوزر
const updateUserData = (updatedFields) => {
  if (user) {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
};

// 🔥 ماتنساش تخرج "updateUserData" وسط الـ value ديال الـ Provider لتحت:
// <AuthContext.Provider value={{ user, login, logout, updateUserData }}>
// 🔥 ماتنساش تزيد "updateSubscription" وسط الـ value ديال الـ Provider لتحت كاع:
// <AuthContext.Provider value={{ user, login, logout, updateSubscription }}>
  // دالة الخروج (Logout)
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateSubscription ,updateUserData,logout }}>
      {children}
    </AuthContext.Provider>
  );
};
