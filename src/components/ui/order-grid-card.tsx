
'use client';

import { Order } from '@/lib/data';
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
  pending: { label: 'PENDING', color: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' },
  process: { label: 'PROSES', color: 'bg-blue-500 text-white' },
  completed: { label: 'SELESAI', color: 'bg-green-500 text-white' },
  cancelled: { label: 'BATAL', color: 'bg-red-500 text-white' },
};

export function OrderGridCard({ order, onDetailClick, onUpdateStatus, onPaymentClick }: { order: Order; onDetailClick: (order: Order) => void; onUpdateStatus: (order: Order) => void; onPaymentClick: (order: Order) => void; }) {
  const statusInfo = statusConfig[order.status.toLowerCase()] || statusConfig.pending;
  const isProcessing = order.status.toLowerCase() === 'process';
  
  const hasNewItems = order.items?.some(item => !item.is_printed);
  const hasNewMainCheckerItems = order.items?.some(item => !item.is_printed && item.checker_type === 'main');
  const hasNewBarCheckerItems = order.items?.some(item => !item.is_printed && item.checker_type === 'bar');

  const totalItems = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  const handleActionClick = () => {
    if (isProcessing) {
      onPaymentClick(order);
    } else {
      onUpdateStatus(order);
    }
  }

  const handleKitchenPrint = () => {
    printKitchenStruk(order);
  };

  const handleMainCheckerPrint = () => {
    printMainCheckerStruk(order);
  }

  const borderGradientClass = isProcessing
    ? 'bg-blue-500'
    : 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    
  const shadowClass = isProcessing
    ? 'hover:shadow-[0_0_15px_2px_rgba(59,130,246,0.5)]'
    : 'hover:shadow-[0_0_15px_2px_rgba(251,191,36,0.5)]';


  return (
    <>
    <Card className={cn("shadow-lg rounded-xl p-0.5 transition-all duration-300 ease-in-out hover:scale-105 hover:p-1", borderGradientClass, shadowClass)}>
      <CardContent className="p-4 flex flex-col h-full bg-card rounded-lg">
        <div className="flex-grow space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">
                  {order.identifier}
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
              {order.items?.slice(0, 2).map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <span className="truncate">{item.menu_name}</span>
                     {item.variant_name && (
                        <Badge
                            variant="outline"
                            className={cn(
                            "text-xs",
                            item.variant_name.toLowerCase() === 'hot' 
                                ? 'border-red-300 bg-white text-red-400' 
                                : 'border-blue-300 bg-white text-blue-400'
                            )}
                        >
                            {item.variant_name}
                        </Badge>
                    )}
                  </div>
                  <span>x {item.quantity}</span>
                </div>
              ))}
              {order.items && order.items.length > 2 && (
                <div className={cn(
                  "text-center text-xs pt-1",
                  isProcessing ? "text-blue-400" : "text-yellow-400"
                )}>
                  + {order.items.length - 2} menu lainnya...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Total Pembayaran:</span>
            <span className="font-bold text-xl">
              Rp {order.total_amount.toLocaleString('id-ID')}
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
                        Pilih checker yang ingin Anda cetak untuk item baru. Tombol hanya aktif jika ada item yang sesuai.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex-col gap-2 mt-4 md:flex-row md:justify-between space-y-2">
                    <Button onClick={handleMainCheckerPrint} className="w-full" disabled={!hasNewMainCheckerItems}>
                        Main Checker
                    </Button>
                    <Button onClick={handleKitchenPrint} className="w-full" disabled={!hasNewBarCheckerItems}>
                        Checker Dapur
                    </Button>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel className="w-full mt-2 md:mt-0">Batal</AlertDialogCancel>
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
                    isProcessing 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-blue-600 hover:bg-blue-700"
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
