
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MenuItem } from '@/lib/data';
import { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  kategori_id: z.coerce.number().min(1, 'Kategori wajib diisi'),
  harga: z.coerce.number().min(0, 'Harga harus angka positif'),
  stok: z.coerce.number().min(0, 'Stok harus angka positif'),
  description: z.string().optional(),
  is_available: z.boolean(),
  is_recommendation: z.boolean(),
  image: z.any().optional(),
});

type MenuFormValues = z.infer<typeof formSchema>;

interface MenuFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuItem: MenuItem | null;
  categories: Category[];
}

export function MenuForm({
  isOpen,
  onClose,
  onSuccess,
  menuItem,
  categories,
}: MenuFormProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      kategori_id: undefined,
      harga: 0,
      stok: 0,
      description: '',
      is_available: true,
      is_recommendation: false,
    },
  });
  
  useEffect(() => {
    if (menuItem) {
      form.reset({
        nama: menuItem.nama,
        kategori_id: menuItem.kategori_id,
        harga: Number(menuItem.harga),
        stok: menuItem.stok || 0,
        description: menuItem.description || '',
        is_available: menuItem.is_available,
        is_recommendation: menuItem.is_recommendation,
      });
      if(menuItem.image_url) {
        setImagePreview(`https://api.sejadikopi.com/storage/${menuItem.image_url}`);
      } else {
        setImagePreview(null);
      }
    } else {
       form.reset({
        nama: '',
        kategori_id: undefined,
        harga: 0,
        stok: 0,
        description: '',
        is_available: true,
        is_recommendation: false,
      });
      setImagePreview(null);
    }
  }, [menuItem, form, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('image', file);
    }
  };

  const onSubmit = async (values: MenuFormValues) => {
    try {
      let imageUrl = menuItem?.image_url || '';

      if (values.image instanceof File) {
        const imageFormData = new FormData();
        imageFormData.append('image', values.image);
        imageFormData.append('folder', 'menu');
        const res = await fetch('https://api.sejadikopi.com/api/images/upload', {
            method: 'POST',
            body: imageFormData,
        });
        const uploadResult = await res.json();
        if (!res.ok) {
            throw new Error(uploadResult.message || 'Gagal mengunggah gambar');
        }
        imageUrl = uploadResult.data.path;
      }
      
      const payload: any = {
        ...values,
        image_url: imageUrl,
      };
      delete payload.image;

      const method = menuItem ? 'POST' : 'POST'; 
      const url = menuItem
        ? `https://api.sejadikopi.com/api/menu/${menuItem.id}`
        : 'https://api.sejadikopi.com/api/menu';
      
      const finalFormData = new FormData();
      for (const key in payload) {
          finalFormData.append(key, payload[key]);
      }
      if (menuItem) {
        finalFormData.append('_method', 'PUT');
      }

      const response = await fetch(url, {
        method,
        body: finalFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || 'Gagal menyimpan item menu.');
      }

      toast({
        title: 'Sukses',
        description: `Item menu berhasil ${menuItem ? 'diperbarui' : 'dibuat'}.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Tidak dapat menyimpan item menu. Endpoint mungkin tidak ada.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{menuItem ? 'Ubah Menu' : 'Buat Menu'}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto px-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. Espresso" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {imagePreview && (
                <div className="w-full h-40 relative">
                    <Image src={imagePreview} alt="Pratinjau Gambar" layout="fill" objectFit="cover" className="rounded-md" unoptimized />
                </div>
                )}
                <FormItem>
                <FormLabel>Gambar Menu</FormLabel>
                <FormControl>
                    <Input type="file" accept="image/*" onChange={handleImageChange} />
                </FormControl>
                <FormMessage />
                </FormItem>
                <FormField
                control={form.control}
                name="kategori_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value || '')}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.nama}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="harga"
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
                    name="stok"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stok</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Jelaskan item..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex items-center space-x-4">
                    <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
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
                    <FormField
                    control={form.control}
                    name="is_recommendation"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                        <div className="space-y-0.5">
                            <FormLabel>Direkomendasikan</FormLabel>
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
                </div>
                <DialogFooter className="sticky bottom-0 bg-background py-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button type="submit">Simpan</Button>
                </DialogFooter>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
