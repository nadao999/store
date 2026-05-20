import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { Link } from 'react-router-dom'; // 👈 زدنا هادي
import axiosInstance from '../axios';
import { Loader2, Send, ArrowRight, MessageSquare, ShieldCheck, CheckCheck, Tag, Film, Image, AlertCircle, X, Maximize2, Trash2, Edit3, Copy, MailWarning } from 'lucide-react'; // 👈 زدنا MailWarning
import toast from 'react-hot-toast';

// 🛡️ مصفاة الألفاظ النابية
const FORBIDDEN_WORDS = [
  'zbi', 'gawri', 'kahba', 'khra', 'moussh', 'taboun', 'zeb', 'sharmota', 'nayek', 
  'قحبة', 'زبي', 'شرموطة', 'طبون', 'خرا', 'نمي', 'قلاوي', 'تهاك', 'ترمك'
];

const cleanProfanity = (text) => {
  let cleanedText = text;
  FORBIDDEN_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    cleanedText = cleanedText.replace(regex, '***');
  });
  return cleanedText;
};

const isWithinFiveMinutes = (dateString) => {
  const msgDate = new Date(dateString).getTime();
  const now = new Date().getTime();
  const diffInMinutes = (now - msgDate) / 1000 / 60;
  return diffInMinutes <= 5;
};

const Messages = () => {
  const { user } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const themeColor = settings?.themeColors?.primary || '#FF5733';

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const messagesEndRef = useRef(null);

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null); 
  const [previewMedia, setPreviewMedia] = useState({ isOpen: false, url: '', type: '' });

  const fetchConversations = async () => {
    if (!user) return setLoading(false);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axiosInstance.get('/api/chat', config);
      setConversations(data);
      if (activeChat) {
        const updatedChat = data.find(c => c._id === activeChat._id);
        if (updatedChat) setActiveChat(updatedChat);
      }
    } catch (error) {
      console.error('مشكلة في جلب المحادثات الحالية:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => fetchConversations(), 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeChat?._id]);

  useEffect(() => {
    const markChatAsRead = async () => {
      if (!activeChat || !user?.token) return;
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axiosInstance.put(`/api/chat/${activeChat._id}/read`, {}, config);
        window.dispatchEvent(new Event('chatReadEvent'));
      } catch (error) {
        console.log('Error marking conversation as read');
      }
    };
    markChatAsRead();
  }, [activeChat, user?.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSendMessage = async (e, textToSend = null) => {
    if (e) e.preventDefault();
    let currentText = textToSend !== null ? textToSend : newMessage;
    if (!currentText.trim()) return;
    
    currentText = cleanProfanity(currentText);
    setSending(true);
    const receiver = activeChat.participants.find(p => p._id !== user.id && p._id !== user._id);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.post('/api/chat/send', { receiverId: receiver._id, text: currentText }, config);
      if (textToSend === null) setNewMessage('');
      fetchConversations(); 
    } catch (error) {
      toast.error('فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateMessage = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const cleaned = cleanProfanity(editingText);
      await axiosInstance.put(`/api/chat/${activeChat._id}/message/${msgId}`, { text: cleaned }, config);
      setEditingMsgId(null);
      setEditingText('');
      fetchConversations();
      toast.success('تم تعديل الرسالة بنجاح');
    } catch (error) {
      toast.error('فشل تعديل الرسالة');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axiosInstance.delete(`/api/chat/${activeChat._id}/message/${msgId}`, config);
      fetchConversations();
      setActiveMenuId(null);
      toast.success('تم الحذف بنجاح');
    } catch (error) {
      toast.error('فشل حذف الرسالة');
    }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setActiveMenuId(null);
    toast.success('تم نسخ النص للحافظة');
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !user?.token || !activeChat) return;

    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user.token}` } };
      toast.loading(type === 'video' ? 'جاري رفع الفيديو...' : 'جاري رفع الصورة...', { id: 'uploadMedia' });
      const { data } = await axiosInstance.post('/api/upload', formData, config);
      
      toast.dismiss('uploadMedia');
      if (type === 'video') {
        await handleSendMessage(null, `[CONTAINS_VIDEO]:${data.url}`);
      } else {
        await handleSendMessage(null, `[CONTAINS_IMAGE]:${data.url}`);
      }
    } catch (err) {
      toast.dismiss('uploadMedia');
      toast.error('فشل الرفع.');
    } finally {
      e.target.value = '';
      setUploadingMedia(false);
    }
  };

  const handleOfferAction = async (msgId, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const receiver = activeChat.participants.find(p => p._id !== user.id && p._id !== user._id);
      const replyText = action === 'accept' ? '✅ تم قبول عرضك المالي بنجاح! يرجى التواصل معي الآن.' : '❌ نعتذر منك، لا يمكنني قبول هذا العرض.';
      await axiosInstance.post('/api/chat/send', { receiverId: receiver._id, text: replyText }, config);
      fetchConversations();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  // 🛡️ بلوك الحماية من غير المسجلين
  if (!user) return <div dir="rtl" className="text-center mt-32 max-w-sm mx-auto bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-3"><div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500"><AlertCircle className="h-6 w-6" /></div><h2 className="text-sm font-black text-gray-800">يرجى تسجيل الدخول أولاً!</h2></div>;
  
  // 🛡️ بلوك الحماية من غير المفعلين (زدناه هنا)
  if (user?.isEmailVerified === false) {
    return (
      <div dir="rtl" className="text-center mt-32 max-w-sm mx-auto bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <MailWarning className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-gray-900">حسابك غير مفعل!</h2>
        <p className="text-xs text-gray-500 font-bold leading-relaxed">
          لا يمكنك التواصل مع المتاجر والبائعين قبل تأكيد بريدك الإلكتروني.
        </p>
        <Link to="/profile" className="block w-full bg-neutral-900 text-white font-black py-3.5 rounded-xl hover:bg-black transition shadow-sm text-sm mt-2">
          الذهاب لتفعيل الحساب
        </Link>
      </div>
    );
  }

  if (loading && conversations.length === 0) return <div className="flex justify-center mt-32"><Loader2 className="animate-spin h-8 w-8 text-amber-500" /></div>;

  return (
    <div dir="rtl" className="text-right w-full max-w-[480px] mx-auto bg-gray-50 flex flex-col h-[calc(100vh-140px)] pb-4 px-2 relative overflow-x-hidden">
      
      {/* 1. قائمة المحادثات */}
      {!activeChat ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col mt-2">
          <div className="p-4 border-b border-gray-50 bg-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-800" />
            <h1 className="text-base font-black text-gray-900">صندوق الرسائل</h1>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2 scrollbar-hide">
            {conversations.length === 0 ? (
              <div className="text-center py-24 text-gray-400 font-bold text-xs border border-dashed border-gray-100 rounded-3xl m-2">صندوق الرسائل فارغ.</div>
            ) : (
              conversations.map(convo => {
                const otherUser = convo.participants.find(p => p._id !== user.id && p._id !== user._id);
                const lastMsg = convo.messages[convo.messages.length - 1];
                if (!otherUser) return null;

                const hasUnread = convo.messages.some(m => m.sender !== user.id && m.sender !== user._id && !m.read);
                const avatarSrc = otherUser.avatar && otherUser.avatar !== 'null' && otherUser.avatar !== '' ? otherUser.avatar : `https://ui-avatars.com/api/?name=${otherUser.username}&background=F3F4F6&color=9CA3AF&bold=true`;
                
                let displayTxt = lastMsg?.text || '';
                if (displayTxt.includes('[CONTAINS_VIDEO]:')) displayTxt = '🎥 مقطع فيديو توضيحي';
                if (displayTxt.includes('[CONTAINS_IMAGE]:')) displayTxt = '📷 صورة ملحقة بالرسالة';

                return (
                  <button key={convo._id} onClick={() => setActiveChat(convo)} className="w-full text-right p-3.5 rounded-2xl transition flex items-center gap-3 border border-gray-100 bg-white hover:bg-gray-50 shadow-sm">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        <img src={avatarSrc} className="w-full h-full object-cover" alt="avatar" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${otherUser.username}&background=F3F4F6&color=9CA3AF&bold=true`; }} />
                      </div>
                      {hasUnread && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <h3 className="font-black text-xs truncate flex items-center gap-1 text-gray-700">
                          {otherUser.storeName || otherUser.username}
                          {otherUser.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                        </h3>
                        <span className="text-[9px] font-bold text-gray-400">{new Date(convo.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className={`text-[11px] truncate font-medium text-gray-400`}>{lastMsg?.sender === user.id ? `أنت: ${displayTxt}` : displayTxt}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (

        /* 2. شاشة الدردشة النشطة */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col relative h-full mt-2">
          
          <div className="p-3 border-b border-gray-100 bg-white flex items-center gap-3 shadow-sm z-10">
            <button onClick={() => setActiveChat(null)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition"><ArrowRight className="h-4 w-4 text-gray-700" /></button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 shrink-0">
                {(() => {
                  const chatPartner = activeChat.participants.find(p => p._id !== user.id && p._id !== user._id);
                  const partnerAvatar = chatPartner?.avatar && chatPartner.avatar !== 'null' && chatPartner.avatar !== '' ? chatPartner.avatar : `https://ui-avatars.com/api/?name=${chatPartner?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`;
                  return (
                    <img 
                      src={partnerAvatar} 
                      className="w-full h-full object-cover" 
                      alt="avatar" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${chatPartner?.username || 'U'}&background=F3F4F6&color=9CA3AF&bold=true`; }} 
                    />
                  );
                })()}
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-xs flex items-center gap-1">
                  {activeChat.participants.find(p => p._id !== user.id && p._id !== user._id)?.storeName || activeChat.participants.find(p => p._id !== user.id && p._id !== user._id)?.username}
                  {activeChat.participants.find(p => p._id !== user.id && p._id !== user._id)?.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50/50 scrollbar-hide">
            {activeChat.messages.map((msg, idx) => {
              const isMe = msg.sender === user.id || msg.sender === user._id;
              const isOffer = msg.text.includes('عرض شراء:');
              
              const isVideoMessage = msg.text.startsWith('[CONTAINS_VIDEO]:');
              const isImageMessage = msg.text.startsWith('[CONTAINS_IMAGE]:');
              const mediaUrl = (isVideoMessage || isImageMessage) ? msg.text.replace('[CONTAINS_VIDEO]:', '').replace('[CONTAINS_IMAGE]:', '') : '';

              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative mb-1`}>
                  
                  {activeMenuId === msg._id && (
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)}></div>
                  )}

                  {isOffer ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 max-w-[85%] shadow-sm z-10">
                      <div className="flex items-center gap-1.5 mb-2 text-amber-700 font-black text-xs"><Tag className="h-3.5 w-3.5" /> عرض شراء تفاعلي</div>
                      <p className="text-gray-800 text-xs font-bold bg-white p-3 rounded-xl border border-amber-100 leading-relaxed whitespace-pre-line">{msg.text}</p>
                      {!isMe && (
                        <div className="flex gap-2 mt-3.5">
                          <button onClick={() => handleOfferAction(msg._id, 'accept')} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[11px] font-black py-2.5 rounded-xl transition shadow-sm">قبول العرض</button>
                          <button onClick={() => handleOfferAction(msg._id, 'reject')} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-black py-2.5 rounded-xl transition shadow-sm">رفض</button>
                        </div>
                      )}
                      <div className="text-[9px] mt-1.5 text-gray-400 text-left">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  ) : (
                    
                    <div 
                      onClick={() => !isOffer && setActiveMenuId(activeMenuId === msg._id ? null : msg._id)}
                      className={`relative max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs font-bold shadow-sm space-y-1 cursor-pointer transition active:scale-[0.98] select-none ${isMe ? 'text-white rounded-bl-sm' : 'bg-white border border-gray-150 text-gray-800 rounded-br-sm'} ${activeMenuId === msg._id ? 'z-50' : 'z-10'}`} 
                      style={{ backgroundColor: isMe ? themeColor : '#FFFFFF' }}
                    >
                      {editingMsgId === msg._id ? (
                        <div className="space-y-1.5 min-w-[200px] text-right" dir="rtl" onClick={(e) => e.stopPropagation()}>
                          <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full p-2 text-neutral-900 rounded-lg text-xs border border-gray-200 focus:outline-none" autoFocus />
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => setEditingMsgId(null)} className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold">إلغاء</button>
                            <button type="button" onClick={() => handleUpdateMessage(msg._id)} className="px-2.5 py-1 bg-neutral-900 text-white rounded-md text-[10px] font-black">حفظ</button>
                          </div>
                        </div>
                      ) : isVideoMessage ? (
                        <div className="rounded-xl overflow-hidden bg-black max-w-[220px] border border-black/5 relative group">
                          <video src={mediaUrl} className="w-full h-40 object-cover pointer-events-none" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewMedia({ isOpen: true, url: mediaUrl, type: 'video' }); }} className="absolute inset-0 bg-black/20 flex items-center justify-center text-white"><Maximize2 className="h-5 w-5 bg-black/40 p-1 rounded-md" /></button>
                        </div>
                      ) : isImageMessage ? (
                        <div className="rounded-xl overflow-hidden bg-gray-100 max-w-[220px] border border-gray-100 relative block">
                          <img src={mediaUrl} className="w-full h-auto object-cover max-h-52 cursor-pointer" alt="ميديا" onClick={(e) => { e.stopPropagation(); setPreviewMedia({ isOpen: true, url: mediaUrl, type: 'image' }); }} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed font-bold">{msg.text}</p>
                      )}

                      <div className={`text-[9px] mt-1.5 flex items-center gap-0.5 ${isMe ? 'text-white/70 justify-end' : 'text-gray-400 justify-start'}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {isMe && <CheckCheck className="h-3 w-3 tracking-tighter" />}
                        {msg.isEdited && <span className="text-[8px] font-bold opacity-60 mr-1">(معدلة)</span>}
                      </div>

                      {activeMenuId === msg._id && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-2.5 px-3 py-2 rounded-full bg-black/75 backdrop-blur-sm shadow-xl border border-white/10 z-50 w-max animate-fade-in ${isMe ? 'left-full ml-2' : 'right-full mr-2'}`}
                        >
                          {!msg.text.startsWith('[CONTAINS_') && (
                            <button onClick={() => handleCopyMessage(msg.text)} className="text-white hover:scale-110 transition p-1" title="نسخ النص">
                              <Copy className="h-4 w-4" />
                            </button>
                          )}

                          {isMe && isWithinFiveMinutes(msg.createdAt) && (
                            <>
                              {!msg.text.startsWith('[CONTAINS_') && (
                                <button onClick={() => { setEditingMsgId(msg._id); setEditingText(msg.text); setActiveMenuId(null); }} className="text-blue-400 hover:scale-110 transition p-1" title="تعديل الرسالة">
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteMessage(msg._id)} className="text-red-500 hover:scale-110 transition p-1" title="إلغاء الإرسال">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {isMe && !isWithinFiveMinutes(msg.createdAt) && (
                            <span className="text-[9px] text-gray-300 font-bold px-1 select-none">لا يمكن التعديل</span>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center z-10 relative">
            <div className="flex gap-1.5">
              <label className={`p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition cursor-pointer flex items-center justify-center shrink-0 ${uploadingMedia ? 'opacity-30 pointer-events-none' : ''}`}>
                <Image className="h-4 w-4 text-gray-500" />
                <input type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} className="hidden" disabled={uploadingMedia || sending} />
              </label>
              <label className={`p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition cursor-pointer flex items-center justify-center shrink-0 ${uploadingMedia ? 'opacity-30 pointer-events-none' : ''}`}>
                {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <Film className="h-4 w-4 text-gray-500" />}
                <input type="file" accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} className="hidden" disabled={uploadingMedia || sending} />
              </label>
            </div>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-neutral-900 transition" disabled={uploadingMedia} />
            <button type="submit" disabled={sending || uploadingMedia || !newMessage.trim()} className="bg-neutral-900 text-white p-3 rounded-xl hover:bg-black transition disabled:opacity-40 shrink-0 shadow-sm">
              {sending && !uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>

        </div>
      )}

      {previewMedia.isOpen && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-[480px] flex justify-between items-center mb-4 px-2">
            <span className="text-white/60 text-xs font-black">{previewMedia.type === 'video' ? 'معاينة مقطع الفيديو' : 'معاينة الصورة الملحقة'}</span>
            <button type="button" onClick={() => setPreviewMedia({ isOpen: false, url: '', type: '' })} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"><X className="h-5 w-5" /></button>
          </div>
          <div className="w-full max-w-[440px] max-h-[70vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/5">
            {previewMedia.type === 'video' ? <video src={previewMedia.url} controls autoPlay className="w-full h-auto max-h-[70vh] object-contain" /> : <img src={previewMedia.url} className="w-full h-auto max-h-[70vh] object-contain" alt="كاملة الحجم" />}
          </div>
        </div>
      )}

    </div>
  );
};

export default Messages;