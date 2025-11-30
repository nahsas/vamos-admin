
"use client"

import * as React from "react"
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Download, Filter, Check, RotateCcw, Wallet, DollarSign, Receipt, LineChart, ShoppingCart, Landmark, Grip, RefreshCw, Plus } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast"

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
    borderColor
}: {
    title: string;
    amount: string;
    transactions: number;
    icon: React.ReactNode;
    borderColor: string;
}) => (
    <Card className={cn("bg-card border-2", borderColor)}>
        <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-md">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="font-bold text-primary">{amount}</p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground">{transactions} transaksi</p>
        </CardContent>
    </Card>
)

const expenseFormSchema = z.object({
  kategori: z.string().min(1, 'Kategori wajib diisi'),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  jumlah: z.coerce.number().min(1, 'Jumlah harus lebih dari 0'),
  created_by: z.string(), // Hidden field
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

function ExpenseForm({ isOpen, onClose, onSuccess, userEmail, expense }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, userEmail: string, expense: any | null }) {
    const { toast } = useToast();
    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema),
        defaultValues: expense ? {
            kategori: expense.kategori,
            deskripsi: expense.deskripsi,
            jumlah: expense.jumlah,
            created_by: userEmail,
        } : {
            kategori: '',
            deskripsi: '',
            jumlah: 0,
            created_by: userEmail,
        },
    });

    React.useEffect(() => {
        form.reset(expense ? {
            kategori: expense.kategori,
            deskripsi: expense.deskripsi,
            jumlah: expense.jumlah,
            created_by: userEmail,
        } : {
            kategori: '',
            deskripsi: '',
            jumlah: 0,
            created_by: userEmail,
        });
    }, [expense, userEmail, form]);

    const onSubmit = async (values: ExpenseFormValues) => {
        try {
            const method = expense ? 'PUT' : 'POST';
            const url = expense
                ? `https://api.sejadikopi.com/api/pengeluarans/${expense.id}`
                : 'https://api.sejadikopi.com/api/pengeluarans';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) throw new Error('Gagal menyimpan pengeluaran.');

            toast({ title: 'Sukses', description: `Pengeluaran berhasil ${expense ? 'diperbarui' : 'ditambahkan'}.` });
            onSuccess();
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{expense ? 'Ubah Pengeluaran' : 'Tambah Pengeluaran'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="kategori" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kategori</FormLabel>
                                <FormControl><Input placeholder="cth. Bahan Baku" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="deskripsi" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Deskripsi</FormLabel>
                                <FormControl><Input placeholder="cth. Pembelian biji kopi" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="jumlah" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jumlah</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [startDate, setStartDate] = React.useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = React.useState<Date | undefined>(endOfMonth(new Date()));
  const [paymentMethod, setPaymentMethod] = React.useState<string>("all");

  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  
  const [dataLoading, setDataLoading] = React.useState(true);

  const [isExpenseFormOpen, setIsExpenseFormOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<any | null>(null);
  
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setDataLoading(true);
    setTransactions([]);
    setExpenses([]);
    try {
        const sDate = startDate ? format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss") : '';
        const eDate = endDate ? format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss") : '';
        const sDateOnly = startDate ? format(startDate, 'yyyy-MM-dd') : '';
        const eDateOnly = endDate ? format(endDate, 'yyyy-MM-dd') : '';

        const transactionUrl = new URL('https://api.sejadikopi.com/api/pesanans');
        transactionUrl.searchParams.set('status', 'selesai');
        transactionUrl.searchParams.set('created_from', sDate);
        transactionUrl.searchParams.set('created_to', eDate);
        if (paymentMethod !== 'all') {
            transactionUrl.searchParams.set('metode_pembayaran', paymentMethod);
        }

        const expenseUrl = `https://api.sejadikopi.com/api/pengeluarans?tanggal_from=${sDateOnly}&tanggal_to=${eDateOnly}&order=tanggal.desc`;
        
        const [transactionRes, expenseRes] = await Promise.all([
            fetch(transactionUrl.toString()),
            fetch(expenseUrl),
        ]);

        if (transactionRes.ok) {
            const data = await transactionRes.json();
            setTransactions(data.data || []);
        } else {
             setTransactions([]);
        }

        if (expenseRes.ok) {
            const data = await expenseRes.json();
            setExpenses(data.data || []);
        } else {
            setExpenses([]);
        }

    } catch (error) {
        console.error("Gagal mengambil data laporan:", error);
        toast({ variant: "destructive", title: "Error", description: "Tidak dapat memuat data laporan." });
    } finally {
        setDataLoading(false);
    }
  }, [startDate, endDate, paymentMethod, toast]);

  React.useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  React.useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);


  if (loading || user?.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Akses Ditolak</div>;
  }
  
  const handleApplyFilter = () => {
    fetchData();
  };
  
  const handleResetFilter = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
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

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return;
    try {
        const response = await fetch(`https://api.sejadikopi.com/api/pengeluarans/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Gagal menghapus pengeluaran.');
        toast({ title: 'Sukses', description: 'Pengeluaran berhasil dihapus.' });
        fetchData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  }
  
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_after_discount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const averageTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

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
  
  const toRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;
  const filterDateRangeStr = `${startDate ? format(startDate, 'd MMM yyyy') : ''} - ${endDate ? format(endDate, 'd MMM yyyy') : ''}`;

  const memoizedExpenseColumns = React.useMemo(() => expenseColumns({ onEdit: handleEditExpense, onDelete: handleDeleteExpense }), [handleEditExpense, handleDeleteExpense]);
  const memoizedTransactionColumns = React.useMemo(() => transactionColumns(), []);


  return (
    <div className="space-y-8">
      {isExpenseFormOpen && <ExpenseForm isOpen={isExpenseFormOpen} onClose={() => setIsExpenseFormOpen(false)} onSuccess={fetchData} userEmail={user.email} expense={editingExpense}/>}

      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Pembukuan</h1>
        <p className="text-muted-foreground">Analisis penjualan dan kinerja Anda.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="p-3 rounded-md bg-yellow-100">
                <Filter className="w-5 h-5 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Filter Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
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
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
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
            <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white font-bold" disabled>
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ReportStatCard
            title="Total Pendapatan"
            value={toRupiah(totalRevenue)}
            date={filterDateRangeStr}
            icon={<DollarSign className="h-5 w-5" />}
            bgColor="bg-green-500"
            textColor="text-white"
            rightIcon={<Landmark className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Total Pengeluaran"
            value={toRupiah(totalExpenses)}
            date={filterDateRangeStr}
            icon={<Receipt className="h-5 w-5" />}
            bgColor="bg-blue-500"
            textColor="text-white"
            rightIcon={<Receipt className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Laba Bersih"
            value={toRupiah(netProfit)}
            date={`Margin: ${margin.toFixed(1)}%`}
            icon={<LineChart className="h-5 w-5" />}
            bgColor="bg-purple-500"
            textColor="text-white"
            rightIcon={<LineChart className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Total Transaksi"
            value={transactions.length.toString()}
            date={`Rata-rata: ${toRupiah(averageTransaction)}`}
            icon={<ShoppingCart className="h-5 w-5" />}
            bgColor="bg-orange-500"
            textColor="text-white"
            rightIcon={<ShoppingCart className="h-6 w-6" />}
          />
        </div>

        <div>
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 rounded-md">
                    <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold">Rincian Pembayaran</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <PaymentBreakdownCard title="Tunai" amount={toRupiah(paymentBreakdown.cash.amount)} transactions={paymentBreakdown.cash.count} icon={<Landmark className="h-6 w-6 text-green-500"/>} borderColor="border-green-500" />
                <PaymentBreakdownCard title="QRIS (Semua)" amount={toRupiah(paymentBreakdown.qris.amount)} transactions={paymentBreakdown.qris.count} icon={<Grip className="h-6 w-6 text-purple-500"/>} borderColor="border-purple-500" />
                <PaymentBreakdownCard title="QRIS BCA" amount={toRupiah(paymentBreakdown.qris_bca.amount)} transactions={paymentBreakdown.qris_bca.count} icon={<Grip className="h-6 w-6 text-blue-500"/>} borderColor="border-blue-500" />
                <PaymentBreakdownCard title="QRIS BRI" amount={toRupiah(paymentBreakdown.qris_bri.amount)} transactions={paymentBreakdown.qris_bri.count} icon={<Grip className="h-6 w-6 text-sky-500"/>} borderColor="border-sky-500" />
                <PaymentBreakdownCard title="QRIS BSI" amount={toRupiah(paymentBreakdown.qris_bsi.amount)} transactions={paymentBreakdown.qris_bsi.count} icon={<Grip className="h-6 w-6 text-orange-500"/>} borderColor="border-orange-500" />
            </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Pelacakan Pengeluaran</CardTitle>
            <div className="flex gap-2">
                <Button variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white border-none" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Segarkan
                </Button>
                <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white" onClick={handleAddExpense}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Pengeluaran
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="text-center h-24 flex items-center justify-center">Memuat data...</div>
          ) : (
            <DataTable columns={memoizedExpenseColumns} data={expenses} />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-xl">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="text-center h-48 flex items-center justify-center">Memuat data...</div>
          ) : (
            <DataTable columns={memoizedTransactionColumns} data={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
