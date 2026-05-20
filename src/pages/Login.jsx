import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/'); 
    } catch (err) {
      setError(err); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex justify-center items-center min-h-[80vh] px-4 pb-20 md:pb-0 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 relative overflow-hidden">
        
        {/* خلفية تجميلية خفيفة */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
            <LogIn className="h-7 w-7 text-neutral-900 rtl:-scale-x-100" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">مرحباً بك مجدداً</h2>
          <p className="text-gray-500 text-sm font-medium mt-2">قم بتسجيل الدخول لمتابعة نشاطك في المنصة.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 mb-6 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs font-bold leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* خانة الإيميل */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-neutral-900 block pr-12 pl-4 py-3.5 transition outline-none"
              placeholder="البريد الإلكتروني"
              required
            />
          </div>

          {/* خانة كلمة المرور */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-amber-50 focus:border-neutral-900 block pr-12 pl-4 py-3.5 transition outline-none"
              placeholder="كلمة المرور"
              required
            />
          </div>

          {/* زر الدخول */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-neutral-900 hover:bg-black font-black rounded-xl text-sm px-5 py-4 text-center flex justify-center items-center gap-2 transition-all disabled:opacity-70 shadow-md mt-2"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5 rtl:-scale-x-100" />}
            <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-gray-500 relative z-10">
          ليس لديك حساب بعد؟{' '}
          <Link to="/register" className="font-black text-neutral-900 hover:underline hover:text-amber-600 transition">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;