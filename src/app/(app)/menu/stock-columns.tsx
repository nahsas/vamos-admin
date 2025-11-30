
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MenuItem } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

type StockColumnsProps = {
  onEdit: (menuItem: MenuItem) => void;
  onUpdateSuccess: () => void;
}

export const columns = ({ onEdit, onUpdateSuccess }: StockColumnsProps): ColumnDef<MenuItem>[] => {
  const { toast } = useToast();

  const handleMarkAsSold = async (menuItem: MenuItem) => {
    try {
      const fullMenuItemData = {
        ...menuItem,
        stok: 0,
        is_available: false,
        harga: Number(menuItem.harga)
      };

      const response = await fetch(`https://api.sejadikopi.com/api/menu/${menuItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullMenuItemData),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as sold.');
      }

      toast({
        title: 'Success',
        description: `${menuItem.nama} has been marked as sold out.`,
      });
      onUpdateSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update stock.',
      });
    }
  }
  
  return [
    {
      accessorKey: "nama",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="pl-4">{row.getValue("nama")}</div>
    },
    {
      accessorKey: "kategori",
      header: "Category",
      cell: ({ row }) => {
        const menuItem = row.original as any;
        return menuItem.kategori ? menuItem.kategori.nama : 'N/A';
      }
    },
    {
      accessorKey: "stok",
      header: () => <div className="text-right">Stock</div>,
      cell: ({ row }) => {
        const stock = row.getValue("stok") as number;
        return <div className="text-right font-medium">{stock}</div>
      },
    },
    {
        accessorKey: "is_available",
        header: "Availability",
        cell: ({ row }) => {
          const stock = row.original.stok as number;
          const isAvailable = stock > 0;
          return <Badge variant={isAvailable ? "outline" : "secondary"}>{isAvailable ? "Available" : "Sold Out"}</Badge>
        }
      },
    {
      id: "actions",
      cell: ({ row }) => {
        const menuItem = row.original
        return (
            <AlertDialog>
              <div className="text-right space-x-2">
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={menuItem.stok === 0}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Mark as Sold
                    </Button>
                  </AlertDialogTrigger>
                  <Button onClick={() => onEdit(menuItem)} size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Stock
                  </Button>
              </div>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will set the stock for "{menuItem.nama}" to 0. This action can be reversed by manually updating the stock.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleMarkAsSold(menuItem)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, Mark as Sold
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        )
      },
    },
  ]
}
