import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios';
import { ArrowLeft, Crown, Search, Bell, Target, X, ChevronLeft, Shirt, Watch, Smartphone, Laptop, Gamepad2, Sparkles, Home as HomeIcon, Dumbbell, Tv, Car, ArrowUpRight, Plus, Camera, Loader2, PlayCircle, Coins, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const APP_CATEGORIES = [
  { slug: 'vetements-chaussures', name: 'الملابس والأحذية', icon: Shirt },
  { slug: 'accessoires-mode', name: 'إكسسوارات الموضة', icon: Watch },
  { slug: 'telephone-tablette', name: 'هواتف وأجهزة لوحية', icon: Smartphone },
  { slug: 'informatique', name: 'إعلاميات وحواسيب', icon: Laptop },
  { slug: 'jeux-videos-consoles', name: 'ألعاب الفيديو', icon: Gamepad2 },
  { slug: 'beaute-sante', name: 'الصحة والجمال', icon: Sparkles },
  { slug: 'maison-cuisine', name: 'المنزل والمطبخ', icon: HomeIcon },
  { slug: 'sports-loisirs', name: 'الرياضة والتسلية', icon: Dumbbell },
  { slug: 'tv-hi-tech', name: 'تلفاز وإلكترونيات', icon: Tv },
  { slug: 'accessoire-auto-moto', name: 'سيارات ودراجات', icon: Car },
];

const Home = () => {
  const { settings } = useContext(SettingsContext);
  const { user, updateUserData } = useContext(AuthContext); 
  const adminPhoneNumber = settings?.adminWhatsApp || "212600000000";

  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [stories, setStories] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [activeStory, setActiveStory] = useState(null);

  // 📸 حالات إضافة القصة
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};

        if (user?.token && updateUserData) {
          axiosInstance.get('/api/auth/profile', config)
            .then(res => {
              if (res.data) updateUserData(res.data);
            })
            .catch(err => console.error('Silent profile sync failed'));
        }

        const fetchProducts = axiosInstance.get('/api/products/smart-feed', config)
          .catch(() => axiosInstance.get('/api/products')); 

        const [resReqs, resProds, resStories] = await Promise.allSettled([
          axiosInstance.get('/api/requests/nearby'),
          fetchProducts,
          axiosInstance.get('/api/stories')
        ]);

        if (resReqs.status === 'fulfilled') setRequests(resReqs.value.data);
        if (resProds.status === 'fulfilled') setProducts(resProds.value.data);
        if (resStories.status === 'fulfilled') setStories(resStories.value.data);

      } catch (err) {
        console.error('مشكل في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  // 🔔 دالة طلب تفعيل الإشعارات الحقيقية (Push Notifications)
  const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
      toast.error("متصفحك الحالي لا يدعم الإشعارات الذكية.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        // إرسال إشعار تجريبي فوري للتأكيد
        new Notification("تم تفعيل الإشعارات بنجاح 🔔", {
          body: "ستتوصل الآن بجديد الرسائل وعروض الشراء مباشرة على شاشة هاتفك.",
          icon: "/favicon.ico" // يمكنك وضع رابط لوغو التطبيق هنا
        });
        toast.success("تم تفعيل الإشعارات بنجاح!");
      } else {
        toast.error("تم رفض الإشعارات. يرجى السماح بها من إعدادات المتصفح.");
      }
    });
  };

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const mediaType = file.type.startsWith('video') ? 'video' : 'image';
    if (mediaType === 'video' && file.size > 50 * 1024 * 1024) {
      return toast.error('حجم الفيديو كبير جداً! (الحد الأقصى 50 ميغابايت)');
    }

    setUploading(true);
    try {
      const configUpload = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user.token}` } };
      
      const uploadData = new FormData();
      uploadData.append('image', file); 
      
      const uploadRes = await axiosInstance.post('/api/upload', uploadData, configUpload);
      const mediaUrl = uploadRes.data.url;

      const configStory = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post('/api/stories', { mediaUrl, mediaType }, configStory);

      toast.success('تم نشر القصة بنجاح! 📸');
      setShowAddStoryModal(false);
      
      if (data.coins !== undefined && updateUserData) updateUserData({ ...user, coins: data.coins });
      
      const storiesRes = await axiosInstance.get('/api/stories');
      setStories(storiesRes.data);

    } catch (error) {
      if (error.response?.data?.action === 'NEED_COINS') {
        setShowAddStoryModal(false);
        setShowCoinModal(true); 
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data;
        if (typeof errorMsg === 'string') {
          toast.error(errorMsg);
        } else {
          toast.error('حدث خطأ أثناء الرفع! يرجى التحقق من حجم ونوع الملف.');
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const smartCategories = [...new Set(products.map(p => p.category))]
    .map(slug => APP_CATEGORIES.find(c => c.slug === slug))
    .filter(Boolean);

  const categoriesToShow = smartCategories.length > 0 ? smartCategories : APP_CATEGORIES;

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[80vh] gap-3 bg-gray-50/50">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="pb-28 md:pb-6 text-right w-full max-w-[480px] mx-auto bg-white min-h-screen">
      
      {/* 🔝 1. الهيدر العلوي */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <h1 className="text-[1.1rem] font-black tracking-tight text-neutral-900">
          {settings?.siteName || '9ri3aHunter'}
        </h1>
        <div className="flex gap-2.5">
          
          {/* 🔥 تم التحديث: زر البحث يأخذك الآن إلى صفحة البحث */}
          <Link to="/search" className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition">
            <Search className="h-5 w-5" />
          </Link>
          
          {/* 🔥 تم التحديث: زر الجرس يطلب تصريح الإشعارات (Push Notifications) */}
          <button onClick={requestNotificationPermission} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition relative group">
            <Bell className="h-5 w-5 group-hover:text-amber-500 transition-colors" />
            {/* النقطة الحمراء تنبض لتلفت الانتباه */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>

        </div>
      </div>

      {/* 📸 2. شريط القصص (Stories) */}
      <div className="bg-white pt-3 pb-2 border-b border-gray-50">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x">
          
          <button 
            onClick={() => {
              if (user) setShowAddStoryModal(true);
              else toast.error('يرجى تسجيل الدخول أولاً لنشر قصة.');
            }} 
            className="flex flex-col items-center gap-1 shrink-0 snap-start relative"
          >
            <div className="w-14 h-14 rounded-full p-[2px] border border-gray-200 shadow-sm relative group">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-white flex items-center justify-center text-gray-400">
                <img 
                  src={user?.avatar && user.avatar !== 'null' && user.avatar !== '' ? user.avatar : `https://ui-avatars.com/api/?name=${user?.username || 'Me'}&background=F3F4F6&color=9CA3AF&bold=true`} 
                  className="w-full h-full object-cover" 
                  alt="me" 
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.username || 'Me'}&background=F3F4F6&color=9CA3AF&bold=true`; }}
                />
              </div>
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white z-10">
                <Plus className="h-3 w-3" />
              </div>
            </div>
            <span className="text-[9px] font-bold text-gray-500 mt-0.5">إضافة قصة</span>
          </button>

          {stories.map((story) => (
            <button 
              key={story._id} 
              onClick={() => setActiveStory(story)}
              className="flex flex-col items-center gap-1 shrink-0 snap-start group"
            >
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-red-500 to-purple-500 shadow-sm group-hover:scale-[1.02] transition-transform">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img 
                    src={story.vendor?.avatar && story.vendor.avatar !== 'null' && story.vendor.avatar !== '' ? story.vendor.avatar : `https://ui-avatars.com/api/?name=${story.vendor?.storeName || story.vendor?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`} 
                    className="w-full h-full object-cover" 
                    alt="vendor" 
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${story.vendor?.storeName || story.vendor?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`; }}
                  />
                </div>
              </div>
              <span className="text-[9px] font-black text-gray-700 truncate w-14 text-center mt-0.5">
                {story.vendor?.storeName || story.vendor?.username}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 space-y-4 mt-3">
        
        {/* 🏷️ 3. أزرار التصنيفات السريعة */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-1">
          {categoriesToShow.map(cat => (
            <Link 
              key={cat.slug} 
              to={`/category/${cat.slug}`}
              className="bg-white border border-gray-150 shadow-sm px-3.5 py-2 rounded-full flex items-center gap-1.5 shrink-0 snap-start hover:border-neutral-900 transition"
            >
              <cat.icon className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-[10px] font-black text-gray-800 whitespace-nowrap">{cat.name}</span>
            </Link>
          ))}
        </div>

        {/* 📦 4. عرض المنتجات حسب التصنيفات */}
        <div className="space-y-4">
          {categoriesToShow.map(cat => {
            const catProducts = products.filter(p => p.category === cat.slug);
            if (catProducts.length === 0) return null;

            const sortedCatProducts = [
              ...catProducts.filter(p => p.isPromoted),
              ...catProducts.filter(p => !p.isPromoted)
            ].slice(0, 8);

            return (
              <div key={cat.slug} className="space-y-2">
                
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-black text-[13px] text-gray-900 flex items-center gap-1.5">
                    {cat.name}
                  </h3>
                  <Link to={`/category/${cat.slug}`} className="text-[10px] font-bold text-gray-500 hover:text-neutral-900 transition flex items-center gap-0.5">
                    <span>عرض الكل</span> <ChevronLeft className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide snap-x snap-mandatory">
                  {sortedCatProducts.map(prod => (
                    <div key={prod._id} className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm flex flex-col justify-between snap-start w-[135px] min-w-[135px] relative group">
                      
                      {prod.isPromoted && (
                        <div className="absolute top-2.5 right-2.5 z-10 bg-black/80 backdrop-blur-md text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                          <Crown className="h-2 w-2" /> مميز
                        </div>
                      )}

                      <Link to={`/product/${prod.slug}`} className="block h-28 w-full rounded-[12px] overflow-hidden bg-gray-50 mb-1.5 relative">
                        {prod.images[0] && <img src={prod.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={prod.title} />}
                      </Link>

                      <div className="p-1 space-y-0.5 flex flex-col flex-1 justify-between">
                        <Link to={`/product/${prod.slug}`}>
                          <h4 className="font-bold text-gray-800 text-[10px] line-clamp-2 leading-snug">{prod.title}</h4>
                        </Link>
                        <div className="flex items-center justify-start pt-1">
                          <span className="font-black text-neutral-900 text-xs">{prod.price} <span className="text-[8px] text-gray-500 font-bold">درهم</span></span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {catProducts.length > 8 && (
                    <Link to={`/category/${cat.slug}`} className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center min-w-[100px] snap-start hover:bg-gray-100 transition text-center p-3 gap-1.5">
                      <div className="bg-white p-2 rounded-full shadow-sm"><ChevronLeft className="h-4 w-4 text-gray-600" /></div>
                      <span className="text-[9px] font-black text-gray-600">المزيد</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 🎯 5. طلبات الشراء */}
        <div className="bg-neutral-900 p-4 rounded-3xl border border-neutral-800 shadow-md space-y-3 relative overflow-hidden mt-2 mb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[70px] opacity-20 pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-black text-[13px] text-white flex items-center gap-1.5">
              <Target className="h-4 w-4 text-blue-400" /> طلبات المشترين
            </h3>
            <Link to="/requests" className="text-[9px] font-black bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-full shadow-sm hover:bg-white/20 transition">تصفح الكل</Link>
          </div>

          <div className="grid grid-cols-1 gap-2 relative z-10">
            {requests.slice(0, 3).map(req => (
              <Link key={req._id} to={`/request/${req._id}`} className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/5 flex justify-between items-center gap-3 hover:bg-white/20 transition">
                <div className="text-right overflow-hidden flex-1">
                  <h4 className="font-bold text-gray-100 text-[11px] truncate">{req.title}</h4>
                  <span className="text-[9px] font-bold text-blue-400 block mt-0.5">الميزانية: {req.maxBudget} درهم</span>
                </div>
                <div className="bg-blue-500 text-white font-black text-[9px] px-3 py-1.5 rounded-xl shrink-0">تقديم عرض</div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ================================================================= */}
      {/* 🪟 النوافذ المنبثقة (Modals) */}
      {/* ================================================================= */}

      {/* ➕ مودال إضافة قصة */}
      {showAddStoryModal && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-md text-center" dir="rtl">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm mx-auto shadow-2xl relative">
            <button onClick={() => setShowAddStoryModal(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full"><X className="h-5 w-5 text-gray-600" /></button>
            <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-amber-500 rounded-full p-1 mx-auto mb-4">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center"><Camera className="h-6 w-6 text-pink-500" /></div>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">نشر قصة سريعة 📸</h3>
            <p className="text-xs font-bold text-gray-500 mb-6">القصة تبقى ظاهرة لمدة 24 ساعة. التكلفة <span className="text-amber-500 font-black text-sm">20 Coins 🪙</span>.<br/><span className="text-red-500">مدة الفيديو القصوى: 40 ثانية.</span></p>
            
            <label className={`w-full bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg flex justify-center items-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />} 
              <span>{uploading ? 'جاري رفع القصة...' : 'اختر فيديو أو صورة'}</span>
              <input type="file" accept="video/mp4,video/x-m4v,video/*,image/*" className="hidden" onChange={handleAddStory} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* 🪙 مودال شحن العملات */}
      {showCoinModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md text-center relative overflow-hidden">
            <button onClick={() => setShowCoinModal(false)} className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-full z-10"><X className="h-5 w-5 text-gray-500" /></button>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"><Coins className="h-8 w-8 text-white" /></div>
            <h3 className="text-xl font-black text-gray-900 mb-1">شحن رصيد العملات 🪙</h3>
            <p className="text-gray-500 mb-5 text-xs font-medium px-4">رصيدك الحالي ({user?.coins || 0}) غير كافٍ. يرجى شحن الرصيد لتتمكن من نشر القصص والترويج لمنتجاتك!</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-right text-xs text-amber-800 space-y-1.5 font-bold shadow-inner">
              <p>🛒 500 Coin = 50 درهم</p><p>🚀 1200 Coin = 100 درهم (أفضل عرض)</p>
            </div>
            <a href={`https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(`السلام عليكم، أريد شحن محفظتي بـ Coins 🪙. اسم الحساب: ${user?.username}`)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-neutral-900 hover:bg-black text-white font-black py-3.5 rounded-xl text-xs flex justify-center items-center gap-2 shadow-md"><Phone className="h-4 w-4" /> تواصل مع الإدارة للشحن</a>
          </div>
        </div>
      )}

      {/* 👁️ عارض القصص (مع الصورة الذكية المدمجة) */}
      {activeStory && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col animate-fade-in" dir="rtl">
          <div className="absolute top-3 inset-x-3 z-20 flex gap-1">
            <div className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white animate-[progress_15s_linear_forwards] origin-right"></div>
            </div>
          </div>

          <div className="absolute top-6 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full border border-gray-600 overflow-hidden bg-white flex items-center justify-center">
                <img 
                  src={activeStory.vendor?.avatar && activeStory.vendor.avatar !== 'null' && activeStory.vendor.avatar !== '' ? activeStory.vendor.avatar : `https://ui-avatars.com/api/?name=${activeStory.vendor?.storeName || activeStory.vendor?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`} 
                  className="w-full h-full object-cover" 
                  alt="vendor" 
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${activeStory.vendor?.storeName || activeStory.vendor?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`; }}
                />
              </div>
              <div className="text-right drop-shadow-md">
                <h3 className="text-white text-sm font-black">{activeStory.vendor?.storeName || activeStory.vendor?.username}</h3>
                <span className="text-gray-300 text-[10px] font-medium">{new Date(activeStory.createdAt).toLocaleTimeString('ar-MA', {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <button onClick={() => setActiveStory(null)} className="text-white p-2 rounded-full hover:bg-white/20 transition">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 w-full h-full relative bg-zinc-950 flex items-center justify-center">
            {activeStory.mediaType === 'video' ? (
              <video src={activeStory.mediaUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={activeStory.mediaUrl} className="w-full h-full object-cover" alt="story" />
            )}
            <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
          </div>

          <div className="absolute bottom-8 inset-x-6 z-20">
            <Link 
              to={`/vendor/${activeStory.vendor?._id}`}
              className="w-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black py-4 rounded-2xl flex justify-center items-center gap-2 text-sm hover:bg-white hover:text-black transition-all shadow-2xl"
            >
              زيارة المتجر <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </div>

          <style>{`@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
        </div>
      )}
      
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default Home;