
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

type Transaction = {
    id: number;
    completed_at: string;
    created_at: string;
    no_meja: string;
    metode_pembayaran: string;
    total_after_discount: number;
}

const toRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

export const transactionColumns = (): ColumnDef<Transaction>[] => [
    {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => `#${row.getValue("id")}`
    },
    {
        accessorKey: "completed_at",
        header: "Tanggal",
        cell: ({ row }) => {
            const completedAt = row.getValue("completed_at") as string;
            const createdAt = row.original.created_at;
            const date = completedAt ? new Date(completedAt) : new Date(createdAt);
            return format(date, 'dd MMM yyyy, HH:mm');
        }
    },
    {
        accessorKey: "no_meja",
        header: "Meja/Pelanggan",
    },
    {
        accessorKey: "metode_pembayaran",
        header: "Metode",
        cell: ({ row }) => <div className="capitalize">{row.getValue("metode_pembayaran") || 'N/A'}</div>
    },
    {
        accessorKey: "total_after_discount",
        header: "Total",
        cell: ({ row }) => {
            const total = row.getValue("total_after_discount") as number;
            return <div className="text-right font-medium">{toRupiah(total || 0)}</div>
        }
    }
]
