
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MenuItem } from "@/lib/data"
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
import Image from "next/image"
import { Category } from "@/lib/types"

type MenuColumnsProps = {
  onEdit: (menuItem: MenuItem) => void;
  onDeleteSuccess: () => void;
  categories: Category[];
}

export const columns = ({ onEdit, onDeleteSuccess, categories }: MenuColumnsProps): ColumnDef<MenuItem>[] => {
  const { toast } = useToast();

  const getCategoryName = (kategori_id: number) => {
    if (!categories) return 'N/A';
    const category = categories.find(c => c.id === kategori_id);
    return category ? category.nama : 'N/A';
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`https://api.sejadikopi.com/api/menu/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Gagal menghapus item menu.");
      toast({ title: "Sukses", description: "Item menu berhasil dihapus." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Tidak dapat menghapus item menu." });
    }
  };
  
  return [
    {
        accessorKey: "image_url",
        header: "Gambar",
        cell: ({ row }) => {
            const imageUrl = row.getValue("image_url") as string;
            const fullUrl = imageUrl ? `https://api.sejadikopi.com/storage/${imageUrl}` : 'https://placehold.co/40x40/FFFAF0/6F4E37?text=Kopi';
            return <Image src={fullUrl} alt={row.getValue("nama")} width={40} height={40} className="rounded-md object-cover" />
        }
    },
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
      accessorKey: "harga",
      header: () => <div className="text-right">Harga</div>,
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("harga"))
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(price)

        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "is_available",
      header: "Ketersediaan",
      cell: ({ row }) => {
        const isAvailable = row.getValue("is_available")
        return <Badge variant={isAvailable ? "outline" : "secondary"}>{isAvailable ? "Tersedia" : "Habis"}</Badge>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const menuItem = row.original
        return (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Buka menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(menuItem)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Ubah item
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus item
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak bisa dibatalkan. Ini akan menghapus item menu secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(menuItem.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]
}
