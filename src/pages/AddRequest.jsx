import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axios';
import { MapPin, Tag, DollarSign, AlertCircle, CheckCircle, Loader2, Target, Sparkles, HelpCircle } from 'lucide-react';
import { SocketContext } from '../context/SocketContext';
import toast from 'react-hot-toast';

// 🏷️ قائمة التصنيفات الرسمية الموحدة في المنصة
const APP_CATEGORIES = [
  { slug: 'vetements-chaussures', name: 'الملابس والأحذية' },
  { slug: 'accessoires-mode', name: 'إكسسوارات الموضة والساعات' },
  { slug: 'telephone-tablette', name: 'الهواتف والأجهزة اللوحية' },
  { slug: 'informatique', name: 'الإعلاميات والحواسيب' },
  { slug: 'jeux-videos-consoles', name: 'ألعاب الفيديو والكونسول' },
  { slug: 'beaute-sante', name: 'الصحة والجمال' },
  { slug: 'maison-cuisine', name: 'المنزل والمطبخ' },
  { slug: 'sports-loisirs', name: 'الرياضة والتسلية' },
  { slug: 'tv-hi-tech', name: 'التلفاز والإلكترونيات' },
  { slug: 'accessoire-auto-moto', name: 'أكسسوارات السيارات والدراجات' }
];

const AddRequest = () => {
  const { user } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const themeColor = settings?.themeColors?.primary || '#FF5733';

  // معلومات الطلب
  const [formData, setFormData] = useState({
    title: '',
    category: 'vetements-chaussures',
    size: '',
    color: '',
    condition: 'Any',
    maxBudget: ''
  });

  // الإحداثيات الجغرافية
  const [location, setLocation] = useState({ longitude: null, latitude: null });
  const [locationError, setLocationError] = useState('');
  const [status, setStatus] = useState({ error: '', success: '', isLoading: false });

  // جلب الموقع الجغرافي عند فتح الصفحة مباشرة
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
          });
        },
        (error) => {
          setLocationError('يرجى تفعيل خدمة الموقع (GPS) لنتمكن من توصيل طلبك إلى المتاجر القريبة منك.');
        }
      );
    } else {
      setLocationError('المتصفح الحالي لا يدعم ميزة تحديد الموقع الجغرافي.');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '', isLoading: true });

    if (!location.longitude || !location.latitude) {
      setStatus({ ...status, error: 'يتعذر إرسال الطلب بدون تحديد موقعك الجغرافي.', isLoading: false });
      return;
    }

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        details: { size: formData.size, color: formData.color, condition: formData.condition },
        maxBudget: Number(formData.maxBudget),
        longitude: location.longitude,
        latitude: location.latitude
      };

      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.post('/api/requests', payload, config);
      
      // بث الإشعار الفوري للمتاجر القريبة عبر Socket
      if (socket) {
        socket.emit('new_request_created', payload);
      }
      
      setStatus({ success: 'تم نشر طلبك بنجاح في السوق المفتوح!', error: '', isLoading: false });
      toast.success('تم نشر الطلب بنجاح! 🎉');
      setTimeout(() => navigate('/'), 2000);
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data;
      setStatus({ error: typeof errorMsg === 'string' ? errorMsg : 'حدث خطأ أثناء نشر الطلب في السيرفر', success: '', isLoading: false });
    }
  };

  if (!user) {
    return (
      <div dir="rtl" className="text-center mt-32 max-w-sm mx-auto bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-gray-800">يرجى تسجيل الدخول أولاً!</h2>
        <p className="text-xs text-gray-400 font-bold">يجب أن تملك حساباً مفعلاً لتتمكن من نشر طلبات الشراء واستهداف المتاجر.</p>
        <button onClick={() => navigate('/login')} className="w-full bg-neutral-900 hover:bg-black text-white font-black py-3 rounded-xl text-sm transition shadow-md">تسجيل الدخول الآن</button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full max-w-[480px] mx-auto bg-gray-50 min-h-screen pb-28 md:pb-6 text-right">
      
      {/* 🔝 الهيدر العلوي */}
      <div className="bg-white px-5 py-4 flex items-center gap-2 border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <Target className="h-5 w-5 text-amber-500 animate-pulse" />
        <h1 className="text-base font-black text-gray-900">إنشاء طلب شراء جديد</h1>
      </div>

      <div className="p-4 space-y-4">
        
        {/* بطاقة الترحيب والتعليمات */}
        <div className="bg-gradient-to-r from-neutral-900 to-gray-800 rounded-[2rem] p-5 text-white relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <h2 className="text-base font-black text-amber-400 flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> ماذا تبحث اليوم؟</h2>
          <p className="text-[11px] font-medium text-gray-300 mt-1 leading-relaxed">أدخل مواصفات المنتج الذي ترغب في شرائه وسيقوم رادار المنصة الذكي بإرسال طلبك فوراً إلى جميع التجار المتاحين في منطقتك الجغرافية!</p>
        </div>

        {/* تنبيهات الحالة */}
        {status.error && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm"><AlertCircle className="h-5 w-5 shrink-0" />{status.error}</div>}
        {status.success && <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-black shadow-sm"><CheckCircle className="h-5 w-5 shrink-0" />{status.success}</div>}
        {locationError && <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm"><MapPin className="h-5 w-5 shrink-0 animate-bounce" />{locationError}</div>}

        {/* نموذج الإدخال البريميوم */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
          
          {/* عنوان الطلب */}
          <div>
            <label className="block text-[11px] font-black text-gray-500 mb-1.5">ما هو اسم المنتج المطلوب؟</label>
            <input 
              type="text" 
              name="title" 
              onChange={handleChange} 
              required 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:outline-none focus:border-neutral-950 focus:ring-4 focus:ring-gray-100 transition shadow-inner" 
              placeholder="مثال: حذاء نايكي إير فورس مقاس 42 أبيض" 
            />
          </div>

          {/* التصنيف والميزانية */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-gray-500 mb-1.5">التصنيف الصحيح</label>
              <select 
                name="category" 
                onChange={handleChange} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:outline-none focus:border-neutral-950 transition"
              >
                {APP_CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 mb-1.5">الحد الأقصى للميزانية</label>
              <div className="relative">
                <input 
                  type="number" 
                  name="maxBudget" 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 pr-3 pl-12 text-xs font-black focus:outline-none focus:border-neutral-950 transition" 
                  placeholder="مثال: 500" 
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-black">درهم</span>
              </div>
            </div>
          </div>

          {/* الخصائص الدقيقة للمنتج */}
          <div className="pt-3 border-t border-gray-50 space-y-3">
            <h3 className="text-xs font-black text-gray-800 flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-gray-400" /> تفاصيل إضافية للبياسة:</h3>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 text-center">اللون المقترح</label>
                <input 
                  type="text" 
                  name="color" 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center text-xs font-bold focus:outline-none" 
                  placeholder="أسود، أبيض..." 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 text-center">المقاس / القياس</label>
                <input 
                  type="text" 
                  name="size" 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center text-xs font-bold focus:outline-none" 
                  placeholder="42, M, L..." 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 text-center">حالة المنتج</label>
                <select 
                  name="condition" 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center text-xs font-bold focus:outline-none"
                >
                  <option value="Any">أي حالة</option>
                  <option value="New">جديد تماماً</option>
                  <option value="Used">مستعمل بحالة ممتازة</option>
                </select>
              </div>
            </div>
          </div>

          {/* زر النشر البريميوم */}
          <button
            type="submit"
            disabled={status.isLoading || !location.longitude}
            className="w-full mt-6 text-white bg-neutral-900 hover:bg-black font-black rounded-2xl py-4 text-center transition-all shadow-md hover:scale-[1.01] disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
          >
            {status.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري نشر طلبك في السوق...</span>
              </>
            ) : (
              <span>نشر الطلب واستهداف التجار الآن 🚀</span>
            )}
          </button>

        </form>
      </div>
      
    </div>
  );
};

export default AddRequest;