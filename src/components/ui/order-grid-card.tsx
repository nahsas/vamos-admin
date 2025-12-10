
'use client';

import { Order, MenuItem, Additional } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, FileText, Info, ArrowRight, Wallet, Bell, Printer } from 'lucide-react';
import { printKitchenStruk, printMainCheckerStruk } from '@/lib/print-utils';
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

export function OrderGridCard({ order, menuItems, onDetailClick, onUpdateStatus, onPaymentClick }: { order: Order; menuItems: MenuItem[], onDetailClick: (order: Order) => void; onUpdateStatus: (order: Order) => void; onPaymentClick: (order: Order) => void; }) {
  const statusInfo = statusConfig[order.status.toLowerCase()] || statusConfig.pending;
  const isProcessing = order.status.toLowerCase() === 'diproses';
  
  const [additionals, setAdditionals] = React.useState<Additional[]>([]);

  React.useEffect(() => {
    fetch('https://vamos-api.sejadikopi.com/api/additionals')
      .then(res => res.json())
      .then(data => setAdditionals(data.data || []));
  }, []);

  const hasNewItems = order.detail_pesanans.some(item => item.printed === 0);

  const getMenuName = (menuId: number) => {
    const menuItem = menuItems.find((item) => item.id === menuId);
    return menuItem ? menuItem.nama : 'Item Tidak Dikenal';
  };

  const totalItems = order.detail_pesanans.reduce((acc, item) => acc + item.jumlah, 0);
  
  const handleActionClick = () => {
    if (isProcessing) {
      onPaymentClick(order);
    } else {
      onUpdateStatus(order);
    }
  }

  const handleKitchenPrint = () => {
    printKitchenStruk(order, menuItems, additionals);
  };

  const handleMainCheckerPrint = () => {
    printMainCheckerStruk(order, menuItems, additionals);
  }


  return (
    <>
    <Card className={cn("shadow-lg border-2 rounded-xl", order.status.toLowerCase() === 'pending' ? 'border-yellow-400' : 'border-blue-500')}>
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-grow space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">
                  {order.location_type.toLowerCase() === 'dine-in' ? `Meja ${order.no_meja}` : order.no_meja}
                </h3>
                {hasNewItems && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
                    <Bell className="w-2.5 h-2.5 mr-1"/>
                    BARU
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs font-bold", statusInfo.color)}>{statusInfo.label}</Badge>
                {order.location_area && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    <MapPin className="mr-1 h-3 w-3" />
                    {order.location_area}
                  </Badge>
                )}
              </div>
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
                     <span className="truncate">{getMenuName(item.menu_id)}</span>
                     {item.varian && (
                        <Badge
                            className={cn(
                            "text-xs text-white",
                            item.varian.toLowerCase() === 'hot' ? 'bg-red-500' : 'bg-blue-500'
                            )}
                        >
                            {item.varian}
                        </Badge>
                    )}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!hasNewItems} size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-1 py-1 flex items-center justify-center gap-1">
                    <FileText className="h-3 w-3" />
                    Checker
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pilih Tipe Checker</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pilih checker yang ingin Anda cetak untuk item baru.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="!flex-col !items-stretch gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <AlertDialogAction onClick={handleKitchenPrint} className="w-full">Checker Dapur</AlertDialogAction>
                        <AlertDialogAction onClick={handleMainCheckerPrint} className="w-full">Main Checker</AlertDialogAction>
                    </div>
                    <AlertDialogCancel className="w-full mt-0">Batal</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" variant="secondary" className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-1 py-1 flex items-center justify-center gap-1" onClick={() => onDetailClick(order)}>
              <Info className="h-3 w-3" />
              Detail
            </Button>
            <Button 
                size="sm" 
                className={cn(
                    "w-full text-white font-bold text-xs px-1 py-1 flex items-center justify-center gap-1",
                    isProcessing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                )} 
                onClick={handleActionClick}
            >
              {isProcessing ? (
                <>
                    <Wallet className="h-3 w-3" />
                    Bayar
                </>
              ) : (
                <>
                    Proses
                    <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
