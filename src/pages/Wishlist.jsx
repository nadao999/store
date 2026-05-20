import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../axios';
import { Heart, Trash2, ArrowRight, ShoppingBag, Loader2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const { user, updateUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!user?.token) return navigate('/login');
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.get('/api/auth/wishlist', config);
      setWishlist(data || []);
    } catch (error) {
      console.error('فشل في جلب المفضلة:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.post(`/api/auth/wishlist/${productId}`, {}, config);
      
      setWishlist(prev => prev.filter(item => (item._id || item) !== productId));
      toast.success('تمت الإزالة من المفضلة بنجاح');
      
      if (updateUserData) {
        updateUserData({ ...user, wishlist: data.wishlist });
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إزالة المنتج');
    }
  };

  if (loading) return <div className="flex justify-center mt-32"><Loader2 className="animate-spin h-10 w-10 text-amber-500" /></div>;

  return (
    <div dir="rtl" className="pb-24 md:pb-6 text-right w-full max-w-[480px] mx-auto min-h-screen bg-gray-50 px-3 pt-3 space-y-4">
      
      {/* هيدر الصفحة */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <h1 className="text-base font-black text-gray-900 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500 fill-red-500" /> قائمة المفضلة ({wishlist.length})
        </h1>
        <Link to="/" className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-neutral-900 transition bg-gray-50 px-3 py-2 rounded-xl">
          <span>الرئيسية</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* المحتوى */}
      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-red-300" />
          </div>
          <h3 className="text-sm font-black text-gray-800">قائمة المفضلة فارغة</h3>
          <p className="text-xs font-bold text-gray-400">تصفح المنتجات في الصفحة الرئيسية وأضف ما يعجبك هنا.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {wishlist.map(product => {
            if (!product || typeof product !== 'object') return null;
            return (
              <div key={product._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative flex flex-col justify-between group shadow-sm">
                
                {/* زر الحذف الفوري */}
                <button 
                  onClick={() => handleRemoveFromWishlist(product._id)} 
                  className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition border border-gray-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="relative">
                  <Link to={`/product/${product.slug}`} className="h-36 bg-gray-50 block overflow-hidden relative">
                    <img src={product.images?.[0] || 'https://via.placeholder.com/300'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="product" />
                  </Link>
                </div>

                <div className="p-3 text-right flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-xs line-clamp-2 leading-snug">{product.title}</h3>
                    <span className="font-black text-neutral-900 text-sm block mt-2">{product.price} <span className="text-[10px] text-gray-400 font-bold">درهم</span></span>
                  </div>

                  <Link 
                    to={`/product/${product.slug}`} 
                    className="w-full bg-neutral-900 hover:bg-black text-white text-[11px] font-black py-2 rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>تفاصيل المنتج</span>
                    <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Wishlist;