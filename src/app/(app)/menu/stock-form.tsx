
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
  DialogDescription,
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
import { MenuItem } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  stok: z.coerce.number().min(0, 'Stock must be a non-negative number'),
});

type StockFormValues = z.infer<typeof formSchema>;

interface StockFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuItem: MenuItem | null;
}

export function StockForm({
  isOpen,
  onClose,
  onSuccess,
  menuItem,
}: StockFormProps) {
  const { toast } = useToast();
  const form = useForm<StockFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stok: 0,
    },
  });

  useEffect(() => {
    if (menuItem) {
      form.reset({
        stok: (menuItem as any).stok || 0,
      });
    }
  }, [menuItem, form]);

  const onSubmit = async (values: StockFormValues) => {
    if (!menuItem) return;

    try {
      // The API requires the full object for a PUT request, not just the stock.
      // We spread the original item and override the stock and availability.
      const fullMenuItemData = {
        ...menuItem,
        stok: values.stok,
        is_available: values.stok > 0,
        harga: Number(menuItem.harga) // Ensure price is a number
      };

      const response = await fetch(`https://api.sejadikopi.com/api/menu/${menuItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullMenuItemData),
      });

      if (!response.ok) {
        console.error("Failed to update stock:", await response.json());
        throw new Error('Failed to update stock.');
      }

      toast({
        title: 'Success',
        description: `Stock for ${menuItem.nama} has been updated.`,
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update stock.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            Update the stock quantity for {menuItem?.nama}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Stock</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
