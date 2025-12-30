
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"

type Expense = {
    id: number;
    title: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    created_by: number;
}

type ExpenseColumnsProps = {
    onEdit: (expense: Expense) => void;
    onDelete: (id: number) => void;
}

const toRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

export const expenseColumns = ({ onEdit, onDelete }: ExpenseColumnsProps): ColumnDef<Expense>[] => [
    {
        accessorKey: "date",
        header: "Tanggal",
        cell: ({ row }) => format(new Date(row.getValue("date")), 'dd MMM yyyy')
    },
    {
        accessorKey: "type",
        header: "Kategori",
    },
    {
        accessorKey: "title",
        header: "Deskripsi",
         cell: ({ row }) => {
            const expense = row.original;
            return (
                <div className="max-w-[200px] truncate" title={expense.description || expense.title}>
                    {expense.title}
                </div>
            )
        }
    },
    {
        accessorKey: "amount",
        header: () => <div className="text-right">Jumlah</div>,
        cell: ({ row }) => <div className="text-right">{toRupiah(row.getValue("amount"))}</div>,
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
