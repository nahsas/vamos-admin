

"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Camera, Folder, Calendar as CalendarIcon, Download, Filter, Check, RotateCcw, Wallet, DollarSign, Receipt, LineChart, ShoppingCart, Landmark, Grip, RefreshCw, Plus, UploadCloud, Search } from "lucide-react"
import { format, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/data-table";
import { transactionColumns } from "./transaction-columns";
import { expenseColumns } from "./expense-columns";
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
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Order, MenuItem } from "@/lib/data"
import { OrderDetailModal } from "@/components/ui/order-detail-modal"
import * as XLSX from 'xlsx';


const ReportStatCard = ({
  title,
  value,
  date,
  icon,
  bgColor,
  textColor,
  rightIcon
}: {
  title: string;
  value: string;
  date?: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  rightIcon?: React.ReactNode;
}) => (
  <Card className={cn(bgColor, textColor, "rounded-xl shadow-lg")}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {icon}
            <span>{title}</span>
          </div>
          <div className="text-3xl font-bold">{value}</div>
          {date && (
            <div className="flex items-center gap-2 text-xs">
              <CalendarIcon className="h-4 w-4" />
              <span>{date}</span>
            </div>
          )}
        </div>
        {rightIcon && <div className="p-3 bg-white/20 rounded-lg">{rightIcon}</div>}
      </div>
    </CardContent>
  </Card>
);

const PaymentBreakdownCard = ({
    title,
    amount,
    transactions,
    icon,
}: {
    title: string;
    amount: string;
    transactions: number | string;
    icon: React.ReactNode;
}) => (
    <Card className="bg-background/50 rounded-xl">
        <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-md text-primary-foreground">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="font-bold text-primary-foreground">{amount}</p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground">{transactions} {typeof transactions === 'number' && 'transaksi'}</p>
        </CardContent>
    </Card>
)

const expenseFormSchema = z.object({
  id: z.string().optional(),
  kategori: z.string().min(1, 'Kategori wajib diisi'),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  jumlah: z.coerce.number().min(1, 'Jumlah harus lebih dari 0'),
  tanggal: z.string(),
  image: z.any().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

function ExpenseForm({ isOpen, onClose, onSuccess, userEmail, expense }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, userEmail: string, expense: any | null }) {
    const { toast } = useToast();
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const galleryInputRef = React.useRef<HTMLInputElement>(null);
    const cameraInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema),
        defaultValues: {
            kategori: 'Operasional',
            deskripsi: '',
            jumlah: 0,
            tanggal: format(new Date(), 'yyyy-MM-dd'),
            image: null,
        },
    });

    React.useEffect(() => {
        const defaultDate = format(new Date(), 'yyyy-MM-dd');
        if (expense) {
             form.reset({
                id: expense.id,
                kategori: expense.kategori,
                deskripsi: expense.deskripsi,
                jumlah: expense.jumlah,
                tanggal: format(new Date(expense.tanggal), 'yyyy-MM-dd'),
                image: null,
            });
            if(expense.bukti_url) {
                setImagePreview(`https://vamos-api.sejadikopi.com/storage/${expense.bukti_url}`);
            } else {
                setImagePreview(null);
            }
        } else {
             form.reset({
                kategori: 'Operasional',
                deskripsi: '',
                jumlah: 0,
                tanggal: defaultDate,
                id: `EXP-${Date.now()}`,
                image: null,
            });
            setImagePreview(null);
        }
    }, [expense, form, isOpen]);

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

    const onSubmit = async (values: ExpenseFormValues) => {
    try {
      let imageUrl = expense?.bukti_url || '';

      const imageFile = form.getValues('image');
      if (imageFile instanceof File) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        imageFormData.append('folder', 'expenses');

        const imageUploadRes = await fetch('https://vamos-api.sejadikopi.com/api/images/upload', {
          method: 'POST',
          body: imageFormData,
        });

        if (!imageUploadRes.ok) {
          throw new Error('Gagal mengunggah gambar.');
        }

        const imageUploadResult = await imageUploadRes.json();
        imageUrl = imageUploadResult.data.path;
      }

      const method = expense ? 'PUT' : 'POST';
      const url = expense
        ? `https://vamos-api.sejadikopi.com/api/pengeluarans/${expense.id}`
        : 'https://vamos-api.sejadikopi.com/api/pengeluarans';
      
      const payload = {
        id: values.id || `EXP-${Date.now()}`,
        kategori: values.kategori,
        deskripsi: values.deskripsi,
        jumlah: values.jumlah,
        tanggal: values.tanggal,
        created_by: userEmail,
        bukti_url: imageUrl,
        foto_url: imageUrl,
      };
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server responded with an error:", errorData);
        throw new Error(errorData.message || 'Gagal menyimpan pengeluaran.');
      }

      toast({
        title: 'Sukses',
        description: `Pengeluaran berhasil ${expense ? 'diperbarui' : 'ditambahkan'}.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{expense ? 'Ubah Pengeluaran' : 'Tambah Pengeluaran'}</DialogTitle>
                    <DialogDescription>Isi detail pengeluaran baru di bawah ini.</DialogDescription>
                </DialogHeader>
                <div className="px-6 max-h-[70vh] overflow-y-auto">
                  <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                  <FormField control={form.control} name="kategori" render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Kategori</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl>
                                                  <SelectTrigger>
                                                      <SelectValue placeholder="Pilih kategori" />
                                                  </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                  <SelectItem value="Bahan Baku">Bahan Baku</SelectItem>
                                                  <SelectItem value="Gaji Karyawan">Gaji Karyawan</SelectItem>
                                                  <SelectItem value="Operasional">Operasional</SelectItem>
                                                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                                              </SelectContent>
                                          </Select>
                                          <FormMessage />
                                      </FormItem>
                                  )} />
                                  <FormField control={form.control} name="deskripsi" render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Deskripsi</FormLabel>
                                          <FormControl>
                                              <Textarea placeholder="cth. Pembelian biji kopi Arabica 5kg" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )} />
                                  <FormField control={form.control} name="jumlah" render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Jumlah (Rp)</FormLabel>
                                          <FormControl><Input type="number" placeholder="cth. 15000" {...field} /></FormControl>
                                          <FormMessage />
                                          <p className="text-xs text-muted-foreground">Input angka saja, format otomatis.</p>
                                      </FormItem>
                                  )} />
                              </div>
                              <div className="space-y-2">
                                  <FormLabel>Foto Bukti (Opsional, Max 50MB)</FormLabel>
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-full flex flex-col justify-center items-center text-center">
                                      {imagePreview ? (
                                          <div className="relative w-full h-48 mb-4">
                                              <img src={imagePreview} alt="Pratinjau Bukti" className="rounded-md object-cover w-full h-full" />
                                          </div>
                                      ) : (
                                          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                                              <UploadCloud className="w-12 h-12 mb-2" />
                                              <p className="font-semibold">Pilih foto bukti pengeluaran</p>
                                          </div>
                                      )}
                                      <input
                                          type="file"
                                          ref={galleryInputRef}
                                          className="hidden"
                                          accept="image/*"
                                          onChange={handleImageChange}
                                      />
                                      <input
                                          type="file"
                                          ref={cameraInputRef}
                                          className="hidden"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={handleImageChange}
                                      />
                                      <div className="flex gap-4 mt-4">
                                          <Button type="button" onClick={() => cameraInputRef.current?.click()}>
                                              <Camera className="mr-2 h-4 w-4" /> Kamera
                                          </Button>
                                          <Button type="button" variant="secondary" className="bg-green-600 text-white hover:bg-green-700" onClick={() => galleryInputRef.current?.click()}>
                                              <Folder className="mr-2 h-4 w-4" /> Galeri
                                          </Button>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-2">Format: JPG, PNG, WEBP (Max 50MB). Foto akan dikompres otomatis.</p>
                                  </div>
                              </div>
                          </div>
                      </form>
                  </Form>
                </div>
                <DialogFooter className="p-6 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                    <Button type="submit" onClick={form.handleSubmit(onSubmit)}>Simpan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [startDate, setStartDate] = React.useState<Date | undefined>(startOfDay(new Date()));
  const [endDate, setEndDate] = React.useState<Date | undefined>(endOfDay(new Date()));
  const [paymentMethod, setPaymentMethod] = React.useState<string>("all");

  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  
  const [dataLoading, setDataLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  const [isExpenseFormOpen, setIsExpenseFormOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<any | null>(null);

  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  const [transactionSearch, setTransactionSearch] = React.useState("");
  const [expenseSearch, setExpenseSearch] = React.useState("");
  
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setDataLoading(true);
    let allTransactions: any[] = [];
    setExpenses([]);
    try {
        const sDate = startDate ? format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss") : '';
        const eDate = endDate ? format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss") : '';
        
        const sDateOnly = startDate ? format(startDate, 'yyyy-MM-dd') : '';
        const eDateOnly = endDate ? format(endDate, 'yyyy-MM-dd') : '';

        const transactionUrl = new URL('https://vamos-api.sejadikopi.com/api/pesanans');
        transactionUrl.searchParams.set('status', 'selesai');
        if(sDate) transactionUrl.searchParams.set('created_from', sDate);
        if(eDate) transactionUrl.searchParams.set('created_to', eDate);
        
        const fetchMethod = paymentMethod.startsWith('qris') ? 'qris' : paymentMethod;
        if (fetchMethod !== 'all') {
            transactionUrl.searchParams.set('metode_pembayaran', fetchMethod);
        }

        const expenseUrl = new URL('https://vamos-api.sejadikopi.com/api/pengeluarans');
        if(sDateOnly) expenseUrl.searchParams.set('tanggal_from', sDateOnly);
        if(eDateOnly) expenseUrl.searchParams.set('tanggal_to', eDateOnly);
        expenseUrl.searchParams.set('order', 'tanggal.desc');
        
        const [transactionRes, expenseRes, menuRes] = await Promise.all([
            fetch(transactionUrl.toString()),
            fetch(expenseUrl.toString()),
            fetch('https://vamos-api.sejadikopi.com/api/menu'),
        ]);

        if (transactionRes.ok) {
            const data = await transactionRes.json();
            allTransactions = data.data || [];
        }

        if (expenseRes.ok) {
            const data = await expenseRes.json();
            setExpenses(data.data || []);
        } else {
            setExpenses([]);
        }

        if (menuRes.ok) {
            const menuData = await menuRes.json();
            setMenuItems(menuData.data || []);
        } else {
            setMenuItems([]);
        }

        if (paymentMethod.startsWith('qris-')) {
            const bank = paymentMethod.split('-')[1];
            setTransactions(
                allTransactions.filter(t => t.bank_qris && t.bank_qris.toLowerCase().includes(bank))
            );
        } else {
            setTransactions(allTransactions);
        }

    } catch (error) {
        console.error("Gagal mengambil data laporan:", error);
        toast({ variant: "destructive", title: "Error", description: "Tidak dapat memuat data laporan." });
        setTransactions([]);
    } finally {
        setDataLoading(false);
    }
  }, [startDate, endDate, paymentMethod, toast]);

  React.useEffect(() => {
    if (user && ['admin', 'kasir'].includes(user.role)) {
      fetchData();
    }
  }, [user, fetchData]);

  React.useEffect(() => {
    if (!loading && user && !['admin', 'kasir'].includes(user.role)) {
      router.push('/');
    }
  }, [user, loading, router]);


  if (loading || !user || !['admin', 'kasir'].includes(user.role)) {
    return <div className="flex items-center justify-center h-screen">Akses Ditolak</div>;
  }
  
  const handleApplyFilter = () => {
    fetchData();
  };
  
  const handleResetFilter = () => {
    setStartDate(startOfDay(new Date()));
    setEndDate(endOfDay(new Date()));
    setPaymentMethod("all");
    setTimeout(fetchData, 100);
  };
  
  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsExpenseFormOpen(true);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseFormOpen(true);
  };

  const handleViewTransactionDetails = (transaction: Order) => {
    setSelectedOrder(transaction);
    setIsDetailModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return;
    try {
        const response = await fetch(`https://vamos-api.sejadikopi.com/api/pengeluarans/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Gagal menghapus pengeluaran.');
        toast({ title: 'Sukses', description: 'Pengeluaran berhasil dihapus.' });
        fetchData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  }

    const toRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_after_discount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const paymentBreakdown = transactions.reduce((acc, t) => {
        const method = t.metode_pembayaran || 'unknown';
        const bank = t.bank_qris || 'other';
        
        if (method === 'cash') {
            acc.cash.amount += t.total_after_discount || 0;
            acc.cash.count += 1;
        } else if (method === 'qris') {
            acc.qris.amount += t.total_after_discount || 0;
            acc.qris.count += 1;
            
            if (bank && bank.toLowerCase().includes('bca')) {
                acc.qris_bca.amount += t.total_after_discount || 0;
                acc.qris_bca.count += 1;
            } else if (bank && bank.toLowerCase().includes('bri')) {
                acc.qris_bri.amount += t.total_after_discount || 0;
                acc.qris_bri.count += 1;
            } else if (bank && bank.toLowerCase().includes('bsi')) {
                acc.qris_bsi.amount += t.total_after_discount || 0;
                acc.qris_bsi.count += 1;
            }
        }
        return acc;
    }, {
        cash: { amount: 0, count: 0 },
        qris: { amount: 0, count: 0 },
        qris_bca: { amount: 0, count: 0 },
        qris_bri: { amount: 0, count: 0 },
        qris_bsi: { amount: 0, count: 0 },
    });
  
    const pittyCash = 1000000;
    const setoran = paymentBreakdown.cash.amount - totalExpenses;

    const filterDateRangeStr = `${startDate ? format(startDate, 'd MMM yyyy') : ''} - ${endDate ? format(endDate, 'd MMM yyyy') : ''}`;

    const handleExport = () => {
        setExporting(true);
        
        // 1. Summary Sheet
        const summaryData = [
        ["Laporan Pembukuan Sejadi Kopi"],
        [`Periode: ${filterDateRangeStr}`],
        [],
        ["RINGKASAN UMUM"],
        ["Total Pendapatan", totalRevenue],
        ["Total Pengeluaran", totalExpenses],
        ["Laba Bersih", netProfit],
        ["Margin Laba", `${margin.toFixed(2)}%`],
        ["Total Transaksi", transactions.length],
        [],
        ["RINCIAN PEMBAYARAN"],
        ["Metode", "Jumlah Transaksi", "Total Nominal"],
        ["Pitty Cash", "", pittyCash],
        ["Tunai", paymentBreakdown.cash.count, paymentBreakdown.cash.amount],
        ["Setoran", "", setoran],
        ["QRIS (Semua)", paymentBreakdown.qris.count, paymentBreakdown.qris.amount],
        ["QRIS (BCA)", paymentBreakdown.qris_bca.count, paymentBreakdown.qris_bca.amount],
        ["QRIS (BRI)", paymentBreakdown.qris_bri.count, paymentBreakdown.qris_bri.amount],
        ["QRIS (BSI)", paymentBreakdown.qris_bsi.count, paymentBreakdown.qris_bsi.amount],
        ];
        const summary_ws = XLSX.utils.aoa_to_sheet(summaryData);

        // 2. Transactions Sheet
        const transactionsData = transactions.map(t => ({
        "ID": t.id,
        "Tanggal": format(new Date(t.completed_at || t.created_at), 'dd MMM yyyy, HH:mm'),
        "Meja/Pelanggan": t.no_meja,
        "Metode": `${t.metode_pembayaran}${t.metode_pembayaran === 'qris' ? ` (${t.bank_qris || 'N/A'})` : ''}`,
        "Total": t.total,
        "Diskon": t.discount_amount || 0,
        "Total Akhir": t.total_after_discount,
        }));
        const transactions_ws = XLSX.utils.json_to_sheet(transactionsData);

        // 3. Expenses Sheet
        const expensesData = expenses.map(e => ({
            "Tanggal": format(new Date(e.tanggal), 'dd MMM yyyy'),
            "Kategori": e.kategori,
            "Deskripsi": e.deskripsi,
            "Jumlah": e.jumlah,
            "Dibuat oleh": e.created_by
        }));
        const expenses_ws = XLSX.utils.json_to_sheet(expensesData);
        
        // Create workbook and append sheets
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, summary_ws, "Ringkasan");
        XLSX.utils.book_append_sheet(wb, transactions_ws, "Riwayat Transaksi");
        XLSX.utils.book_append_sheet(wb, expenses_ws, "Riwayat Pengeluaran");

        // Write file and trigger download
        XLSX.writeFile(wb, "Laporan_Pembukuan.xlsx");

        setExporting(false);
    };

    const filteredExpenses = expenses.filter(e =>
      e.kategori.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.deskripsi.toLowerCase().includes(expenseSearch.toLowerCase())
    );

    const filteredTransactions = transactions.filter(t =>
      t.id.toString().includes(transactionSearch) ||
      t.no_meja.toLowerCase().includes(transactionSearch.toLowerCase())
    );

    const memoizedExpenseColumns = React.useMemo(() => expenseColumns({ onEdit: handleEditExpense, onDelete: handleDeleteExpense }), [expenses]);
    const memoizedTransactionColumns = React.useMemo(() => transactionColumns({ onViewDetails: handleViewTransactionDetails }), [transactions]);


  return (
    <div className="space-y-8">
      {isExpenseFormOpen && user && <ExpenseForm isOpen={isExpenseFormOpen} onClose={() => setIsExpenseFormOpen(false)} onSuccess={fetchData} userEmail={user.email} expense={editingExpense}/>}
      <OrderDetailModal 
        order={selectedOrder}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        menuItems={menuItems}
        onOrderDeleted={fetchData}
      />

      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Pembukuan</h1>
        <p className="text-muted-foreground">Analisis penjualan dan kinerja Anda.</p>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="p-3 rounded-md bg-yellow-100">
                <Filter className="w-5 h-5 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Filter Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 items-end gap-4">
                <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            <SelectValue placeholder="Semua Metode" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Metode</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="qris">QRIS (Semua)</SelectItem>
                        <SelectItem value="qris-bca">QRIS (BCA)</SelectItem>
                        <SelectItem value="qris-bri">QRIS (BRI)</SelectItem>
                        <SelectItem value="qris-bsi">QRIS (BSI)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-4">
            <Button onClick={handleApplyFilter} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                <Check className="mr-2 h-4 w-4" /> Terapkan
            </Button>
            <Button variant="secondary" onClick={handleResetFilter} className="bg-slate-500 hover:bg-slate-600 text-white font-bold">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleExport} disabled={exporting}>
                {exporting ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Mengekspor...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </>
                )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <ReportStatCard
            title="Total Pendapatan"
            value={toRupiah(totalRevenue)}
            date={filterDateRangeStr}
            icon={<DollarSign className="h-5 w-5" />}
            bgColor="bg-blue-500"
            textColor="text-white"
            rightIcon={<Landmark className="h-6 w-6" />}
          />
           <ReportStatCard
            title="Setoran"
            value={toRupiah(setoran)}
            icon={<Landmark className="h-5 w-5" />}
            bgColor="bg-green-500"
            date={"Uang yang harus di setor"}
            textColor="text-white"
            rightIcon={<Wallet className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Total Pengeluaran"
            value={toRupiah(totalExpenses)}
            date={filterDateRangeStr}
            icon={<Receipt className="h-5 w-5" />}
            bgColor="bg-purple-500"
            textColor="text-white"
            rightIcon={<Receipt className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Laba Bersih"
            value={toRupiah(netProfit)}
            date={`Margin: ${margin.toFixed(1)}%`}
            icon={<LineChart className="h-5 w-5" />}
            bgColor="bg-orange-500"
            textColor="text-white"
            rightIcon={<LineChart className="h-6 w-6" />}
          />
        </div>

        <div>
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/20 rounded-md">
                    <Wallet className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Rincian Pembayaran</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <PaymentBreakdownCard title="Pitty Cash" amount={toRupiah(pittyCash)} transactions="Kas tetap" icon={<Wallet className="h-6 w-6"/>} />
                <PaymentBreakdownCard title="Tunai" amount={toRupiah(paymentBreakdown.cash.amount)} transactions={paymentBreakdown.cash.count} icon={<Landmark className="h-6 w-6"/>} />
                <PaymentBreakdownCard title="QRIS (Semua)" amount={toRupiah(paymentBreakdown.qris.amount)} transactions={paymentBreakdown.qris.count} icon={<Grip className="h-6 w-6"/>} />
                <PaymentBreakdownCard title="QRIS BCA" amount={toRupiah(paymentBreakdown.qris_bca.amount)} transactions={paymentBreakdown.qris_bca.count} icon={<Grip className="h-6 w-6"/>} />
                <PaymentBreakdownCard title="QRIS BRI" amount={toRupiah(paymentBreakdown.qris_bri.amount)} transactions={paymentBreakdown.qris_bri.count} icon={<Grip className="h-6 w-6"/>} />
                <PaymentBreakdownCard title="QRIS BSI" amount={toRupiah(paymentBreakdown.qris_bsi.amount)} transactions={paymentBreakdown.qris_bsi.count} icon={<Grip className="h-6 w-6"/>} />
            </div>
        </div>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle className="text-xl">Pelacakan Pengeluaran</CardTitle>
                <p className="text-sm text-muted-foreground">Cari berdasarkan kategori atau deskripsi.</p>
            </div>
            <div className="w-full md:w-auto md:max-w-xs">
                 <Input
                  placeholder="Cari pengeluaran..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="w-full bg-blue-500 hover:bg-blue-600 text-white border-none" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Segarkan
                </Button>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={handleAddExpense}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="text-center h-24 flex items-center justify-center">Memuat data...</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <DataTable columns={memoizedExpenseColumns} data={filteredExpenses} />
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="rounded-xl">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle className="text-xl">Riwayat Transaksi</CardTitle>
                <p className="text-sm text-muted-foreground">Cari berdasarkan ID transaksi atau nama meja/pelanggan.</p>
            </div>
            <div className="w-full md:w-auto md:max-w-xs">
                <Input
                  placeholder="Cari transaksi..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="w-full"
                />
            </div>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="text-center h-48 flex items-center justify-center">Memuat data...</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <DataTable columns={memoizedTransactionColumns} data={filteredTransactions} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
