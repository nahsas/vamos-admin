
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
import { Order, MenuItem, OrderItem, Additional } from '@/lib/data';
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
  PlusCircle,
  Bell,
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
  
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(order);
  const [additionals, setAdditionals] = React.useState<Additional[]>([]);

  React.useEffect(() => {
    setCurrentOrder(order);
    if(open) {
      fetch('https://api.sejadikopi.com/api/additionals')
        .then(res => res.json())
        .then(data => setAdditionals(data.data || []))
        .catch(console.error);
    }
  }, [order, open]);


  const handleDelete = async () => {
    if (!currentOrder) return;

    try {
      const response = await fetch(`https://api.sejadikopi.com/api/pesanans/${currentOrder.id}`, {
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
  
  const handleCancelOrder = async () => {
    if (!currentOrder) return;
  
    try {
      const getOrderResponse = await fetch(`https://api.sejadikopi.com/api/pesanan/${currentOrder.id}`);
      if (!getOrderResponse.ok) {
        throw new Error('Gagal mengambil data pesanan terbaru sebelum membatalkan.');
      }
      const fullOrderData = await getOrderResponse.json();
  
      const updatedOrder = {
        ...fullOrderData.data,
        status: 'cancelled',
      };
  
      const response = await fetch(`https://api.sejadikopi.com/api/pesanans/${currentOrder.id}`, {
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
        description: `Pesanan #${currentOrder.id} telah dibatalkan.`,
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

  const handleDeleteItem = async (itemId: number) => {
    if (!currentOrder) return;
    try {
        const response = await fetch(`https://api.sejadikopi.com/api/detail_pesanan/${itemId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Gagal menghapus item pesanan.');
        }

        // Optimistic UI update
        const updatedDetails = currentOrder.detail_pesanans.filter(item => item.id !== itemId);
        const newTotal = updatedDetails.reduce((sum, item) => sum + parseInt(item.subtotal, 10), 0);
        
        setCurrentOrder({
            ...currentOrder,
            detail_pesanans: updatedDetails,
            total: String(newTotal),
            total_after_discount: newTotal, // Assuming discount is removed if an item is deleted. This could be more complex.
        });

        toast({
            title: 'Sukses',
            description: 'Item berhasil dihapus dari pesanan.',
        });
    } catch (error) {
        console.error('Error deleting order item:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: (error as Error).message || 'Gagal menghapus item.',
        });
    }
  };

  const getMenuDetails = (menuId: number) => {
    return menuItems.find((item) => item.id === menuId);
  };

  const getAdditionalNames = (item: OrderItem): string[] => {
    const names: string[] = [];
    const allAddons = { ...item.additionals, ...item.dimsum_additionals };

    for (const id in allAddons) {
      if (allAddons[id]) {
        const additional = additionals.find(add => add.id === parseInt(id));
        if (additional) {
          names.push(additional.nama);
        }
      }
    }
    return names;
  }
  
  const totalItems = currentOrder?.detail_pesanans.reduce((sum, item) => sum + item.jumlah, 0) || 0;
  const isProcessing = currentOrder?.status.toLowerCase() === 'diproses';
  const isCompleted = currentOrder?.status.toLowerCase() === 'selesai' || currentOrder?.status.toLowerCase() === 'cancelled';

  const handlePaymentClick = () => {
    onOpenChange(false);
    setIsPaymentModalOpen(true);
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onOrderDeleted(); // Refresh data on parent when modal closes
    }
    onOpenChange(isOpen);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0">
        {!currentOrder && <div className="p-8 text-center">No order selected.</div>}
        {currentOrder && (
          <>
            <DialogHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg relative">
              <div className="flex justify-between items-center">
                <DialogTitle>
                  Detail Pesanan{' '}
                  {currentOrder.location_type.toLowerCase() === 'dine_in'
                    ? `Meja ${currentOrder.no_meja}`
                    : currentOrder.no_meja}
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
                  <Badge variant="outline" className="bg-white/20 border-white/50 text-white">
                    <MapPin className="mr-1 h-3 w-3" />
                    {currentOrder.location_area}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                {currentOrder.detail_pesanans.map((item) => {
                const menuItem = getMenuDetails(item.menu_id);
                const addonNames = getAdditionalNames(item);
                return (
                    <div key={item.id} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex justify-between items-start gap-4">
                           <div className="flex-1 space-y-1">
                                <p className="font-bold flex items-center gap-2">
                                    {menuItem?.nama || 'Nama tidak ditemukan'}{' '}
                                     {item.printed === 0 && !isCompleted && (
                                      <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
                                          <Bell className="w-2.5 h-2.5 mr-1"/>
                                          BARU
                                      </Badge>
                                    )}
                                </p>
                                <div className="flex items-center gap-1 flex-wrap">
                                    {item.varian && <Badge variant="secondary" className="text-xs">{item.varian}</Badge>}
                                    {addonNames.map((add, index) => (
                                        <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                            <PlusCircle className="mr-1 h-3 w-3" />
                                            {add}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                             <div className="text-right flex-shrink-0">
                                <p className="font-semibold">x {item.jumlah}</p>
                            </div>
                            {!isCompleted && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus item ini?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Yakin ingin menghapus item "{menuItem?.nama || 'Item'}" dari pesanan? Tindakan ini tidak dapat dibatalkan.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">
                                                Ya, Hapus
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
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
                                 <span>Rp {item.base_price.toLocaleString('id-ID')}</span>
                             </div>
                              {item.additional_price && parseInt(item.additional_price, 10) > 0 && (
                                <div className="flex justify-between">
                                    <span>Harga tambahan:</span>
                                    <span>Rp {parseInt(item.additional_price, 10).toLocaleString('id-ID')}</span>
                                </div>
                              )}
                             <div className="flex justify-between font-bold text-primary">
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
                        <p className="text-2xl font-bold">Rp {(currentOrder.total_after_discount ?? parseInt(currentOrder.total, 10)).toLocaleString('id-ID')}</p>
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
        order={currentOrder}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
    />
    </>
  );
}
