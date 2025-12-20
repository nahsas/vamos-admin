
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
import { Additional } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

type AdditionalColumnsProps = {
  onEdit: (additional: Additional) => void;
  onDeleteSuccess: () => void;
}

export const columns = ({ onEdit, onDeleteSuccess }: AdditionalColumnsProps): ColumnDef<Additional>[] => {
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    // NOTE: DELETE /additionals/{id} is not in api.json.
    // Assuming it's missing and implementing optimistically
    try {
      const response = await fetch(`https://sejadikopi-api-v2.sejadikopi.com/api/additionals/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Gagal menghapus item tambahan. Endpoint tidak ada.");
      toast({ title: "Sukses", description: "Item tambahan berhasil dihapus." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Tidak dapat menghapus item tambahan." });
    }
  };

  return [
    {
      accessorKey: "nama",
      header: "Nama",
    },
    {
      accessorKey: "harga",
      header: "Harga",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("harga"));
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(price);
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
          const isActive = row.getValue("is_active");
          return <Badge variant={isActive ? "outline" : "secondary"}>{isActive ? 'Aktif' : 'Tidak Aktif'}</Badge>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const additional = row.original
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
                <DropdownMenuItem onClick={() => onEdit(additional)}>
                   <Pencil className="mr-2 h-4 w-4" />
                  Ubah
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" disabled>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak bisa dibatalkan. Ini akan menghapus item tambahan secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(additional.id)}
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
