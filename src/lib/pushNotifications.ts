// Push Notification utilities for Oscorp

const SW_PATH = '/sw.js';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

async function getVapidPublicKey(): Promise<string> {
  const response = await fetch('/api/push/vapid-public-key');
  const data = await response.json();
  return data.publicKey;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    const p256dh = btoa(
      String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
    );
    const auth = btoa(
      String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
    );

    const token = localStorage.getItem('oscorp-token');
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint, p256dh, auth }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const token = localStorage.getItem('oscorp-token');
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

export async function isSubscribedToPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
