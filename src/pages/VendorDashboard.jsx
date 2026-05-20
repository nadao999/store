import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import axiosInstance from '../axios';
import { Package, Crown, Loader2, Image, Trash2, Camera, Rocket, X, Pencil, Coins, Phone, Plus, PlayCircle, Film, Settings, AlertTriangle, MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const APP_CATEGORIES = [
  { slug: 'vetements-chaussures', name: 'الملابس والأحذية' },
  { slug: 'accessoires-mode', name: 'إكسسوارات الموضة' },
  { slug: 'telephone-tablette', name: 'الهواتف والأجهزة اللوحية' },
  { slug: 'informatique', name: 'الإعلاميات والحواسيب' },
  { slug: 'jeux-videos-consoles', name: 'ألعاب الفيديو' },
  { slug: 'beaute-sante', name: 'الصحة والجمال' },
  { slug: 'maison-cuisine', name: 'المنزل والمطبخ' },
  { slug: 'sports-loisirs', name: 'الرياضة والتسلية' },
  { slug: 'tv-hi-tech', name: 'تلفاز وإلكترونيات' },
  { slug: 'accessoire-auto-moto', name: 'سيارات ودراجات' }
];

const VendorDashboard = () => {
  const { user, updateUserData } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const adminPhoneNumber = settings?.adminWhatsApp || "212600000000";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingStore, setUpdatingStore] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  // 🪟 Modals Management
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false); 
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false); 
  const [showStoryModal, setShowStoryModal] = useState(false);
  
  const [boostConfirm, setBoostConfirm] = useState({ isOpen: false, productId: null }); 
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, productId: null });

  // Forms
  const [storeInfo, setStoreInfo] = useState({ storeName: '', storeBio: '', workingHours: '', storeCover: '', avatar: '' });
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category: 'vetements-chaussures', images: [] });
  const [editFormData, setEditFormData] = useState({ _id: '', title: '', description: '', price: '', category: '', images: [] });

  const isPremium = user?.subscriptionPlan === 'Premium';

  // 🛡️ دالة ذكية باش نهائيا ما يبانش كود HTML ولا [object Object]
  const showProError = (error, defaultMessage) => {
    const data = error?.response?.data;
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string') return toast.error(data.message);
      if (typeof data.error === 'string') return toast.error(data.error);
    } else if (typeof data === 'string') {
      if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
        return toast.error('مشكل في السيرفر! تأكد من نوع وحجم الملف.');
      }
      return toast.error(data);
    }
    toast.error(defaultMessage || 'حدث خطأ غير متوقع.');
  };

  // 🔥 الـ useEffect خاصو ديما يكون الفوق باش يخدم قبل ما نحبسو الصفحة
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.token) return;
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const resProfile = await axiosInstance.get('/api/auth/profile', config);
        const dbUser = resProfile.data;
        updateUserData(dbUser);
        setStoreInfo({ storeName: dbUser.storeName || '', storeBio: dbUser.storeBio || '', workingHours: dbUser.workingHours || '', storeCover: dbUser.storeCover || '', avatar: dbUser.avatar || '' });

        const resProducts = await axiosInstance.get(`/api/products/vendor/${dbUser._id || dbUser.id}`);
        setProducts(resProducts.data);
      } catch (error) {
        showProError(error, 'حدث خطأ أثناء تحميل بيانات المتجر');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  // ==========================================
  // 🚀 التحكم في المنتجات والترويج
  // ==========================================

  const confirmBoost = (productId) => {
    const product = products.find(p => p._id === productId);
    if (!product.isPromoted) setBoostConfirm({ isOpen: true, productId }); 
    else executeBoost(productId); 
  };

  const executeBoost = async (productId) => {
    setBoostConfirm({ isOpen: false, productId: null });
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.put(`/api/products/${productId}/boost`, {}, config);
      setProducts(prev => prev.map(p => p._id === productId ? data.product : p));
      if (data.coins !== undefined && updateUserData) updateUserData({ ...user, coins: data.coins });
      toast.success(data.message);
    } catch (error) {
      if (error.response?.data?.action === 'NEED_COINS') setShowCoinModal(true); 
      else showProError(error, 'حدث خطأ أثناء الترويج');
    }
  };

  const handleImageUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    e.target.value = ''; 
    if (files.length === 0) return;
    setUploading(true);
    const uploadedUrls = [];
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user.token}` } };
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append('image', file); 
        const { data } = await axiosInstance.post('/api/upload', uploadData, config);
        uploadedUrls.push(data.url);
      }
      if (type === 'add') setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      else if (type === 'edit') setEditFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast.success('تم الرفع بنجاح! 🖼️');
    } catch (error) { 
      showProError(error, 'فشل رفع الصورة');
    } finally { 
      setUploading(false); 
    }
  };

  const handleRemoveImage = (index, type) => {
    if (type === 'edit') setEditFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== index) }));
    else setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== index) }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price || formData.images.length === 0) return toast.error('يرجى ملء جميع الحقول وإضافة صورة واحدة على الأقل!');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post('/api/products', formData, config);
      setProducts(prev => [data, ...prev]);
      setFormData({ title: '', description: '', price: '', category: 'vetements-chaussures', images: [] });
      setShowAddProductModal(false);
      toast.success('تمت الإضافة بنجاح! 🎉');
    } catch (error) {
      if (error.response?.data?.action === 'UPGRADE_REQUIRED') setShowUpgradeModal(true);
      else showProError(error, 'حدث خطأ أثناء إضافة المنتج');
    }
  };

  const openEditModal = (product) => {
    setEditFormData({ _id: product._id, title: product.title, description: product.description, price: product.price, category: product.category, images: product.images || [] });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (editFormData.images.length === 0) return toast.error('لا يمكنك ترك المنتج بدون صور!');
    setUpdatingProduct(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.put(`/api/products/${editFormData._id}`, editFormData, config);
      setProducts(prev => prev.map(p => p._id === editFormData._id ? data : p));
      setShowEditModal(false);
      toast.success('تم تحديث المنتج بنجاح!');
    } catch (error) { 
      showProError(error, 'حدث خطأ أثناء التعديل');
    } finally { 
      setUpdatingProduct(false); 
    }
  };

  const executeDeleteProduct = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.delete(`/api/products/${deleteConfirm.productId}`, config);
      setProducts(prev => prev.filter(p => p._id !== deleteConfirm.productId));
      setDeleteConfirm({ isOpen: false, productId: null });
      toast.success('تم حذف المنتج بنجاح. 🗑️');
    } catch (error) { 
      setDeleteConfirm({ isOpen: false, productId: null });
      showProError(error, 'حدث خطأ أثناء الحذف');
    }
  };

  const handleStoreMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    e.target.value = ''; 
    if (!file) return;
    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file); 
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post('/api/upload', uploadData, config);
      if (type === 'cover') setStoreInfo(prev => ({ ...prev, storeCover: data.url }));
      if (type === 'logo') setStoreInfo(prev => ({ ...prev, avatar: data.url }));
      toast.success('تم رفع الصورة بنجاح!');
    } catch (error) { 
      showProError(error, 'فشل رفع صورة المتجر');
    } finally { 
      setUploading(false); 
    }
  };

  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    setUpdatingStore(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.put('/api/auth/store-settings', storeInfo, config);
      updateUserData(data.user);
      setShowSettingsModal(false);
      toast.success(data.message || 'تم حفظ الإعدادات بنجاح');
    } catch (error) { 
      showProError(error, 'حدث خطأ أثناء الحفظ');
    } finally { 
      setUpdatingStore(false); 
    }
  };

  const handleRecordSale = async (productId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.put(`/api/products/${productId}/sell-piece`, {}, config);
      
      toast.success(data.message);
      // fetchMyProducts(); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تسجيل المبيعة');
    }
  };

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; 
    
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
      setShowStoryModal(false);
      
      if (data.coins !== undefined && updateUserData) {
        updateUserData({ ...user, coins: data.coins });
      }
    } catch (error) {
      if (error.response?.data?.action === 'NEED_COINS') {
        setShowStoryModal(false);
        setShowCoinModal(true);
      } else {
        showProError(error, 'حدث خطأ أثناء نشر القصة');
      }
    } finally {
      setUploading(false);
    }
  };

  // 🔥 كنخليو الـ Loading هي الأولى باش يكمل الـ Fetch د البروفايل
  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-amber-500 h-10 w-10" /></div>;

  // 🛡️ دابا عاد كنشيكيو واش الإيميل مفعل، حيت الداتا غاتكون تجددات
  if (user?.isEmailVerified === false) {
    return (
      <div dir="rtl" className="text-center mt-32 max-w-sm mx-auto bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <MailWarning className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-gray-900">حسابك غير مفعل!</h2>
        <p className="text-xs text-gray-500 font-bold leading-relaxed">
          لا يمكنك إدارة متجرك أو إضافة منتجات قبل تأكيد بريدك الإلكتروني.
        </p>
        <Link to="/profile" className="block w-full bg-neutral-900 text-white font-black py-3.5 rounded-xl hover:bg-black transition shadow-sm text-sm mt-2">
          الذهاب لتفعيل الحساب
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="pb-24 md:pb-6 text-right max-w-5xl mx-auto space-y-5 px-3 mt-2 relative">
      
      {/* 🪙 هيدر المحفظة والمحل */}
      <div className="bg-gradient-to-r from-neutral-950 via-gray-900 to-neutral-950 text-white rounded-3xl p-5 shadow-lg flex justify-between items-center border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white p-0.5 relative">
            {/* 🔥 الأفاتار الذكي */}
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center font-black text-gray-400">
              <img 
                src={user?.avatar && user.avatar !== 'null' && user.avatar !== '' ? user.avatar : `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`} 
                className="w-full h-full object-cover" 
                alt="Avatar"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`; }}
              />
            </div>
            {isPremium && <Crown className="absolute -top-2 -right-2 h-5 w-5 text-amber-400 drop-shadow-md" />}
          </div>
          <div>
            <h1 className="text-sm font-black flex items-center gap-1">{storeInfo.storeName || user?.username}</h1>
            <p className="text-gray-400 text-[10px] font-medium">{isPremium ? 'بائع مميز VIP 👑' : 'بائع قياسي'}</p>
          </div>
        </div>
        
        <button onClick={() => setShowCoinModal(true)} className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-2xl text-center transition shadow-md flex items-center gap-2">
          <div className="text-right">
            <span className="text-[9px] font-black block leading-none">الرصيد</span>
            <span className="text-sm font-black leading-none">{user?.coins || 0}</span>
          </div>
          <Coins className="h-6 w-6" />
        </button>
      </div>

      {/* 📸 شريط الـ Stories */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-black text-gray-800 mb-3">القصص والفيديوهات (Stories)</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          <button onClick={() => setShowStoryModal(true)} className="flex flex-col items-center gap-1.5 shrink-0 group">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 p-1 group-hover:border-amber-500 transition relative">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center">
                <Plus className="h-6 w-6 text-gray-400 group-hover:text-amber-500" />
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-500">إضافة قصة</span>
          </button>
          
          <button onClick={() => toast('قسم مقاطع Reels سيكون متاحاً قريباً للـ VIP! 🎬')} className="flex flex-col items-center gap-1.5 shrink-0 group opacity-70">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 p-1 group-hover:border-purple-500 transition relative">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center">
                <Film className="h-6 w-6 text-gray-400 group-hover:text-purple-500" />
              </div>
              <Crown className="absolute -bottom-1 -right-1 h-4 w-4 text-purple-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-500">مقاطع Reels</span>
          </button>
        </div>
      </div>

      {/* 🎛️ أزرار التحكم السريعة */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowAddProductModal(true)} className="bg-neutral-900 text-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-black transition">
          <div className="bg-white/10 p-3 rounded-full"><Package className="h-6 w-6 text-amber-400" /></div>
          <span className="text-sm font-black">إضافة منتج</span>
        </button>
        
        <button onClick={() => setShowSettingsModal(true)} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition">
           <div className="bg-gray-50 p-3 rounded-full border border-gray-200"><Settings className="h-6 w-6 text-gray-600" /></div>
           <span className="text-sm font-black text-gray-800">إعدادات المتجر</span>
        </button>
      </div>

      {/* 📦 المنتجات الخاصة بي */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-base font-black text-gray-900">منتجاتي ({products.length})</h2>
          {!isPremium && <span className="text-[10px] font-bold text-gray-400">الحد الأقصى: 5</span>}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 text-gray-400 font-bold text-sm">المتجر فارغ، ابدأ بنشر منتجاتك الآن!</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {products.map(product => (
              <div key={product._id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between ${product.isPromoted ? 'border-amber-400 ring-1 ring-amber-400' : 'border-gray-100'}`}>
                <div className="h-32 bg-gray-50 relative group">
                  {product.images[0] && <img src={product.images[0]} className="w-full h-full object-cover" />}
                  {product.isPromoted && <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-md shadow-sm">🚀 مـُروج</span>}
                  
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(product); }} className="bg-white/90 backdrop-blur-sm text-blue-600 p-1.5 rounded-lg shadow-sm border border-gray-100 hover:bg-blue-50 transition">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, productId: product._id }); }} className="bg-white/90 backdrop-blur-sm text-red-500 p-1.5 rounded-lg shadow-sm border border-gray-100 hover:bg-red-50 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-bold text-gray-800 text-[11px] truncate mb-1">{product.title}</h3>
                  <span className="font-black text-green-600 text-sm block mb-2">{product.price} درهم</span>
                  
                  <button 
                    onClick={() => confirmBoost(product._id)}
                    className={`w-full py-2 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 border ${product.isPromoted ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' : 'bg-amber-500 border-amber-500 text-black shadow-sm hover:scale-[1.02]'}`}
                  >
                    {product.isPromoted ? 'إيقاف الترويج' : '🚀 ترويج (50 🪙)'}
                  </button>
                </div>
              </div>
            ))}
            
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 🪟 النوافذ المنبثقة الاحترافية (Modals) */}
      {/* ========================================================= */}

      {/* 🗑️ مودال تأكيد الحذف الاحترافي */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-center" dir="rtl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm border border-red-200">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-sm font-bold text-gray-500 mb-6 px-2">
              هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن هذه الخطوة.
            </p>
            <div className="flex gap-3">
              <button onClick={executeDeleteProduct} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-2xl text-sm shadow-md transition">حذف نهائي</button>
              <button onClick={() => setDeleteConfirm({isOpen: false, productId: null})} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-3 rounded-2xl text-sm transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ مودال إعدادات المحل */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex flex-col justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in text-right" dir="rtl">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4 flex-row-reverse sticky top-0 bg-white z-10">
              <button onClick={() => setShowSettingsModal(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full"><X className="h-5 w-5 text-gray-600" /></button>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Settings className="h-5 w-5" /> إعدادات المتجر</h3>
            </div>
            <form onSubmit={handleSaveStoreSettings} className="space-y-4">
              <div className="relative mb-12">
                <div className="h-28 bg-gray-100 rounded-xl overflow-hidden border relative">
                  <img src={storeInfo.storeCover || 'https://via.placeholder.com/600x200'} className="w-full h-full object-cover" />
                  <label className="absolute top-2 right-2 bg-black/60 p-2 rounded-lg cursor-pointer hover:bg-black text-white">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" onChange={(e) => handleStoreMediaUpload(e, 'cover')} className="hidden" disabled={uploading}/>
                  </label>
                </div>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full p-1 shadow-md border">
                  {/* 🔥 الأفاتار الذكي */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 relative flex items-center justify-center font-black text-2xl text-gray-400">
                    <img 
                      src={storeInfo.avatar && storeInfo.avatar !== 'null' && storeInfo.avatar !== '' ? storeInfo.avatar : `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`} 
                      className="w-full h-full object-cover" 
                      alt="store avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`; }}
                    />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer rounded-full text-white">
                      <Camera className="h-5 w-5" />
                      <input type="file" accept="image/*" onChange={(e) => handleStoreMediaUpload(e, 'logo')} className="hidden" disabled={uploading}/>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">اسم المتجر</label>
                <input type="text" value={storeInfo.storeName} onChange={(e) => setStoreInfo({...storeInfo, storeName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">نبذة عن المتجر (Bio)</label>
                <textarea value={storeInfo.storeBio} onChange={(e) => setStoreInfo({...storeInfo, storeBio: e.target.value})} rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">أوقات العمل</label>
                <input type="text" value={storeInfo.workingHours} onChange={(e) => setStoreInfo({...storeInfo, workingHours: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold focus:outline-none" />
              </div>
              <button type="submit" disabled={updatingStore || uploading} className="w-full bg-neutral-900 text-white font-black rounded-2xl py-3.5 text-sm hover:bg-black transition shadow-lg mt-2">
                {updatingStore ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📦 مودال إضافة منتج */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex flex-col justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in text-right" dir="rtl">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4 flex-row-reverse sticky top-0 bg-white z-10">
              <button onClick={() => setShowAddProductModal(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full"><X className="h-5 w-5 text-gray-600" /></button>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Package className="h-5 w-5" /> إضافة منتج جديد</h3>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">ماذا تريد أن تبيع؟</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm font-bold focus:outline-none focus:border-neutral-900" placeholder="مثال: قميص أصلي" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">السعر (درهم)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm font-bold focus:outline-none focus:border-neutral-900" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">التصنيف</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:border-neutral-900">
                    {APP_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">وصف المنتج</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:border-neutral-900" />
              </div>
              
              <label className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-neutral-900 transition">
                <div className="bg-white p-3 rounded-full shadow-sm"><Image className="h-6 w-6 text-gray-500" /></div>
                <span className="text-xs text-gray-600 font-black">اختر صور المنتج</span>
                <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'add')} className="hidden" disabled={uploading} />
              </label>

              {formData.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0 group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage(idx, 'add')} className="absolute inset-0 bg-black/50 flex items-center justify-center transition"><Trash2 className="h-5 w-5 text-white" /></button>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={uploading} className="w-full bg-neutral-900 text-white font-black rounded-2xl py-3.5 text-sm hover:bg-black transition shadow-lg">نشر المنتج الآن</button>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ مودال التعديل */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex flex-col justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-sm text-right" dir="rtl">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md mx-auto shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between border-b pb-3 flex-row-reverse sticky top-0 bg-white z-10">
               <button onClick={() => setShowEditModal(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full"><X className="h-5 w-5" /></button>
               <h3 className="font-black text-gray-900">تعديل المنتج</h3>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-3">
               <div>
                 <label className="block text-[11px] font-bold text-gray-400 mb-1">اسم المنتج</label>
                 <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl text-sm font-bold focus:outline-none focus:border-neutral-900" />
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="block text-[11px] font-bold text-gray-400 mb-1">السعر</label>
                   <input type="number" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl text-sm font-bold focus:outline-none focus:border-neutral-900" />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-gray-400 mb-1">التصنيف</label>
                   <select value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-neutral-900">
                      {APP_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-[11px] font-bold text-gray-400 mb-1">الوصف</label>
                 <textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-neutral-900" rows="2" />
               </div>

               <div className="pt-2">
                 <label className="block text-[11px] font-bold text-gray-400 mb-2">صور المنتج</label>
                 <div className="flex gap-2 overflow-x-auto pb-2">
                   {editFormData.images.map((img, idx) => (
                     <div key={idx} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0 group">
                       <img src={img} className="w-full h-full object-cover" />
                       <button type="button" onClick={() => handleRemoveImage(idx, 'edit')} className="absolute inset-0 bg-black/60 flex items-center justify-center transition"><Trash2 className="h-5 w-5 text-white" /></button>
                     </div>
                   ))}
                   <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-900 transition">
                     <Plus className="h-6 w-6 text-gray-400" />
                     <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'edit')} className="hidden" disabled={uploading} />
                   </label>
                 </div>
               </div>

               <div className="flex gap-2 pt-3">
                 <button type="submit" disabled={updatingProduct || uploading} className="w-full bg-neutral-900 text-white font-black rounded-xl py-3.5 text-sm hover:bg-black transition">
                   {updatingProduct || uploading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'حفظ التعديلات'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 مودال التأكيد ديال البوست */}
      {boostConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[99] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-center" dir="rtl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg border-4 border-white relative z-10">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">تأكيد الترويج</h3>
            <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed px-2">
              هذه العملية ستجعل منتجك يظهر في صدارة الموقع.<br/>
              ستكلفك <span className="text-amber-500 font-black text-base">50 Coins 🪙</span>. هل أنت متأكد؟
            </p>
            <div className="flex gap-3">
              <button onClick={() => executeBoost(boostConfirm.productId)} className="flex-1 bg-neutral-900 text-white font-black py-3 rounded-2xl text-sm shadow-md">نعم، قم بالترويج</button>
              <button onClick={() => setBoostConfirm({isOpen: false, productId: null})} className="flex-1 bg-gray-100 text-gray-600 font-black py-3 rounded-2xl text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* 📸 مودال الـ Story */}
      {showStoryModal && (
        <div className="fixed inset-0 bg-black/90 z-[999] flex flex-col justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-md text-center" dir="rtl">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm mx-auto shadow-2xl relative">
            <button onClick={() => setShowStoryModal(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full"><X className="h-5 w-5 text-gray-600" /></button>
            <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-amber-500 rounded-full p-1 mx-auto mb-4">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center"><Camera className="h-6 w-6 text-pink-500" /></div>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">نشر قصة للمتجر 📸</h3>
            <p className="text-xs font-bold text-gray-500 mb-6">القصة تبقى ظاهرة لمدة 24 ساعة. التكلفة <span className="text-amber-500 font-black text-sm">20 Coins 🪙</span>.<br/><span className="text-red-500">مدة الفيديو القصوى: 40 ثانية.</span></p>
            
            <label className={`w-full bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg flex justify-center items-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />} 
              <span>{uploading ? 'جاري رفع القصة...' : 'اختر فيديو أو صورة'}</span>
              <input type="file" accept="video/mp4,video/x-m4v,video/*,image/*" className="hidden" onChange={handleAddStory} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* 🪙 مودال الشحن */}
      {showCoinModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md text-center relative overflow-hidden">
            <button onClick={() => setShowCoinModal(false)} className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-full z-10"><X className="h-5 w-5 text-gray-500" /></button>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"><Coins className="h-8 w-8 text-white" /></div>
            <h3 className="text-xl font-black text-gray-900 mb-1">شحن رصيد العملات 🪙</h3>
            <p className="text-gray-500 mb-5 text-xs font-medium px-4">رصيدك الحالي ({user?.coins || 0}) غير كافٍ. يرجى شحن الرصيد لتتمكن من الترويج لمنتجاتك!</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-right text-xs text-amber-800 space-y-1.5 font-bold shadow-inner">
              <p>🛒 500 Coin = 50 درهم</p><p>🚀 1200 Coin = 100 درهم (أفضل عرض)</p>
            </div>
            <a href={`https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(`السلام عليكم، أريد شحن محفظتي بـ Coins 🪙. اسم الحساب: ${user?.username}`)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-neutral-900 hover:bg-black text-white font-black py-3.5 rounded-xl text-xs flex justify-center items-center gap-2 shadow-md"><Phone className="h-4 w-4" /> تواصل مع الإدارة للشحن</a>
          </div>
        </div>
      )}

      {/* 🛑 مودال الترقية */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md text-center relative">
            <Crown className="h-14 w-14 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl font-black text-gray-800 mb-1">وصلت للحد الأقصى!</h3>
            <p className="text-gray-500 mb-5 text-xs">الباقة المجانية تتيح لك 5 منتجات فقط. قم بترقية حسابك إلى Premium لتتمكن من إضافة المزيد.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowUpgradeModal(false)} className="w-full bg-gray-100 text-gray-500 font-bold py-2.5 rounded-xl text-xs">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}

export default VendorDashboard;