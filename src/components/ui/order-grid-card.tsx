
'use client';

import { Order, MenuItem } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, FileText, Info, ArrowRight } from 'lucide-react';
import { Separator } from './separator';

const statusConfig: {
  [key: string]: {
    label: string;
    color: string;
  };
} = {
  pending: { label: 'PENDING', color: 'bg-yellow-400 text-yellow-900' },
  diproses: { label: 'PROSES', color: 'bg-blue-500 text-white' },
  selesai: { label: 'SELESAI', color: 'bg-green-500 text-white' },
  dibatalkan: { label: 'BATAL', color: 'bg-red-500 text-white' },
};

export function OrderGridCard({ order, menuItems }: { order: Order; menuItems: MenuItem[] }) {
  const statusInfo = statusConfig[order.status.toLowerCase()] || statusConfig.pending;

  const getMenuName = (menuId: number) => {
    const menuItem = menuItems.find((item) => item.id === menuId);
    return menuItem ? menuItem.nama : 'Unknown Item';
  };

  const totalItems = order.detail_pesanans.reduce((acc, item) => acc + item.jumlah, 0);

  return (
    <Card className={cn("shadow-lg border-2", order.status.toLowerCase() === 'pending' ? 'border-yellow-400' : 'border-blue-500')}>
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-grow space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {order.location_type.toLowerCase() === 'dine_in' ? `Meja ${order.no_meja}` : order.no_meja}
                <Badge className={cn("text-xs font-bold", statusInfo.color)}>{statusInfo.label}</Badge>
              </h3>
               {order.location_area && (
                <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-700 border-blue-300">
                  <MapPin className="mr-1 h-3 w-3" />
                  {order.location_area}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {format(new Date(order.created_at), "HH:mm")}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "dd MMM yyyy", { locale: id })}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <h4>Detail Pesanan</h4>
              <span className="text-muted-foreground">{totalItems} menu</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {order.detail_pesanans.slice(0, 2).map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <span>{getMenuName(item.menu_id)}</span>
                     {item.varian && <Badge variant="outline" className="text-xs bg-gray-200">{item.varian}</Badge>}
                  </div>
                  <span>x {item.jumlah}</span>
                </div>
              ))}
              {order.detail_pesanans.length > 2 && (
                <div className="text-center text-xs text-primary pt-1">
                  + {order.detail_pesanans.length - 2} menu lainnya...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Total Pembayaran:</span>
            <span className="font-bold text-xl">
              Rp {parseInt(order.total, 10).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold col-span-1">
              <FileText className="mr-2 h-4 w-4" />
              Checker
            </Button>
            <Button variant="secondary" className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold col-span-1">
              <Info className="mr-2 h-4 w-4" />
              Detail
            </Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold col-span-1">
              Proses <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    