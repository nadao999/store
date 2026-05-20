import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SettingsContext } from '../context/SettingsContext';
import { AuthContext } from '../context/AuthContext'; // 🔥 زدنا الكونتيكست د اليوزر
import axiosInstance from '../axios';
import { Store, Phone, Crown, Package, Loader2, CheckCircle2, Clock, ArrowRight, ShieldCheck, MessageSquareText, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const Storefront = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);
  const { user } = useContext(AuthContext); // 🔥 جبنا اليوزر باش نعرفوه واش مكونيكطي
  const themeColor = settings?.themeColors?.primary || '#FF5733';

  const [products, setProducts] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  // 💬 إعدادات مودال الشات الداخلي
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/api/products/vendor/${vendorId}`);
        setProducts(data);
        
        if (data.length > 0 && data[0].seller) {
          setVendor(data[0].seller);
        } else {
          const resVendor = await axiosInstance.get(`/api/auth/vendor/${vendorId}`);
          setVendor(resVendor.data);
        }
      } catch (error) {
        toast.error('مشكل فجلب معلومات الحانوت');
      } finally {
        setLoading(false);
      }
    };
    if (vendorId) fetchStoreData();
  }, [vendorId]);

  // 💬 دالة إرسال الرسالة للبائع
  const handleSendInternalMessage = async (e) => {
    e.preventDefault();
    if (user?.isEmailVerified === false) {
    return toast.error('يرجى تفعيل بريدك الإلكتروني للتواصل مع البائع!');
    }
    if (!user) {
      toast.error('خاصك تسجل الدخول باش تقدر تصيفط ميساج!');
      navigate('/login');
      return;
    }
    if (!chatMessage.trim()) return;
    
    setSendingChat(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.post('/api/chat/send', { 
        receiverId: vendor._id || vendor.id, 
        text: chatMessage 
      }, config);
      
      toast.success('تم إرسال الرسالة بنجاح! 💬');
      setShowChatModal(false);
      setChatMessage('');
    } catch (error) {
      toast.error('فشل إرسال الرسالة. جرب مرة أخرى.');
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin h-10 w-10 text-gray-500" /></div>;
  if (!vendor) return <div className="text-center mt-20 font-bold">هاد الحانوت غير موجود!</div>;

  return (
    <div className="pb-24 md:pb-6 text-right max-w-5xl mx-auto space-y-6 px-2">
      
      {/* 🔙 زر الرجوع */}
      <div className="flex justify-start">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm hover:text-black transition hover:bg-gray-50">
          <span>رجوع</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* 🏪 رأس الحانوت الاحترافي */}
      <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden relative group">
        
        <div className="h-40 md:h-64 w-full bg-gray-200 relative overflow-hidden">
          <img 
            src={vendor?.storeCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
            alt="Store Cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {vendor?.subscriptionPlan === 'Premium' && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-amber-400/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase">VIP Store</span>
            </div>
          )}
        </div>

        <div className="px-5 md:px-8 pb-6 relative flex flex-col md:flex-row justify-between items-center md:items-end gap-5 -mt-16 md:-mt-20 z-10">
          
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-right w-full md:w-auto">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white p-1.5 shadow-2xl border-4 border-white relative flex-shrink-0 group-hover:-translate-y-2 transition duration-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center text-4xl font-black text-gray-300">
                {vendor?.avatar ? (
                  <img src={vendor.avatar} className="w-full h-full object-cover" alt="Store Logo" />
                ) : (
                  <span>{vendor?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {vendor?.isVerified && (
                <span className="absolute bottom-2 left-2 bg-white rounded-full p-0.5 shadow-md">
                  <ShieldCheck className="h-6 w-6 text-blue-500 fill-blue-50" title="بائع موثوق" />
                </span>
              )}
            </div>

            <div className="space-y-1.5 pt-2 md:pt-0 pb-1">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 drop-shadow-sm">
                  {vendor?.storeName || `محل ${vendor?.username}`}
                </h1>
              </div>
              <p className="text-gray-500 text-sm max-w-md font-medium leading-relaxed line-clamp-2">
                {vendor?.storeBio || 'هذا البائع لم يضف وصفاً لمتجره بعد.'}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-bold text-gray-400 pt-2">
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Clock className="h-3.5 w-3.5 text-gray-500" /> {vendor?.workingHours || 'متاح كل يوم'}</span>
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Package className="h-3.5 w-3.5 text-gray-500" /> {products.length} بياسة</span>
              </div>
            </div>
          </div>

          {/* 🔥 أزرار التواصل (واتساب + شات داخلي) */}
          <div className="flex flex-col w-full md:w-auto gap-2 self-center md:self-end flex-shrink-0 z-20">
            {/* زر الشات الداخلي */}
            <button 
              onClick={() => {
                if(!user) { toast.error('تسجل الدخول باش تواصل مع البائع'); navigate('/login'); }
                else { setShowChatModal(true); }
              }}
              className="w-full md:w-auto bg-neutral-900 hover:bg-black text-white font-black px-6 py-3 rounded-2xl flex justify-center items-center gap-2 text-sm transition-all shadow-md hover:-translate-y-1"
            >
              <MessageSquareText className="h-4 w-4" />
              <span>رسالة فالسيت 💬</span>
            </button>
            
            {/* زر الواتساب */}
            {vendor?.phoneNumber && (
              <a 
                href={`https://wa.me/${vendor.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم، دخلت للمحل ديالك فـ ${settings?.siteName || 'Qri3a Hunter'} وبغيت نعرف معلومات كثر على السلعة...`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white font-black px-6 py-3 rounded-2xl flex justify-center items-center gap-2 text-sm transition-all shadow-md hover:-translate-y-1"
              >
                <Phone className="h-4 w-4 fill-white" />
                <span>واتساب</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* 🛍️ معرض السلعة */}
      <div className="space-y-5 pt-2">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-gray-800" />
            <span>الفيترينة د المحل</span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <Package className="mx-auto h-14 w-14 text-gray-300" />
            <p className="text-gray-500 font-bold">هاد المحل مازال ما حط حتى بياسة فالسوق.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map(product => (
              <div key={product._id} className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${product.isPromoted ? 'border border-amber-300 ring-2 ring-amber-400/10' : 'border border-gray-100 hover:border-gray-300'}`}>
                
                <div className="relative">
                  {product.isPromoted && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-md z-10 shadow-md flex items-center gap-1">
                      <Crown className="h-3 w-3" /> مميز
                    </span>
                  )}
                  <Link to={`/product/${product.slug}`} className="block h-40 sm:h-48 bg-gray-50 overflow-hidden relative">
                    <img src={product.images[0] || 'https://via.placeholder.com/300'} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={product.title} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300"></div>
                  </Link>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <Link to={`/product/${product.slug}`} className="space-y-1.5 block cursor-pointer">
                    <span className="text-[9px] font-black tracking-wider text-gray-400 uppercase">{product.category}</span>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-amber-600 transition">{product.title}</h3>
                    <p className="text-gray-500 text-xs line-clamp-2 font-medium leading-relaxed">{product.description || 'لا يوجد وصف متاح لهذه البياسة.'}</p>
                  </Link>
                  <div className="pt-3 flex justify-between items-center border-t border-gray-50">
                    <Link to={`/product/${product.slug}`} className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-bold mb-0.5">ثمن البياسة</span>
                      <span className="font-black text-green-600 text-sm md:text-base">{product.price} <span className="text-[10px] font-bold text-gray-500">درهم</span></span>
                    </Link>
                    <a href={`https://wa.me/${vendor.phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم، شفت هاد البياسة فالحانوت ديالك فـ ${settings?.siteName || 'Qri3a Hunter'}: "${product.title}" بـ ${product.price} درهم.\nالرابط: ${window.location.origin}/product/${product.slug}\nواش باقا متوفرة بغيت ناخدها؟`)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-white px-3.5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5" style={{ backgroundColor: themeColor }}>
                      <Phone className="h-3 w-3 fill-white" />
                      <span>طلب</span>
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 💬 نافذة إرسال رسالة داخلية */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-right">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 flex-row-reverse">
              <button onClick={() => setShowChatModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition"><X className="h-5 w-5 text-gray-500" /></button>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-gray-800" /> تواصل مع البائع</h3>
            </div>
            
            <form onSubmit={handleSendInternalMessage} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">رسالتك:</label>
                <textarea 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)} 
                  rows="4" 
                  placeholder="السلام عليكم، بغيت نسولكم على..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20" 
                  autoFocus
                />
              </div>

              <button type="submit" disabled={sendingChat || !chatMessage.trim()} className="w-full bg-neutral-900 text-white font-bold rounded-xl py-3 text-sm hover:bg-black transition flex justify-center items-center gap-2 disabled:opacity-50">
                {sendingChat ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>إرسال الرسالة</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Storefront;