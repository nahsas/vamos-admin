
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { appEventEmitter } from '@/lib/event-emitter';

export function useOrderNotification() {
  const [lastKnownOrdersState, setLastKnownOrdersState] = useState<Map<number, number>>(new Map());
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const isFirstLoad = useRef(true);

  // This effect runs only once on the client to initialize the audio object.
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.preload = 'auto'; // Preload the audio file
    }

    // Function to unlock audio on first user interaction
    const unlockAudio = () => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            // Remove the listener after the first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };

  }, []);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await fetch('https://api.sejadikopi.com/api/pesanans?status=pending');
      if (!response.ok) {
        console.error('Failed to fetch pending orders');
        return;
      }
      const { data: pendingOrders }: { data: Order[] } = await response.json();

      if (!pendingOrders) {
        return;
      }
      
      const currentOrdersState = new Map(pendingOrders.map(order => [order.id, order.detail_pesanans.length]));

      if (isFirstLoad.current) {
        setLastKnownOrdersState(currentOrdersState);
        isFirstLoad.current = false;
        return;
      }
      
      let hasNewActivity = false;
      const ordersWithNewActivity: Order[] = [];

      for (const order of pendingOrders) {
          const lastItemCount = lastKnownOrdersState.get(order.id);
          const currentItemCount = order.detail_pesanans.length;

          // Case 1: A completely new order has arrived.
          if (lastItemCount === undefined) {
              hasNewActivity = true;
              ordersWithNewActivity.push(order);
          } 
          // Case 2: An existing order has new items added.
          else if (currentItemCount > lastItemCount) {
              hasNewActivity = true;
              ordersWithNewActivity.push(order);
          }
      }


      if (hasNewActivity) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(error => {
            console.log("Audio playback failed, user may need to interact with the page first.", error);
          });
        }
        
        ordersWithNewActivity.forEach(newOrder => {
            const customer = newOrder.location_type.toLowerCase() === 'dine_in' ? `Meja ${newOrder.no_meja}`: newOrder.no_meja;
            const title = lastKnownOrdersState.has(newOrder.id) ? '🔔 Item Baru Ditambahkan!' : '🔔 Pesanan Baru Diterima!';
            const description = lastKnownOrdersState.has(newOrder.id) ? `Item baru ditambahkan ke pesanan ${customer}.` : `Pesanan baru dari ${customer} telah diterima.`;

            toast({
                title: title,
                description: description,
                action: (
                    <Button onClick={() => router.push('/orders')} size="sm">
                        Lihat Pesanan
                    </Button>
                ),
                duration: 10000,
            });
        });
        
        appEventEmitter.emit('new-order');
        setLastKnownOrdersState(currentOrdersState);
      } else if (currentOrdersState.size !== lastKnownOrdersState.size) {
        // This handles cases where orders were completed/cancelled elsewhere.
        setLastKnownOrdersState(currentOrdersState);
      }

    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  }, [lastKnownOrdersState, toast, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingOrders();
    }, 3000); // Poll every 3 seconds

    // Fetch once on mount
    fetchPendingOrders();

    return () => clearInterval(interval);
  }, [fetchPendingOrders]);
}
