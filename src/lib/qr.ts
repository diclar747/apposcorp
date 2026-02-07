export interface QRPaymentData {
  toUserId: string;
  recipientName: string;
  amount?: number;
}

export function parseQRCode(raw: string): QRPaymentData | null {
  // URL scheme format: oscorp://pay?user=...&name=...&amount=...
  if (raw.startsWith('oscorp://pay')) {
    try {
      const url = new URL(raw.replace('oscorp://', 'https://oscorp.app/'));
      const userId = url.searchParams.get('user');
      const name = url.searchParams.get('name');
      const amountStr = url.searchParams.get('amount');
      if (!userId) return null;
      return {
        toUserId: userId,
        recipientName: name ? decodeURIComponent(name) : 'Usuario',
        amount: amountStr ? parseFloat(amountStr) : undefined,
      };
    } catch {
      return null;
    }
  }

  // Legacy JSON format: { type: 'payment', toUserId, amount, storeName }
  try {
    const data = JSON.parse(raw);
    if (data.type === 'payment' && data.toUserId) {
      return {
        toUserId: data.toUserId,
        recipientName: data.storeName || 'Usuario',
        amount: data.amount || undefined,
      };
    }
  } catch { /* not JSON */ }

  return null;
}

export function generateQRValue(userId: string, userName: string, amount?: number): string {
  const params = new URLSearchParams({ user: userId, name: userName });
  if (amount !== undefined && amount > 0) {
    params.set('amount', amount.toString());
  }
  return `oscorp://pay?${params.toString()}`;
}
