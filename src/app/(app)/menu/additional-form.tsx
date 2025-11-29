
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
  nama: z.string().min(1, 'Name is required'),
  harga: z.coerce.number().min(0, 'Price must be a positive number'),
  is_active: z.boolean(),
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
      nama: '',
      harga: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (additional) {
      form.reset({
        nama: additional.nama,
        harga: additional.harga,
        is_active: additional.is_active,
      });
    } else {
      form.reset({
        nama: '',
        harga: 0,
        is_active: true,
      });
    }
  }, [additional, form]);

  const onSubmit = async (values: AdditionalFormValues) => {
    try {
      const method = additional ? 'PUT' : 'POST';
      const url = additional
        ? `https://api.sejadikopi.com/api/additionals/${additional.id}`
        : 'https://api.sejadikopi.com/api/additionals';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to save additional item.');

      toast({
        title: 'Success',
        description: `Additional item successfully ${additional ? 'updated' : 'created'}.`,
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save additional item.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{additional ? 'Edit Additional' : 'Create Additional'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Extra Shot" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="harga"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
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
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    