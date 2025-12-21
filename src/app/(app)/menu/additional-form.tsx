
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Additional } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  price: z.coerce.number().min(0, 'Harga harus angka positif'),
  is_available: z.boolean(),
});

type AdditionalFormValues = z.infer<typeof formSchema>;

interface AdditionalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  additional: Additional | null;
}

export function AdditionalForm({
  isOpen,
  onClose,
  onSuccess,
  additional,
}: AdditionalFormProps) {
  const { toast } = useToast();
  const form = useForm<AdditionalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      is_available: true,
    },
  });

  useEffect(() => {
    if (additional) {
      form.reset({
        name: additional.name,
        price: additional.price,
        is_available: additional.is_available,
      });
    } else {
      form.reset({
        name: '',
        price: 0,
        is_available: true,
      });
    }
  }, [additional, form, isOpen]);

  const onSubmit = async (values: AdditionalFormValues) => {
    try {
      const method = additional ? 'PUT' : 'POST';
      const url = additional
        ? `https://vamos-api-v2.sejadikopi.com/api/additionals/${additional.id}`
        : 'https://vamos-api-v2.sejadikopi.com/api/additionals';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Gagal menyimpan item tambahan.');

      toast({
        title: 'Sukses',
        description: `Item tambahan berhasil ${additional ? 'diperbarui' : 'dibuat'}.`,
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak dapat menyimpan item tambahan.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{additional ? 'Ubah Tambahan' : 'Buat Tambahan'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="cth. Ekstra Shot" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Tersedia</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    