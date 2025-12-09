
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
import { Discount } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type DiscountColumnsProps = {
  onEdit: (discount: Discount) => void;
  onDeleteSuccess: () => void;
}

export const columns = ({ onEdit, onDeleteSuccess }: DiscountColumnsProps): ColumnDef<Discount>[] => {
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`https://vamos-api.sejadikopi.com/api/discount-codes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Gagal menghapus diskon.");
      toast({ title: "Sukses", description: "Diskon berhasil dihapus." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Tidak dapat menghapus diskon." });
    }
  };

  return [
    {
      accessorKey: "code",
      header: "Kode",
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => <div className="capitalize">{row.getValue("type")}</div>,
    },
    {
      accessorKey: "value",
      header: "Nilai",
      cell: ({ row }) => {
        const discount = row.original;
        if (discount.type === 'percentage') {
          return `${discount.value}%`;
        }
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(discount.value);
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
        accessorKey: "valid_to",
        header: "Berlaku Hingga",
        cell: ({row}) => {
            const validTo = row.getValue("valid_to") as string | undefined;
            if (!validTo) return <span>-</span>;
            return format(new Date(validTo), "dd MMM yyyy");
        }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const discount = row.original
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
                <DropdownMenuItem onClick={() => onEdit(discount)}>
                   <Pencil className="mr-2 h-4 w-4" />
                  Ubah
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
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
                  Tindakan ini tidak bisa dibatalkan. Ini akan menghapus kode diskon secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(discount.id)}
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
