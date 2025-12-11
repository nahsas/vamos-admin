
"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Wallet,
  Receipt,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Order, MenuItem } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format, startOfToday } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { OrderDetailModal } from "@/components/ui/order-detail-modal";

function StatCard({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
  className,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-md rounded-xl", className)}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-md ${bgColor}`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground font-semibold uppercase">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({ order, menuItems, onDetailClick }: { order: Order; menuItems: MenuItem[], onDetailClick: (order: Order) => void }) {
  const getMenuItemName = (id: number) => {
    return menuItems.find((item) => item.id === id)?.nama || "Item Tidak Dikenal";
  };

  const statusColor: { [key: string]: string } = {
    selesai: 'bg-green-100 text-green-700 border-green-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300'
  };
  
  const statusBorder: { [key: string]: string } = {
    selesai: 'border-green-400',
    cancelled: 'border-red-400'
  };
  
  const paymentMethodColor: { [key: string]: string } = {
      cash: 'bg-blue-100 text-blue-700 border-blue-300',
      qris: 'bg-purple-100 text-purple-700 border-purple-300',
  }

  const paymentMethodText: { [key: string]: string } = {
      cash: 'Tunai',
      qris: `QRIS (${order.bank_qris || 'N/A'})`,
  }

  return (
    <Card className={cn("shadow-md border-l-4 flex flex-col rounded-xl", statusBorder[order.status.toLowerCase()])}>
      <CardContent className="p-4 space-y-4 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              {order.location_type.toLowerCase() === "dine-in"
                ? `Meja ${order.no_meja}`
                : order.no_meja}
              <Badge className={cn("text-xs capitalize", statusColor[order.status.toLowerCase()])}>{order.status}</Badge>
            </h3>
            <div className="flex items-center gap-2 mt-2">
                {order.metode_pembayaran && (
                    <Badge variant="outline" className={paymentMethodColor[order.metode_pembayaran]}>
                        {paymentMethodText[order.metode_pembayaran]}
                    </Badge>
                )}
                {order.location_area && (
                     <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">{order.location_area}</Badge>
                )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(new Date(order.created_at), "HH:mm")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), "eeee, dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>

        <div className="border-t border-dashed pt-4">
          <div className="flex justify-between items-center text-sm font-medium mb-2">
            <h4>Detail Pesanan</h4>
            <span className="text-muted-foreground">{order.detail_pesanans.reduce((acc, item) => acc + item.jumlah, 0)} item</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {order.detail_pesanans.slice(0, 2).map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{getMenuItemName(item.menu_id)}</span>
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
        
        <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">Rp {parseInt(order.total).toLocaleString('id-ID')}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pembayaran:</span>
                <span className="font-bold text-base">Rp {(order.total_after_discount ?? order.total).toLocaleString('id-ID')}</span>
            </div>
        </div>

      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" variant="outline" onClick={() => onDetailClick(order)}>
          <Eye className="mr-2 h-4 w-4" />
          Lihat Detail
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function HistoryPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);


  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(startOfToday(), 'yyyy-MM-dd');
      const [orderRes, menuRes] = await Promise.all([
        fetch(`https://vamos-api.sejadikopi.com/api/pesanans?status=selesai,cancelled&payment_date=${today}`),
        fetch('https://vamos-api.sejadikopi.com/api/menu')
      ]);

      if (!orderRes.ok) throw new Error("Gagal mengambil riwayat pesanan.");
      const orderData = await orderRes.json();
      setOrders(orderData.data || []);
      
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData.data || []);
      } else {
        setMenuItems([]);
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan tidak terduga.');
      setOrders([]);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const getMenuItemName = (id: number) => {
    return menuItems.find((item) => item.id === id)?.nama || "";
  };

  const handleDetailClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  
  const handleOrderAction = () => {
    fetchData();
  };

  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status.toLowerCase() === filterStatus;
    
    if (!statusMatch) return false;
    
    if (searchTerm === "") return true;

    const lowerCaseSearch = searchTerm.toLowerCase();
    
    const nameMatch = order.no_meja.toLowerCase().includes(lowerCaseSearch);
    const itemMatch = order.detail_pesanans.some(detail => getMenuItemName(detail.menu_id).toLowerCase().includes(lowerCaseSearch));

    return nameMatch || itemMatch;
  });

  const completedOrders = orders.filter(o => o.status === "selesai").length;
  const totalRevenue = orders
    .filter((o) => o.status === "selesai")
    .reduce((sum, order) => sum + (order.total_after_discount ?? parseInt(order.total, 10)), 0);


  return (
    <div className="space-y-6">
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          menuItems={menuItems}
          onOrderDeleted={handleOrderAction}
        />
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari meja, pelanggan, atau item..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-primary/10 border border-primary/20 text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>Hari ini: {format(new Date(), "dd MMMM yyyy", { locale: id })}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="TOTAL TRANSAKSI"
          value={orders.length.toString()}
          icon={Receipt}
          bgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="SELESAI"
          value={completedOrders.toString()}
          icon={CheckCircle}
          bgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="TOTAL PENDAPATAN"
          value={`Rp ${totalRevenue.toLocaleString("id-ID")}`}
          icon={Wallet}
          bgColor="bg-primary/10"
          iconColor="text-primary"
          className="lg:col-span-2"
        />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Riwayat Transaksi Pembelian</h2>
        <Badge variant="secondary">{filteredOrders.length} transaksi ditemukan</Badge>
      </div>

       {loading && <div className="text-center p-8">Memuat data riwayat...</div>}
       {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="h-6 w-6"/>
                <div>
                    <p className="font-bold">Gagal memuat data</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )}

      {!loading && !error && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} menuItems={menuItems} onDetailClick={handleDetailClick} />
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground sm:col-span-1 md:col-span-2 xl:col-span-3">
              <p>Tidak ada riwayat transaksi untuk filter yang dipilih.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
