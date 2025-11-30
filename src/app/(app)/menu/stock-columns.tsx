
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, XCircle, CheckCircle } from "lucide-react"
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
import { Category } from "@/lib/types"

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

  const handleUpdateStock = async (menuItem: MenuItem, newStock: number) => {
    try {
      const fullMenuItemData = new FormData();
      fullMenuItemData.append('nama', menuItem.nama);
      fullMenuItemData.append('kategori_id', String(menuItem.kategori_id));
      fullMenuItemData.append('harga', String(menuItem.harga));
      fullMenuItemData.append('stok', String(newStock));
      fullMenuItemData.append('is_available', newStock > 0 ? '1' : '0');
      fullMenuItemData.append('is_recommendation', String(menuItem.is_recommendation ? 1: 0));
      fullMenuItemData.append('description', menuItem.description || '');


      const response = await fetch(`https://api.sejadikopi.com/api/menu/${menuItem.id}`, {
        method: 'PUT',
        body: fullMenuItemData,
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui stok.');
      }

      toast({
        title: 'Sukses',
        description: `Stok untuk ${menuItem.nama} telah diperbarui.`,
      });
      onUpdateSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak dapat memperbarui stok.',
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
      accessorKey: "stok",
      header: () => <div className="text-right">Stok</div>,
      cell: ({ row }) => {
        const stock = row.original.stok as number;
        return <div className="text-right font-medium">{stock || 0}</div>
      },
    },
    {
        accessorKey: "is_available",
        header: "Ketersediaan",
        cell: ({ row }) => {
          const stock = row.original.stok as number;
          const isAvailable = stock > 0;
          return <Badge variant={isAvailable ? "outline" : "secondary"}>{isAvailable ? "Tersedia" : "Habis"}</Badge>
        }
      },
    {
      id: "actions",
      cell: ({ row }) => {
        const menuItem = row.original
        return (
            <div className="text-right space-x-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={(menuItem.stok || 0) === 0}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Tandai Habis
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ini akan mengatur stok untuk "{menuItem.nama}" menjadi 0.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUpdateStock(menuItem, 0)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Ya, Tandai Habis
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="outline" size="sm" className="bg-green-600 text-white hover:bg-green-700 hover:text-white">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Tandai Tersedia
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Ini akan mengatur stok untuk "{menuItem.nama}" menjadi 1000.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUpdateStock(menuItem, 1000)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Ya, Tandai Tersedia
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        )
      },
    },
  ]
}
