
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

  const handleUpdateStock = async (menuItem: MenuItem, isAvailable: boolean) => {
    try {
      const payload = {
        is_available: isAvailable,
      };

      const response = await fetch(`https://api.sejadikopi.com/api/menu/${menuItem.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
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
          const isAvailable = row.original.is_available;
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
                    <Button variant="destructive" size="sm" disabled={!menuItem.is_available}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Tandai Habis
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ini akan menandai "{menuItem.nama}" sebagai Habis.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUpdateStock(menuItem, false)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Ya, Tandai Habis
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="outline" size="sm" className="bg-green-600 text-white hover:bg-green-700 hover:text-white" disabled={menuItem.is_available}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Tandai Tersedia
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                           Ini akan menandai "{menuItem.nama}" sebagai Tersedia.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUpdateStock(menuItem, true)}
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
