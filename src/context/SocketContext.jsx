import { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // 1. ملي اليوزر كيدخل للسيت، كنحلو الخط مع الباكاند
    if (user) {
     const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      setSocket(newSocket);

      // 2. كنقولو للسيرفر: "سجل هاد اليوزر راه دخل أونلاين"
      newSocket.emit('user_connected', user._id);

      // 3. كنتسناو الإشعارات: ملي شي شاري يلوح طلب جديد
      newSocket.on('new_request_notification', (data) => {
        // كنطلعو إشعار زوين بالصوت (إلى بغينا) والألوان
        toast.success(
          <div className="flex flex-col gap-1 text-right w-full">
            <span className="font-bold text-gray-800">همزة جديدة فالسوق! 🚨</span>
            <span className="text-sm text-gray-600">طلب: {data.title}</span>
            <span className="text-xs text-green-600 font-bold">الميزانية: {data.maxBudget} درهم</span>
          </div>,
          { duration: 5000, position: 'top-center' }
        );
      });

      // 4. ملي كيسد السيت، كنقطعو الخط
      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};