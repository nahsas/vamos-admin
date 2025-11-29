import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { menuItems } from "@/lib/data";
import { PlusCircle } from "lucide-react";

export default function MenuPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage your coffee shop's menu.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>
      <DataTable columns={columns} data={menuItems} />
    </div>
  );
}
