
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
import { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  is_available: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
}

export function CategoryForm({
  isOpen,
  onClose,
  onSuccess,
  category,
}: CategoryFormProps) {
  const { toast } = useToast();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      is_available: true,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        is_available: category.is_available,
      });
    } else {
       form.reset({
        name: '',
        is_available: true,
      });
    }
  }, [category, form, isOpen]);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const method = category ? 'PUT' : 'POST';
      const url = category
        ? `https://sejadikopi-api-v2.sejadikopi.com/api/categories/${category.id}`
        : 'https://sejadikopi-api-v2.sejadikopi.com/api/categories';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Gagal menyimpan kategori.');

      toast({
        title: 'Sukses',
        description: `Kategori berhasil ${category ? 'diperbarui' : 'dibuat'}.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Tidak dapat menyimpan kategori.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Ubah Kategori' : 'Buat Kategori'}</DialogTitle>
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
                    <Input placeholder="cth. Kopi" {...field} />
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
