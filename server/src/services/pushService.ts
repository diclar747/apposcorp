import webpush from 'web-push';
import { prisma } from '../utils/prisma.js';

const OSCORP_ICON = 'https://www.oscorp.com.py/assets/images/logos/logo2.png';

// Initialize VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@oscorp.com.py',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  // 1. Create persistent notification in DB
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: payload.title,
        message: payload.body,
        type: payload.tag === 'deposit-approved' ? 'success' : 
              payload.tag === 'deposit-rejected' ? 'error' : 
              'info',
        actionUrl: payload.url,
        imageUrl: payload.image || payload.icon,
      }
    });
  } catch (error) {
    console.error('[DB NOTIFICATION ERROR] Error creating notification:', error);
  }

  // 2. Send Web Push
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, isActive: true },
  });

  if (subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || OSCORP_ICON,
    badge: payload.badge || '/icons/icon-192x192.png',
    image: payload.image,
    url: payload.url || '/',
    tag: payload.tag || 'oscorp',
    data: payload.data,
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushPayload
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Silent cleanup of expired/gone subscriptions
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint },
          }).catch(() => {}); // Secondary catch to prevent errors if already deleted
        }
      }
    })
  );
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload))
  );
}

export async function sendPushToRole(role: string | null, payload: PushPayload) {
  const where: any = {};
  if (role && role !== 'all') {
    where.role = role;
  }
  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });
  await sendPushToUsers(
    users.map((u) => u.id),
    payload
  );
}
