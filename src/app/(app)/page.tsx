
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader, CalendarDays, Utensils, Layers, ClipboardList, RefreshCw } from "lucide-react";
import { orders, Order, menuItems } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  React.useEffect(() => {
    const fetchTotalMenu = async () => {
      try {
        const response = await fetch("https://api.sejadikopi.com/api/menu?select=nama");
        if (response.ok) {
          const data = await response.json();
          setTotalMenu(data.data.length);
        } else {
          setTotalMenu(0);
        }
      } catch (error) {
        console.error("Failed to fetch total menu:", error);
        setTotalMenu(0);
      }
    };

    fetchTotalMenu();
  }, []);


  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const processingOrders = orders.filter(o => o.status === 'Processing').length;
  const completedOrders = orders.filter(o => o.status === 'Completed' && new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
  const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
  
  const totalCategories = [...new Set(menuItems.map(item => item.category))].length;

  const activeOrders = orders.filter(
    (o) => o.status === "Pending" || o.status === "Processing"
  );
  
  const dineInOrders = activeOrders.filter(o => o.orderType === 'Dine In');
  const takeawayOrders = activeOrders.filter(o => o.orderType === 'Takeaway');


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
        <StatCard title="Kategori Menu" value={totalCategories.toString()} icon={Layers} description="Kategori aktif" bgColor="bg-gradient-to-br from-yellow-400 to-amber-600" textColor="text-white" />
        <StatCard title="Pesanan Hari Ini" value={todaysOrders.toString()} icon={ClipboardList} description="Total pesanan" bgColor="bg-gradient-to-br from-yellow-400 to-amber-600" textColor="text-white" />
        <StatCard title="Pending" value={pendingOrders.toString()} icon={Clock} description="Menunggu" bgColor="bg-yellow-400" textColor="text-white" />
        <StatCard title="Diproses" value={processingOrders.toString()} icon={Loader} description="Sedang diproses" bgColor="bg-blue-500" textColor="text-white" />
        <StatCard title="Selesai" value={completedOrders.toString()} icon={CheckCircle2} description="Selesai hari ini" bgColor="bg-green-500" textColor="text-white" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Status Pesanan</CardTitle>
            <div className="flex items-center gap-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="grid grid-cols-2 bg-gray-200 rounded-full">
                        <TabsTrigger value="dine-in" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white">Dine-in</TabsTrigger>
                        <TabsTrigger value="take-away" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white">Take Away</TabsTrigger>
                    </TabsList>
                </Tabs>
              <Button variant="outline" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dine-in">
              {dineInOrders.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Dine In orders would be mapped here */}
                 </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <ClipboardList className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">Tidak Ada Pesanan Dine-in</h3>
                  <p className="text-muted-foreground">
                    Saat ini tidak ada pesanan dine-in yang aktif
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="take-away">
              {takeawayOrders.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Takeaway orders would be mapped here */}
                 </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                     <ClipboardList className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">Tidak Ada Pesanan Take Away</h3>
                  <p className="text-muted-foreground">
                    Saat ini tidak ada pesanan takeaway yang aktif.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
