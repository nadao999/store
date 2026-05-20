import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsContext } from '../context/SettingsContext';
import axiosInstance from '../axios';
import { Search as SearchIcon, SlidersHorizontal, Loader2, Crown, ChevronLeft } from 'lucide-react';

const APP_CATEGORIES = [
  { slug: 'all', name: 'جميع الأصناف' },
  { slug: 'vetements-chaussures', name: 'الملابس والأحذية' },
  { slug: 'accessoires-mode', name: 'إكسسوارات الموضة والساعات' },
  { slug: 'telephone-tablette', name: 'الهواتف والأجهزة اللوحية' },
  { slug: 'informatique', name: 'الإعلاميات والحواسيب' },
  { slug: 'jeux-videos-consoles', name: 'ألعاب الفيديو والكونسول' },
  { slug: 'beaute-sante', name: 'الصحة والجمال' },
  { slug: 'maison-cuisine', name: 'المنزل والمطبخ' },
  { slug: 'sports-loisirs', name: 'الرياضة والتسلية' },
  { slug: 'tv-hi-tech', name: 'التلفاز والإلكترونيات' },
  { slug: 'accessoire-auto-moto', name: 'أكسسوارات السيارات والدراجات' }
];

const Search = () => {
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [searchParams, setSearchParams] = useState({
    keyword: '',
    category: 'all',
    minPrice: '',
    maxPrice: ''
  });

  const executeSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(searchParams).toString();
      const { data } = await axiosInstance.get(`/api/products/search?${query}`);
      setProducts(data);
    } catch (error) {
      console.error('خطأ أثناء عملية البحث:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch();
    setShowFilters(false);
  };

  return (
    <div dir="rtl" className="pb-28 md:pb-6 text-right w-full max-w-[480px] mx-auto bg-gray-50 min-h-screen px-3 space-y-4">
      
      {/* 🔍 محرك البحث العلوي */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-2 z-40 mt-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <button 
            type="button" 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition flex items-center justify-center ${showFilters ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
          
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="ابحث عن منتج محدد..." 
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-neutral-950 focus:ring-4 focus:ring-gray-100 transition" 
            />
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          <button type="submit" className="bg-neutral-900 text-white font-black px-5 rounded-xl shadow-md hover:bg-black transition text-xs">
            بحث
          </button>
        </form>

        {/* ⚙️ الفلاتر المتقدمة */}
        {showFilters && (
          <div className="pt-4 mt-4 border-t border-gray-100 space-y-4 animate-fade-in">
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2">تحديد نطاق السعر (بالدرهم)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  placeholder="السعر الأدنى" 
                  value={searchParams.minPrice} 
                  onChange={(e) => setSearchParams({...searchParams, minPrice: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none"
                />
                <span className="text-gray-400 font-bold">إلى</span>
                <input 
                  type="number" 
                  placeholder="السعر الأعلى" 
                  value={searchParams.maxPrice} 
                  onChange={(e) => setSearchParams({...searchParams, maxPrice: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setSearchParams({ keyword: '', category: 'all', minPrice: '', maxPrice: '' })}
                className="text-[11px] font-black text-gray-500 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition"
              >
                إعادة تعيين
              </button>
              <button onClick={handleSearchSubmit} className="text-[11px] font-black text-white bg-neutral-900 px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-black transition shadow-sm">
                <SearchIcon className="h-3.5 w-3.5" /> تطبيق التصفية
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🏷️ شريط الأصناف السريع */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide snap-x">
        {APP_CATEGORIES.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setSearchParams({...searchParams, category: cat.slug})}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full border text-xs font-black transition snap-start ${searchParams.category === cat.slug ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 📦 شبكة نتائج البحث المحدثة هندسياً */}
      <div className="pt-1 space-y-3">
        <h3 className="font-black text-gray-800 text-sm px-1">
          نتائج البحث المتاحة ({products.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-amber-500" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 border-dashed space-y-3 px-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <SearchIcon className="h-8 w-8" />
            </div>
            <h4 className="font-black text-gray-800 text-sm">لم نجد أي منتجات!</h4>
            <p className="text-xs font-medium text-gray-400 leading-relaxed">عذراً، لم نجد أي معروضات تطابق هذه الكلمات أو النطاق السعري حالياً.</p>
            <button onClick={() => setSearchParams({ keyword: '', category: 'all', minPrice: '', maxPrice: '' })} className="text-xs font-black text-amber-600 underline block mx-auto pt-1">مسح الفلاتر والمحاولة مجدداً</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(prod => (
              <div key={prod._id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between group transition-all duration-300 hover:shadow-md ${prod.isPromoted ? 'border-amber-400 ring-1 ring-amber-400/10' : 'border-gray-100'}`}>
                <div className="relative">
                  {prod.isPromoted && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-md z-10 shadow-sm flex items-center gap-0.5">
                      <Crown className="h-2.5 w-2.5" /> مميز
                    </span>
                  )}
                  <Link to={`/product/${prod.slug}`} className="h-36 sm:h-40 bg-gray-50 overflow-hidden block relative">
                    {prod.images[0] && <img src={prod.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={prod.title} />}
                  </Link>
                </div>
                
                {/* 🔥 تم التعديل هنا: زجر مساحة العرض النصية وربط العناصر بمرونة لمنع أي مساحات فارغة ميتة */}
                <div className="p-3 flex flex-col justify-between bg-white space-y-2 flex-1">
                  <Link to={`/product/${prod.slug}`} className="space-y-0.5 block text-right">
                    <span className="text-[9px] font-black text-gray-400 block truncate">
                      {APP_CATEGORIES.find(c => c.slug === prod.category)?.name || 'صنف عام'}
                    </span>
                    <h4 className="font-black text-gray-900 text-xs line-clamp-1 leading-snug">{prod.title}</h4>
                    <span className="font-black text-green-600 text-xs block pt-0.5">{prod.price} درهم</span>
                  </Link>
                  
                  <button 
                    onClick={() => navigate(`/product/${prod.slug}`)}
                    className="w-full text-center bg-neutral-900 text-white text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1 transition hover:bg-black shadow-sm"
                  >
                    <span>عرض تفاصيل المنتج</span>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{` .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } `}</style>

    </div>
  );
};

export default Search;