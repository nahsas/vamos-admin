
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const settingsSchema = z.object({
  pitty_cash: z.coerce.number().int().min(0, "Pitty cash tidak boleh negatif"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function PengaturanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [initialSettings, setInitialSettings] = React.useState<any>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      pitty_cash: 0,
    }
  });

  const fetchData = React.useCallback(async () => {
    setDataLoading(true);
    try {
      const response = await fetch('https://vamos-api-v2.sejadikopi.com/api/settings');
      if (!response.ok) throw new Error("Gagal mengambil data pengaturan.");
      const data = await response.json();
      setInitialSettings(data);
      reset({ pitty_cash: data.pitty_cash || 0 });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat pengaturan.' });
    } finally {
      setDataLoading(false);
    }
  }, [reset, toast]);

  React.useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading, fetchData]);

  React.useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data: SettingsFormValues) => {
    if (!initialSettings) return;
    setIsSubmitting(true);
    try {
        const payload = {
            pitty_cash: data.pitty_cash,
            is_open: initialSettings.is_open,
            is_auto_best_seller: initialSettings.is_auto_best_seller,
        };
        const response = await fetch('https://vamos-api-v2.sejadikopi.com/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Gagal menyimpan pengaturan.');
        toast({ title: 'Sukses', description: 'Pengaturan berhasil disimpan.' });
        fetchData(); // re-fetch to update state
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan pengaturan.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center h-screen">Memuat Pengaturan...</div>;
  }
  
  if (user?.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Akses Ditolak</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan umum untuk aplikasi Vamos POS.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto rounded-xl">
          <CardHeader>
            <CardTitle>Pengaturan Umum</CardTitle>
            <CardDescription>Atur nilai-nilai dasar untuk operasional kedai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Controller
                  name="pitty_cash"
                  control={control}
                  render={({ field }) => (
                     <div>
                        <Label htmlFor="pitty-cash">Pitty Cash (Kas Kecil)</Label>
                        <Input
                            id="pitty-cash"
                            type="number"
                            placeholder="Masukkan jumlah kas kecil"
                            {...field}
                        />
                        {errors.pitty_cash && <p className="text-sm font-medium text-destructive pt-2">{errors.pitty_cash.message}</p>}
                        <p className="text-sm text-muted-foreground pt-2">
                            Jumlah uang tunai awal yang tersedia di kasir setiap hari.
                        </p>
                    </div>
                  )}
                />
            </div>
          </CardContent>
           <CardContent className="pt-0 flex justify-end">
             <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Simpan Pengaturan
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
