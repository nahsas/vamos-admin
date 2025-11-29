
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
import { orders } from "@/lib/data";
import {
  Users,
  Wallet,
  ShoppingCart,
  Search,
  Filter,
  RefreshCw,
  ClipboardList,
  Badge,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
        <div className="p-3 bg-amber-400/20 rounded-md">
          <Icon className="w-8 h-8 text-amber-600" />
        </div>
        <p className="text-sm text-muted-foreground font-semibold">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = React.useState("dine-in");

  const activeOrders = orders.filter(
    (o) => o.status === "Pending" || o.status === "Processing"
  );
  
  const dineInOrders = activeOrders.filter(o => o.orderType === 'Dine In');
  const takeawayOrders = activeOrders.filter(o => o.orderType === 'Takeaway');

  const totalTransactions = activeOrders.reduce((sum, order) => sum + order.total, 0)
    .toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

  const totalItems = activeOrders.reduce((sum, order) => sum + order.items.length, 0);

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="MEJA TERISI" value={dineInOrders.length.toString()} icon={Users} />
        <StatCard title="TOTAL TRANSAKSI" value={totalTransactions} icon={Wallet} />
        <StatCard title="TOTAL ITEM" value={totalItems.toString()} icon={ShoppingCart} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle>Detail List Meja Terisi</CardTitle>
            <div className="flex items-center gap-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="dine-in" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white">Dine-in</TabsTrigger>
                        <TabsTrigger value="take-away" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white">Take Away</TabsTrigger>
                    </TabsList>
                </Tabs>
              <Badge variant="outline" className="h-9">
                {activeOrders.length} pesanan aktif
              </Badge>
              <Button variant="outline" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
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
                  <h3 className="text-xl font-bold">Belum Ada Pesanan Dine-in</h3>
                  <p className="text-muted-foreground">
                    Saat ini tidak ada meja yang terisi
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
                  <h3 className="text-xl font-bold">Belum Ada Pesanan Take Away</h3>
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
