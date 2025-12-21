
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Category } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import React from "react"

type StockColumnsProps = {
  onUpdateSuccess: () => void;
  categories: Category[];
}

export const columns = ({ onUpdateSuccess, categories }: StockColumnsProps): ColumnDef<MenuItem>[] => {
  const { toast } = useToast();
  
  const getCategoryName = (kategori_id: number) => {
    if (!categories) return 'N/A';
    const category = categories.find(c => c.id === kategori_id);
    return category ? category.nama : 'N/A';
  }

  const handleUpdateStock = async (menuItem: MenuItem, newStockLevel: number) => {
    try {
      const payload = {
        stok: newStockLevel,
      };

      const response = await fetch(`https://vamos-api-v2.sejadikopi.com/api/menus/${menuItem.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({...payload, _method: 'PUT'}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || 'Gagal memperbarui stok.');
      }

      toast({
        title: 'Sukses',
        description: `Stok untuk ${menuItem.nama} telah diperbarui.`,
      });
      onUpdateSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Tidak dapat memperbarui stok.',
      });
    }
  }

  const AvailabilityToggle: React.FC<{ menuItem: MenuItem }> = ({ menuItem }) => {
    const [isAvailable, setIsAvailable] = React.useState(menuItem.stok > 0);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [pendingState, setPendingState] = React.useState(isAvailable);
  
    React.useEffect(() => {
      setIsAvailable(menuItem.stok > 0);
    }, [menuItem.stok]);

    const handleCheckedChange = (checked: boolean) => {
      setPendingState(checked);
      setIsAlertOpen(true);
    };

    const confirmChange = () => {
      const newStock = pendingState ? 1000 : 0;
      handleUpdateStock(menuItem, newStock);
      setIsAvailable(pendingState);
      setIsAlertOpen(false);
    };

    return (
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <div className="flex items-center space-x-2 justify-end">
            <Label htmlFor={`stock-switch-${menuItem.id}`} className={isAvailable ? "text-green-600" : "text-red-600"}>
                {isAvailable ? 'Tersedia' : 'Habis'}
            </Label>
            <Switch
                id={`stock-switch-${menuItem.id}`}
                checked={isAvailable}
                onCheckedChange={handleCheckedChange}
                aria-readonly
            />
        </div>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
                Apakah Anda yakin ingin mengubah status "{menuItem.nama}" menjadi {pendingState ? 'Tersedia' : 'Habis'}?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                Ya, Lanjutkan
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };
  
  return [
    {
      accessorKey: "nama",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="pl-4">{row.getValue("nama")}</div>
    },
    {
      accessorKey: "kategori_id",
      header: "Kategori",
      cell: ({ row }) => {
        const kategori_id = row.getValue("kategori_id") as number;
        return getCategoryName(kategori_id);
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ketersediaan</div>,
      cell: ({ row }) => {
        const menuItem = row.original;
        return <AvailabilityToggle menuItem={menuItem} />;
      },
    },
  ]
}

    