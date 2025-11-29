
'use client';

import { Order, MenuItem } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusConfig: {
  [key: string]: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
  };
} = {
  pending: { variant: 'secondary', label: 'Pending' },
  diproses: { variant: 'default', label: 'Processing' },
  selesai: { variant: 'outline', label: 'Completed' },
  dibatalkan: { variant: 'destructive', label: 'Cancelled' },
};

export function OrderCard({ order, menuItems }: { order: Order; menuItems: MenuItem[] }) {
  const statusInfo = statusConfig[order.status.toLowerCase()] || statusConfig.pending;

  const getMenuName = (menuId: number) => {
    const menuItem = menuItems.find((item) => item.id === menuId);
    return menuItem ? menuItem.nama : 'Unknown Item';
  };

  return (
    <Card className={cn("shadow-md border-l-4", order.status.toLowerCase() === 'pending' ? 'border-yellow-400' : 'border-blue-500')}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">
              {order.location_type === 'DINE_IN' ? `Meja ${order.no_meja}` : order.no_meja}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
              {order.location_area && (
                 <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">{order.location_area}</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(new Date(order.created_at), "HH:mm")}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.id}
            </p>
          </div>
        </div>

        <div className="border-t border-dashed pt-3">
           <div className="flex justify-between items-center text-sm font-medium mb-2">
            <h4>Detail Pesanan</h4>
            <span className="text-muted-foreground">
                {order.detail_pesanans.reduce((acc, item) => acc + item.jumlah, 0)} item
            </span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {order.detail_pesanans.slice(0, 2).map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{getMenuName(item.menu_id)}</span>
                <span>x {item.jumlah}</span>
              </div>
            ))}
            {order.detail_pesanans.length > 2 && (
              <div className="text-center text-xs text-primary pt-2">
                + {order.detail_pesanans.length - 2} menu lainnya...
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-base">
              Rp {parseInt(order.total, 10).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
