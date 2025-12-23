
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react"
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
import { Category, Variant, Additional } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import React from "react"
import { cn } from "@/lib/utils"

type MenuColumnsProps = {
  onEdit: (menuItem: MenuItem) => void;
  onDeleteSuccess: () => void;
  categories: Category[];
  variants: Variant[];
  additionals: Additional[];
}

const ToggleSwitch = ({
  item,
  field,
  onUpdate,
  trueIcon: TrueIcon,
  falseIcon: FalseIcon
}: {
  item: MenuItem,
  field: 'is_available' | 'is_best_seller',
  onUpdate: (id: number, data: Partial<MenuItem>) => void,
  trueIcon: React.ElementType,
  falseIcon: React.ElementType
}) => {
  const [isChecked, setIsChecked] = React.useState(item[field]);

  const handleToggle = (checked: boolean) => {
    setIsChecked(checked);
    onUpdate(item.id, { [field]: checked });
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Switch
        checked={isChecked}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
      />
      {isChecked ? (
        <TrueIcon className="h-5 w-5 text-green-500" />
      ) : (
        <FalseIcon className="h-5 w-5 text-red-500" />
      )}
    </div>
  );
};


export const columns = ({ onEdit, onDeleteSuccess, categories, variants, additionals }: MenuColumnsProps): ColumnDef<MenuItem>[] => {
  const { toast } = useToast();

  const getCategoryName = (categoryId: number) => {
    if (!categories) return 'N/A';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
  }
  
  const getLinkedNames = (ids: number[], source: (Variant | Additional)[]) => {
    if (!ids || ids.length === 0 || !source) return [];
    return ids.map(id => source.find(item => item.id === id)?.name).filter(Boolean) as string[];
  }


  const handleUpdate = async (id: number, data: Partial<MenuItem>) => {
    try {
      const response = await fetch(`https://vamos-api-v2.sejadikopi.com/api/menus/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, _method: 'PUT' }),
      });
      if (!response.ok) {
        throw new Error('Gagal memperbarui status menu.');
      }
      toast({ title: "Sukses", description: "Status menu berhasil diperbarui." });
      onDeleteSuccess(); // Re-fetch data
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Tidak dapat memperbarui status." });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`https://vamos-api-v2.sejadikopi.com/api/menus/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Gagal menghapus item menu.' }));
        throw new Error(errorData.message);
      }
      toast({ title: "Sukses", description: "Item menu berhasil dihapus." });
      onDeleteSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Tidak dapat menghapus item menu." });
    }
  };
  
  return [
    {
        accessorKey: "image",
        header: "Gambar",
        cell: ({ row }) => {
            const imageUrl = row.original.image;
            const fullUrl = imageUrl ? `https://vamos-api-v2.sejadikopi.com/api/images?path=${imageUrl}` : 'https://placehold.co/40x40/FFFAF0/6F4E37?text=Kopi';
            return <Image src={fullUrl} alt={row.getValue("name")} width={40} height={40} className="rounded-md object-cover" unoptimized />
        }
    },
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "category_id",
      header: "Kategori",
      cell: ({ row }) => {
        const categoryId = row.getValue("category_id") as number;
        return getCategoryName(categoryId);
      }
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Harga</div>,
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"))
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(price)

        return <div className="text-right font-medium">{formatted}</div>
      },
    },
     {
      accessorKey: "variant_ids",
      header: "Varian Terhubung",
      cell: ({ row }) => {
        const variantIds = row.original.variant_ids || [];
        const variantNames = getLinkedNames(variantIds, variants);
        if (variantNames.length === 0) return <span>-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {variantNames.map(name => (
              <Badge key={name} variant="secondary">{name}</Badge>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: "additional_ids",
      header: "Tambahan Terhubung",
      cell: ({ row }) => {
        const additionalIds = row.original.additional_ids || [];
        const additionalNames = getLinkedNames(additionalIds, additionals);
        if (additionalNames.length === 0) return <span>-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {additionalNames.map(name => (
              <Badge key={name} variant="outline" className="bg-purple-100 text-purple-800">{name}</Badge>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: "is_available",
      header: "Tersedia",
      cell: ({ row }) => (
        <ToggleSwitch 
          item={row.original} 
          field="is_available" 
          onUpdate={handleUpdate}
          trueIcon={CheckCircle}
          falseIcon={XCircle}
        />
      ),
    },
    {
      accessorKey: "is_best_seller",
      header: "Terlaris",
      cell: ({ row }) => (
        <ToggleSwitch 
          item={row.original} 
          field="is_best_seller" 
          onUpdate={handleUpdate}
          trueIcon={CheckCircle}
          falseIcon={XCircle}
        />
      ),
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
