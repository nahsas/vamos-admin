
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Loader, CalendarDays, Utensils, Layers, ClipboardList, RefreshCw, AlertTriangle } from "lucide-react";
import { Order, MenuItem } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/ui/order-card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function StatCard({ title, value, icon: Icon, description, bgColor = "bg-white", textColor = "text-black" }: { title:string, value:string, icon: React.ElementType, description: string, bgColor?: string, textColor?: string }) {
  return (
    <Card className={cn("shadow-lg", bgColor, textColor)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-black/10 rounded-md">
            <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{value}</div>
        <div className="flex items-center gap-2 text-xs">
            <CalendarDays className="h-3 w-3" />
            <p>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = React.useState("dine-in");
  const [totalMenu, setTotalMenu] = React.useState<number | null>(null);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [totalCategories, setTotalCategories] = React.useState<number | null>(null);
  const [todaysOrdersCount, setTodaysOrdersCount] = React.useState<number | null>(null);
  const [pendingOrders, setPendingOrders] = React.useState<number | null>(null);
  const [processingOrders, setProcessingOrders] = React.useState<number | null>(null);
  const [completedOrders, setCompletedOrders] = React.useState<number | null>(null);
  
  const [dineInOrders, setDineInOrders] = React.useState<Order[]>([]);
  const [takeawayOrders, setTakeawayOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);

  const fetchStatCounts = React.useCallback(async () => {
    // This can be refactored into a single stats endpoint later
    try {
        const [menuRes, catRes, todayRes, pendingRes, processingRes, completedRes] = await Promise.all([
            fetch("https://api.sejadikopi.com/api/menu"),
            fetch("https://api.sejadikopi.com/api/categories?select=nama"),
            fetch("https://api.sejadikopi.com/api/pesanans?select=id,created_at"),
            fetch("https://api.sejadikopi.com/api/pesanans?select=id&status=pending"),
            fetch("https://api.sejadikopi.com/api/pesanans?select=id&status=diproses"),
            fetch("https://api.sejadikopi.com/api/pesanans?select=id,created_at&status=selesai")
        ]);

        if (menuRes.ok) {
            const menuData = await menuRes.json();
            setTotalMenu(menuData.data.length);
            setMenuItems(menuData.data);
        } else {
            setTotalMenu(0);
            setMenuItems([]);
        }
        if (catRes.ok) setTotalCategories((await catRes.json()).data.length); else setTotalCategories(0);
        
        if (todayRes.ok) {
            const data = await todayRes.json();
            const today = new Date().toDateString();
            const count = data.data.filter((order: { created_at: string }) => new Date(order.created_at).toDateString() === today).length;
            setTodaysOrdersCount(count);
        } else {
            setTodaysOrdersCount(0);
        }

        if (pendingRes.ok) setPendingOrders((await pendingRes.json()).data.length); else setPendingOrders(0);
        if (processingRes.ok) setProcessingOrders((await processingRes.json()).data.length); else setProcessingOrders(0);

        if (completedRes.ok) {
            const data = await completedRes.json();
            const today = new Date().toDateString();
            const count = data.data.filter((order: { created_at: string }) => new Date(order.created_at).toDateString() === today).length;
            setCompletedOrders(count);
        } else {
            setCompletedOrders(0);
        }
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setTotalMenu(0);
        setMenuItems([]);
        setTotalCategories(0);
        setTodaysOrdersCount(0);
        setPendingOrders(0);
        setProcessingOrders(0);
        setCompletedOrders(0);
    }
  }, []);

  const fetchActiveOrders = React.useCallback(async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
          const dineInRes = await fetch("https://api.sejadikopi.com/api/pesanans?location_type=dine_in&status=pending,diproses");
          const takeawayRes = await fetch("https://api.sejadikopi.com/api/pesanans?location_type=takeaway&status=pending,diproses");

          if (dineInRes.ok) {
              const data = await dineInRes.json();
              setDineInOrders(data.data);
          } else {
              throw new Error('Failed to fetch dine-in orders');
          }

          if (takeawayRes.ok) {
              const data = await takeawayRes.json();
              setTakeawayOrders(data.data);
          } else {
              throw new Error('Failed to fetch takeaway orders');
          }
      } catch (error: any) {
          console.error("Failed to fetch active orders:", error);
          setOrdersError(error.message || "An unexpected error occurred.");
      } finally {
          setOrdersLoading(false);
      }
  }, []);

  React.useEffect(() => {
    fetchStatCounts();
    fetchActiveOrders();
  }, [fetchStatCounts, fetchActiveOrders]);

  const handleRefresh = () => {
      fetchStatCounts();
      fetchActiveOrders();
  }
  
  const renderOrderList = (orders: Order[], type: 'dine-in' | 'take-away') => {
      if (ordersLoading) {
          return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="h-64 animate-pulse bg-gray-200"></Card>
                ))}
             </div>
          )
      }
      if (ordersError) {
          return (
             <div className="flex flex-col items-center justify-center text-center py-16 text-red-500">
                <AlertTriangle className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold">Error Fetching Orders</h3>
                <p className="text-muted-foreground">{ordersError}</p>
             </div>
          )
      }
       if (orders.length > 0) {
          return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} menuItems={menuItems} />
                ))}
            </div>
          )
       }
       
       return (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <ClipboardList className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">Tidak Ada Pesanan {type === 'dine-in' ? 'Dine-in' : 'Take Away'}</h3>
                <p className="text-muted-foreground">
                    Saat ini tidak ada pesanan {type === 'dine-in' ? 'dine-in' : 'takeaway'} yang aktif
                </p>
            </div>
       )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Menu" 
          value={totalMenu !== null ? totalMenu.toString() : "..."} 
          icon={Utensils} 
          description="Semua kategori" 
          bgColor="bg-gradient-to-br from-yellow-400 to-amber-600" 
          textColor="text-white" 
        />
        <StatCard 
            title="Kategori Menu" 
            value={totalCategories !== null ? totalCategories.toString() : "..."} 
            icon={Layers} 
            description="Kategori aktif" 
            bgColor="bg-gradient-to-br from-yellow-400 to-amber-600" 
            textColor="text-white" 
        />
        <StatCard 
            title="Pesanan Hari Ini" 
            value={todaysOrdersCount !== null ? todaysOrdersCount.toString() : "..."} 
            icon={ClipboardList} 
            description="Total pesanan" 
            bgColor="bg-gradient-to-br from-yellow-400 to-amber-600" 
            textColor="text-white" 
        />
        <StatCard title="Pending" value={pendingOrders !== null ? pendingOrders.toString() : "..."} icon={Clock} description="Menunggu" bgColor="bg-yellow-400" textColor="text-white" />
        <StatCard title="Diproses" value={processingOrders !== null ? processingOrders.toString() : "..."} icon={Loader} description="Sedang diproses" bgColor="bg-blue-500" textColor="text-white" />
        <StatCard title="Selesai" value={completedOrders !== null ? completedOrders.toString() : "..."} icon={CheckCircle2} description="Selesai hari ini" bgColor="bg-green-500" textColor="text-white" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Status Pesanan</CardTitle>
            <div className="flex items-center gap-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="grid grid-cols-2 bg-gray-200 rounded-full">
                        <TabsTrigger value="dine-in" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-2">
                          Dine-in
                          <Badge className="bg-white/20 text-white rounded-full">{dineInOrders.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="take-away" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-2">
                          Take Away
                          <Badge className="bg-white/20 text-white rounded-full">{takeawayOrders.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
              <Button onClick={handleRefresh} variant="outline" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
