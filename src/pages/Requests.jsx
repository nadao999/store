import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axios';
import { Target, User, DollarSign, Clock, Tag, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Requests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAllRequests = async () => {
      try {
        setLoading(true);
        // كنجيبو كاع الطلبات من الرابط لي عاد قادينا فـ الباكاند
        const { data } = await  axiosInstance.get('/api/requests/nearby');
        if (Array.isArray(data)) {
          setRequests(data);
        }
      } catch (err) {
        console.error('خطأ في جلب الطلبات:', err);
      } finally {
        setLoading(false);
      }
    };

    getAllRequests();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-[70vh]"><Loader2 className="animate-spin h-10 w-10 text-amber-500" /></div>;

  return (
    <div dir="rtl" className="pb-28 md:pb-6 text-right w-full max-w-[480px] mx-auto bg-gray-50 min-h-screen">
      
      {/* 🔝 الهيدر العلوي */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-base font-black text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500 animate-pulse" /> طلبات المشترين الحالية
        </h1>
        <span className="text-xs font-black bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          {requests.length} طلب
        </span>
      </div>

      {/* 📄 قائمة الطلبات */}
      <div className="p-4 space-y-3">
        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 border-dashed min-h-[250px] flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
            <h3 className="font-black text-gray-800 text-sm mb-1">السوق فارغ حالياً</h3>
            <p className="text-xs font-bold text-gray-400">لا توجد طلبات شراء مفتوحة في الوقت الحالي.</p>
          </div>
        ) : (
          requests.map((req) => (
            <Link 
              key={req._id} 
              to={`/request/${req._id}`} 
              className="bg-white p-4 rounded-3xl border border-gray-100 flex justify-between items-center gap-3 shadow-sm hover:shadow-md transition block group"
            >
              <div className="text-right flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black px-2 py-0.5 bg-gray-150 text-gray-500 rounded-md">
                    {req.category || 'عام'}
                  </span>
                  <h3 className="font-black text-gray-900 text-sm truncate group-hover:text-amber-600 transition">{req.title}</h3>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {req.buyer?.username || 'مشتري'}</span>
                  <span className="flex items-center gap-1 text-green-600 font-black"> {req.maxBudget} درهم</span>
                </div>
              </div>

              <div className="bg-neutral-900 group-hover:bg-amber-500 text-white group-hover:text-black font-black text-[10px] px-3.5 py-2 rounded-xl shrink-0 flex items-center gap-0.5 transition-all">
                <span>تقديم عرض</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
};

export default Requests;