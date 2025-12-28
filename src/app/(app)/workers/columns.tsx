
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
import { Worker } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

type WorkerColumnsProps = {
  onEdit: (worker: Worker) => void;
  onDeleteSuccess: () => void;
}

export const columns = ({ onEdit, onDeleteSuccess }: WorkerColumnsProps): ColumnDef<Worker>[] => {
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`https://vamos-api-v2.sejadikopi.com/api/v1/admin/workers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Gagal menghapus pekerja.");
      toast({ title: "Sukses", description: "Pekerja berhasil dihapus." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Tidak dapat menghapus pekerja." });
    }
  };

  return [
    {
      accessorKey: "nip",
      header: "NIP",
    },
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Telepon",
    },
    {
      accessorKey: "position",
      header: "Posisi",
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
        const worker = row.original
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
                <DropdownMenuItem onClick={() => onEdit(worker)}>
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
                  Tindakan ini tidak bisa dibatalkan. Ini akan menghapus data pekerja secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(worker.id)}
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
