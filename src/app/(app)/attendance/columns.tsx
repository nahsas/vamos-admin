
"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { format } from 'date-fns';
import { Attendance } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Attendance>[] = [
    {
        accessorKey: "worker_name",
        header: "Nama Pekerja",
    },
    {
        accessorKey: "clock_in_time",
        header: "Waktu Masuk",
        cell: ({ row }) => {
            const time = row.getValue("clock_in_time") as string | null;
            if (!time) return <Badge variant="secondary">Belum Absen</Badge>;
            return format(new Date(time), 'HH:mm:ss');
        }
    },
    {
        accessorKey: "clock_in_photo_url",
        header: "Foto Masuk",
        cell: ({ row }) => {
            const url = row.getValue("clock_in_photo_url") as string | null;
            if (!url) return "-";
            const fullUrl = `https://vamos-api-v2.sejadikopi.com/storage/${url}`;
            return <Image src={fullUrl} alt="Foto Masuk" width={50} height={50} className="rounded-md object-cover" unoptimized/>;
        }
    },
    {
        accessorKey: "clock_out_time",
        header: "Waktu Pulang",
        cell: ({ row }) => {
            const time = row.getValue("clock_out_time") as string | null;
            if (!time) return "-";
            return format(new Date(time), 'HH:mm:ss');
        }
    },
    {
        accessorKey: "clock_out_photo_url",
        header: "Foto Pulang",
        cell: ({ row }) => {
            const url = row.getValue("clock_out_photo_url") as string | null;
            if (!url) return "-";
            const fullUrl = `https://vamos-api-v2.sejadikopi.com/storage/${url}`;
            return <Image src={fullUrl} alt="Foto Pulang" width={50} height={50} className="rounded-md object-cover" unoptimized/>;
        }
    }
]
