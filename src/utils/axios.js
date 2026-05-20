import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// باش ديما نصيفطو الـ Token للـ Backend يلا كان عندنا
instance.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;