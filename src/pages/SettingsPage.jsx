import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios';
import { Settings, User, Mail, Phone, Camera, Loader2, ArrowRight, Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, updateUserData } = useContext(AuthContext);
  const navigate = useNavigate();

  const initialPhone = user?.phoneNumber || user?.phonenumber || '';

  // المعلومات الشخصية
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: initialPhone,
    avatar: user?.avatar || ''
  });

  // معلومات كلمة المرور
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post('/api/upload', uploadData, config);
      setFormData(prev => ({ ...prev, avatar: data.url }));
      toast.success('تم رفع الصورة الشخصية بنجاح!');
    } catch (error) {
      toast.error('فشل رفع الصورة الشخصية.');
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // 🧠 فحص صارم ومعدل: الحساب كيعتبر كيبدل المودباس فقط إيلا دخل المودباس الجديد د بصح
    const isChangingPassword = passwordData.newPassword.trim() !== '';
    
    if (isChangingPassword) {
      if (!passwordData.oldPassword) return toast.error('يرجى إدخال كلمة المرور الحالية أولاً لتأكيد التغيير!');
      
      // الفحص الصارم لبنية المودباس (8 أحرف + حرف كابيتال + رمز خاص)
      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      
      if (!passwordRegex.test(passwordData.newPassword)) {
        return toast.error('خطأ ف البنية: يجب أن يتكون المودباس من 8 أحرف على الأقل، ويحتوي على حرف كبير (A-Z) ورمز خاص واحد على الأقل مثل (@، $، !)...');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين!');
      }
    }

    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // إرسال البيانات بدقة: إيلا مكانش كيبدل المودباس ماكنصيفطوش حقول المودباس نهائياً للباكاند
      const payload = isChangingPassword 
        ? { ...formData, ...passwordData } 
        : { ...formData };
      
      const { data } = await axiosInstance.put('/api/auth/update-profile', payload, config);
      
      if (updateUserData) updateUserData(data.user || data);
      toast.success('تم تحديث البيانات بنجاح! ✨');
      
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => navigate('/profile'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حفظ التغييرات. المرجو التأكد من صحة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="pb-24 md:pb-6 text-right w-full max-w-[480px] mx-auto min-h-screen bg-gray-50 px-3 pt-3 space-y-4 font-sans">
      
      {/* الهيدر العلوي */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <h1 className="text-base font-black text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-700" /> إعدادات الحساب
        </h1>
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-neutral-900 transition bg-gray-50 px-3 py-2 rounded-xl">
          <span>رجوع</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* نموذج تعديل البيانات */}
      <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5" autoComplete="off">
        
        {/* رفع الصورة الشخصية */}
        <div className="flex flex-col items-center justify-center space-y-2 py-2">
          <div className="w-24 h-24 bg-gray-100 rounded-full p-1 border border-gray-200 shadow-md relative group flex items-center justify-center">
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center text-gray-400 font-black text-3xl uppercase">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
              ) : (
                <img 
                  src={formData.avatar && formData.avatar !== 'null' && formData.avatar !== '' 
                    ? formData.avatar 
                    : `https://ui-avatars.com/api/?name=${formData.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true&size=150`} 
                  className="w-full h-full object-cover" 
                  alt="avatar" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${formData.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true&size=150`;
                  }}
                />
              )}
            </div>
            
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full text-white transition duration-300 z-10">
              <Camera className="h-5 w-5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading || saving} />
            </label>
          </div>
          <span className="text-[10px] text-gray-400 font-bold">انقر على الدائرة لتغيير الصورة الشخصية</span>
        </div>

        {/* خانة اسم الحساب */}
        <div>
          <label className="block text-[11px] font-black text-gray-500 mb-1.5 flex items-center gap-1"><User className="h-3.5 w-3.5 text-gray-400" /> اسم المستخدم</label>
          <input 
            type="text" 
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:outline-none focus:border-neutral-950 transition"
            required
            autoComplete="off"
          />
        </div>

        {/* خانة البريد الإلكتروني مقفولة */}
        <div>
          <label className="block text-[11px] font-black text-gray-500 mb-1.5 flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-gray-400" /> البريد الإلكتروني (لا يمكن تغييره)</label>
          <input 
            type="email" 
            value={formData.email}
            disabled
            className="w-full bg-gray-100 border border-gray-200 text-gray-400 rounded-xl p-3.5 text-xs font-bold cursor-not-allowed select-none opacity-80"
          />
        </div>

        {/* خانة رقم الهاتف */}
        <div>
          <label className="block text-[11px] font-black text-gray-500 mb-1.5 flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" /> رقم الهاتف المعتمد</label>
          <input 
            type="tel" 
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:outline-none focus:border-neutral-950 transition text-right"
            placeholder="0600000000"
            required
            autoComplete="off"
          />
        </div>

        {/* قسم تغيير كلمة المرور المحدث بحماية ضد الإدخال التلقائي */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <h3 className="text-xs font-black text-neutral-900 flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-gray-500" /> تعديل كلمة المرور (اختياري)</h3>
          
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">كلمة المرور الحالية</label>
            <input 
              type="password" 
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none"
              placeholder="اكتب المودباس القديم لتغييره"
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1">المودباس الجديد</label>
              <input 
                type="password" 
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none"
                placeholder="A-Z + الرموز + 8 أحرف"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1">تأكيد المودباس</label>
              <input 
                type="password" 
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none"
                placeholder="أعد كتابته للتأكيد"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        {/* زر الحفظ */}
        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full mt-4 bg-neutral-900 hover:bg-black text-white font-black rounded-xl py-3.5 text-center transition flex justify-center items-center gap-2 text-sm shadow-md"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>حفظ التعديلات</span>
        </button>

      </form>

    </div>
  );
};

export default SettingsPage;