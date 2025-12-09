
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { Order } from "@/lib/data"

// Align Transaction type with the full Order type
type Transaction = Order;

type TransactionColumnsProps = {
    onViewDetails: (transaction: Transaction) => void;
}


const toRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

export const transactionColumns = ({ onViewDetails }: TransactionColumnsProps): ColumnDef<Transaction>[] => [
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
        cell: ({ row }) => {
            const transaction = row.original;
            const method = transaction.metode_pembayaran;
            if (method === 'qris') {
                return `QRIS (${transaction.bank_qris || 'N/A'})`
            }
            return <div className="capitalize">{method || 'N/A'}</div>
        }
    },
    {
        accessorKey: "total_after_discount",
        header: "Total",
        cell: ({ row }) => {
            const total = row.getValue("total_after_discount") as number | null;
            return <div className="text-right font-medium">{toRupiah(total || parseInt(row.original.total, 10) || 0)}</div>
        }
    },
    {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
            const transaction = row.original
            return (
                <div className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(transaction)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Detail
                    </Button>
                </div>
            )
        }
    }
]
