
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"

type Expense = {
    id: number;
    kategori: string;
    deskripsi: string;
    jumlah: number;
    created_at: string;
    created_by: string;
}

type ExpenseColumnsProps = {
    onEdit: (expense: Expense) => void;
    onDelete: (id: number) => void;
}

const toRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

export const expenseColumns = ({ onEdit, onDelete }: ExpenseColumnsProps): ColumnDef<Expense>[] => [
    {
        accessorKey: "created_at",
        header: "Tanggal",
        cell: ({ row }) => format(new Date(row.getValue("created_at")), 'dd MMM yyyy')
    },
    {
        accessorKey: "kategori",
        header: "Kategori",
    },
    {
        accessorKey: "deskripsi",
        header: "Deskripsi",
    },
    {
        accessorKey: "jumlah",
        header: "Jumlah",
        cell: ({ row }) => toRupiah(row.getValue("jumlah"))
    },
    {
        accessorKey: "created_by",
        header: "Dibuat oleh",
    },
    {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
            const expense = row.original
            return (
                <div className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(expense)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(expense.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )
        }
    }
]
