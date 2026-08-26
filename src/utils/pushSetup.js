import baseURL from '../Components/Modules/ApiUrl/NodeBaseURL2';


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function setupPushNotifications(userId, userType = 'customer') {
  console.log(`🔔 Setting up push notifications for ${userType} ${userId}`);

  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported');
    return;
  }

  if (!('PushManager' in window)) {
    console.warn('⚠️ Push Manager not supported');
    return;
  }

  try {
    // Register service worker
    console.log('📝 Registering service worker...');
    const registration = await navigator.serviceWorker.register('/service-worker-push.js');
    console.log('✅ Service Worker registered');

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');

    // Request permission
    console.log('📝 Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('📝 Notification permission:', permission);

    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied');
      return;
    }

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('📝 Creating new push subscription...');
      
      const response = await fetch(`${baseURL}/api/push/vapid-public-key`);
      if (!response.ok) {
        throw new Error(`Failed to get VAPID key: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ VAPID public key received');
      
      if (!data.publicKey) {
        throw new Error('No public key received from server');
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      });
      
      console.log('✅ Push subscription created');
    } else {
      console.log('✅ Using existing push subscription');
    }

    // Save subscription to server
    console.log('📝 Saving subscription to server...');
    const saveResponse = await fetch(`${baseURL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId.toString(), 
        user_type: userType, 
        subscription 
      })
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save subscription: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    
    if (result.success) {
      console.log(`✅ Push notifications set up successfully for ${userType} ${userId}`);
    } else {
      console.warn('⚠️ Subscription saved but server returned:', result);
    }
  } catch (error) {
    console.error('❌ Error setting up push notifications:', error);
  }
}