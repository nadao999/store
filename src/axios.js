import axios from 'axios';

// هنا السيستيم كيهز الرابط بوحدو من ملف .env لي صاوبنا الفوق
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

export default axiosInstance;