import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SettingsContext } from '../context/SettingsContext';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from 'axios'; 
import { Phone, ShieldCheck, Clock, Loader2, ArrowRight, Tag, Crown, ChevronLeft, ChevronRight, Star, MessageSquareText, Flag, X, Handshake, Send, Heart, FileText, ChevronDown, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);
  const { user, updateUserData } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reportModal, setReportModal] = useState({ isOpen: false, type: '', targetId: '', title: '' });
  const [reportData, setReportData] = useState({ reason: 'محتوى غير لائق', details: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const fetchProductDetails = async () => {
    try {
      const { data } = await axiosInstance.get(`/api/products/details/${slug}`);
      setProduct(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب تفاصيل هذا المنتج');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchProductDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, navigate]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (user?.token && product?._id) {
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data } = await axiosInstance.get('/api/auth/wishlist', config);
          
          const isFav = data.some(item => 
            item === product._id || 
            item._id === product._id ||
            item.id === product._id
          );
          
          setIsWishlisted(isFav);
        } catch (error) {
          console.error('فشل في التحقق من المفضلة');
        }
      }
    };

    if (product) checkWishlistStatus();
  }, [product, user?.token]);

  useEffect(() => {
    if (product && user?.token) {
      axiosInstance.post('/api/auth/track-interest', 
        { category: product.category, weight: 1 }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      ).catch(err => console.log('Tracking ignored'));
    }
  }, [product, user]);

  const handleToggleWishlist = async () => {
    if (!user) return toast.error('يجب عليك تسجيل الدخول لإضافة المنتج للمفضلة!');
    setTogglingWishlist(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post(`/api/auth/wishlist/${product._id}`, {}, config);
      
      setIsWishlisted(!isWishlisted); 
      toast.success(data.message);
      
      if (updateUserData) {
        updateUserData({ ...user, wishlist: data.wishlist });
      } else {
        const userCopy = JSON.parse(localStorage.getItem('user'));
        if(userCopy) {
           userCopy.wishlist = data.wishlist;
           localStorage.setItem('user', JSON.stringify(userCopy));
        }
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الإضافة للمفضلة');
    } finally {
      setTogglingWishlist(false);
    }
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!comment) return toast.error('يرجى كتابة تعليق!');
    setSubmittingReview(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.post(`/api/products/${product._id}/reviews`, { rating, comment }, config);
      toast.success('شكراً على تقييمك! 🌟');
      setComment('');
      fetchProductDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في إضافة التقييم');
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitReportHandler = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.post('/api/reports', {
        targetType: reportModal.type,
        targetId: reportModal.targetId,
        reason: reportData.reason,
        details: reportData.details
      }, config);
      toast.success('تم الإرسال بنجاح! ستقوم الإدارة بمراجعة طلبك.');
      setReportModal({ isOpen: false, type: '', targetId: '', title: '' });
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال التبليغ');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (user?.isEmailVerified === false) {
    return toast.error('يرجى تفعيل بريدك الإلكتروني للقيام بهذا الإجراء!');
    }
    if (!user) {
      toast.error('يجب عليك تسجيل الدخول لتقديم عرض مالي!');
      navigate('/login');
      return;
    }
    if (!offerPrice || isNaN(offerPrice) || Number(offerPrice) <= 0) {
      return toast.error('الرجاء إدخال سعر صحيح ومناسب!');
    }

    if (user.id === product?.seller?._id || user._id === product?.seller?._id || user.id === product?.seller || user._id === product?.seller) {
      return toast.error('خطأ أمني: لا يمكنك تقديم عرض مالي على معروضاتك الشخصية!');
    }

    setSendingOffer(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const offerText = `عرض شراء:\nالمنتج: ${product.title}\nالثمن المقترح: ${offerPrice} درهم هل توافق على بيع المنتج بهذا السعر؟`;
      
      const targetSellerId = product.seller?._id || product.seller;

      await axiosInstance.post('/api/chat/send', { 
        receiverId: targetSellerId, 
        text: offerText 
      }, config);
      
      toast.success('تم إرسال عرضك المالي بنجاح! تفقّد صندوق الرسائل لمتابعة الاتفاق.');
      setShowOfferModal(false);
      setOfferPrice('');
    } catch (error) {
      toast.error('فشل في إرسال العرض المالي للمتجر.');
    } finally {
      setSendingOffer(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[70vh]"><Loader2 className="animate-spin h-10 w-10 text-amber-500" /></div>;
  if (!product) return <div className="text-center mt-20 font-black text-gray-500 text-lg">هذا المنتج غير متوفر حالياً! 🚫</div>;

  const vendor = product.seller;
  const safePhone = vendor?.phoneNumber ? String(vendor.phoneNumber).replace(/\D/g, '') : '';
  const whatsappMessage = `السلام عليكم، لقد وجدت هذا المنتج في منصة ${settings?.siteName || 'Qri3a Hunter'} وأنا مهتم به:\n🔹 *المنتج:* ${product.title}\n💰 *السعر:* ${product.price} درهم\n🔗 *الرابط:* ${window.location.href}`;

  const isProductOwner = user && (user.id === vendor?._id || user._id === vendor?._id || user.id === vendor || user._id === vendor);

  return (
    <div dir="rtl" className="pb-40 md:pb-6 text-right w-full max-w-[480px] mx-auto bg-gray-50/50 min-h-screen space-y-3 relative">
      
      <div className="flex justify-between items-center bg-white px-4 py-3 border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-black text-gray-700 hover:opacity-80 transition">
          <ArrowRight className="h-4 w-4" /> <span>العودة</span>
        </button>
        <span className="text-[10px] text-gray-500 font-black bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-gray-400" /> {product.category}
        </span>
      </div>

      <div className="bg-white p-2 border-b border-gray-100 shadow-sm space-y-2">
        <div className="w-full h-80 relative flex items-center justify-center bg-white rounded-2xl overflow-hidden group">
          {product.isPromoted && (
            <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-md z-10 shadow-sm flex items-center gap-0.5">
              <Crown className="h-2.5 w-2.5" /> مميز
            </span>
          )}
          <img src={product.images[activeImgIdx] || 'https://via.placeholder.com/500'} className="w-full h-full object-contain" alt={product.title} />
          {product.images.length > 1 && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
              <button onClick={() => setActiveImgIdx(prev => (prev === 0 ? product.images.length - 1 : prev - 1))} className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md pointer-events-auto text-gray-700 transition hover:bg-white"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setActiveImgIdx(prev => (prev === product.images.length - 1 ? 0 : prev + 1))} className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md pointer-events-auto text-gray-700 transition hover:bg-white"><ChevronLeft className="h-4 w-4" /></button>
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 justify-start scrollbar-hide px-1">
            {product.images.map((img, idx) => (
              <button key={idx} onClick={() => setActiveImgIdx(idx)} className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImgIdx === idx ? 'border-neutral-900 scale-95 shadow-sm' : 'border-gray-100 opacity-60'}`}>
                <img src={img} className="w-full h-full object-cover" alt="thumb" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-5 border-y border-gray-100 shadow-sm space-y-3 relative">
        <button 
          onClick={() => setReportModal({ isOpen: true, type: 'Product', targetId: product._id, title: product.title })}
          className="absolute top-5 left-5 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
          title="إبلاغ عن محتوى"
        >
          <Flag className="h-4 w-4" />
        </button>

        <h1 className="text-xl font-black text-gray-950 pr-8 leading-snug">{product.title}</h1>
        
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-3xl font-black text-green-600 tracking-tight">{product.price}</span>
            <span className="text-xs font-bold text-gray-400 mr-1">درهم</span>
          </div>

          {product.numReviews > 0 && (
            <div className="bg-amber-50 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-amber-100">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-amber-700">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-y border-gray-100 shadow-sm">
        <button 
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full p-5 flex items-center justify-between font-black text-gray-900 text-xs transition hover:bg-gray-50/50"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span>تفاصيل ومواصفات المنتج</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isDetailsOpen ? 'rotate-180 text-neutral-900' : ''}`} />
        </button>

        {isDetailsOpen && (
          <div className="px-5 pb-5 animate-fade-in">
            <p className="text-gray-700 text-xs font-medium leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-gray-100/60 shadow-inner">
              {product.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 border-y border-gray-100 shadow-sm">
        <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between">
          <Link to={`/vendor/${vendor?._id || vendor?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            {/* 🔥 الأفاتار الذكي */}
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center font-black text-gray-400 shrink-0">
              <img 
                src={vendor?.avatar && vendor.avatar !== 'null' && vendor.avatar !== '' ? vendor.avatar : `https://ui-avatars.com/api/?name=${vendor?.storeName || vendor?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`} 
                className="w-full h-full object-cover" 
                alt="vendor"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${vendor?.storeName || vendor?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`; }}
              />
            </div>
            <div className="text-right space-y-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-black text-gray-900 text-xs truncate">
                  {vendor?.storeName || vendor?.username}
                </h3>
                {vendor?.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500 fill-blue-50" />}
              </div>
              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-white border border-gray-100 px-2 py-0.5 rounded-md w-fit"><Clock className="h-3 w-3 text-gray-400" /> {vendor?.workingHours || 'متاح دائماً'}</span>
            </div>
          </Link>
          <Link to={`/vendor/${vendor?._id || vendor?.id}`} className="text-[10px] font-black text-neutral-900 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition shrink-0 flex items-center gap-1">
            <Store className="h-3.5 w-3.5 text-gray-400" />
            <span>زيارة المتجر</span>
          </Link>
        </div>
      </div>

      <div className="bg-white p-5 border-t border-gray-100 shadow-sm space-y-4">
        <h2 className="text-xs font-black text-gray-800 flex items-center gap-1.5"><MessageSquareText className="h-4 w-4 text-amber-500" /> آراء العملاء وتجاربهم ({product.reviews?.length || 0})</h2>

        {user && !isProductOwner && (
          <form onSubmit={submitReviewHandler} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1 flex-row-reverse justify-end">
              {[1, 2, 3, 4, 5].map((star) => (
                <button type="button" key={star} onClick={() => setRating(star)} className={`transition ${rating >= star ? 'text-amber-400' : 'text-gray-200'}`}><Star className={`h-5 w-5 ${rating >= star ? 'fill-amber-400' : ''}`} /></button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب تقييمك الصادق حول جودة السلعة هنا..." className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:outline-none focus:border-neutral-950 transition resize-none font-medium" rows="2" required />
            <button type="submit" disabled={submittingReview} className="w-full bg-neutral-900 hover:bg-black font-black text-white rounded-xl py-2.5 text-xs shadow-sm transition">نشر التقييم</button>
          </form>
        )}

        <div className="space-y-2.5">
          {product.reviews?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-bold text-xs bg-white rounded-2xl border border-dashed border-gray-100">لا توجد تقييمات متوفرة بعد لهذا المنتج.</div>
          ) : (
            product.reviews?.map((review, idx) => (
              <div key={idx} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 shadow-sm space-y-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-black text-gray-900 text-xs block">{review.name}</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}
                  </div>
                </div>
                <p className="text-gray-600 text-xs font-medium pt-1.5 border-t border-white leading-relaxed">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="fixed bottom-16 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 flex items-center gap-3 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] w-full max-w-[480px] mx-auto">
        
        {safePhone ? (
          <a href={`https://wa.me/${safePhone}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-white font-black h-12 rounded-xl flex justify-center items-center gap-2 text-xs transition shadow-md hover:opacity-95 active:scale-95" style={{ backgroundColor: '#25D366' }}>
            <Phone className="h-4 w-4 fill-white" />
            <span>شراء عبر الواتساب</span>
          </a>
        ) : (
          <div className="flex-1 bg-gray-100 text-gray-400 font-black h-12 rounded-xl flex justify-center items-center text-xs cursor-not-allowed">الرقم غير متاح</div>
        )}

        {!isProductOwner ? (
          <button onClick={() => setShowOfferModal(true)} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-neutral-900 font-black h-12 px-5 rounded-xl text-xs flex justify-center items-center gap-1.5 transition shadow-md active:scale-95">
            <Handshake className="h-4 w-4 shrink-0" />
            <span>تقديم عرض</span>
          </button>
        ) : (
          <div className="bg-gray-100 text-gray-400 text-center text-[10px] font-black h-12 px-4 rounded-xl flex items-center justify-center border border-gray-200 cursor-not-allowed shadow-inner select-none">
            منتجك الخاص
          </div>
        )}

        <button onClick={handleToggleWishlist} disabled={togglingWishlist} className={`p-3.5 h-12 w-12 rounded-xl border transition flex items-center justify-center shadow-sm shrink-0 active:scale-95 ${isWishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500'}`}>
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {showOfferModal && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm text-right" dir="rtl">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl space-y-4 overflow-hidden relative animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 relative z-10">
              <h3 className="text-base font-black text-amber-600 flex items-center gap-2"><Handshake className="h-5 w-5" /> تقديم عرض مالي للبائع</h3>
              <button onClick={() => setShowOfferModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleSendOffer} className="space-y-4 pt-1 relative z-10">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex justify-between items-center shadow-inner">
                <span className="text-xs font-bold text-amber-800">السعر الأصلي للمنتج:</span>
                <span className="font-black text-amber-600 text-lg">{product.price} درهم</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">ما هو السعر المناسب الذي تقترحه لشراء السلعة؟</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={offerPrice} 
                    onChange={(e) => setOfferPrice(e.target.value)} 
                    placeholder="مثال: 150" 
                    className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pr-4 pl-12 text-sm font-black focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-50 transition shadow-sm" 
                    autoFocus 
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">درهم</span>
                </div>
              </div>

              <button type="submit" disabled={sendingOffer || !offerPrice} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl py-3.5 text-sm flex justify-center items-center gap-2 shadow-md transition">
                {sendingOffer ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>إرسال العرض المقترح الآن</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {reportModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm text-right" dir="rtl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-black text-red-600 flex items-center gap-1.5"><Flag className="h-5 w-5" /> الإبلاغ عن محتوى</h3>
              <button onClick={() => setReportModal({ isOpen: false, type: '', targetId: '', title: '' })} className="p-1.5 hover:bg-gray-100 rounded-full transition"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <form onSubmit={submitReportHandler} className="space-y-4">
              <select value={reportData.reason} onChange={(e) => setReportData({...reportData, reason: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none">
                <option value="محتوى غير لائق">محتوى غير لائق</option>
                <option value="سلعة مزيفة / نصب">سلعة مزيفة أو احتيال</option>
              </select>
              <textarea value={reportData.details} onChange={(e) => setReportData({...reportData, details: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none" rows="3" placeholder="تفاصيل البلاغ..." />
              <button type="submit" disabled={submittingReport} className="w-full bg-red-600 text-white font-black rounded-xl py-3 text-sm">إرسال البلاغ</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetails;