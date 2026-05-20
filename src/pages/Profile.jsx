import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios';
import { LogOut, Crown, ShieldCheck, Target, Trash2, Loader2, Phone, Store, Heart, Coins, Users, UserMinus, Plus, X, FileText, MailWarning, CheckCircle, ChevronLeft, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, dispatch, updateUserData } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();
  const adminPhoneNumber = settings?.adminWhatsApp || "212600000000";

  const [activeTab, setActiveTab] = useState('requests'); 
  const [myRequests, setMyRequests] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 📧 إعدادات التفعيل (Verification)
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // 🪟 مودال الشحن
  const [showCoinModal, setShowCoinModal] = useState(false);

  useEffect(() => {
    if (!user?.token) {
      navigate('/login');
      return;
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]); 

  const fetchData = async () => {
    setLoading(true);
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    
    try {
      // التحديث الصامت
      axiosInstance.get('/api/auth/profile', config)
        .then(res => {
          if (res.data && updateUserData) {
             updateUserData(res.data);
          }
        })
        .catch(err => console.error('Silent profile sync failed'));

      const reqWishlist = axiosInstance.get('/api/auth/wishlist', config).catch(() => ({ data: [] }));
      const reqRequests = axiosInstance.get('/api/requests/my-requests', config).catch(() => ({ data: [] })); 
      const reqFollowing = axiosInstance.get('/api/auth/following', config).catch(() => ({ data: [] }));

      const [resWishlist, resReqs, resFollowing] = await Promise.all([reqWishlist, reqRequests, reqFollowing]);

      setWishlist(resWishlist.data || []);
      
      if (resReqs.data && Array.isArray(resReqs.data)) {
        const userReqs = resReqs.data.filter(r => r.user?._id === user.id || r.user === user.id);
        setMyRequests(userReqs);
      } else {
        setMyRequests([]);
      }

      setFollowingList(resFollowing.data || []);

    } catch (error) {
      console.log('Error fetching profile data', error);
    } finally {
      setLoading(false); 
    }
  };

  // 🔥 دالة طلب إرسال الكود للإيميل
  const handleVerifyEmail = async () => {
    setSendingEmail(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post('/api/auth/send-verification', {}, config);
      toast.success(data.message || 'تم إرسال كود التفعيل إلى بريدك الإلكتروني! 📧');
      setShowVerifyModal(true); // فتح نافذة إدخال الكود
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل إرسال الكود، حاول لاحقاً.');
    } finally {
      setSendingEmail(false);
    }
  };

  // 🔥 دالة تأكيد الكود المكون من 6 أرقام
  const submitVerificationCode = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post('/api/auth/verify-email', { code: verificationCode }, config);
      
      toast.success(data.message || 'تم تفعيل حسابك بنجاح! 🎉');
      setShowVerifyModal(false);
      if (updateUserData && data.user) {
        updateUserData(data.user); // باش تحيد ديك الرسالة الحمرا ديريكت بلا ماتحتاج ريفريش
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'الكود غير صحيح أو انتهت صلاحيته.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.delete(`/api/requests/${id}`, config);
      toast.success('تم حذف الطلب بنجاح');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الطلب');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.post(`/api/auth/wishlist/${productId}`, {}, config);
      toast.success('تمت الإزالة من المفضلة');
      fetchData(); 
    } catch (error) {
      toast.error('حدث خطأ أثناء الإزالة');
    }
  };

  const handleUnfollow = async (vendorId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.post(`/api/auth/follow/${vendorId}`, {}, config);
      toast.success('تم إلغاء المتابعة بنجاح');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء إلغاء المتابعة');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('تم تسجيل الخروج بنجاح 👋');
    navigate('/login');
  };

  if (!user) return null;
  const upgradeMessage = `السلام عليكم، أريد ترقية حسابي إلى Premium في منصة ${settings?.siteName || 'Qri3a Hunter'} وشحن محفظتي بالعملات 🪙. اسم الحساب: ${user.username}`;

  return (
    <div dir="rtl" className="pb-28 md:pb-6 w-full max-w-[480px] mx-auto bg-gray-50 min-h-screen">
      
      <div className="relative bg-white pb-6 rounded-b-[2.5rem] shadow-sm border-b border-gray-100">
        <div className="h-36 bg-gradient-to-br from-neutral-900 via-gray-800 to-neutral-900 rounded-b-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-5 inset-x-5 flex justify-between items-center z-10">
            <h1 className="text-white font-black text-xl tracking-wide">حسابي</h1>
            <button onClick={handleLogout} className="bg-white/10 backdrop-blur-md text-white p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm" title="تسجيل الخروج">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-5 relative -mt-14 flex flex-col items-center z-20">
          <div className="w-28 h-28 bg-white rounded-full p-1.5 shadow-xl relative">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center text-gray-400">
              <img 
                src={user?.avatar && user.avatar !== 'null' && user.avatar !== '' ? user.avatar : `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true&size=150`} 
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true&size=150`; }}
              />
            </div>
            {user?.subscriptionPlan === 'Premium' && (
              <div className="absolute bottom-1 right-1 bg-amber-400 text-black p-1.5 rounded-full border-2 border-white shadow-sm">
                <Crown className="h-4 w-4" />
              </div>
            )}
          </div>
          
          <div className="mt-3 text-center">
            <h2 className="text-xl font-black text-gray-900 flex items-center justify-center gap-1.5">
              {user?.username}
              {user?.isVerified && <ShieldCheck className="h-5 w-5 text-blue-500" />}
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-0.5">{user?.email}</p>
          </div>

          <div className="flex items-center justify-center gap-12 mt-6 w-full">
            <div className="text-center">
              <span className="block text-xl font-black text-gray-900">{user?.followers?.length || 0}</span>
              <span className="text-[10px] font-bold text-gray-400">المتابِعون</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center">
              <span className="block text-xl font-black text-gray-900">{user?.following?.length || 0}</span>
              <span className="text-[10px] font-bold text-gray-400">أتابع</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        
        {/* 🛑 رسالة تأكيد الإيميل */}
        {user?.isEmailVerified === false && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <div className="bg-red-100 p-2 rounded-full shrink-0">
              <MailWarning className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-red-800 text-sm">حسابك غير مفعل!</h3>
              <p className="text-[11px] font-bold text-red-600 mt-1 mb-2 leading-relaxed">
                يرجى تأكيد بريدك الإلكتروني لتتمكن من إضافة المنتجات والتواصل مع المتاجر.
              </p>
              <button 
                onClick={handleVerifyEmail} 
                disabled={sendingEmail}
                className="bg-red-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm hover:bg-red-600 transition flex items-center gap-1.5"
              >
                {sendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />} 
                إرسال رابط التفعيل
              </button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 shadow-[0_8px_30px_rgba(245,158,11,0.3)] flex justify-between items-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-1.5 text-amber-50 mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-xs font-bold tracking-wider">رصيد المحفظة</span>
            </div>
            <div className="text-3xl font-black tracking-tight drop-shadow-sm flex items-baseline gap-1">
              {user?.coins || 0} <span className="text-xs font-bold text-amber-100">Coin</span>
            </div>
          </div>
          <button onClick={() => setShowCoinModal(true)} className="relative z-10 bg-neutral-900 text-white px-5 py-3.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md hover:bg-black transition active:scale-95 shrink-0">
            <Plus className="h-4 w-4 text-amber-400" /> شحن الرصيد
          </button>
        </div>
          
        {user?.role === 'vendor' ? (
            <button onClick={() => navigate('/vendor-dashboard')} className="w-full bg-white border border-gray-200 text-gray-800 font-black py-4 rounded-2xl text-sm flex items-center justify-between px-5 shadow-sm hover:border-neutral-900 transition group">
              <div className="flex items-center gap-2"><Store className="h-5 w-5 text-gray-400 group-hover:text-neutral-900 transition" /> إدارة المتجر الخاص بي</div>
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
        ) : user?.role !== 'admin' ? (
          <a href={`https://wa.me/${adminPhoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(upgradeMessage)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-neutral-900 text-amber-400 font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md hover:bg-black transition">
            <Crown className="h-5 w-5" /> الترقية إلى بائع VIP
          </a>
        ) : null}

        <div className="bg-white p-1.5 rounded-full flex gap-1 shadow-sm border border-gray-100 mt-6">
          <button onClick={() => setActiveTab('requests')} className={`flex-1 py-2.5 rounded-full text-xs font-black flex justify-center items-center gap-1.5 transition ${activeTab === 'requests' ? 'bg-neutral-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <FileText className="h-4 w-4" /> طلباتي
          </button>
          <button onClick={() => setActiveTab('wishlist')} className={`flex-1 py-2.5 rounded-full text-xs font-black flex justify-center items-center gap-1.5 transition ${activeTab === 'wishlist' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Heart className="h-4 w-4" /> المفضلة
          </button>
          <button onClick={() => setActiveTab('following')} className={`flex-1 py-2.5 rounded-full text-xs font-black flex justify-center items-center gap-1.5 transition ${activeTab === 'following' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users className="h-4 w-4" /> أتابع
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-amber-500" /></div>
        ) : (
          <div className="space-y-3 pb-4">
            {activeTab === 'requests' && (
              myRequests.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 border-dashed min-h-[200px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3"><FileText className="h-8 w-8 text-gray-300" /></div>
                  <h3 className="font-black text-gray-800 text-sm mb-1">لا توجد طلبات حالياً</h3>
                  <p className="text-xs font-bold text-gray-400">لم تقم بإضافة أي طلب شراء في السوق بعد.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map(req => (
                    <div key={req._id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center gap-3 shadow-sm hover:shadow-md transition">
                      <div className="text-right flex-1">
                        <h3 className="font-bold text-gray-900 text-sm">{req.title}</h3>
                        <span className="text-amber-600 text-xs font-black block mt-1 bg-amber-50 w-fit px-2 py-1 rounded-lg">الميزانية: {req.maxBudget} درهم</span>
                      </div>
                      <button onClick={() => handleDeleteRequest(req._id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-3 rounded-xl transition shadow-sm"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'wishlist' && (
              wishlist.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 border-dashed min-h-[200px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3"><Heart className="h-8 w-8 text-red-300" /></div>
                  <h3 className="font-black text-gray-800 text-sm mb-1">قائمة المفضلة فارغة</h3>
                  <p className="text-xs font-bold text-gray-400">لم تقم بحفظ أي منتج في مفضلتك.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {wishlist.map(product => (
                    <div key={product._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative flex flex-col group shadow-sm">
                      <button onClick={() => handleRemoveFromWishlist(product._id)} className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-red-500 hover:bg-red-50 transition border border-gray-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Link to={`/product/${product.slug}`} className="h-36 bg-gray-50 block overflow-hidden relative">
                        {product.images[0] && <img src={product.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="product" />}
                      </Link>
                      <div className="p-3 text-right flex-1 flex flex-col justify-between">
                        <h3 className="font-bold text-gray-800 text-[11px] line-clamp-2 leading-snug">{product.title}</h3>
                        <span className="font-black text-green-600 text-sm block mt-2">{product.price} <span className="text-[9px] text-gray-400">درهم</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'following' && (
              followingList.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 border-dashed min-h-[200px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3"><Users className="h-8 w-8 text-blue-300" /></div>
                  <h3 className="font-black text-gray-800 text-sm mb-1">لا توجد متابعات</h3>
                  <p className="text-xs font-bold text-gray-400">أنت لا تتابع أي متاجر حالياً.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followingList.map(vendor => (
                    <div key={vendor._id} className="bg-white p-3 rounded-2xl border border-gray-100 flex justify-between items-center gap-3 shadow-sm hover:shadow-md transition">
                      <Link to={`/vendor/${vendor._id}`} className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gray-50 border shadow-sm overflow-hidden flex items-center justify-center font-black text-gray-400 shrink-0">
                          <img 
                            src={vendor?.avatar && vendor.avatar !== 'null' ? vendor.avatar : `https://ui-avatars.com/api/?name=${vendor?.storeName || vendor?.username}&background=F3F4F6&color=9CA3AF&bold=true`} 
                            className="w-full h-full object-cover" 
                            alt="vendor" 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${vendor?.storeName || vendor?.username}&background=F3F4F6&color=9CA3AF&bold=true`; }}
                          />
                        </div>
                        <div className="text-right">
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1">
                            {vendor.storeName || vendor.username}
                            {vendor.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5"><Store className="h-3 w-3" /> زيارة المتجر</span>
                        </div>
                      </Link>
                      <button 
                        onClick={() => handleUnfollow(vendor._id)} 
                        className="bg-gray-50 border border-gray-200 text-gray-600 hover:text-white hover:bg-red-500 hover:border-red-500 px-3 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5 text-xs font-black"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">إلغاء</span>
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

          </div>
        )}
      </div>

      {showCoinModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-md text-center relative overflow-hidden shadow-2xl">
            <button onClick={() => setShowCoinModal(false)} className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-full z-10 transition"><X className="h-5 w-5 text-gray-500" /></button>
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white"><Coins className="h-10 w-10 text-white" /></div>
            <h3 className="text-xl font-black text-gray-900 mb-2">شحن رصيد العملات 🪙</h3>
            <p className="text-gray-500 mb-6 text-xs font-bold px-4 leading-relaxed">رصيدك الحالي هو (<span className="text-amber-600">{user?.coins || 0}</span>). يرجى شحن الرصيد للاستفادة من كافة ميزات المنصة!</p>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 text-right text-xs text-gray-800 space-y-2 font-black shadow-inner">
              <p className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                <span className="flex items-center gap-1.5"><Coins className="h-4 w-4 text-amber-500" /> 500 Coin</span> 
                <span className="text-gray-900">50 درهم</span>
              </p>
              <p className="flex justify-between items-center bg-amber-50 p-2.5 rounded-xl border border-amber-200 shadow-sm text-amber-700">
                <span className="flex items-center gap-1.5"><Rocket className="h-4 w-4 text-amber-500" /> 1200 Coin</span> 
                <span className="text-amber-700 font-black">100 درهم</span>
              </p>
            </div>
            <a href={`https://wa.me/${adminPhoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم، أريد شحن محفظتي بـ Coins 🪙. اسم الحساب: ${user?.username}`)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-neutral-900 hover:bg-black text-white font-black py-4 rounded-2xl text-sm flex justify-center items-center gap-2 shadow-lg transition hover:scale-[1.02]">
              <Phone className="h-4 w-4" /> تواصل مع الإدارة للشحن
            </a>
          </div>
        </div>
      )}

      {/* 🔐 مودال إدخال كود التفعيل */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center relative shadow-2xl">
            <button onClick={() => setShowVerifyModal(false)} className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-full transition"><X className="h-5 w-5 text-gray-500" /></button>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">أدخل كود التفعيل</h3>
            <p className="text-gray-500 mb-6 text-xs font-bold px-2">قمنا بإرسال كود من 6 أرقام إلى بريدك الإلكتروني. يرجى إدخاله هنا.</p>
            
            <form onSubmit={submitVerificationCode} className="space-y-4">
              <input 
                type="text" 
                maxLength="6"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} // أرقام فقط
                className="w-full bg-gray-50 border border-gray-200 text-center text-2xl tracking-[0.5em] font-black rounded-xl py-3 focus:ring-2 focus:ring-neutral-900 focus:outline-none placeholder-gray-300"
                placeholder="000000"
                required
              />
              <button 
                type="submit" 
                disabled={verifying || verificationCode.length < 6}
                className="w-full bg-neutral-900 hover:bg-black text-white font-black py-3.5 rounded-xl text-sm flex justify-center items-center gap-2 transition disabled:opacity-50 shadow-md"
              >
                {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                تأكيد الحساب
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default Profile;