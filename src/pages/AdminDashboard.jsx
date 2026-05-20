import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axios';
import { Users, Package, Flag, ShieldCheck, Crown, Ban, CheckCircle2, Trash2, Loader2, Target, Settings, Save, Coins, X, Eye, ExternalLink, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('users');
  
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  
  const [settingsData, setSettingsData] = useState({ siteName: '', adminWhatsApp: '', themeColor: '#FF5733' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [coinModal, setCoinModal] = useState({ isOpen: false, userId: null, username: '', newCoins: 0 });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null, action: null, message: '', title: '' });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('غير مسموح لك بالدخول لهذه الصفحة');
      navigate('/');
      return;
    }
    fetchAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const [resStats, resUsers, resReports, resProducts, resRequests, resSettings] = await Promise.all([
        axiosInstance.get('/api/admin/stats', config).catch(() => ({ data: {} })),
        axiosInstance.get('/api/admin/users', config).catch(() => ({ data: [] })),
        axiosInstance.get('/api/admin/reports', config).catch(() => ({ data: [] })),
        axiosInstance.get('/api/admin/products', config).catch(() => ({ data: [] })),
        axiosInstance.get('/api/admin/requests', config).catch(() => ({ data: [] })),
        axiosInstance.get('/api/admin/settings', config).catch(() => ({ data: {} }))
      ]);

      setStats(resStats.data);
      setUsersList(resUsers.data || []);
      setReportsList(resReports.data || []);
      setProductsList(resProducts.data || []);
      setRequestsList(resRequests.data || []);
      
      if (resSettings.data && resSettings.data.siteName) setSettingsData(resSettings.data);
      
    } catch (error) {
      toast.error('مشكلة في جلب بعض بيانات الإدارة');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updateData) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.put(`/api/admin/users/${userId}`, updateData, config);
      toast.success('تم التحديث بنجاح! 🛠️');
      fetchAdminData();
    } catch (error) { toast.error('فشل التحديث'); }
  };

  const executeConfirmation = async () => {
    const { type, id, action } = confirmModal;
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    
    try {
      if (type === 'USER') {
        await axiosInstance.delete(`/api/admin/users/${id}`, config);
        toast.success('تم مسح المستخدم بنجاح! 🗑️');
      } 
      else if (type === 'PRODUCT') {
        await axiosInstance.delete(`/api/admin/products/${id}`, config);
        toast.success('تم مسح المنتج بنجاح! 🚀');
      } 
      else if (type === 'REQUEST') {
        await axiosInstance.delete(`/api/requests/${id}`, config);
        toast.success('تم مسح الطلب بنجاح! 🗑️');
      } 
      else if (type === 'REPORT') {
        await axiosInstance.put(`/api/admin/reports/${id}/resolve`, { action }, config);
        toast.success('تم إغلاق الشكوى بنجاح');
      }
      
      setConfirmModal({ isOpen: false, type: '', id: null, action: null, message: '', title: '' });
      fetchAdminData();
    } catch (error) {
      toast.error('فشل في تنفيذ الإجراء');
      setConfirmModal({ isOpen: false, type: '', id: null, action: null, message: '', title: '' });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.axiosInstance.put('/api/admin/settings', settingsData, config);
      toast.success('تم حفظ الإعدادات بنجاح!');
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error) { toast.error('فشل حفظ الإعدادات'); } 
    finally { setSavingSettings(false); }
  };

  const handleChargeCoins = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.put(`/api/admin/users/${coinModal.userId}/coins`, { coins: coinModal.newCoins }, config);
      toast.success(`تم شحن رصيد ${coinModal.username} بنجاح! 🪙`);
      setCoinModal({ isOpen: false, userId: null, username: '', newCoins: 0 });
      fetchAdminData();
    } catch (error) {
      toast.error('فشل شحن الرصيد');
    }
  };

  if (loading) return <div className="flex justify-center mt-32"><Loader2 className="animate-spin h-10 w-10 text-amber-500" /></div>;

  return (
    <div className="pb-24 md:pb-6 text-right max-w-6xl mx-auto px-3 space-y-5 mt-2 font-sans" dir="rtl">
      
      {/* هيدر الإدارة VIP */}
      <div className="bg-gradient-to-r from-neutral-950 via-gray-900 to-neutral-950 text-white p-5 rounded-3xl shadow-xl flex justify-between items-center border border-neutral-800 relative overflow-hidden">
        <Crown className="absolute -left-4 -bottom-4 h-24 w-24 text-white/5 -rotate-12" />
        <div className="relative z-10 w-full text-right">
          <h1 className="text-lg md:text-2xl font-black flex items-center justify-start gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-400" /> لوحة تحكم الإدارة 👑
          </h1>
          <p className="text-amber-100/60 text-[10px] md:text-xs mt-1 font-medium">إدارة شاملة للمنصة: الأعضاء، السلع، الطلبات، والشكاوى.</p>
        </div>
      </div>

      {/* الإحصائيات المخصصة للهواتف والحواسب */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <Users className="h-6 w-6 text-blue-500 mb-1" />
          <span className="text-xl font-black text-gray-800">{stats?.usersCount || 0}</span>
          <span className="text-[10px] text-gray-400 font-bold">الأعضاء</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <Package className="h-6 w-6 text-green-500 mb-1" />
          <span className="text-xl font-black text-gray-800">{stats?.productsCount || 0}</span>
          <span className="text-[10px] text-gray-400 font-bold">المنتجات</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <Crown className="h-6 w-6 text-amber-500 mb-1" />
          <span className="text-xl font-black text-gray-800">{stats?.premiumUsers || 0}</span>
          <span className="text-[10px] text-gray-400 font-bold">VIP</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center relative">
          <Flag className="h-6 w-6 text-red-500 mb-1" />
          <span className="text-xl font-black text-red-600">{stats?.reportsCount || 0}</span>
          <span className="text-[10px] text-red-400 font-bold">الشكاوى</span>
        </div>
      </div>

      {/* شريط التبويب العائم */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('users')} className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[11px] sm:text-sm font-black transition flex items-center justify-center gap-1 ${activeTab === 'users' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>
          <Users className="h-3.5 w-3.5 hidden sm:block" /> الأعضاء
        </button>
        <button onClick={() => setActiveTab('products')} className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[11px] sm:text-sm font-black transition flex items-center justify-center gap-1 ${activeTab === 'products' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>
          <Package className="h-3.5 w-3.5 hidden sm:block" /> السلع
        </button>
        <button onClick={() => setActiveTab('requests')} className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[11px] sm:text-sm font-black transition flex items-center justify-center gap-1 ${activeTab === 'requests' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>
          <Target className="h-3.5 w-3.5 hidden sm:block" /> الطلبات
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[11px] sm:text-sm font-black transition flex items-center justify-center gap-1 ${activeTab === 'reports' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-red-500'}`}>
          <Flag className="h-3.5 w-3.5 hidden sm:block" /> الشكاوى {reportsList?.length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{reportsList.length}</span>}
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[11px] sm:text-sm font-black transition flex items-center justify-center gap-1 ${activeTab === 'settings' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>
          <Settings className="h-3.5 w-3.5 hidden sm:block" /> الإعدادات
        </button>
      </div>

      {/* قسم الأعضاء */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {usersList?.map(u => (
            <div key={u._id} className={`bg-white rounded-2xl p-4 border shadow-sm flex flex-col justify-between ${u.isBlocked ? 'border-red-200 bg-red-50/30 opacity-75' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-3 border-b border-gray-50 pb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                  <img 
                    src={u.avatar && u.avatar !== 'null' && u.avatar !== '' 
                      ? u.avatar 
                      : `https://ui-avatars.com/api/?name=${u.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`} 
                    className="w-full h-full object-cover"
                    alt="User Profile"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${u.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`; }}
                  />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-black text-gray-900 flex items-center justify-start gap-1 text-sm">
                    {u.username}
                    {u.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                    {u.isBlocked && <span className="text-[9px] bg-red-600 text-white px-1.5 rounded-sm">محظور</span>}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400">{u.email}</div>
                  <div className="text-[9px] text-gray-500 font-bold mt-0.5">{u.role === 'admin' ? 'مسؤول المنصة 👑' : (u.storeName || 'مستعمل عادي')}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <button onClick={() => setCoinModal({ isOpen: true, userId: u._id, username: u.username, newCoins: u.coins || 0 })} className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1 shadow-sm">
                  {u.coins || 0} <Coins className="h-3.5 w-3.5" />
                </button>
                
                {u.role !== 'admin' && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleUpdateUser(u._id, { isVerified: !u.isVerified })} className={`p-2 rounded-lg border transition shadow-sm ${u.isVerified ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-400'}`} title="توثيق المحل"><ShieldCheck className="h-4 w-4" /></button>
                    <button onClick={() => handleUpdateUser(u._id, { subscriptionPlan: u.subscriptionPlan === 'Premium' ? 'Basic' : 'Premium' })} className={`p-2 rounded-lg border transition shadow-sm ${u.subscriptionPlan === 'Premium' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-400'}`} title="ترقية الحساب"><Crown className="h-4 w-4" /></button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button onClick={() => handleUpdateUser(u._id, { isBlocked: !u.isBlocked })} className={`p-2 rounded-lg border transition shadow-sm ${u.isBlocked ? 'bg-red-600 border-red-700 text-white' : 'bg-gray-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-400'}`} title={u.isBlocked ? 'إلغاء الحظر' : 'حظر الحساب'}><Ban className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'USER', id: u._id, title: 'مسح المستخدم نهائياً', message: 'هل أنت متأكد من رغبتك في حذف هذا المستخدم وسحب جميع معروضاته نهائياً من الخادم؟' })} className="bg-gray-50 p-2 rounded-lg border hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-400 transition shadow-sm" title="مسح الحساب"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* قسم المنتجات والسلع */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {productsList?.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex items-center gap-3 relative">
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                {p.images && p.images[0] && <img src={p.images[0]} className="w-full h-full object-cover"/>}
              </div>
              <div className="flex-1 overflow-hidden text-right">
                <div className="font-black text-gray-900 text-xs truncate mb-1">{p.title}</div>
                <div className="text-[10px] text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded-md inline-block mb-1">{p.seller?.username || 'بائع مجهول'}</div>
                <div className="font-black text-green-600 text-sm">{p.price} <span className="text-[9px] text-gray-500">درهم</span></div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Link to={`/product/${p.slug}`} className="bg-blue-50 text-blue-600 p-2 rounded-xl transition shadow-sm hover:bg-blue-600 hover:text-white"><Eye className="h-3.5 w-3.5" /></Link>
                <button onClick={() => setConfirmModal({ isOpen: true, type: 'PRODUCT', id: p._id, title: 'مسح المنتج', message: 'هل أنت متأكد من رغبتك في إزالة هذا المنتج نهائياً من السوق؟' })} className="bg-red-50 text-red-600 p-2 rounded-xl transition shadow-sm hover:bg-red-600 hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 قسم طلبات الشراء المحمي (تعديل جذري وحل للمشكلة) */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {requestsList?.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400 font-bold text-sm shadow-sm">لا توجد أي طلبات حالياً! ✨</div>
          ) : (
            requestsList?.map(req => (
              <div key={req._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-right">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{req.category || 'عام'}</span>
                  <button onClick={() => setConfirmModal({ isOpen: true, type: 'REQUEST', id: req._id, title: 'مسح الطلب من السوق', message: 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟' })} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <h3 className="font-black text-gray-900 text-sm mb-1">{req.title}</h3>
                <p className="text-xs font-bold text-gray-500 mb-3 flex items-center justify-start gap-1"><User className="h-3 w-3" /> صاحب الطلب: {req.buyer?.username || 'مشتري'}</p>
                <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                  <span className="text-[11px] font-black text-green-600 flex items-center gap-1"><Coins className="h-3 w-3" /> الميزانية: {req.maxBudget} درهم</span>
                  <Link to={`/request/${req._id}`} className="text-[10px] font-black text-neutral-900 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-neutral-900 hover:text-white transition">تفاصيل الطلب</Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 🔥 قسم الشكاوى والبلاغات المحمي (تعديل جذري وحل للمشكلة) */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reportsList?.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400 font-bold text-sm shadow-sm">صندوق البلاغات فارغ تماماً حالياً! ✨</div>
          ) : (
            reportsList?.map(report => (
              <div key={report._id} className="bg-red-50 p-4 sm:p-5 rounded-2xl border border-red-100 flex flex-col md:flex-row justify-between gap-4 shadow-sm relative overflow-hidden text-right">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
                <div className="space-y-2 pr-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-200 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{report.targetType === 'Product' ? 'منتج مخادع' : 'بائع مخالف'}</span>
                    <h3 className="font-black text-gray-900 text-sm">{report.reason}</h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-600 font-medium bg-white/60 p-2.5 rounded-xl border border-red-100/50 leading-relaxed">{report.details || 'لا توجد تفاصيل ملحقة بالبلاغ.'}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded-lg border shadow-sm">المُبْلِغ: {report.reporter?.username || 'عضو'}</span>
                    
                    {report.targetId && (
                      <Link 
                        to={report.targetType === 'Product' ? `/product/${report.targetId?.slug || report.targetId}` : `/vendor/${report.targetId?._id || report.targetId}`} 
                        className="text-[10px] text-white bg-blue-600 font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:bg-blue-700 transition"
                      >
                        <ExternalLink className="h-3 w-3" /> فحص وإدارة المحتوى المخالف
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 border-t border-red-100 md:border-0 pt-3 md:pt-0">
                  <button onClick={() => setConfirmModal({ isOpen: true, type: 'REPORT', id: report._id, action: 'dismiss', title: 'تجاهل البلاغ', message: 'هل أنت متأكد من رغبتك في تجاهل هذا البلاغ وإغلاقه بشكل ودي؟' })} className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-[11px] font-black px-4 py-2.5 rounded-xl transition shadow-sm flex-1 md:flex-none">تجاهل البلاغ</button>
                  <button onClick={() => setConfirmModal({ isOpen: true, type: 'REPORT', id: report._id, action: 'delete_target', title: 'حذف العنصر المخالف', message: 'سيتم مسح هذا العنصر بشكل نهائي وصارم من السيرفر كإجراء عقابي، هل توافق؟' })} className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md flex-1 md:flex-none"><Trash2 className="h-3.5 w-3.5" /> مسح المخالف</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* قسم إعدادات المنصة */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 sm:p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <div className="bg-neutral-100 p-2 rounded-full"><Settings className="h-5 w-5 text-gray-800" /></div>
            <h2 className="text-lg font-black text-gray-900">إعدادات المنصة العامة</h2>
          </div>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-gray-500 mb-1.5">اسم الموقع الرسمي</label>
              <input 
                type="text" 
                value={settingsData.siteName} 
                onChange={(e) => setSettingsData({...settingsData, siteName: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-neutral-900 transition"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-black text-gray-500 mb-1.5">رابط واتساب الإدارة المباشر</label>
              <div className="flex">
                <input 
                  type="text" 
                  value={settingsData.adminWhatsApp} 
                  onChange={(e) => setSettingsData({...settingsData, adminWhatsApp: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-r-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-neutral-900 transition text-left"
                  dir="ltr"
                  placeholder="212600000000"
                />
                <span className="bg-green-50 text-green-700 font-black px-4 py-3.5 rounded-l-xl text-[10px] border border-r-0 border-green-200 flex items-center">Wa.me</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-500 mb-1.5">الهوية اللونية للمنصة</label>
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 w-full justify-between">
                <span className="text-xs font-black text-gray-600 px-2" dir="ltr">{settingsData.themeColor}</span>
                <input 
                  type="color" 
                  value={settingsData.themeColor} 
                  onChange={(e) => setSettingsData({...settingsData, themeColor: e.target.value})}
                  className="h-10 w-16 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </div>

            <div className="pt-3">
              <button type="submit" disabled={savingSettings} className="w-full bg-neutral-900 text-white font-black rounded-xl py-3.5 text-sm hover:bg-black transition flex justify-center items-center gap-2 shadow-md">
                {savingSettings ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>حفظ التعديلات الحالية</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* مودال شحن رصيد المحافظ */}
      {coinModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-center">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl relative overflow-hidden">
            <button onClick={() => setCoinModal({ isOpen: false, userId: null, username: '', newCoins: 0 })} className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-full z-10"><X className="h-5 w-5 text-gray-500" /></button>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border-4 border-amber-50 relative z-10">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">شحن وتعديل المحفظة</h3>
            <p className="text-[10px] font-bold text-gray-500 mb-4 px-2">شحن رصيد حساب العضو: <span className="text-amber-600">{coinModal.username}</span></p>
            <form onSubmit={handleChargeCoins} className="space-y-4">
              <input 
                type="number" 
                value={coinModal.newCoins} 
                onChange={(e) => setCoinModal({...coinModal, newCoins: e.target.value})} 
                className="w-full bg-gray-50 border border-amber-200 rounded-2xl py-4 text-center text-xl font-black text-amber-600 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-xl text-sm shadow-md transition">تأكيد الشحن فوراً</button>
            </form>
          </div>
        </div>
      )}

      {/* مودال التأكيد الاحترافي */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-center">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden border border-gray-100">
            <div className="w-14 h-14 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-3 border border-red-100">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">{confirmModal.title}</h3>
            <p className="text-xs font-bold text-gray-500 mb-5 px-2 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2.5">
              <button onClick={executeConfirmation} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl text-xs shadow-md transition">تأكيد الإجراء</button>
              <button onClick={() => setConfirmModal({ isOpen: false, type: '', id: null, action: null, message: '', title: '' })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-3 rounded-xl text-xs transition">إلغاء الأمر</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default AdminDashboard;