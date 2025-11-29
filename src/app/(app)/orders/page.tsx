import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { orders } from "@/lib/data";
import { PlusCircle } from "lucide-react";

export default function OrdersPage() {
  const activeOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage incoming and processing orders.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>
      <DataTable columns={columns} data={activeOrders} />
    </div>
  );
}
