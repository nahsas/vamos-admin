
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
import { Order, MenuItem } from "@/lib/data";
import { OrderGridCard } from "@/components/ui/order-grid-card";
import { OrderDetailModal } from "@/components/ui/order-detail-modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";


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
    <Card className="shadow-md">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 bg-amber-400/20 rounded-md">
          <Icon className="w-8 h-8 text-amber-600" />
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
  const [loading, setLoading] = React.useState(true);
  const [occupiedTablesCount, setOccupiedTablesCount] = React.useState<number | null>(null);
  
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        dineInPendingRes,
        dineInProcessingRes,
        takeawayPendingRes,
        takeawayProcessingRes,
        tablesRes,
        menuRes
      ] = await Promise.all([
        fetch("https://api.sejadikopi.com/api/pesanans?status=pending&location_type=dine_in"),
        fetch("https://api.sejadikopi.com/api/pesanans?status=diproses&location_type=dine_in"),
        fetch("https://api.sejadikopi.com/api/pesanans?status=pending&location_type=takeaway"),
        fetch("https://api.sejadikopi.com/api/pesanans?status=diproses&location_type=takeaway"),
        fetch("https://api.sejadikopi.com/api/pesanans?select=no_meja,created_at,location_type&status=pending,diproses"),
        fetch("https://api.sejadikopi.com/api/menu")
      ]);
      
      const dineInPending = dineInPendingRes.ok ? (await dineInPendingRes.json()).data : [];
      const dineInProcessing = dineInProcessingRes.ok ? (await dineInProcessingRes.json()).data : [];
      setDineInOrders([...dineInPending, ...dineInProcessing]);

      const takeawayPending = takeawayPendingRes.ok ? (await takeawayPendingRes.json()).data : [];
      const takeawayProcessing = takeawayProcessingRes.ok ? (await takeawayProcessingRes.json()).data : [];
      setTakeawayOrders([...takeawayPending, ...takeawayProcessing]);

      if (menuRes.ok) setMenuItems((await menuRes.json()).data);

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        const today = new Date().toDateString();
        const uniqueTables = new Set(
          tablesData.data
            .filter((order: { created_at: string; no_meja: string; location_type: string }) =>
              new Date(order.created_at).toDateString() === today &&
              order.location_type && order.location_type.toLowerCase() === 'dine_in'
            )
            .map((order: { no_meja: string }) => order.no_meja)
        );
        setOccupiedTablesCount(uniqueTables.size);
      } else {
        setOccupiedTablesCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setDineInOrders([]);
      setTakeawayOrders([]);
      setOccupiedTablesCount(0);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);


  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDetailClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  
  const handleUpdateStatus = async (orderId: number) => {
    try {
      const response = await fetch(`https://api.sejadikopi.com/api/pesanans/${orderId}`, {
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
        description: `Order #${orderId} has been moved to "Processing".`,
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
        <div className="space-y-6">
            {pendingOrders.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Hourglass className="h-5 w-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-yellow-700">Pending ({pendingOrders.length})</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {pendingOrders.map(order => (
                            <OrderGridCard key={order.id} order={order} menuItems={menuItems} onDetailClick={handleDetailClick} onUpdateStatus={handleUpdateStatus} />
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {processingOrders.map(order => (
                            <OrderGridCard key={order.id} order={order} menuItems={menuItems} onDetailClick={handleDetailClick} onUpdateStatus={handleUpdateStatus} />
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
        />
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari nomor meja, catatan, atau nama menu..."
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[200px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Semua Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="MEJA TERISI" value={occupiedTablesCount !== null ? occupiedTablesCount.toString() : '...'} icon={Users} />
        <StatCard title="TOTAL ITEM" value={totalItems.toString()} icon={ShoppingCart} />
        <div className="md:col-span-2">
          <StatCard title="TOTAL TRANSAKSI" value={totalTransactions} icon={Wallet} />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold">Detail List Meja Terisi</h2>
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-2 rounded-lg bg-gray-200 p-1 h-auto">
              <TabsTrigger value="dine-in" className="rounded-md data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-2 px-3 py-1.5 text-sm">
                Dine-in
                <Badge className="bg-white/20 text-white rounded-full h-6 w-6 flex items-center justify-center">{dineInOrders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="take-away" className="rounded-md data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-2 px-3 py-1.5 text-sm">
                Take Away
                <Badge className="bg-white/20 text-white rounded-full h-6 w-6 flex items-center justify-center">{takeawayOrders.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Badge variant="outline" className="h-9 text-sm font-medium hidden md:flex">
            {allActiveOrders.length} pesanan aktif
          </Badge>
          <Button onClick={fetchData} variant="outline" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dine-in">
              {renderOrderList(dineInOrders, 'dine-in')}
            </TabsContent>
            <TabsContent value="take-away">
              {renderOrderList(takeawayOrders, 'take-away')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
