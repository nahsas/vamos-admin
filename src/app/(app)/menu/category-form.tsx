
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
  nama: z.string().min(1, 'Nama wajib diisi'),
  urutan: z.coerce.number().int().min(0, 'Urutan harus berupa angka positif'),
  support_additional: z.boolean(),
  support_dimsum_additional: z.boolean(),
}).refine(data => !(data.support_additional && data.support_dimsum_additional), {
  message: "Hanya salah satu jenis 'support' yang dapat diaktifkan pada satu waktu.",
  path: ["support_additional"], 
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
      nama: '',
      urutan: 0,
      support_additional: false,
      support_dimsum_additional: false,
    },
  });

  const supportAdditional = form.watch('support_additional');
  const supportDimsumAdditional = form.watch('support_dimsum_additional');

  useEffect(() => {
    if (category) {
      form.reset({
        nama: category.nama,
        urutan: category.urutan || 0,
        support_additional: category.support_additional || false,
        support_dimsum_additional: category.support_dimsum_additional || false,
      });
    } else {
       form.reset({
        nama: '',
        urutan: 0,
        support_additional: false,
        support_dimsum_additional: false,
      });
    }
  }, [category, form, isOpen]);

  const onSubmit = async (values: CategoryFormValues) => {
    // NOTE: The API spec does not provide POST/PUT for /categories with these fields.
    // Assuming it's missing and implementing optimistically.
    try {
      const method = category ? 'PUT' : 'POST';
      const url = category
        ? `https://vamos-api.sejadikopi.com/api/categories/${category.id}`
        : 'https://vamos-api.sejadikopi.com/api/categories';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Gagal menyimpan kategori. Endpoint tidak ada atau payload salah.');

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
  
  const handleSwitchChange = (field: 'support_additional' | 'support_dimsum_additional', value: boolean) => {
      form.setValue(field, value);
      if (value) {
          const otherField = field === 'support_additional' ? 'support_dimsum_additional' : 'support_additional';
          form.setValue(otherField, false);
      }
      form.clearErrors('support_additional');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Ubah Kategori' : 'Buat Kategori'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="nama"
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
                name="urutan"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Urutan</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="cth. 1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="support_additional"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Mendukung Tambahan</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(value) => handleSwitchChange('support_additional', value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="support_dimsum_additional"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Mendukung Tambahan Dimsum</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                       checked={field.value}
                       onCheckedChange={(value) => handleSwitchChange('support_dimsum_additional', value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.formState.errors.support_additional && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.support_additional.message}</p>
            )}

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
