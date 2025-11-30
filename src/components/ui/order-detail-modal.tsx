
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { Order, MenuItem } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  X,
  Trash2,
  Utensils,
  MapPin,
  ArrowRight,
  MessageSquare,
  Wallet,
  XCircle,
  PlusCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentModal } from './payment-modal';

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
  cancelled: { label: 'BATAL', color: 'bg-red-500 text-white' },
};

export function OrderDetailModal({
  order,
  open,
  onOpenChange,
  menuItems,
  onOrderDeleted,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: MenuItem[];
  onOrderDeleted: () => void;
}) {
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  const handleDelete = async () => {
    if (!order) return;

    try {
      const response = await fetch(`https://api.sejadikopi.com/api/pesanans/${order.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus pesanan');
      }
      
      toast({
        title: 'Sukses',
        description: `Pesanan #${order.id} telah dihapus.`,
      });
      onOpenChange(false); // Close the modal
      onOrderDeleted(); // Trigger a refetch on the parent page

    } catch (error) {
       console.error('Error deleting order:', error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak dapat menghapus pesanan.',
      });
    }
  };
  
  const handleCancelOrder = async () => {
    if (!order) return;
  
    try {
      // Fetch the full, most recent order data first
      const getOrderResponse = await fetch(`https://api.sejadikopi.com/api/pesanan/${order.id}`);
      if (!getOrderResponse.ok) {
        throw new Error('Gagal mengambil data pesanan terbaru sebelum membatalkan.');
      }
      const fullOrderData = await getOrderResponse.json();
  
      // Now, update the status and send the full object back
      const updatedOrder = {
        ...fullOrderData.data,
        status: 'cancelled',
      };
  
      const response = await fetch(`https://api.sejadikopi.com/api/pesanans/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Gagal membatalkan pesanan. Status: ${response.status}`);
      }
      
      toast({
        title: 'Sukses',
        description: `Pesanan #${order.id} telah dibatalkan.`,
      });
      onOpenChange(false);
      onOrderDeleted();
  
    } catch (error) {
       console.error('Error cancelling order:', error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Tidak dapat membatalkan pesanan.',
      });
    }
  };

  const getMenuDetails = (menuId: number) => {
    return menuItems.find((item) => item.id === menuId);
  };

  const parseAdditionals = (additionals: string | null | undefined): string[] => {
    if (!additionals) return [];
    try {
      // Handles cases like "['item1', 'item2']" or "'item1', 'item2'"
      const cleanedString = additionals.replace(/'/g, '"');
      const parsed = JSON.parse(cleanedString.startsWith('[') ? cleanedString : `[${cleanedString}]`);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // Handles simple comma-separated strings
      return additionals.split(',').map(s => s.trim());
    }
  };
  
  const totalItems = order?.detail_pesanans.reduce((sum, item) => sum + item.jumlah, 0) || 0;
  const isProcessing = order?.status.toLowerCase() === 'diproses';
  const isCompleted = order?.status.toLowerCase() === 'selesai' || order?.status.toLowerCase() === 'cancelled';

  const handlePaymentClick = () => {
    onOpenChange(false); // Close current modal
    setIsPaymentModalOpen(true); // Open payment modal
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        {!order && <div className="p-8 text-center">No order selected.</div>}
        {order && (
          <>
            <DialogHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg relative">
              <div className="flex justify-between items-center">
                <DialogTitle>
                  Detail Pesanan{' '}
                  {order.location_type.toLowerCase() === 'dine-in'
                    ? `Meja ${order.no_meja}`
                    : order.no_meja}
                </DialogTitle>
                <div className="flex items-center gap-2">
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive-foreground/70 hover:text-destructive-foreground hover:bg-destructive-foreground/10 mr-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin ingin menghapus pesanan ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pesanan secara permanen
                          dan menghapus datanya dari server kami.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <DialogClose className="absolute right-4 top-4 rounded-full p-1 bg-white/20 text-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
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

            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                {order.detail_pesanans.map((item) => {
                const menuItem = getMenuDetails(item.menu_id);
                const allAdditionals = [
                    ...parseAdditionals(item.additionals),
                    ...parseAdditionals(item.dimsum_additionals)
                ];
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
                                    {allAdditionals.map((add, index) => (
                                        <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                            <PlusCircle className="mr-1 h-3 w-3" />
                                            {add}
                                        </Badge>
                                    ))}
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
                               <span>{item.note || "Tidak ada catatan."}</span>
                            </div>
                         <div className="text-sm mt-2 pt-2 border-t border-dashed">
                             <div className="flex justify-between">
                                 <span>Harga satuan:</span>
                                 <span>Rp {item.base_price.toLocaleString('id-ID')}</span>
                             </div>
                              {item.additional_price && parseInt(item.additional_price, 10) > 0 && (
                                <div className="flex justify-between">
                                    <span>Harga tambahan:</span>
                                    <span>Rp {parseInt(item.additional_price, 10).toLocaleString('id-ID')}</span>
                                </div>
                              )}
                             <div className="flex justify-between">
                                 <span>Subtotal ({item.jumlah}x):</span>
                                 <span>Rp {parseInt(item.subtotal, 10).toLocaleString('id-ID')}</span>
                             </div>
                         </div>
                    </div>
                );
                })}
            </div>

            <div className="p-4 bg-slate-50 border-t rounded-b-lg space-y-4">
                <div className="w-full flex justify-between items-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Pembayaran:</p>
                        <p className="text-2xl font-bold">Rp {(order.total_after_discount ?? parseInt(order.total, 10)).toLocaleString('id-ID')}</p>
                    </div>
                     <p className="text-sm text-muted-foreground">{totalItems} item</p>
                </div>
                {!isCompleted && (
                    <DialogFooter className="grid grid-cols-2 gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700">
                                    <XCircle className="mr-2 h-4 w-4" /> Batalkan Pesanan
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Tindakan ini akan membatalkan pesanan. Ini tidak bisa dibatalkan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">
                                    Ya, Batalkan
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button 
                            onClick={isProcessing ? handlePaymentClick : () => {}}
                            className={cn(
                                isProcessing 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : "bg-blue-600 hover:bg-blue-700",
                                "text-white"
                            )}
                        >
                        {isProcessing ? (
                            <>
                            <Wallet className="mr-2 h-4 w-4" /> Bayar
                            </>
                        ) : (
                            <>
                            Proses <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                        </Button>
                    </DialogFooter>
                )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    <PaymentModal 
        order={order}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
    />
    </>
  );
}
