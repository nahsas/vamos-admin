
'use client';

import { useOrderNotification } from '@/hooks/use-order-notification.tsx';

/**
 * This is a client-side component that activates the order notification
 * polling system. It doesn't render any UI itself.
 */
export function OrderNotifier() {
  useOrderNotification();
  return null;
}
