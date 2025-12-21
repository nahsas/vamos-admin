
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Star } from "lucide-react"
import { MenuItem } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"
import React from "react"

type BestSellerColumnsProps = {
  onUpdateSuccess: () => void;
}

export const columns = ({ onUpdateSuccess }: BestSellerColumnsProps): ColumnDef<MenuItem>[] => {
  const { toast } = useToast();

  const handleToggleBestSeller = async (menuItem: MenuItem, isBestSeller: boolean) => {
    try {
      const payload = { is_best_seller: isBestSeller };

      // API endpoint for updating menu isn't fully defined, assuming it exists
      const response = await fetch(`https://sejadikopi-api-v2.sejadikopi.com/api/menus/${menuItem.id}`, {
        method: 'POST', // using post for multipart
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({...payload, _method: 'PUT'}),
      });

      if (!response.ok) {
        throw new Error(`Gagal memperbarui status terlaris.`);
      }

      toast({
        title: 'Sukses',
        description: `${menuItem.name} telah ${isBestSeller ? 'ditambahkan ke' : 'dihapus dari'} menu terlaris.`,
      });
      onUpdateSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Tidak dapat memperbarui status item.',
      });
    }
  }

  const BestSellerToggle: React.FC<{ menuItem: MenuItem }> = ({ menuItem }) => {
    const [isBestSeller, setIsBestSeller] = React.useState(menuItem.is_best_seller);

    const handleClick = () => {
      const newStatus = !isBestSeller;
      setIsBestSeller(newStatus);
      handleToggleBestSeller(menuItem, newStatus);
    }
    
    return (
      <button onClick={handleClick} className="group">
        <Star className={cn(
          "h-6 w-6 text-gray-300 transition-all duration-200 group-hover:scale-125",
          isBestSeller ? "text-yellow-400 fill-yellow-400" : "group-hover:text-yellow-200"
        )} />
      </button>
    );
  };
  
  return [
    {
        accessorKey: "image",
        header: "Gambar",
        cell: ({ row }) => {
            const imageUrl = row.original.image;
            const fullUrl = imageUrl ? `https://sejadikopi-api-v2.sejadikopi.com/storage/${imageUrl}` : 'https://placehold.co/40x40/FFFAF0/6F4E37?text=Kopi';
            return <Image src={fullUrl} alt={row.getValue("name")} width={40} height={40} className="rounded-md object-cover" unoptimized />
        }
    },
    {
      accessorKey: "name",
      header: "Nama Menu",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Jadikan Terlaris</div>,
      cell: ({ row }) => {
        const menuItem = row.original;
        return (
          <div className="text-right">
            <BestSellerToggle menuItem={menuItem} />
          </div>
        );
      },
    },
  ]
}
