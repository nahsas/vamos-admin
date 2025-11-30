
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function useOrderNotification() {
  const [lastKnownOrderIds, setLastKnownOrderIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Initialize Audio object on the client side
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await fetch('https://api.sejadikopi.com/api/pesanans?status=pending');
      if (!response.ok) {
        // Silently fail, no need to bother user with failed polling.
        console.error('Failed to fetch pending orders');
        return;
      }
      const { data: pendingOrders }: { data: Order[] } = await response.json();

      if (!pendingOrders || pendingOrders.length === 0) {
        if (isFirstLoad.current) {
            setLastKnownOrderIds(new Set());
            isFirstLoad.current = false;
        }
        return;
      }
      
      const currentOrderIds = new Set(pendingOrders.map(order => order.id));

      if (isFirstLoad.current) {
        setLastKnownOrderIds(currentOrderIds);
        isFirstLoad.current = false;
        return;
      }

      const newOrderIds = [...currentOrderIds].filter(id => !lastKnownOrderIds.has(id));

      if (newOrderIds.length > 0) {
        if (audioRef.current) {
          audioRef.current.play().catch(error => console.error("Audio play failed:", error));
        }
        
        const newOrders = pendingOrders.filter(order => newOrderIds.includes(order.id));

        newOrders.forEach(newOrder => {
            const customer = newOrder.location_type === 'DINE-IN' ? `Meja ${newOrder.no_meja}`: newOrder.no_meja;
            toast({
                title: '🔔 Pesanan Baru Diterima!',
                description: `Pesanan baru dari ${customer} telah diterima.`,
                action: (
                    <Button onClick={() => router.push('/orders')} size="sm">
                        Lihat Pesanan
                    </Button>
                ),
                duration: 10000,
            });
        });

        setLastKnownOrderIds(currentOrderIds);
      } else if (currentOrderIds.size < lastKnownOrderIds.size) {
        // Also update if orders were processed/cancelled elsewhere
        setLastKnownOrderIds(currentOrderIds);
      }

    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  }, [lastKnownOrderIds, toast, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingOrders();
    }, 15000); // Poll every 15 seconds

    // Fetch once on mount
    fetchPendingOrders();

    return () => clearInterval(interval);
  }, [fetchPendingOrders]);
}
