
"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
} from "lucide-react";
import { orders, menuItems } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-md ${bgColor}`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground font-semibold">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({ order }: { order: (typeof orders)[0] }) {
  const getMenuItemName = (id: string) => {
    return menuItems.find((item) => item.id === id)?.name || "Unknown Item";
  };

  const statusVariant: { [key: string]: "default" | "destructive" | "outline" } = {
    Completed: 'outline',
    Cancelled: 'destructive'
  }

  const statusColor: { [key: string]: string } = {
    Completed: 'bg-yellow-400 text-yellow-900',
    Cancelled: 'bg-red-500 text-white'
  }


  return (
    <Card className="shadow-md border-l-4 border-yellow-400">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              {order.orderType === "Dine In"
                ? order.tableName
                : order.customerName}
              <Badge className={cn("text-xs", statusColor[order.status])}>{order.status}</Badge>
            </h3>
            <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">QRIS (BCA)</Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">Indoor</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(order.createdAt, "HH:mm")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(order.createdAt, "eeee, dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>

        <div className="border-t border-dashed pt-4">
          <div className="flex justify-between items-center text-sm font-medium mb-2">
            <h4>Detail Pesanan</h4>
            <span className="text-muted-foreground">{order.items.reduce((acc, item) => acc + item.quantity, 0)} item</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {order.items.slice(0, 2).map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{getMenuItemName(item.menuItemId)}</span>
                <span>x {item.quantity}</span>
              </div>
            ))}
             {order.items.length > 2 && (
                <div className="text-center text-xs text-primary pt-2">
                    + {order.items.length - 2} menu lainnya...
                </div>
            )}
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pembayaran:</span>
                <span className="font-bold text-base">Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}

export default function HistoryPage() {
  const pastOrders = orders.filter(
    (o) => o.status === "Completed" || o.status === "Cancelled"
  );
  const completedOrders = pastOrders.filter(
    (o) => o.status === "Completed"
  ).length;
  const cancelledOrders = pastOrders.filter(
    (o) => o.status === "Cancelled"
  ).length;
  const totalRevenue = pastOrders
    .filter((o) => o.status === "Completed")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari meja, pelanggan, atau item..."
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[120px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="destructive" className="bg-red-500 text-white">
          C
        </Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>Hari ini: {format(new Date(), "dd MMMM yyyy", { locale: id })}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="TOTAL TRANSAKSI"
          value={pastOrders.length.toString()}
          icon={Receipt}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          title="SELESAI"
          value={completedOrders.toString()}
          icon={CheckCircle}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="DIBATALKAN"
          value={cancelledOrders.toString()}
          icon={XCircle}
          bgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          title="TOTAL PENDAPATAN"
          value={`Rp ${totalRevenue.toLocaleString("id-ID")}`}
          icon={Wallet}
          bgColor="bg-yellow-400"
          iconColor="text-white"
        />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">History Transaksi Pembelian</h2>
        <Badge variant="secondary">{pastOrders.length} transaksi ditemukan</Badge>
      </div>

      <div className="space-y-4">
        {pastOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
