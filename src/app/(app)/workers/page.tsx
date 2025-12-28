
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import { PlusCircle, Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Worker } from '@/lib/types';
import { WorkerForm } from './worker-form';
import { columns as workerColumns } from "./columns";


export default function WorkersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isWorkerFormOpen, setIsWorkerFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('https://vamos.sejadikopi.com/api/v1/admin/workers');
      if (!response.ok) throw new Error('Gagal mengambil data pekerja');
      
      const data = await response.json();
      setWorkers(data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data pekerja", error);
      toast({ variant: "destructive", title: "Error", description: "Tidak dapat memuat data pekerja." });
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Akses Ditolak</div>;
  }
  
  const handleWorkerFormOpen = (worker: Worker | null = null) => {
    setEditingWorker(worker);
    setIsWorkerFormOpen(true);
  };

  const workerColumnsWithHandlers = workerColumns({ onEdit: handleWorkerFormOpen, onDeleteSuccess: fetchData });

  const filteredWorkers = workers.filter(worker => 
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <WorkerForm
        isOpen={isWorkerFormOpen}
        onClose={() => setIsWorkerFormOpen(false)}
        onSuccess={fetchData}
        worker={editingWorker}
      />

      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Manajemen Pekerja</h1>
        <p className="text-muted-foreground">Tambah, ubah, dan kelola semua data pekerja.</p>
      </div>
      
      <Card className="rounded-xl">
        <CardHeader>
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-grow">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Daftar Pekerja</h3>
                  <p className="text-sm text-muted-foreground">Kelola semua akun pekerja yang terdaftar.</p>
                </div>
              </div>
              <Button onClick={() => handleWorkerFormOpen()} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Pekerja
              </Button>
            </div>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NIP, atau email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          <DataTable 
            columns={workerColumnsWithHandlers} 
            data={filteredWorkers} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
