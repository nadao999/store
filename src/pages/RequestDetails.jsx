import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import axiosInstance from '../axios';
import { DollarSign, Image, Send, Loader2, AlertCircle, CheckCircle, User, ArrowRight, Tag, MessageSquare, Trash2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const RequestDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const themeColor = settings?.themeColors?.primary || '#FF5733';

  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ error: '', success: '' });

  // 📥 حالة فتح النوافذ المنبثقة للصور ملء الشاشة (المعاينة)
  const [previewMedia, setPreviewMedia] = useState({ isOpen: false, url: '' });

  // 🗑️ حالة فتح مودال الحذف الاحترافي الجديد لمنع الـ Alert البدائي
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, offerId: null });

  useEffect(() => {
    const fetchRequestAndOffers = async () => {
      try {
        setLoading(true);
        const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
        
        const resRequest = await axiosInstance.get(`/api/requests/${id}`, config)
          .catch(() => axiosInstance.get(`/api/requests/nearby`));
        
        if (resRequest.data) {
          if (Array.isArray(resRequest.data)) {
            const currentRequest = resRequest.data.find(r => r._id === id);
            setRequest(currentRequest);
          } else {
            setRequest(resRequest.data);
          }
        }

        if (user?.token) {
          const resOffers = await axiosInstance.get(`/api/offers/request/${id}`, config);
          if (Array.isArray(resOffers.data)) {
            setOffers(resOffers.data);
          }
        }
      } catch (err) {
        console.error('مشكلة في جلب البيانات:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchRequestAndOffers();
    }
  }, [id, user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file); 

    try {
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`
        }
      };
      const { data } = await axiosInstance.post('/api/upload', formData, config);
      
      setImages([...images, data.url]);
      toast.success('تم رفع الصورة بنجاح! 🖼️');
    } catch (err) {
      setStatus({ ...status, error: 'فشل رفع الملف. يرجى التحقق من الحجم والصيغة.' });
    } finally {
      e.target.value = '';
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (user?.isEmailVerified === false) {
      return toast.error('يرجى تفعيل بريدك الإلكتروني من حسابك أولاً لتقديم العروض!');
    }
    if (!user) return navigate('/login');
    setStatus({ error: '', success: '' });

    if (user.id === request?.buyer?._id || user._id === request?.buyer?._id || user.id === request?.buyer || user._id === request?.buyer) {
      return toast.error('لا يمكنك تقديم عرض على الطلب الخاص بك!');
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = { requestId: id, proposedPrice: Number(proposedPrice), message, images };
      
      const { data } = await axiosInstance.post('/api/offers', payload, config);
      setOffers([data, ...offers]);
      setStatus({ success: 'تم إرسال عرضك بنجاح! 🎉', error: '' });
      setProposedPrice('');
      setMessage('');
      setImages([]);
      toast.success('تم تقديم العرض بنجاح');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data;
      setStatus({ error: typeof errorMsg === 'string' ? errorMsg : 'حدث خطأ أثناء إرسال العرض', success: '' });
    }
  };

  // 🔥 تنفيذ الحذف الفعلي من السيرفر بعد تأكيد اليوزر داخل المودال الجديد
  const executeDeleteOffer = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.delete(`/api/offers/${deleteModal.offerId}`, config);
      
      setOffers(offers.filter(offer => offer._id !== deleteModal.offerId));
      setDeleteModal({ isOpen: false, offerId: null });
      toast.success('تم سحب وإلغاء العرض بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف العرض من السيرفر');
      setDeleteModal({ isOpen: false, offerId: null });
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[70vh]"><Loader2 className="animate-spin h-10 w-10 text-amber-500" /></div>;
  if (!request) return <div className="text-center mt-20 font-black text-gray-500 text-lg">هذا الطلب غير متوفر حالياً! 🚫</div>;

  const isOwner = user && (user.id === request.buyer?._id || user._id === request.buyer?._id || user.id === request.buyer || user._id === request.buyer);

  return (
    <div dir="rtl" className="pb-24 md:pb-6 text-right max-w-5xl mx-auto px-2 space-y-6">
      
      {/* شريط التنقل العلوي */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row-reverse mt-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-black transition">
          <ArrowRight className="h-4 w-4" /> <span>العودة إلى قائمة الطلبات</span>
        </button>
        <span className="text-[10px] text-gray-500 font-bold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" /> {request.category || 'عام'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* القسم الأيمن والأوسط: تفاصيل الطلب وقائمة العروض المتاحة */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* بطاقة تفاصيل الطلب الشخصي */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
            <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              طلب شراء مفتوح في السوق 🎯
            </span>
            <h1 className="text-2xl font-black text-gray-900 leading-tight pt-1">{request.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 pb-2 border-b border-gray-50">
              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl"><User className="h-4 w-4 text-gray-400" /> {request.buyer?.username || 'مشتري'}</span>
              <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-xl border border-green-100"><DollarSign className="h-4 w-4" /> الميزانية المحددة: {request.maxBudget} درهم</span>
            </div>

            <div className="pt-2 space-y-3">
              <h3 className="font-black text-sm text-gray-800 flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-gray-400" /> المواصفات المطلوبة:</h3>
              <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100"><span className="text-gray-400 block mb-0.5 font-medium">المقاس</span> <span className="font-black text-gray-800">{request.details?.size || 'غير محدد'}</span></div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100"><span className="text-gray-400 block mb-0.5 font-medium">اللون</span> <span className="font-black text-gray-800">{request.details?.color || 'غير محدد'}</span></div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100"><span className="text-gray-400 block mb-0.5 font-medium">الحالة</span> <span className="font-black text-gray-800">{request.details?.condition === 'New' ? 'جديد' : 'مستعمل'}</span></div>
              </div>
              {request.details?.description && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs font-medium text-gray-600 mt-2 leading-relaxed">
                  {request.details.description}
                </div>
              )}
            </div>
          </div>

          {/* قائمة العروض المقدمة من البائعين */}
          <div className="space-y-3">
            <h2 className="text-base font-black text-gray-900 px-1">العروض الحالية من المتاجر ({offers.length})</h2>
            
            {offers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 border-dashed text-gray-400 font-bold text-sm">لا توجد عروض مقدمة على هذا الطلب حتى الآن. كُن أول من يقدم عرضاً!</div>
            ) : (
              offers.map((offer) => {
                const isMyOffer = user && (user.id === offer.seller?._id || user._id === offer.seller?._id || user.id === offer.seller || user._id === offer.seller);
                
                return (
                  <div key={offer._id} className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition relative">
                    
                    <div className="flex justify-between items-center">
                      <span className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        {offer.seller?.username || 'متجر تجاري'}
                      </span>
                      
                      {/* حاوية للثمن وزر الحذف بتنسيق Flexbox النظيف */}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">{offer.proposedPrice} درهم</span>
                        {isMyOffer && (
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, offerId: offer._id })} 
                            className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition shadow-sm"
                            title="حذف العرض"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 text-xs font-medium leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100/50">{offer.message}</p>

                    {offer.images?.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {offer.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setPreviewMedia({ isOpen: true, url: img })}
                            className="h-24 rounded-xl overflow-hidden bg-gray-50 border cursor-pointer hover:opacity-80 transition"
                          >
                            <img src={img} alt="صورة المنتج المعروض" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* زر الواتساب للاتصال بصاحب العرض */}
                    {user && request.buyer?._id === user._id && offer.seller?.phoneNumber && (
                      <a 
                        href={`https://wa.me/${String(offer.seller.phoneNumber).replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم ${offer.seller.username}، لقد اطلعت على عرضك في منصة ${settings?.siteName || 'Qri3a Hunter'} بخصوص طلب الشراء الخاص بي "${request.title}" بسعر ${offer.proposedPrice} درهم. هل المنتج لا يزال متوفراً؟`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 w-full text-white font-black py-3.5 rounded-2xl flex justify-center items-center gap-2 text-xs transition shadow-md hover:shadow-lg"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        <span>التواصل والاتفاق عبر الواتساب</span>
                      </a>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* القسم الأيسر: نموذج تقديم عرض مالي جديد نقي بدون فيديو */}
        <div className="lg:col-span-1">
          {isOwner ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-[2rem] p-6 text-center font-bold text-xs leading-relaxed shadow-sm">
              هذا الطلب تابع لحسابك الشخصي. يمكنك متابعة العروض المقدمة من المتاجر الأخرى في القائمة الجانبية والتواصل معهم مباشرة.
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-1.5"><DollarSign className="h-5 w-5 text-amber-500" /> هل تمتلك هذا المنتج؟ قدم عرضك الآن</h3>
              
              {status.error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs font-bold"><AlertCircle className="h-4 w-4 shrink-0" />{status.error}</div>}
              {status.success && <div className="bg-green-50 border border-green-100 text-green-600 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs font-black"><CheckCircle className="h-4 w-4 shrink-0" />{status.success}</div>}

              <form onSubmit={handleOfferSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1.5">السعر المقترح (بالدرهم)</label>
                  <input type="number" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-black focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-gray-100 transition" placeholder="مثال: 450" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1.5">وصف المنتج وحالته للعميل</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-medium focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-gray-100 transition leading-relaxed" placeholder="مثال: المنتج متوفر لدي بمقاس 42، بحالة ممتازة وأصلي بالكامل..." />
                </div>

                {/* زر رفع الصور الاحترافي النقي المتبقي */}
                <div className="pt-1">
                  <label className="border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50/50 hover:bg-gray-150 hover:border-gray-400 transition w-full">
                    <Image className="h-5 w-5 text-gray-400" />
                    <span className="text-[11px] text-gray-600 font-black">+ إضافة صورة توضيحية للسلعة</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>

                {/* 🔥 عرض الصور المرفوعة للمعاينة الحية مع زر X أحمر ثابت وواضح ف الموبايل */}
                {images.length > 0 && (
                  <div className="flex gap-2.5 flex-wrap pt-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-200 relative">
                        <img 
                          src={img} 
                          className="w-full h-full object-cover rounded-xl cursor-pointer" 
                          alt="معاينة" 
                          onClick={() => setPreviewMedia({ isOpen: true, url: img })}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeImage(idx)} 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10 transition hover:scale-110 flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* زر النشر */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full mt-4 bg-neutral-900 hover:bg-black text-white font-black rounded-2xl py-3.5 text-center transition flex justify-center items-center gap-2 text-sm disabled:opacity-50 shadow-md hover:scale-[1.01]"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>إرسال العرض المالي الآن</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📥 نافذة عرض الصور ملء الشاشة (Preview Modal) */}
      {/* ========================================================= */}
      {previewMedia.isOpen && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-[480px] flex justify-between items-center mb-4 px-2">
            <span className="text-white/60 text-xs font-black">معاينة الصورة المرفقة بالعرض</span>
            <button type="button" onClick={() => setPreviewMedia({ isOpen: false, url: '' })} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition shadow-md"><X className="h-5 w-5" /></button>
          </div>
          <div className="w-full max-w-[440px] max-h-[70vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/5">
            <img src={previewMedia.url} className="w-full h-auto max-h-[70vh] object-contain" alt="كاملة الحجم" />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🗑️ 🔐 مودال تأكيد الحذف البريميوم الجديد (بديل الـ Alert) */}
      {/* ========================================================= */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-center" dir="rtl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden border border-gray-100">
            <div className="w-14 h-14 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-3 border border-red-100">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">تأكيد سحب العرض</h3>
            <p className="text-xs font-bold text-gray-400 mb-5 px-2 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا العرض المالي نهائياً؟ لن يتمكن المشتري من رؤيته مجدداً ولا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2.5">
              <button onClick={executeDeleteOffer} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl text-xs shadow-md transition">نعم، حذف نهائي</button>
              <button onClick={() => setDeleteModal({ isOpen: false, offerId: null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-3 rounded-xl text-xs transition">إلغاء الأمر</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RequestDetails;