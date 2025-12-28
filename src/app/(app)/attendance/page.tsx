
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { DataTable } from "@/components/data-table";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CalendarCheck, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Attendance } from '@/lib/types';
import { columns as attendanceColumns } from "./columns";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AttendancePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const session = localStorage.getItem('sejadikopi-session');
      if (!session) throw new Error('Sesi tidak ditemukan');

      const { access_token } = JSON.parse(session);

      const response = await fetch(`https://vamos.sejadikopi.com/api/v1/admin/attendance/today?search=${searchTerm}`, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
      });
      if (!response.ok) throw new Error('Gagal mengambil data absensi');
      
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        setAttendance(data.data);
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data absensi", error);
      toast({ variant: "destructive", title: "Error", description: "Tidak dapat memuat data absensi." });
    } finally {
        setDataLoading(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const filteredAttendance = attendance.filter(att => 
    att.worker_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Laporan Absensi</h1>
        <p className="text-muted-foreground">Lihat laporan absensi harian semua pekerja.</p>
      </div>
      
      <Card className="rounded-xl">
        <CardHeader>
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-grow">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                  <CalendarCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Laporan Hari Ini</h3>
                  <p className="text-sm text-muted-foreground">Absensi untuk tanggal: {format(new Date(), "eeee, dd MMMM yyyy", { locale: id })}</p>
                </div>
              </div>
            </div>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama pekerja..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {dataLoading ? (
                <div className="text-center p-8">Memuat data absensi...</div>
            ) : (
                <DataTable 
                    columns={attendanceColumns} 
                    data={filteredAttendance} 
                />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
