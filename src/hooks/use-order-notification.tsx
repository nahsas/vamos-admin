
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { appEventEmitter } from '@/lib/event-emitter';

export function useOrderNotification() {
  const [lastKnownOrders, setLastKnownOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const isFirstLoad = useRef(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.preload = 'auto';
    }
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    try {
      const response = await fetch('https://vamos-api-v2.sejadikopi.com/api/orders?status=pending,process&with=items,items.menu');
      if (!response.ok) {
        throw new Error('Failed to fetch active orders');
      }
      
      if (fetchError) {
          setFetchError(null);
      }

      const { data: activeOrders }: { data: Order[] } = await response.json();
      
      if (!activeOrders) return;

      if (isFirstLoad.current) {
        setLastKnownOrders(activeOrders);
        isFirstLoad.current = false;
        return;
      }
      
      const newOrderNotifications: Order[] = [];
      const updatedOrderNotifications: Order[] = [];

      for (const newOrder of activeOrders) {
          const oldOrder = lastKnownOrders.find(o => o.id === newOrder.id);

          if (!oldOrder) {
              newOrderNotifications.push(newOrder);
          } else {
              const oldUnprintedCount = oldOrder.items?.filter(item => !item.is_printed).length ?? 0;
              const newUnprintedCount = newOrder.items?.filter(item => !item.is_printed).length ?? 0;
              
              if (newUnprintedCount > oldUnprintedCount) {
                  updatedOrderNotifications.push(newOrder);
              }
          }
      }

      const hasNewActivity = newOrderNotifications.length > 0 || updatedOrderNotifications.length > 0;

      if (hasNewActivity) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(error => {
            console.log("Audio playback failed, user may need to interact with the page first.", error);
          });
        }
        
        newOrderNotifications.forEach(order => {
            const customer = order.order_type.toLowerCase() === 'dine-in' ? `Meja ${order.identifier}`: order.identifier;
            toast({
                title: '🔔 Pesanan Baru Diterima!',
                description: `Pesanan baru dari ${customer} telah diterima.`,
                action: (
                    <Button onClick={() => router.push('/orders')} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        Lihat Pesanan
                    </Button>
                ),
                duration: 10000,
            });
        });

        updatedOrderNotifications.forEach(order => {
            const customer = order.order_type.toLowerCase() === 'dine-in' ? `Meja ${order.identifier}`: order.identifier;
            toast({
                title: '🔔 Item Baru Ditambahkan!',
                description: `Item baru ditambahkan ke pesanan ${customer}.`,
                action: (
                    <Button onClick={() => router.push('/orders')} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        Lihat Pesanan
                    </Button>
                ),
                duration: 10000,
            });
        });
        
        appEventEmitter.emit('new-order');
      }
      setLastKnownOrders(activeOrders);

    } catch (error) {
      console.error('Error fetching active orders:', error);
      if (!fetchError) {
          const errorMessage = 'Could not connect to server to check for new orders. Please check your network connection.';
          setFetchError(errorMessage);
          toast({
              variant: "destructive",
              title: "Network Error",
              description: errorMessage,
              duration: 8000,
          });
      }
    }
  }, [lastKnownOrders, toast, router, fetchError]);

  useEffect(() => {
    fetchActiveOrders(); // Fetch immediately on mount
    const interval = setInterval(fetchActiveOrders, 3000); 
    return () => clearInterval(interval);
  }, [fetchActiveOrders]);
}
