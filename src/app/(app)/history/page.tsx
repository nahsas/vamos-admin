import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { orders } from "@/lib/data";

export default function HistoryPage() {
  const pastOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Cancelled');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Order History</h1>
        <p className="text-muted-foreground">A comprehensive log of all past orders.</p>
      </div>
      <DataTable columns={columns} data={pastOrders} />
    </div>
  );
}
