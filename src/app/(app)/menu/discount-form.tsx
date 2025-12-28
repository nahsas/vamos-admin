
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Discount } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Nama diskon wajib diisi'),
  value: z.coerce.number().min(0, 'Nilai harus angka positif'),
  is_percentage: z.boolean().default(false),
  is_available: z.boolean().default(true),
});

type DiscountFormValues = z.infer<typeof formSchema>;

interface DiscountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  discount: Discount | null;
}

export function DiscountForm({
  isOpen,
  onClose,
  onSuccess,
  discount,
}: DiscountFormProps) {
  const { toast } = useToast();
  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      value: 0,
      is_percentage: false,
      is_available: true,
    },
  });

  useEffect(() => {
    if (discount) {
      form.reset({
        name: discount.name,
        value: discount.value,
        is_percentage: discount.is_percentage,
        is_available: discount.is_available,
      });
    } else {
      form.reset({
        name: '',
        value: 0,
        is_percentage: false,
        is_available: true,
      });
    }
  }, [discount, form, isOpen]);

  const onSubmit = async (values: DiscountFormValues) => {
    try {
      const method = discount ? 'PUT' : 'POST';
      const url = discount
        ? `https://vamos-api-v2.sejadikopi.com/api/discounts/${discount.id}`
        : 'https://vamos-api-v2.sejadikopi.com/api/discounts';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Gagal menyimpan diskon.');

      toast({
        title: 'Sukses',
        description: `Diskon berhasil ${discount ? 'diperbarui' : 'dibuat'}.`,
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak dapat menyimpan diskon.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{discount ? 'Ubah Diskon' : 'Buat Diskon'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Diskon</FormLabel>
                  <FormControl>
                    <Input placeholder="cth. DISKONRAMADAN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Isi angka saja. Jika tipe persentase, isi 10 untuk 10%. Jika tetap, isi 10000 untuk Rp 10.000.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_percentage"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Tipe Persentase</FormLabel>
                     <FormDescription>
                        Aktifkan jika diskon berupa persentase (%).
                     </FormDescription>
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
