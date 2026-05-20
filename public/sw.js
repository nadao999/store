// الملف: frontend/public/sw.js

self.addEventListener('push', function(event) {
  // هاد الكود كيخدم فالخلفية واخا السيت مسدود
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'كاين طلب جديد فالسوق!',
    icon: '/vite.svg', // الأيقونة لي غتبان فالإشعار
    badge: '/vite.svg',
    dir: 'rtl',
    vibrate: [200, 100, 200] // التليفون غيفيبري
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Qri3a Hunter', options)
  );
});