// Oscorp Service Worker - Push Notifications
// Version: 1.0.2 - Updated: 2026-07-29

const OSCORP_ICON = '/icons/icon-192x192.png';
const OSCORP_BADGE = '/icons/icon-96x96.png';

// Listen for push events
self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Oscorp',
      body: event.data ? event.data.text() : 'Tienes una nueva notificacion',
    };
  }

  const title = data.title || 'Oscorp';
  const options = {
    body: data.body || '',
    icon: data.icon || OSCORP_ICON,
    badge: data.badge || OSCORP_BADGE,
    image: data.image || undefined,
    tag: data.tag || 'oscorp-notification',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
    },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Notify all open tabs to refresh notifications
      return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        windowClients.forEach((client) => client.postMessage({ type: 'NEW_NOTIFICATION' }));
      });
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Install - skip waiting
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate - claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
