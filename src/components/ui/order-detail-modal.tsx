
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order, MenuItem } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  X,
  Trash2,
  List,
  Utensils,
  MapPin,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

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

export function OrderDetailModal({
  order,
  open,
  onOpenChange,
  menuItems,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: MenuItem[];
}) {

  React.useEffect(() => {
    if (!open) {
      // Optional: Add any cleanup logic when modal closes
    }
  }, [open]);

  const getMenuDetails = (menuId: number) => {
    return menuItems.find((item) => item.id === menuId);
  };
  
  const totalItems = order?.detail_pesanans.reduce((sum, item) => sum + item.jumlah, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        {!order && <div className="p-8 text-center">No order selected.</div>}
        {order && (
          <>
            <DialogHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex justify-between items-center">
                <DialogTitle>
                  Detail Pesanan{' '}
                  {order.location_type.toLowerCase() === 'dine_in'
                    ? `Meja ${order.no_meja}`
                    : order.no_meja}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive-foreground/70 hover:text-destructive-foreground hover:bg-destructive-foreground/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <button onClick={() => onOpenChange(false)} className="text-destructive-foreground/70 hover:text-destructive-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm pt-2">
                <Badge variant="secondary">
                  {format(new Date(order.created_at), 'HH:mm - dd MMM yyyy', {
                    locale: id,
                  })}
                </Badge>
                <Badge
                  className={cn(statusConfig[order.status.toLowerCase()]?.color)}
                >
                  {statusConfig[order.status.toLowerCase()]?.label}
                </Badge>
                {order.location_area && (
                  <Badge variant="outline" className="bg-white/20 border-white/50 text-white">
                    <MapPin className="mr-1 h-3 w-3" />
                    {order.location_area}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-yellow-400 pb-2 mb-4">
                    <List className="text-primary h-5 w-5" />
                    <h3 className="text-lg font-semibold">Detail Menu Pesanan</h3>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                    {order.detail_pesanans.map((item) => {
                    const menuItem = getMenuDetails(item.menu_id);
                    return (
                        <div key={item.id} className="bg-slate-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold flex items-center gap-2">
                                        {menuItem?.nama || 'Nama tidak ditemukan'}{' '}
                                        <Utensils className="w-4 h-4 text-amber-600" />
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                                        {item.varian && <Badge variant="secondary" className="text-xs">{item.varian}</Badge>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">x {item.jumlah}</p>
                                    <p className="font-bold text-lg text-primary">
                                        Rp{' '}
                                        {parseInt(item.subtotal, 10).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                                <div className="mt-2 pt-2 border-t border-dashed text-sm text-muted-foreground flex items-start gap-2">
                                   <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                                   <span>{item.note}</span>
                                </div>
                             <div className="text-sm mt-2 pt-2 border-t border-dashed">
                                 <div className="flex justify-between">
                                     <span>Harga satuan:</span>
                                     <span>Rp {item.base_price.toLocaleString('id-ID')}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>Subtotal ({item.jumlah}x):</span>
                                     <span>Rp {parseInt(item.subtotal, 10).toLocaleString('id-ID')}</span>
                                 </div>
                             </div>
                        </div>
                    );
                    })}
                </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t rounded-b-lg space-y-4">
                <div className="w-full flex justify-between items-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Pembayaran:</p>
                        <p className="text-2xl font-bold">Rp {parseInt(order.total, 10).toLocaleString('id-ID')}</p>
                    </div>
                     <p className="text-sm text-muted-foreground">{totalItems} item</p>
                </div>
                <div className="w-full grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => onOpenChange(false)} className="bg-slate-600 text-white hover:bg-slate-700">
                        <X className="mr-2 h-4 w-4" /> Tutup
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Proses <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
