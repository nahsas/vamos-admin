
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
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  kategori_id: z.coerce.number().min(1, 'Kategori wajib diisi'),
  harga: z.coerce.number().min(0, 'Harga harus angka positif'),
  description: z.string().optional(),
  image: z.any().optional(),
  kategori_struk: z.enum(['makanan', 'minuman']),
  available_variants: z.array(z.string()).optional(),
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
      description: '',
      kategori_struk: 'makanan',
      available_variants: [],
    },
  });

  const kategoriStruk = form.watch('kategori_struk');
  
  useEffect(() => {
    let variants: string[] = [];
    if (menuItem?.available_variants) {
      try {
        // The value from API is a string like "['Hot','Ice']"
        const parsed = JSON.parse(menuItem.available_variants.replace(/'/g, '"'));
        if(Array.isArray(parsed)) {
          variants = parsed;
        }
      } catch(e) {
        console.error("Failed to parse available_variants", e);
      }
    }

    if (menuItem) {
      form.reset({
        nama: menuItem.nama,
        kategori_id: menuItem.kategori_id,
        harga: Number(menuItem.harga),
        description: menuItem.description || '',
        kategori_struk: menuItem.kategori_struk || 'makanan',
        available_variants: variants,
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
        description: '',
        kategori_struk: 'makanan',
        available_variants: [],
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
        available_variants: JSON.stringify(values.available_variants).replace(/"/g, "'"),
        is_available: true, 
        is_recommendation: false,
        stok: 1000,
      };
      delete payload.image;

      const method = menuItem ? 'PUT' : 'POST'; 
      const url = menuItem
        ? `https://api.sejadikopi.com/api/menu/${menuItem.id}`
        : 'https://api.sejadikopi.com/api/menu';
      
      const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
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
        description: error.message || 'Tidak dapat menyimpan item menu.',
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
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="kategori_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Kategori Menu</FormLabel>
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
                     <FormField
                        control={form.control}
                        name="kategori_struk"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Kategori Struk</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori struk" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="minuman">Minuman</SelectItem>
                                <SelectItem value="makanan">Makanan</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>

                <FormItem>
                    <FormLabel>Harga</FormLabel>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">Rp</span>
                        <FormField
                        control={form.control}
                        name="harga"
                        render={({ field }) => (
                            <FormControl>
                                <Input type="number" className="pl-8" {...field} />
                            </FormControl>
                        )}
                        />
                    </div>
                    <FormMessage />
                </FormItem>

                {kategoriStruk === 'minuman' && (
                    <FormField
                    control={form.control}
                    name="available_variants"
                    render={() => (
                        <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">Varian</FormLabel>
                            <FormDescription>
                                Pilih varian yang tersedia untuk minuman ini.
                            </FormDescription>
                        </div>
                        <div className="flex gap-4">
                        {['Hot', 'Ice'].map((item) => (
                            <FormField
                                key={item}
                                control={form.control}
                                name="available_variants"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), item])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item
                                                )
                                            )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {item}
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}

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
