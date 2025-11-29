
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Order } from '@/lib/data';
import { cn } from '@/lib/utils';
import { X, Landmark, QrCode, Pencil, Check, Receipt, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const banks = [
    { id: 'BCA', name: 'BCA', logo: 'https://placehold.co/100x40/003087/FFFFFF?text=BCA' },
    { id: 'BRI', name: 'BRI', logo: 'https://placehold.co/100x40/00529C/FFFFFF?text=BRI' },
    { id: 'BSI', name: 'BSI', logo: 'https://placehold.co/100x40/00A59C/FFFFFF?text=BSI' },
]

export function PaymentModal({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [paymentMethod, setPaymentMethod] = React.useState<'Cash' | 'QRIS'>('Cash');
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [selectedBank, setSelectedBank] = React.useState<'BCA' | 'BRI' | 'BSI' | null>('BCA');

  const quickAddAmounts = [1000, 2000, 5000, 10000, 50000, 100000];
  const orderTotal = order ? parseInt(order.total, 10) : 0;
  
  const handleAutoFill = () => {
    setPaymentAmount(orderTotal.toString());
  };

  const handleQuickAdd = (amount: number) => {
    setPaymentAmount((prev) => (Number(prev || 0) + amount).toString());
  }
  
  const changeAmount = Number(paymentAmount) - orderTotal;
  const isShortfall = changeAmount < 0;
  const changeText = `Rp ${Math.abs(changeAmount).toLocaleString('id-ID')}`;

  React.useEffect(() => {
    // Reset state when modal is closed or order changes
    if (!open) {
      setPaymentAmount('');
      setPaymentMethod('Cash');
      setSelectedBank('BCA');
    }
  }, [open]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 text-center items-center">
            <div className="p-3 bg-green-100 rounded-full mb-2">
                <Receipt className="w-6 h-6 text-green-600" />
            </div>
          <DialogTitle className="text-xl font-bold">
            Pembayaran{' '}
            {order.location_type.toLowerCase() === 'dine_in'
              ? `Meja ${order.no_meja}`
              : order.no_meja}
          </DialogTitle>
          <p className="text-muted-foreground text-sm">Silakan pilih metode pembayaran</p>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex justify-between items-center">
            <span className="font-medium text-yellow-800">Total Pembayaran:</span>
            <span className="font-bold text-xl text-yellow-900">
              Rp {orderTotal.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-code">Kode Diskon (Opsional)</Label>
            <div className="flex gap-2">
              <Input id="discount-code" placeholder="MASUKKAN KODE DISKON" />
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Terapkan
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label>Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-2">
                 <Button
                    variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('Cash')}
                    className={cn(
                        "h-12 text-base",
                        paymentMethod === 'Cash' ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : "bg-gray-100 text-gray-800"
                    )}
                 >
                    <Landmark className="mr-2 h-5 w-5"/> Cash
                </Button>
                 <Button
                    variant={paymentMethod === 'QRIS' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('QRIS')}
                    className={cn(
                        "h-12 text-base",
                         paymentMethod === 'QRIS' ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-100 text-gray-800"
                    )}
                 >
                    <QrCode className="mr-2 h-5 w-5"/> QRIS
                </Button>
            </div>
          </div>

            {paymentMethod === 'Cash' && (
                <div className="space-y-2">
                    <Label htmlFor="payment-amount">Jumlah Pembayaran</Label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">Rp</span>
                        <Input
                            id="payment-amount"
                            type="number"
                            placeholder="Masukkan jumlah pembayaran"
                            className="pl-8 pr-8"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                         {paymentAmount && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground"
                                onClick={() => setPaymentAmount('')}
                            >
                                <X className="h-4 w-4"/>
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        {quickAddAmounts.map(amount => (
                            <Button key={amount} variant="outline" size="sm" onClick={() => handleQuickAdd(amount)} className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100">
                                +Rp {amount.toLocaleString('id-ID')}
                            </Button>
                        ))}
                    </div>
                    <Button onClick={handleAutoFill} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Pencil className="mr-2 h-4 w-4" /> Auto Pas Total
                    </Button>
                    {paymentAmount && (
                         <div className={cn(
                            "rounded-lg p-3 flex justify-between items-center text-lg",
                             isShortfall ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                         )}>
                            <span className="font-medium">{isShortfall ? 'Kurang:' : 'Kembalian:'}</span>
                            <span className="font-bold">
                                {changeText}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {paymentMethod === 'QRIS' && (
                <div className="space-y-4">
                    <div>
                        <Label>Pilih Bank untuk QRIS</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {banks.map((bank) => (
                                <button
                                    key={bank.id}
                                    onClick={() => setSelectedBank(bank.id as any)}
                                    className={cn(
                                        "border-2 rounded-lg p-2 flex flex-col items-center justify-center space-y-1 transition-all",
                                        selectedBank === bank.id ? "border-purple-600 bg-purple-50" : "border-gray-200 bg-white"
                                    )}
                                >
                                    <Image src={bank.logo} alt={bank.name} width={60} height={24} className="object-contain" />
                                    <span className="text-sm font-medium">{bank.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {selectedBank && (
                        <div className="bg-purple-50 border border-dashed border-purple-200 rounded-lg p-3 space-y-2">
                             <div className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-purple-600" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-purple-800">Metode QRIS</span>
                                    <span className="text-sm text-purple-600">Bank: {selectedBank}</span>
                                </div>
                             </div>
                             <div className="border-t border-purple-200 my-2"></div>
                             <div className="flex justify-between items-center">
                                <span className="font-medium text-purple-800">Total Pembayaran:</span>
                                <span className="font-bold text-xl text-purple-900">
                                    Rp {orderTotal.toLocaleString('id-ID')}
                                </span>
                             </div>
                        </div>
                    )}
                    
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription>
                            Pembayaran akan diproses melalui QRIS dengan total akhir secara otomatis
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t grid grid-cols-2 gap-2">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="mr-2 h-4 w-4" />
                Selesai & Print Struk
            </Button>
             <DialogClose asChild>
                <Button variant="secondary" className="bg-gray-300 text-gray-800 hover:bg-gray-400">
                    <X className="mr-2 h-4 w-4" />
                    Batal
                </Button>
             </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
