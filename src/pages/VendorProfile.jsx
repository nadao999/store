import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../axios';
import { ShieldCheck, UserPlus, UserCheck, Package, Users, Star, ArrowRight, Loader2, Clock, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [vendor, setVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // إعدادات المتابعة
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [togglingFollow, setTogglingFollow] = useState(false);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const resVendor = await axiosInstance.get(`/api/auth/vendor/${id}`);
        setVendor(resVendor.data);
        setFollowersCount(resVendor.data.followers?.length || 0);

        if (user && resVendor.data.followers?.includes(user.id || user._id)) {
          setIsFollowing(true);
        }

        const resProducts = await axiosInstance.get(`/api/products/vendor/${id}`);
        setVendorProducts(resProducts.data);

      } catch (error) {
        toast.error('حدث خطأ أثناء تحميل بيانات المتجر');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVendorData();
  }, [id, user, navigate]);

  const handleToggleFollow = async () => {
    if (!user) {
      toast.error('يجب عليك تسجيل الدخول أولاً للمتابعة!');
      return navigate('/login');
    }
    if (user?.isEmailVerified === false) {
      return toast.error('يرجى تفعيل بريدك الإلكتروني لمتابعة هذا المتجر!');
    }
    if (user.id === vendor?._id || user._id === vendor?._id) {
      return toast.error('لا يمكنك متابعة متجرك الشخصي!');
    }

    setTogglingFollow(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post(`/api/auth/follow/${vendor?._id}`, {}, config);
      
      setIsFollowing(data.isFollowing);
      setFollowersCount(prev => data.isFollowing ? prev + 1 : prev - 1);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء معالجة المتابعة');
    } finally {
      setTogglingFollow(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-32"><Loader2 className="animate-spin text-amber-500 h-10 w-10" /></div>;
  if (!vendor) return <div className="text-center mt-20 font-black text-gray-500 text-lg">هذا المتجر غير متوفر حالياً! 🚫</div>;

  return (
    <div dir="rtl" className="pb-24 md:pb-6 text-right max-w-4xl mx-auto space-y-4 font-sans px-3">
      
      {/* 🖼️ غلاف المتجر */}
      <div className="relative h-48 md:h-64 bg-gray-200 rounded-b-[2rem] overflow-hidden shadow-sm">
        <img src={vendor.storeCover || 'https://images.unsplash.com/photo-1558485293-b6d3b4b57421?q=80&w=1200&auto=format&fit=crop'} className="w-full h-full object-cover" alt="Store Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <button onClick={() => navigate(-1)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full transition text-white">
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* 👤 معلومات المتجر والأفاتار الذكي */}
      <div className="px-2 relative -mt-16 sm:-mt-20">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-gray-100 relative">
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-3 -mt-16 sm:-mt-20">
              {/* تفعيل الصورة الشخصية البديلة الذكية في حال عدم الرفع */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1 rounded-full shadow-lg border relative z-10 flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center text-3xl font-black text-gray-400 uppercase">
                  <img 
                    src={vendor.avatar && vendor.avatar !== 'null' && vendor.avatar !== '' 
                      ? vendor.avatar 
                      : `https://ui-avatars.com/api/?name=${vendor.storeName || vendor.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true&size=150`} 
                    className="w-full h-full object-cover" 
                    alt="Vendor Avatar" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${vendor.storeName || vendor.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true&size=150`;
                    }}
                  />
                </div>
              </div>
              <div className="mt-2 sm:mt-14">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center justify-center sm:justify-start gap-1">
                  {vendor.storeName || vendor.username}
                  {vendor.isVerified && <ShieldCheck className="h-5 w-5 text-blue-500 fill-blue-500/10" />}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 font-bold mt-1 max-w-sm">{vendor.storeBio || 'متجر موثوق ومعتمد في المنصة.'}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-[10px] font-black text-gray-400">
                  <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100"><Clock className="h-3.5 w-3.5 text-gray-400" /> {vendor.workingHours || 'متاح كامل اليوم'}</span>
                </div>
              </div>
            </div>

            {/* زر المتابعة المستقر */}
            <div className="flex items-center justify-center sm:justify-end mt-1 sm:mt-4">
              <button 
                onClick={handleToggleFollow}
                disabled={togglingFollow}
                className={`px-8 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition shadow-sm ${isFollowing ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200/60' : 'bg-neutral-900 text-white hover:bg-black'}`}
              >
                {togglingFollow ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <><UserCheck className="h-4 w-4" /> إلغاء المتابعة</> : <><UserPlus className="h-4 w-4" /> متابعة المتجر</>}
              </button>
            </div>
          </div>

          {/* 📊 شريط الإحصائيات الفاخر */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-gray-100">
            <div className="text-center">
              <span className="block text-lg sm:text-xl font-black text-gray-900">{followersCount}</span>
              <span className="text-[10px] font-black text-gray-400 flex items-center justify-center gap-1"><Users className="h-3 w-3 text-gray-400" /> المتابعون</span>
            </div>
            <div className="text-center border-x border-gray-100">
              <span className="block text-lg sm:text-xl font-black text-gray-900">{vendorProducts.length}</span>
              <span className="text-[10px] font-black text-gray-400 flex items-center justify-center gap-1"><Package className="h-3 w-3 text-gray-400" /> المعروضات</span>
            </div>
            <div className="text-center">
              <span className="block text-lg sm:text-xl font-black text-green-600">+{vendor.soldProducts || 0}</span>
              <span className="text-[10px] font-black text-gray-400 flex items-center justify-center gap-1"><Star className="h-3 w-3 text-gray-400" /> المبيعات</span>
            </div>
          </div>

        </div>
      </div>

      {/* 📦 منتجات البائع المتاحة */}
      <div className="px-2 space-y-4 pt-2">
        <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">المنتجات المتوفرة في المتجر ({vendorProducts.length})</h2>
        
        {vendorProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 text-gray-400 font-bold text-sm shadow-sm">هذا المتجر لم يقم بنشر أي منتجات في السوق حالياً.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {vendorProducts.map(prod => (
              <div key={prod._id} onClick={() => navigate(`/product/${prod.slug}`)} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition relative group">
                
                {prod.isPromoted && (
                  <div className="absolute top-2 right-2 z-10 bg-black/80 backdrop-blur-md text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Crown className="h-2 w-2" /> مميز
                  </div>
                )}
                
                <div className="h-32 bg-gray-50 overflow-hidden relative">
                  {prod.images && prod.images[0] && <img src={prod.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={prod.title} />}
                </div>
                <div className="p-3 text-right">
                  <h3 className="font-bold text-gray-800 text-[11px] truncate mb-1">{prod.title}</h3>
                  <span className="font-black text-green-600 text-xs">{prod.price} <span className="text-[9px] text-gray-400 font-bold">درهم</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default VendorProfile;