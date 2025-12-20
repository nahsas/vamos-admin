
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
import { useAuth } from "@/context/auth-context";

function StatCard({ title, value, icon: Icon, description, bgColor = "bg-white", textColor = "text-black" }: { title:string, value:string, icon: React.ElementType, description: string, bgColor?: string, textColor?: string }) {
  return (
    <Card className={cn("shadow-lg rounded-xl", bgColor, textColor)}>
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
  const { user } = useAuth();
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
            fetch("https://sejadikopi-api-v2.sejadikopi.com/api/menus"),
            fetch("https://sejadikopi-api-v2.sejadikopi.com/api/categories?select=nama"),
            fetch("https://sejadikopi-api-v2.sejadikopi.com/api/orders?select=id,created_at"),
            fetch("https://sejadikopi-api-v2.sejadikopi.com/api/orders?select=id&status=pending"),
            fetch("https://sejadikopi-api-v2.sejadikopi.com/api/orders?select=id&status=diproses,process"),
            fetch("https://sejadikopi-api-v2.sejadikopi.com/api/orders?select=id,created_at&status=selesai,completed")
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
        console.error("Gagal mengambil statistik dasbor:", error);
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
          const dineInRes = await fetch("https://sejadikopi-api-v2.sejadikopi.com/api/orders?type=dine_in&status=pending,process");
          const takeawayRes = await fetch("https://sejadikopi-api-v2.sejadikopi.com/api/orders?type=takeaway&status=pending,process");

          if (dineInRes.ok) {
              const data = await dineInRes.json();
              setDineInOrders(data.data);
          } else {
              throw new Error('Gagal mengambil pesanan dine-in');
          }

          if (takeawayRes.ok) {
              const data = await takeawayRes.json();
              setTakeawayOrders(data.data);
          } else {
              throw new Error('Gagal mengambil pesanan takeaway');
          }
      } catch (error: any) {
          console.error("Gagal mengambil pesanan aktif:", error);
          setOrdersError(error.message || "Terjadi kesalahan tak terduga.");
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
             <div className="grid gap-6 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="h-64 animate-pulse bg-gray-200 rounded-xl"></Card>
                ))}
             </div>
          )
      }
      if (ordersError) {
          return (
             <div className="flex flex-col items-center justify-center text-center py-16 text-red-500">
                <AlertTriangle className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold">Error Mengambil Pesanan</h3>
                <p className="text-muted-foreground">{ordersError}</p>
             </div>
          )
      }
       if (orders.length > 0) {
          return (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {user?.role === 'admin' ? (
              <>
                <StatCard 
                  title="Total Menu" 
                  value={totalMenu !== null ? totalMenu.toString() : "..."} 
                  icon={Utensils} 
                  description="Semua kategori" 
                  bgColor="bg-purple-600" 
                  textColor="text-white" 
                />
                <StatCard 
                    title="Kategori Menu" 
                    value={totalCategories !== null ? totalCategories.toString() : "..."} 
                    icon={Layers} 
                    description="Kategori aktif" 
                    bgColor="bg-gradient-to-tr from-purple-700 to-blue-700" 
                    textColor="text-white" 
                />
                <StatCard 
                    title="Pesanan Hari Ini" 
                    value={todaysOrdersCount !== null ? todaysOrdersCount.toString() : "..."} 
                    icon={ClipboardList} 
                    description="Total pesanan" 
                    bgColor="bg-blue-700" 
                    textColor="text-white" 
                />
              </>
            ) : (
              <>
                <StatCard title="Tertunda" value={pendingOrders !== null ? pendingOrders.toString() : "..."} icon={Clock} description="Menunggu" bgColor="bg-yellow-400" textColor="text-white" />
                <StatCard title="Diproses" value={processingOrders !== null ? processingOrders.toString() : "..."} icon={Loader} description="Sedang diproses" bgColor="bg-blue-500" textColor="text-white" />
                <StatCard title="Selesai" value={completedOrders !== null ? completedOrders.toString() : "..."} icon={CheckCircle2} description="Selesai hari ini" bgColor="bg-green-500" textColor="text-white" />
              </>
            )}
          </div>
        </CardContent>
      </Card>


      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Status Pesanan</h2>
        <Button onClick={handleRefresh} className="h-9 text-primary-foreground w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Segarkan
        </Button>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="space-y-4">
            <div className="flex justify-center">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="grid grid-cols-2 bg-gray-200 rounded-full p-1 h-auto">
                        <TabsTrigger value="dine-in" className="rounded-full data-[state=active]:bg-gradient-to-r from-blue-500 to-purple-600 data-[state=active]:text-white flex items-center gap-2 px-3 py-1.5">
                            Dine-in
                            <Badge className="bg-white text-blue-600 data-[state=inactive]:bg-primary-foreground/90 data-[state=inactive]:text-primary rounded-full h-6 w-6 flex items-center justify-center">{dineInOrders.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="take-away" className="rounded-full data-[state=active]:bg-gradient-to-r from-blue-500 to-purple-600 data-[state=active]:text-white flex items-center gap-2 px-3 py-1.5">
                            Take Away
                            <Badge className="bg-white text-blue-600 data-[state=inactive]:bg-primary-foreground/90 data-[state=inactive]:text-primary rounded-full h-6 w-6 flex items-center justify-center">{takeawayOrders.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
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
