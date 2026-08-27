import baseURL from '../Components/Modules/ApiUrl/NodeBaseURL2';

function urlBase64ToUint8Array(base64String) {
  console.log('🔑 Converting VAPID key to Uint8Array...');
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const arr = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  console.log(`✅ VAPID key converted: ${arr.length} bytes`);
  return arr;
}

export async function setupPushNotifications(userId, userType = 'customer') {
  console.log(`🔔 ====== SETTING UP PUSH NOTIFICATIONS ======`);
  console.log(`🔔 User: ${userType} ${userId}`);
  console.log(`🔔 Timestamp: ${new Date().toISOString()}`);

  // Check browser support
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported in this browser');
    return { success: false, reason: 'SW not supported' };
  }
  if (!('PushManager' in window)) {
    console.warn('⚠️ Push Manager not supported in this browser');
    return { success: false, reason: 'Push not supported' };
  }

  try {
    // STEP 1: Get current Notification permission
    console.log('📝 Current Notification.permission:', Notification.permission);
    
    if (Notification.permission === 'denied') {
      console.warn('⚠️ Notification permission already denied. User must re-enable in browser settings.');
      return { success: false, reason: 'Permission denied' };
    }

    // STEP 2: Request permission if needed
    let permission = Notification.permission;
    if (permission !== 'granted') {
      console.log('📝 Requesting notification permission...');
      permission = await Notification.requestPermission();
      console.log(`📝 Permission result: ${permission}`);
    }

    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return { success: false, reason: 'Permission not granted' };
    }

    // STEP 3: List all existing service workers
    const allRegistrations = await navigator.serviceWorker.getRegistrations();
    console.log(`🧭 Found ${allRegistrations.length} existing SW registration(s):`);
    allRegistrations.forEach((reg, idx) => {
      console.log(`  [${idx}] scope: ${reg.scope}`);
      console.log(`      active: ${reg.active?.scriptURL || 'none'}`);
      console.log(`      waiting: ${reg.waiting?.scriptURL || 'none'}`);
      console.log(`      installing: ${reg.installing?.scriptURL || 'none'}`);
    });

    // STEP 4: Unregister conflicting service workers
    for (const reg of allRegistrations) {
      const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
      if (scriptURL && !scriptURL.includes('service-worker-push.js')) {
        console.warn(`🗑️ Unregistering conflicting service worker: ${scriptURL}`);
        await reg.unregister();
        console.log(`✅ Unregistered: ${scriptURL}`);
      }
    }

    // STEP 5: Register our service worker
    console.log('📝 Registering service-worker-push.js...');
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/service-worker-push.js');
      console.log(`✅ Service Worker registered successfully`);
      console.log(`   Scope: ${registration.scope}`);
      console.log(`   Active: ${registration.active?.scriptURL || 'none'}`);
    } catch (regError) {
      console.error('❌ Service Worker registration failed:', regError);
      return { success: false, reason: 'SW registration failed', error: regError };
    }

    // STEP 6: Wait for service worker to be ready
    console.log('📝 Waiting for service worker to be ready...');
    await navigator.serviceWorker.ready;
    console.log(`✅ Service Worker ready`);
    console.log(`   Controller: ${navigator.serviceWorker.controller?.scriptURL || 'none'}`);

    // STEP 7: Get VAPID public key from server
    console.log(`📝 Fetching VAPID public key from ${baseURL}/api/push/vapid-public-key...`);
    let keyResponse;
    try {
      keyResponse = await fetch(`${baseURL}/api/push/vapid-public-key`, {
        headers: { 'Accept': 'application/json' }
      });
    } catch (fetchError) {
      console.error('❌ Failed to fetch VAPID key:', fetchError);
      return { success: false, reason: 'VAPID key fetch failed', error: fetchError };
    }

    if (!keyResponse.ok) {
      console.error(`❌ VAPID key request failed: ${keyResponse.status} ${keyResponse.statusText}`);
      return { success: false, reason: `VAPID key HTTP ${keyResponse.status}` };
    }

    const keyData = await keyResponse.json();
    console.log('✅ VAPID public key received from server');
    console.log(`   Key length: ${keyData.publicKey?.length || 0}`);

    if (!keyData.publicKey) {
      console.error('❌ No public key in response:', keyData);
      return { success: false, reason: 'No public key in response' };
    }

    // STEP 8: Get existing subscription
    console.log('📝 Checking for existing push subscription...');
    let subscription = await registration.pushManager.getSubscription();
    console.log(`📝 Existing subscription: ${subscription ? 'YES' : 'NO'}`);
    
    if (subscription) {
      console.log(`   Endpoint: ${subscription.endpoint.substring(0, 60)}...`);
      console.log(`   VAPID key in subscription: ${subscription.options?.applicationServerKey ? 'present' : 'missing'}`);
    }

    // STEP 9: Create new subscription if needed
    if (!subscription) {
      console.log('📝 Creating new push subscription...');
      
      // Convert the VAPID key
      let applicationServerKey;
      try {
        applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
        console.log(`✅ VAPID key converted: ${applicationServerKey.length} bytes`);
      } catch (keyError) {
        console.error('❌ Failed to convert VAPID key:', keyError);
        return { success: false, reason: 'VAPID key conversion failed', error: keyError };
      }

      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        console.log(`✅ Push subscription created successfully`);
        console.log(`   Endpoint: ${subscription.endpoint.substring(0, 60)}...`);
      } catch (subError) {
        console.error('❌ Push subscription failed:', subError);
        return { success: false, reason: 'Subscription creation failed', error: subError };
      }
    } else {
      console.log('✅ Using existing push subscription');
    }

    // STEP 10: Save subscription to server
    console.log(`📝 Saving subscription to server (${baseURL}/api/push/subscribe)...`);
    const subscriptionData = subscription.toJSON ? subscription.toJSON() : subscription;
    
    let saveResponse;
    try {
      saveResponse = await fetch(`${baseURL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId.toString(),
          user_type: userType,
          subscription: subscriptionData
        })
      });
    } catch (saveError) {
      console.error('❌ Failed to save subscription:', saveError);
      return { success: false, reason: 'Subscription save failed', error: saveError };
    }

    if (!saveResponse.ok) {
      console.error(`❌ Save subscription HTTP error: ${saveResponse.status}`);
      const errText = await saveResponse.text();
      console.error(`   Response: ${errText}`);
      return { success: false, reason: `Save HTTP ${saveResponse.status}` };
    }

    const saveResult = await saveResponse.json();
    console.log(`✅ Subscription saved to server:`, saveResult);

    // STEP 11: Verify subscription count
    try {
      // Send a test notification to verify
      console.log('📝 Sending test notification to verify push works...');
      const testResponse = await fetch(`${baseURL}/api/push/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId.toString(),
          user_type: userType,
          title: '✅ Push Notification Test',
          body: 'Your push notifications are working!',
          url: '/customer-dashboard'
        })
      });
      
      if (testResponse.ok) {
        console.log('✅ Test notification sent successfully');
      } else {
        console.warn(`⚠️ Test notification failed: ${testResponse.status}`);
      }
    } catch (testError) {
      console.warn('⚠️ Test notification error (non-critical):', testError.message);
    }

    console.log(`✅ ====== PUSH SETUP COMPLETE ======`);
    return { success: true, subscription: subscription };
    
  } catch (error) {
    console.error('❌ Push setup error:', error);
    console.error('   Stack:', error.stack);
    return { success: false, reason: 'Setup error', error: error };
  }
}

export async function sendTestNotification(userId, userType = 'customer') {
  console.log(`🔔 Sending test notification to ${userType} ${userId}`);
  try {
    const response = await fetch(`${baseURL}/api/push/test-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId.toString(),
        user_type: userType,
        title: '🔔 Test Notification',
        body: 'This is a test notification from Jiyaa Jewels',
        url: '/customer-dashboard'
      })
    });
    
    const result = await response.json();
    console.log('📝 Test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Test notification error:', error);
    return { success: false, error: error.message };
  }
}