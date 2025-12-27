
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MenuItem } from '@/lib/data';
import { Category, Additional, Variant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  category_id: z.coerce.number().min(1, 'Kategori wajib diisi'),
  price: z.coerce.number().min(0, 'Harga harus angka positif'),
  image: z.any().optional(),
  description: z.string().optional(),
  kategori_struk: z.enum(['main', 'bar']).default('main'),
  is_available: z.boolean().default(true),
  is_best_seller: z.boolean().default(false),
  variant_ids: z.array(z.number()).optional(),
  additional_ids: z.array(z.number()).optional(),
});

type MenuFormValues = z.infer<typeof formSchema>;

interface MenuFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuItem: MenuItem & { variants?: any[], additionals?: any[] } | null;
  categories: Category[];
  additionals: Additional[];
  variants: Variant[];
}

export function MenuForm({
  isOpen,
  onClose,
  onSuccess,
  menuItem,
  categories,
  additionals,
  variants,
}: MenuFormProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category_id: undefined,
      price: 0,
      description: '',
      kategori_struk: 'main',
      is_available: true,
      is_best_seller: false,
      variant_ids: [],
      additional_ids: [],
    },
  });
  
  useEffect(() => {
    if (menuItem) {
      const variantIds = menuItem.variants?.map(v => v.id) || [];
      const additionalIds = menuItem.additionals?.map(a => a.id) || [];
      
      form.reset({
        name: menuItem.name,
        category_id: menuItem.category_id,
        price: Number(menuItem.price),
        description: menuItem.description || '',
        kategori_struk: menuItem.kategori_struk || 'main',
        is_available: menuItem.is_available,
        is_best_seller: menuItem.is_best_seller,
        variant_ids: variantIds,
        additional_ids: additionalIds,
      });
      if(menuItem.image) {
        setImagePreview(menuItem.image);
      } else {
        setImagePreview(null);
      }
    } else {
       form.reset({
        name: '',
        category_id: undefined,
        price: 0,
        description: '',
        kategori_struk: 'main',
        is_available: true,
        is_best_seller: false,
        variant_ids: [],
        additional_ids: [],
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
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('category_id', values.category_id.toString());
    formData.append('price', values.price.toString());
    formData.append('description', values.description || '');
    formData.append('kategori_struk', values.kategori_struk);
    formData.append('is_available', values.is_available ? '1' : '0');
    formData.append('is_best_seller', values.is_best_seller ? '1' : '0');
    
    if (values.image instanceof File) {
      formData.append('image', values.image);
    }

    if (values.variant_ids && values.variant_ids.length > 0) {
      values.variant_ids.forEach((id) => {
        formData.append('variant_ids[]', id.toString());
      });
    } else {
      formData.append('variant_ids', ''); // Send empty if none selected
    }
    
    if (values.additional_ids && values.additional_ids.length > 0) {
      values.additional_ids.forEach((id) => {
        formData.append('additional_ids[]', id.toString());
      });
    } else {
      formData.append('additional_ids', ''); // Send empty if none selected
    }
    
    try {
      const method = 'POST';
      let url = 'https://vamos-api-v2.sejadikopi.com/api/menus';
      if(menuItem) {
        url = `https://vamos-api-v2.sejadikopi.com/api/menus/${menuItem.id}`;
        formData.append('_method', 'PUT');
      }
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{menuItem ? 'Ubah Menu' : 'Buat Menu'}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto px-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama Menu</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. Kopi Susu Gula Aren" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
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
                      name="description"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Deskripsi</FormLabel>
                          <FormControl>
                              <Input placeholder="cth. Perpaduan kopi dan susu..." {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                     <FormField
                      control={form.control}
                      name="category_id"
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
                                  {cat.name}
                                  </SelectItem>
                              ))}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                    />

                    <FormItem>
                        <FormLabel>Harga</FormLabel>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">Rp</span>
                            <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormControl>
                                    <Input type="number" className="pl-8" {...field} />
                                </FormControl>
                            )}
                            />
                        </div>
                        <FormMessage />
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="kategori_struk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipe Struk</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe struk" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="main">Main Checker</SelectItem>
                              <SelectItem value="bar">Bar Checker</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                     <div className='flex gap-4'>
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
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="variant_ids"
                      render={() => (
                        <FormItem className="rounded-lg border p-3 shadow-sm">
                          <div className="mb-2">
                            <FormLabel className="text-base">Varian Terhubung</FormLabel>
                            <FormDescription>
                              Pilih varian yang berlaku untuk item ini.
                            </FormDescription>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                            {variants.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="variant_ids"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), item.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal flex-1">
                                        {item.name} (+{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.price)})
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

                     <FormField
                      control={form.control}
                      name="additional_ids"
                      render={() => (
                        <FormItem className="rounded-lg border p-3 shadow-sm">
                          <div className="mb-2">
                            <FormLabel className="text-base">Tambahan Terhubung</FormLabel>
                            <FormDescription>
                              Pilih item tambahan untuk menu ini.
                            </FormDescription>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                            {additionals.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="additional_ids"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), item.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal flex-1">
                                        {item.name} (+{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.price)})
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
                </div>
              </form>
            </Form>
        </div>
        <DialogFooter className="p-6 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
