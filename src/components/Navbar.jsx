import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { Store, User, LogOut, PlusCircle, ChevronDown, Heart, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();
  const themeColor = settings?.themeColors?.primary || '#FF5733';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null); // 🔥 ريفيرونس باش نراقبو الكليك برا المينو

  // 🧠 خوارزمية إغلاق القائمة عند النقر خارجها (Click Outside to Close)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // إضافة المستمع للحدث ملي كيتحل المينو
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center flex-row-reverse" dir="rtl">
          
          {/* اللوغو */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xl shadow-sm" style={{ backgroundColor: themeColor }}>
              Q
            </div>
            <span className="font-extrabold text-xl text-gray-900 hidden sm:block tracking-tight">
              {settings?.siteName || 'Qri3a Hunter'}
            </span>
          </Link>

          {/* القائمة د اليسار */}
          <div className="flex items-center gap-4 text-right">
            {user ? (
              <>
                <Link 
                  to="/add" 
                  className="hidden md:flex items-center gap-1.5 text-white px-5 py-2.5 rounded-xl text-sm font-black transition hover:opacity-90 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  style={{ backgroundColor: themeColor }}
                >
                  <PlusCircle className="h-4 w-4" /> <span>لوح طلب</span>
                </Link>

                {/* المينو ديال اليوزر (محمي بـ useRef) */}
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center gap-2 border px-3 py-2 rounded-xl transition ${isMenuOpen ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-xs font-black text-gray-700 uppercase">
                      {user.username.charAt(0)}
                    </div>
                    <span className="text-sm font-black text-gray-700 hidden sm:block">{user.username}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu (Pro Style 🔥) */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col text-right overflow-hidden animate-fade-in z-50">
                      
                      {/* هيدر معلومات المستخدم */}
                      <div className="px-4 py-3.5 bg-gray-50/80 border-b border-gray-100">
                        <p className="text-sm font-black text-gray-900 truncate">{user.username}</p>
                        <p className="text-[10px] font-bold text-gray-500 truncate mt-0.5">{user.email || 'مستخدم مسجل'}</p>
                      </div>

                      {/* الروابط الأساسية */}
                      <div className="py-1.5">
                        <Link 
                          to="/profile" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-xs font-bold transition"
                        >
                          <User className="h-4 w-4 text-gray-400" /> <span>مشترياتي وطلباتي</span>
                        </Link>
                        
                        <Link 
                          to="/mystore" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-xs font-bold transition"
                        >
                          <Store className="h-4 w-4 text-gray-400" /> <span>إدارة المتجر</span>
                        </Link>

                        <Link 
                          to="/wishlist" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-xs font-bold transition"
                        >
                          <Heart className="h-4 w-4 text-gray-400" /> <span>المفضلة</span>
                        </Link>

                        <Link 
                          to="/settings" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-xs font-bold transition"
                        >
                          <Settings className="h-4 w-4 text-gray-400" /> <span>إعدادات الحساب</span>
                        </Link>
                      </div>

                      <div className="h-px bg-gray-100 w-full"></div>
                      
                      {/* زر الخروج */}
                      <div className="py-1.5">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-red-600 text-xs font-black transition w-full text-right"
                        >
                          <LogOut className="h-4 w-4" /> <span>تسجيل الخروج</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="text-gray-600 font-black text-sm px-4 py-2 hover:bg-gray-50 rounded-xl transition">دخول</Link>
                <Link to="/register" className="text-white font-black text-sm px-5 py-2 rounded-xl transition shadow-sm hover:shadow-md" style={{ backgroundColor: themeColor }}>حساب جديد</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;