
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order, OrderItem } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  X,
  Trash2,
  MapPin,
  ArrowRight,
  MessageSquare,
  Wallet,
  XCircle,
  PlusCircle,
  Bell,
  Plus,
  Minus,
  Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentModal } from './payment-modal';
import { printBillStruk } from '@/lib/print-utils';

const statusConfig: {
  [key: string]: {
    label: string;
    color: string;
    headerColor: string;
  };
} = {
  pending: { label: 'PENDING', color: 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900', headerColor: 'bg-primary' },
  process: { label: 'PROSES', color: 'bg-blue-500 text-white', headerColor: 'bg-primary' },
  completed: { label: 'SELESAI', color: 'bg-green-500 text-white', headerColor: 'bg-green-600' },
  cancelled: { label: 'BATAL', color: 'bg-red-500 text-white', headerColor: 'bg-red-600' },
};

export function OrderDetailModal({
  order,
  open,
  onOpenChange,
  onOrderDeleted,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderDeleted: () => void;
}) {
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(order);

  React.useEffect(() => {
    setCurrentOrder(order);
  }, [order, open]);


  const handleDelete = async () => {
    if (!currentOrder) return;

    try {
      const response = await fetch(`https://vamos-api-v2.sejadikopi.com/api/orders/${currentOrder.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus pesanan');
      }
      
      toast({
        title: 'Sukses',
        description: `Pesanan #${currentOrder.id} telah dihapus.`,
      });
      onOpenChange(false);
      onOrderDeleted(); 

    } catch (error) {
       console.error('Error deleting order:', error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak dapat menghapus pesanan.',
      });
    }
  };
  
  const updateOrderTotalOnBackend = async (orderId: number, newTotal: number) => {
    // This function can be expanded later if needed
  }

  const handleUpdateItemQuantity = async (item: OrderItem, newQuantity: number) => {
    if (!currentOrder || newQuantity < 0) return;

    if (newQuantity === 0) {
        if (confirm(`Yakin ingin menghapus item "${item.menu_name || 'Item'}" dari pesanan?`)) {
            handleDeleteItem(item.id);
        }
        return;
    }
    
    // Quantity update is disabled in modal for now
  };
  
  const handleDeleteItem = async (itemId: number) => {
    // Item deletion is disabled in modal for now
  };

  const totalItems = currentOrder?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const isProcessing = currentOrder?.status.toLowerCase() === 'process';
  const isCompleted = currentOrder?.status.toLowerCase() === 'completed' || currentOrder?.status.toLowerCase() === 'cancelled';

  const handlePaymentClick = () => {
    onOpenChange(false);
    setIsPaymentModalOpen(true);
  }

  const handlePrintBill = () => {
    if (currentOrder) {
      printBillStruk(currentOrder);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onOrderDeleted(); // Refresh data on parent when modal closes
    }
    onOpenChange(isOpen);
  };

  const headerColor = currentOrder ? (statusConfig[currentOrder.status.toLowerCase()]?.headerColor || 'bg-primary') : 'bg-primary';

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0">
        {!currentOrder && <div className="p-8 text-center">No order selected.</div>}
        {currentOrder && (
          <>
            <DialogHeader className={cn("p-4 text-primary-foreground rounded-t-lg relative", headerColor)}>
              <div className="flex justify-between items-center">
                <DialogTitle>
                  Detail Pesanan{' '}
                  {currentOrder.order_type.toLowerCase() === 'dine-in'
                    ? `${currentOrder.identifier}`
                    : currentOrder.identifier}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 text-sm pt-2">
                <Badge variant="secondary" className="bg-black/20 text-white">
                  {format(new Date(currentOrder.created_at), 'HH:mm - dd MMM yyyy', {
                    locale: id,
                  })}
                </Badge>
                <Badge
                  className={cn(statusConfig[currentOrder.status.toLowerCase()]?.color)}
                >
                  {statusConfig[currentOrder.status.toLowerCase()]?.label}
                </Badge>
                {currentOrder.location_area && (
                  <Badge variant="outline" className="bg-black/20 text-white border-white/50">
                    <MapPin className="mr-1 h-3 w-3" />
                    {currentOrder.location_area}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                {currentOrder.items?.map((item) => {
                return (
                    <div key={item.id} className="bg-card rounded-lg p-3">
                        <div className="flex justify-between items-start gap-4">
                           <div className="flex-1 space-y-1">
                                <div className="font-bold flex items-center gap-2">
                                    {item.menu_name || 'Nama tidak ditemukan'}{' '}
                                    {!item.is_printed && (
                                        <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
                                            BARU
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
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
                                    {item.selected_additional_name && (
                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                            <PlusCircle className="mr-1 h-3 w-3" />
                                            {item.selected_additional_name}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                             <div className="text-right flex-shrink-0 flex items-center gap-2">
                                <p className="font-semibold">x {item.quantity}</p>
                            </div>
                        </div>
                        {item.note && (
                            <div className="mt-2 pt-2 border-t border-dashed text-sm text-muted-foreground flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{item.note || "Tidak ada catatan."}</span>
                            </div>
                        )}
                        <div className="text-sm mt-2 pt-2 border-t border-dashed">
                             <div className="flex justify-between">
                                 <span>Harga satuan:</span>
                                 <span>Rp {item.item_unit_price.toLocaleString('id-ID')}</span>
                             </div>
                             <div className="flex justify-between font-bold text-primary">
                                 <span>Subtotal ({item.quantity}x):</span>
                                 <span>Rp {item.item_total_price.toLocaleString('id-ID')}</span>
                             </div>
                        </div>
                    </div>
                );
                })}
            </div>

            <div className="p-4 bg-background border-t rounded-b-lg space-y-4">
                <div className="w-full flex justify-between items-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Pembayaran:</p>
                        <p className="text-2xl font-bold">Rp {(currentOrder.total_amount).toLocaleString('id-ID')}</p>
                    </div>
                     <p className="text-sm text-muted-foreground">{totalItems} item</p>
                </div>
                {!isCompleted && (
                    <DialogFooter className="grid grid-cols-3 gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700">
                                    <XCircle className="mr-2 h-4 w-4" /> Batalkan
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Tindakan ini akan menghapus pesanan secara permanen. Ini tidak bisa dibatalkan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    Ya, Batalkan & Hapus
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" className="bg-gray-600 hover:bg-gray-700 text-white" onClick={handlePrintBill}>
                            <Printer className="mr-2 h-4 w-4" /> Bill
                        </Button>

                        <Button 
                            onClick={handlePaymentClick}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Wallet className="mr-2 h-4 w-4" /> Bayar
                        </Button>
                    </DialogFooter>
                )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    <PaymentModal 
        order={currentOrder}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
    />
    </>
  );
}
