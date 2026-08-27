// ============================================
// SERVICE WORKER - PUSH NOTIFICATIONS
// ============================================

console.log('[SW] Service worker script loaded at', new Date().toISOString());

self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Install event triggered');
  console.log('[SW] Skipping waiting to activate immediately...');
  event.waitUntil(
    self.skipWaiting()
      .then(() => console.log('[SW] ✅ Skip waiting complete'))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] 📦 Activate event triggered');
  console.log('[SW] Claiming clients...');
  event.waitUntil(
    self.clients.claim()
      .then(() => {
        console.log('[SW] ✅ Clients claimed successfully');
        console.log('[SW] ✅ Service Worker activated and ready for push');
        console.log('[SW] Registration scope:', self.registration?.scope || 'unknown');
      })
  );
});

self.addEventListener('push', (event) => {
  console.log('[SW] 📨 ====== PUSH EVENT RECEIVED ======');
  console.log('[SW] Timestamp:', new Date().toISOString());
  console.log('[SW] Event data present:', !!event.data);
  
  let data = { 
    title: 'Jiyaa Jewels', 
    body: 'You have a new notification', 
    url: '/' 
  };

  try {
    if (event.data) {
      const rawData = event.data.json();
      console.log('[SW] 📨 Raw push data:', JSON.stringify(rawData, null, 2));
      
      // Merge with defaults
      data = {
        title: rawData.title || 'Jiyaa Jewels',
        body: rawData.body || 'You have a new notification',
        url: rawData.url || '/',
        icon: rawData.icon || '/logo192.png',
        badge: rawData.badge || '/logo192.png',
        vibrate: rawData.vibrate || [200, 100, 200],
        data: rawData.data || {}
      };
      
      console.log('[SW] 📨 Parsed notification data:', data);
    } else {
      console.warn('[SW] ⚠️ Push event fired with NO data attached');
    }
  } catch (error) {
    console.error('[SW] ❌ Error parsing push data:', error);
    console.error('[SW] Raw data:', event.data ? event.data.text() : 'null');
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: data.vibrate,
    data: { 
      url: data.url,
      notificationData: data.data
    },
    actions: [
      { action: 'open', title: '🔔 Open' },
      { action: 'close', title: '❌ Close' }
    ],
    tag: `push-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
    timestamp: Date.now()
  };

  console.log('[SW] 📝 Notification options:', {
    title: data.title,
    body: options.body,
    tag: options.tag,
    actions: options.actions.length
  });

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('[SW] ✅ showNotification resolved successfully');
        console.log('[SW] ✅ Notification should now be visible');
      })
      .catch((err) => {
        console.error('[SW] ❌ showNotification threw an error:', err);
        console.error('[SW] Error stack:', err.stack);
        // Try fallback notification
        console.log('[SW] 🔄 Trying fallback notification...');
        return self.registration.showNotification('Jiyaa Jewels', {
          body: 'You have a new notification. Click to open.',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200]
        }).then(() => {
          console.log('[SW] ✅ Fallback notification succeeded');
        }).catch((fallbackErr) => {
          console.error('[SW] ❌ Fallback notification also failed:', fallbackErr);
        });
      })
  );
});

// Handle subscription change (browser invalidates subscription)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.warn('[SW] ♻️ pushsubscriptionchange fired');
  console.warn('[SW] Old subscription is no longer valid');
  console.warn('[SW] Browser will automatically request a new subscription');
  
  // You can notify the server here if needed
  // We'll handle re-subscription on the client side when it checks next time
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notification clicked:', event.notification);
  const notification = event.notification;
  const url = notification.data?.url || '/';
  
  console.log('[SW] Action:', event.action || 'default');
  console.log('[SW] Target URL:', url);
  
  event.notification.close();

  if (event.action === 'close') {
    console.log('[SW] User closed notification');
    return;
  }

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log('[SW] Found', clientList.length, 'window clients');
      
      // Try to focus existing client
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && client.url.includes(url) && 'focus' in client) {
          console.log('[SW] Focusing existing client:', client.url);
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        console.log('[SW] Opening new window:', url);
        return clients.openWindow(url);
      } else {
        console.warn('[SW] Cannot open window - not supported');
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 🔔 Notification closed by user (swipe/dismiss)');
  console.log('[SW] Notification title:', event.notification?.title);
});

// ============================================
// MESSAGE HANDLER FOR CLIENT COMMUNICATION
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] 📨 Message received from client:', event.data);
  
  if (event.data && event.data.action === 'ping') {
    console.log('[SW] Pong! Sending response...');
    event.source.postMessage({ 
      action: 'pong', 
      timestamp: Date.now(),
      registrationActive: !!self.registration,
      pushManager: !!self.registration?.pushManager
    });
  }
  
  if (event.data && event.data.action === 'getSubscription') {
    console.log('[SW] Getting current push subscription...');
    self.registration.pushManager.getSubscription()
      .then((subscription) => {
        console.log('[SW] Subscription:', subscription ? 'YES' : 'NO');
        event.source.postMessage({
          action: 'subscription',
          hasSubscription: !!subscription,
          endpoint: subscription?.endpoint || null
        });
      })
      .catch((err) => {
        console.error('[SW] Error getting subscription:', err);
      });
  }
});

// ============================================
// LOG THE SW STATE ON STARTUP
// ============================================

console.log('[SW] ✅ Service worker initialized');
console.log('[SW] Registration ID:', self.registration?.id || 'unknown');
console.log('[SW] Scope:', self.registration?.scope || 'unknown');
console.log('[SW] Push manager support:', !!self.registration?.pushManager);