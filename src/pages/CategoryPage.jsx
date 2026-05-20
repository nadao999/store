import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SettingsContext } from '../context/SettingsContext';
import axiosInstance from '../axios';
import { Loader2, ArrowRight, ShoppingBag, Crown, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

// قائمة التصنيفات النظيفة والاحترافية (بدون إيموجي أو لغات أخرى)
const APP_CATEGORIES = [
  { slug: 'vetements-chaussures', name: 'الملابس والأحذية' },
  { slug: 'accessoires-mode', name: 'إكسسوارات الموضة' },
  { slug: 'telephone-tablette', name: 'الهواتف والأجهزة اللوحية' },
  { slug: 'informatique', name: 'الإعلاميات والحواسيب' },
  { slug: 'jeux-videos-consoles', name: 'ألعاب الفيديو والمنصات' },
  { slug: 'beaute-sante', name: 'الصحة والجمال' },
  { slug: 'maison-cuisine', name: 'المنزل والمطبخ' },
  { slug: 'sports-loisirs', name: 'الرياضة والتسلية' },
  { slug: 'tv-hi-tech', name: 'التلفاز والإلكترونيات' },
  { slug: 'accessoire-auto-moto', name: 'أكسسوارات السيارات والدراجات' },
  { slug: 'supermarche', name: 'السوبرماركت والمواد الغذائية' },
  { slug: 'bebe-jouets', name: 'الأطفال والألعاب' }
];

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const { settings } = useContext(SettingsContext);
  const themeColor = settings?.themeColors?.primary || '#FF5733';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب معلومات التصنيف الحالي من القائمة
  const currentCategory = APP_CATEGORIES.find(c => c.slug === categorySlug);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/api/products/category/${categorySlug}`);
        setProducts(data);
      } catch (error) {
        toast.error('حدث خطأ أثناء جلب منتجات هذا التصنيف');
      } finally {
        setLoading(false);
      }
    };
    if (categorySlug) fetchCategoryProducts();
  }, [categorySlug]);

  if (loading) return <div className="flex justify-center mt-32"><Loader2 className="animate-spin h-10 w-10 text-gray-400" /></div>;

  return (
    <div dir="rtl" className="pb-24 md:pb-6 text-right w-full max-w-[480px] mx-auto min-h-screen bg-gray-50 px-3 pt-3 space-y-4">
      
      {/* هيدر الصفحة الاحترافي */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black text-gray-900 tracking-tight">
            {currentCategory?.name || 'التصنيف التجاري'}
          </h1>
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-neutral-900 transition bg-gray-50 px-3 py-2 rounded-xl">
          <span>الرئيسية</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* حالة عدم وجود منتجات في التصنيف */}
      {products.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-sm font-black text-gray-800">لا توجد منتجات حالياً</h3>
          <p className="text-xs font-bold text-gray-400">لم يقم أي بائع بإضافة منتجات في هذا التصنيف بعد.</p>
        </div>
      ) : (
        /* شبكة عرض المنتجات */
        <div className="grid grid-cols-2 gap-3">
          {products.map(prod => (
            <div 
              key={prod._id} 
              className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between border ${prod.isPromoted ? 'border-amber-300' : 'border-gray-100'}`}
            >
              <div className="relative">
                {prod.isPromoted && (
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-amber-400 text-[9px] font-black px-2 py-1 rounded-full z-10 flex items-center gap-1 shadow-sm">
                    <Crown className="h-3 w-3" /> مميز
                  </div>
                )}
                <Link to={`/product/${prod.slug}`} className="block h-36 sm:h-44 bg-gray-50 overflow-hidden relative group">
                  <img 
                    src={prod.images[0] || 'https://via.placeholder.com/300'} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    alt={prod.title} 
                  />
                </Link>
              </div>

              <div className="p-3 flex flex-col justify-between flex-1 space-y-3">
                <Link to={`/product/${prod.slug}`}>
                  <h3 className="font-bold text-gray-800 text-xs line-clamp-2 leading-snug hover:text-neutral-900 transition">{prod.title}</h3>
                  <span className="font-black text-neutral-900 text-sm block mt-2">{prod.price} <span className="text-[10px] text-gray-500 font-bold">درهم</span></span>
                </Link>

                <Link 
                  to={`/product/${prod.slug}`} 
                  className="w-full bg-neutral-900 hover:bg-black text-white text-xs font-black py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>عرض التفاصيل</span>
                  <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default CategoryPage;