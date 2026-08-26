// public/service-worker-push.js
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installed');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('📦 Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('📨 Push notification received');

  let data = { title: 'Jiyaa Jewels', body: '', url: '/' };

  try {
    if (event.data) {
      data = event.data.json();
      console.log('📨 Push data:', data);
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: '🔔 Open' },
      { action: 'close', title: '❌ Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Jiyaa Jewels', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('🔔 Notification closed');
});