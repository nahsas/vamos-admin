
'use client';

import { Order, MenuItem } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';


const statusConfig: {
  [key: string]: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    color: string;
  };
} = {
  pending: { variant: 'secondary', label: 'Tertunda', color: 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' },
  diproses: { variant: 'default', label: 'Diproses', color: 'bg-blue-500 text-white' },
  selesai: { variant: 'outline', label: 'Selesai', color: 'bg-green-500 text-white' },
  dibatalkan: { variant: 'destructive', label: 'Dibatalkan', color: 'bg-red-500 text-white' },
};

export function OrderCard({ order, menuItems }: { order: Order; menuItems: MenuItem[] }) {
  const router = useRouter();
  const statusInfo = statusConfig[order.status.toLowerCase()] || statusConfig.pending;

  const getMenuName = (menuId: number) => {
    const menuItem = menuItems.find((item) => item.id === menuId);
    return menuItem ? menuItem.nama : 'Item Tidak Dikenal';
  };
  
  const handleRedirect = () => {
    router.push('/orders');
  }
  
  const isPending = order.status.toLowerCase() === 'pending';

  const borderGradientClass = isPending
    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
    : 'bg-gradient-to-br from-purple-600 to-blue-600';


  return (
    <div className={cn("p-0.5 rounded-xl", borderGradientClass)}>
      <Card className="shadow-md rounded-lg h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex-grow space-y-3">
              <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-lg font-bold">
                  {order.location_type.toLowerCase() === 'dine_in' ? `Meja ${order.no_meja}` : order.no_meja}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(
                      statusInfo.color,
                      !isPending && 'bg-gradient-to-r from-purple-600 to-blue-600'
                    )}>
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
                  {format(new Date(order.created_at), "dd MMM yyyy", { locale: id})}
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
                  <span className="text-muted-foreground">Total Pembayaran:</span>
                  <span className="font-bold text-base">
                  Rp {parseInt(order.total, 10).toLocaleString('id-ID')}
                  </span>
              </div>
              </div>
          </div>
          <div className="mt-4">
              <Button 
                onClick={handleRedirect} 
                className={cn(
                  "w-full",
                  isPending 
                    ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 hover:from-yellow-500 hover:to-amber-600"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                )}
              >
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
