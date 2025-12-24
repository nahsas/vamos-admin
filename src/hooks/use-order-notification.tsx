
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
  const [fetchError, setFetchError] = useState<string | null>(null);


  // This effect runs only once on the client to initialize the audio object.
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.preload = 'auto'; // Preload the audio file
    }
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    try {
      const response = await fetch('https://vamos-api-v2.sejadikopi.com/api/orders?status=pending,process&with=items');
      if (!response.ok) {
        throw new Error('Failed to fetch active orders');
      }
      // If fetch is successful, clear any previous error
      if (fetchError) {
          setFetchError(null);
      }
      const { data: activeOrders }: { data: Order[] } = await response.json();

      if (!activeOrders) {
        return;
      }
      
      const currentOrdersState = new Map(activeOrders.map(order => [order.id, order.items?.length ?? 0]));

      if (isFirstLoad.current) {
        setLastKnownOrdersState(currentOrdersState);
        isFirstLoad.current = false;
        return;
      }
      
      const newOrders: Order[] = [];
      const updatedOrders: Order[] = [];

      for (const order of activeOrders) {
          const lastItemCount = lastKnownOrdersState.get(order.id);
          const currentItemCount = order.items?.length ?? 0;

          // Case 1: A completely new order has arrived.
          if (lastItemCount === undefined) {
              newOrders.push(order);
          } 
          // Case 2: An existing order has new items added.
          else if (currentItemCount > lastItemCount) {
              updatedOrders.push(order);
          }
      }

      const hasNewActivity = newOrders.length > 0 || updatedOrders.length > 0;

      if (hasNewActivity) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(error => {
            console.log("Audio playback failed, user may need to interact with the page first.", error);
          });
        }
        
        // Handle new orders
        newOrders.forEach(order => {
            const customer = order.order_type.toLowerCase() === 'dine_in' ? `Meja ${order.identifier}`: order.identifier;
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

        // Handle updated orders
        updatedOrders.forEach(order => {
            const customer = order.order_type.toLowerCase() === 'dine_in' ? `Meja ${order.identifier}`: order.identifier;
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
        setLastKnownOrdersState(currentOrdersState);
      } else if (currentOrdersState.size !== lastKnownOrdersState.size) {
        // This handles cases where orders were completed/cancelled elsewhere.
        setLastKnownOrdersState(currentOrdersState);
      }

    } catch (error) {
      console.error('Error fetching active orders:', error);
      // Only show the toast if it's a new error
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
  }, [lastKnownOrdersState, toast, router, fetchError]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveOrders();
    }, 3000); // Poll every 3 seconds

    // Fetch once on mount
    fetchActiveOrders();

    return () => clearInterval(interval);
  }, [fetchActiveOrders]);
}
