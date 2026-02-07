declare module 'web-push' {
  interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface RequestOptions {
    headers?: Record<string, string>;
    timeout?: number;
    proxy?: string;
  }

  interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): Promise<SendResult>;

  function generateVAPIDKeys(): VapidKeys;

  export {
    PushSubscription,
    RequestOptions,
    SendResult,
    VapidKeys,
    setVapidDetails,
    sendNotification,
    generateVAPIDKeys,
  };

  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
    generateVAPIDKeys: typeof generateVAPIDKeys;
  };

  export default webpush;
}
