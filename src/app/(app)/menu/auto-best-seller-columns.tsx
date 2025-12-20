
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MenuItem } from "@/lib/data"
import Image from "next/image"

type BestSellerItem = {
  menu_id: number;
  total_sold: number;
  menu: MenuItem;
  rank: number;
}

export const columns: ColumnDef<BestSellerItem>[] = [
    {
        accessorKey: "rank",
        header: "#",
        cell: ({ row }) => <div className="font-bold text-lg text-muted-foreground">{row.original.rank}</div>,
    },
    {
        accessorKey: "menu.foto",
        header: "Gambar",
        cell: ({ row }) => {
            const imageUrl = row.original.menu.foto;
            const fullUrl = imageUrl ? `https://sejadikopi-api-v2.sejadikopi.com/storage/${imageUrl}` : 'https://placehold.co/40x40/FFFAF0/6F4E37?text=Kopi';
            return <Image src={fullUrl} alt={row.original.menu.nama} width={40} height={40} className="rounded-md object-cover" unoptimized />
        }
    },
    {
      accessorKey: "menu.nama",
      header: "Nama Menu",
      cell: ({ row }) => <div className="font-medium">{row.original.menu.nama}</div>,
    },
    {
      accessorKey: "total_sold",
      header: "Total Terjual",
      cell: ({ row }) => <div className="font-semibold">{row.original.total_sold}</div>,
    },
]
