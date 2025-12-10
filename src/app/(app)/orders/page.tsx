
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users,
  Wallet,
  ShoppingCart,
  Search,
  Filter,
  RefreshCw,
  ClipboardList,
  Hourglass,
  CookingPot
} from "lucide-react";
import { Order, MenuItem, Additional } from "@/lib/data";
import { OrderGridCard } from "@/components/ui/order-grid-card";
import { OrderDetailModal } from "@/components/ui/order-detail-modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { PaymentModal } from "@/components/ui/payment-modal";
import { appEventEmitter } from "@/lib/event-emitter";
import { printMainCheckerStruk, printKitchenStruk } from "@/lib/print-utils";


function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="shadow-md rounded-xl">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-md">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-semibold">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = React.useState("dine-in");
  const [dineInOrders, setDineInOrders] = React.useState<Order[]>([]);
  const [takeawayOrders, setTakeawayOrders] = React.useState<Order[]>([]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [additionals, setAdditionals] = React.useState<Additional[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [occupiedTablesCount, setOccupiedTablesCount] = React.useState<number | null>(null);
  
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [paymentOrder, setPaymentOrder] = React.useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("all");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, additionalsRes] = await Promise.all([
        fetch("https://vamos-api.sejadikopi.com/api/pesanans?order=updated_at.desc&status=pending,diproses"),
        fetch("https://vamos-api.sejadikopi.com/api/menu"),
        fetch("https://vamos-api.sejadikopi.com/api/additionals")
      ]);
      
      const allActiveOrders = ordersRes.ok ? (await ordersRes.json()).data : [];
      
      const allDineInOrders = allActiveOrders.filter((o: Order) => o.location_type.toLowerCase() === 'dine-in');
      const allTakeawayOrders = allActiveOrders.filter((o: Order) => o.location_type.toLowerCase() === 'takeaway');

      setDineInOrders(allDineInOrders);
      setTakeawayOrders(allTakeawayOrders);

      if (menuRes.ok) setMenuItems((await menuRes.json()).data);
      if (additionalsRes.ok) setAdditionals((await additionalsRes.json()).data);

      const uniqueTables = new Set(
        allDineInOrders.map((order: Order) => order.no_meja)
      );
      setOccupiedTablesCount(uniqueTables.size);
      
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setDineInOrders([]);
      setTakeawayOrders([]);
      setOccupiedTablesCount(0);
      setMenuItems([]);
      setAdditionals([]);
    } finally {
      setLoading(false);
    }
  }, []);


  React.useEffect(() => {
    fetchData();
    
    appEventEmitter.on('new-order', fetchData);

    return () => {
      appEventEmitter.off('new-order', fetchData);
    };
  }, [fetchData]);

  const handleDetailClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  
  const handleUpdateStatus = async (order: Order) => {
    try {
      // Print main checker first
      printMainCheckerStruk(order, menuItems, additionals);
      
      const response = await fetch(`https://vamos-api.sejadikopi.com/api/pesanans/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'diproses' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast({
        title: 'Success',
        description: `Order #${order.id} has been moved to "Processing".`,
      });

      // Refetch data to update the UI
      fetchData();

    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update order status.',
      });
    }
  };

  const handlePaymentClick = (order: Order) => {
    setPaymentOrder(order);
    setIsPaymentModalOpen(true);
  }

  const getMenuName = (menuId: number) => {
    const menuItem = menuItems.find((item) => item.id === menuId);
    return menuItem ? menuItem.nama : 'Unknown Item';
  };

  const filteredDineInOrders = dineInOrders
    .filter(order => {
        if (filterStatus !== 'all' && order.status.toLowerCase() !== filterStatus) {
            return false;
        }
        if (searchTerm === "") {
            return true;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const hasMatchingItem = order.detail_pesanans.some(item =>
            getMenuName(item.menu_id).toLowerCase().includes(lowerCaseSearch) ||
            (item.note && item.note.toLowerCase().includes(lowerCaseSearch))
        );
        return order.no_meja.toLowerCase().includes(lowerCaseSearch) || hasMatchingItem;
    });

  const filteredTakeawayOrders = takeawayOrders
    .filter(order => {
        if (filterStatus !== 'all' && order.status.toLowerCase() !== filterStatus) {
            return false;
        }
        if (searchTerm === "") {
            return true;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        const hasMatchingItem = order.detail_pesanans.some(item =>
            getMenuName(item.menu_id).toLowerCase().includes(lowerCaseSearch) ||
            (item.note && item.note.toLowerCase().includes(lowerCaseSearch))
        );
        return order.no_meja.toLowerCase().includes(lowerCaseSearch) || hasMatchingItem;
    });

  const allActiveOrders = [...dineInOrders, ...takeawayOrders];
  const totalTransactions = allActiveOrders.reduce((sum, order) => sum + parseFloat(order.total), 0)
    .toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

  const totalItems = allActiveOrders.reduce((sum, order) => sum + order.detail_pesanans.reduce((itemSum, item) => itemSum + item.jumlah, 0), 0);

  const renderOrderList = (orders: Order[], type: 'dine-in' | 'take-away') => {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const processingOrders = orders.filter(o => o.status === 'diproses');

    if (loading) {
      return <div className="text-center py-16">Loading...</div>;
    }
    
    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <ClipboardList className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">Belum Ada Pesanan {type === 'dine-in' ? 'Dine-in' : 'Take Away'}</h3>
          <p className="text-muted-foreground">
            Saat ini tidak ada pesanan {type === 'dine-in' ? 'dine-in' : 'takeaway'} yang aktif.
          </p>
        </div>
      );
    }
    
    return (
        <div className="space-y-8">
            {pendingOrders.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Hourglass className="h-5 w-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-yellow-700">Pending ({pendingOrders.length})</h3>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {pendingOrders.map(order => (
                            <OrderGridCard key={order.id} order={order} menuItems={menuItems} onDetailClick={handleDetailClick} onUpdateStatus={handleUpdateStatus} onPaymentClick={handlePaymentClick} />
                        ))}
                    </div>
                </div>
            )}
            {pendingOrders.length > 0 && processingOrders.length > 0 && <Separator className="my-8" />}
             {processingOrders.length > 0 && (
                <div>
                     <div className="flex items-center gap-2 mb-4">
                        <CookingPot className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-700">Processing ({processingOrders.length})</h3>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {processingOrders.map(order => (
                            <OrderGridCard key={order.id} order={order} menuItems={menuItems} onDetailClick={handleDetailClick} onUpdateStatus={handleUpdateStatus} onPaymentClick={handlePaymentClick} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
  }

  return (
    <div className="space-y-6">
       {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          menuItems={menuItems}
          onOrderDeleted={fetchData}
        />
      )}
       <PaymentModal 
        order={paymentOrder}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
      />
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari nomor meja, catatan, atau nama menu..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Semua Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="diproses">Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        <StatCard title="MEJA TERISI" value={occupiedTablesCount !== null ? occupiedTablesCount.toString() : '...'} icon={Users} />
        <StatCard title="TOTAL ITEM" value={totalItems.toString()} icon={ShoppingCart} />
        <div className="sm:col-span-1 md:col-span-2">
          <StatCard title="TOTAL TRANSAKSI" value={totalTransactions} icon={Wallet} />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold">Detail List Meja Terisi</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-9 text-sm font-medium hidden md:flex">
            {allActiveOrders.length} pesanan aktif
          </Badge>
          <Button onClick={fetchData} variant="outline" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="flex items-center justify-center p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-2 rounded-lg bg-gray-200 p-1 h-auto">
              <TabsTrigger value="dine-in" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2 px-3 py-1.5 text-sm">
                Dine-in
                <Badge className="bg-primary-foreground/90 text-primary rounded-full h-6 w-6 flex items-center justify-center">{filteredDineInOrders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="take-away" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2 px-3 py-1.5 text-sm">
                Take Away
                <Badge className="bg-primary-foreground/90 text-primary rounded-full h-6 w-6 flex items-center justify-center">{filteredTakeawayOrders.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dine-in">
              {renderOrderList(filteredDineInOrders, 'dine-in')}
            </TabsContent>
            <TabsContent value="take-away">
              {renderOrderList(filteredTakeawayOrders, 'take-away')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    
    

    

    