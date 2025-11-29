
"use client"

import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { orders, Order } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Download, Filter, ArrowRight, Check, RotateCcw, Wallet, DollarSign, Receipt, LineChart, ShoppingCart, Landmark, Grip } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Helper to aggregate data client-side
const aggregateSalesData = (startDate?: Date, endDate?: Date, paymentMethod?: string) => {
  const salesByDate = orders
    .filter(o => o.status === 'Completed')
    .filter(o => {
      const orderDate = new Date(o.createdAt);
      const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
      const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;
      if (paymentMethod && paymentMethod !== 'All' && o.paymentMethod !== paymentMethod) return false;
      return true;
    })
    .reduce((acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-CA'); // Use YYYY-MM-DD for sorting
      acc[date] = (acc[date] || 0) + order.total;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(salesByDate)
    .map(([date, sales]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

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

export default function ReportsPage() {
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();
  const [paymentMethod, setPaymentMethod] = React.useState<string>("All");
  const [filteredData, setFilteredData] = React.useState(aggregateSalesData());

  const handleApplyFilter = () => {
    setFilteredData(aggregateSalesData(startDate, endDate, paymentMethod));
  };
  
  const handleResetFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setPaymentMethod("All");
    setFilteredData(aggregateSalesData());
  };


  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--primary))",
    },
  }

  const todayStr = format(new Date(), "dd MMMM yyyy");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Analyze your sales and performance.</p>
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
                <div className="flex items-center gap-2">
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
                        {startDate ? format(startDate, "dd/MM/yyyy") : <span>Pick a date</span>}
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
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
                        {endDate ? format(endDate, "dd/MM/yyyy") : <span>Pick a date</span>}
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
                <div className="hidden md:block"></div>
            </div>
            <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Semua Metode" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="GoPay">GoPay</SelectItem>
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
            <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-none font-bold">
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ReportStatCard
            title="Total Pendapatan"
            value="Rp 0"
            date={todayStr}
            icon={<DollarSign className="h-5 w-5" />}
            bgColor="bg-green-500"
            textColor="text-white"
            rightIcon={<Landmark className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Total Pengeluaran"
            value="Rp 0"
            date={todayStr}
            icon={<Receipt className="h-5 w-5" />}
            bgColor="bg-blue-500"
            textColor="text-white"
            rightIcon={<Receipt className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Laba Bersih"
            value="Rp 0"
            date="Margin: 0.0%"
            icon={<LineChart className="h-5 w-5" />}
            bgColor="bg-purple-500"
            textColor="text-white"
            rightIcon={<LineChart className="h-6 w-6" />}
          />
          <ReportStatCard
            title="Total Transaksi"
            value="0"
            date="Avg: Rp 0"
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
                <h2 className="text-xl font-bold">Breakdown Pembayaran</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <PaymentBreakdownCard title="Cash" amount="Rp 0" transactions={0} icon={<Landmark className="h-6 w-6 text-green-500"/>} borderColor="border-green-500" />
                <PaymentBreakdownCard title="QRIS (Semua)" amount="Rp 0" transactions={0} icon={<Grip className="h-6 w-6 text-purple-500"/>} borderColor="border-purple-500" />
                <PaymentBreakdownCard title="QRIS BCA" amount="Rp 0" transactions={0} icon={<Grip className="h-6 w-6 text-blue-500"/>} borderColor="border-blue-500" />
                <PaymentBreakdownCard title="QRIS BRI" amount="Rp 0" transactions={0} icon={<Grip className="h-6 w-6 text-sky-500"/>} borderColor="border-sky-500" />
                <PaymentBreakdownCard title="QRIS BSI" amount="Rp 0" transactions={0} icon={<Grip className="h-6 w-6 text-orange-500"/>} borderColor="border-orange-500" />
            </div>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Daily Sales</CardTitle>
          <CardDescription>A summary of sales from completed orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
                  content={<ChartTooltipContent
                    formatter={(value) => `$${(value as number).toFixed(2)}`}
                    />}
                />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
