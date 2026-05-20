import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, AlertCircle, Loader2, UserPlus, ShieldAlert } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // 🛡️ الفحص الصارم لبنية كلمة المرور قبل الإرسال للخادم
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    
    if (!passwordRegex.test(formData.password)) {
      setError('كلمة المرور ضعيفة: يجب أن تتكون من 8 أحرف على الأقل، وتتضمن حرفاً كبيراً (A-Z) ورمزاً خاصاً (@، $، !...).');
      setIsLoading(false);
      return;
    }

    try {
      await register(formData);
      // 🔥 توجيه المستخدم مباشرة للملف الشخصي ليقوم بتأكيد بريده الإلكتروني
      navigate('/profile'); 
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex justify-center items-center min-h-[80vh] px-4 pb-24 md:pb-0 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 relative overflow-hidden mt-4">
        
        {/* خلفية تجميلية خفيفة */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
            <UserPlus className="h-7 w-7 text-neutral-900" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">إنشاء حساب جديد</h2>
          <p className="text-gray-500 text-sm font-medium mt-2">انضم إلينا الآن للبدء في شراء وبيع المنتجات بسهولة.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 mb-6 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs font-bold leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* حقل الاسم */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-neutral-900 block pr-12 pl-4 py-3.5 transition outline-none"
              placeholder="الاسم الكامل (أو اسم المتجر)"
              required
            />
          </div>

          {/* حقل البريد الإلكتروني */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-neutral-900 block pr-12 pl-4 py-3.5 transition outline-none"
              placeholder="البريد الإلكتروني"
              required
            />
          </div>

          {/* حقل رقم الهاتف */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              name="phoneNumber"
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-neutral-900 block pr-12 pl-4 py-3.5 transition outline-none text-right"
              placeholder="رقم الهاتف (مثال: 0600000000)"
              dir="rtl"
              required
            />
          </div>

          {/* حقل كلمة المرور */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-neutral-900 block pr-12 pl-4 py-3.5 transition outline-none"
                placeholder="كلمة المرور"
                required
              />
            </div>
            {/* 🔥 مساعدة بصرية للمستخدم لمعرفة شروط الأمان المطلوبة */}
            <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-start gap-1">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              يجب أن تحتوي على 8 أحرف، حرف كبير (A-Z)، ورمز خاص (@، #، $...)
            </p>
          </div>

          {/* زر التسجيل */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-neutral-900 hover:bg-black font-black rounded-xl text-sm px-5 py-4 text-center transition-all disabled:opacity-70 shadow-md flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
            <span>{isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}</span>
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-gray-500 relative z-10">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-black text-neutral-900 hover:underline hover:text-amber-600 transition">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;