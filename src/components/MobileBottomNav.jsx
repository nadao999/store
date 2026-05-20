import { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../axios';
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isActive = (path) => location.pathname === path;

  // 🔔 إعدادات الإشعارات (الشارة الحمراء والصوت)
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.token) return;

    const fetchUnreadCount = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axiosInstance.get('/api/chat/unread-count', config);
        
        // 🔊 تشغيل صوت التنبيه عند وصول رسالة جديدة
        if (data.unreadCount > unreadCount) {
          const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          notificationSound.play().catch(e => console.log("تم منع تشغيل الصوت تلقائياً من قبل المتصفح")); // حماية المتصفح
        }

        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('حدث خطأ أثناء جلب الإشعارات');
      }
    };

    fetchUnreadCount();
    
    // جلب التحديثات الجديدة كل 5 ثوانٍ
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [user, unreadCount]);

  return (
    <div dir="rtl" className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-50 px-2 py-1">
      
      {/* ملاحظة: تم ترتيب العناصر لتبدأ بـ "الرئيسية" من اليمين (بفضل dir="rtl")
        ثم "بحث"، زر "الإضافة"، "رسائل"، وأخيراً "حسابي" في اليسار
      */}
      <div className="flex justify-between items-center relative">
        
        <Link to="/" className={`flex flex-col items-center p-2 rounded-xl transition ${isActive('/') ? 'text-amber-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-bold mt-1">الرئيسية</span>
        </Link>
        
        <Link to="/search" className={`flex flex-col items-center p-2 rounded-xl transition ${isActive('/search') ? 'text-amber-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <Search className="h-6 w-6" />
          <span className="text-[10px] font-bold mt-1">بحث</span>
        </Link>

        {/* الزر المركزي العائم للإضافة */}
        <div className="relative -top-5">
          <Link to={user ? "/add" : "/login"} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 border-4 border-white transform transition hover:scale-105">
            <PlusCircle className="h-7 w-7" />
          </Link>
        </div>

        {/* 💬 أيقونة الرسائل مع الشارة الحمراء التفاعلية 🔴 */}
        <Link to="/messages" className={`flex flex-col items-center p-2 rounded-xl transition ${isActive('/messages') ? 'text-amber-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-sm border border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1">الرسائل</span>
        </Link>

        <Link to="/profile" className={`flex flex-col items-center p-2 rounded-xl transition ${isActive('/profile') ? 'text-amber-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <User className="h-6 w-6" />
          <span className="text-[10px] font-bold mt-1">حسابي</span>
        </Link>
        
      </div>
    </div>
  );
};

export default BottomNav;