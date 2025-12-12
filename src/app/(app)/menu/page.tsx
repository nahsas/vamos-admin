
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { columns as menuColumns } from "./columns";
import { columns as categoryColumns } from "./category-columns";
import { columns as discountColumns } from "./discount-columns";
import { columns as stockColumns } from "./stock-columns";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { PlusCircle, Coffee, Utensils, BookOpen, Archive, Percent, Star, Search, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MenuItem } from '@/lib/data';
import { Category, Discount } from '@/lib/types';
import { MenuForm } from './menu-form';
import { CategoryForm } from './category-form';
import { DiscountForm } from './discount-form';

function StatCard({ title, value, icon: Icon, description, color }: { title: string, value: string, icon: React.ElementType, description: string, color: string }) {
  return (
    <Card className={cn("relative overflow-hidden rounded-xl", color)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-white/80" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-white/70">{description}</p>
      </CardContent>
    </Card>
  );
}

function TabHeader({ icon: Icon, title, description, buttonText, onButtonClick, buttonDisabled = false, children }: { icon: React.ElementType, title: string, description: string, buttonText: string, onButtonClick: () => void, buttonDisabled?: boolean, children?: React.ReactNode }) {
  return (
    <Card className="mb-6 bg-card rounded-xl">
      <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-4 flex-grow">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
             <Icon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {children || (
            <Button onClick={onButtonClick} disabled={buttonDisabled} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function MenuPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [menuFilterCategory, setMenuFilterCategory] = useState('all');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockFilterAvailability, setStockFilterAvailability] = useState('all');

  const [stats, setStats] = useState({
    totalMenu: 0,
    totalCoffee: 0,
    totalFoodAndSnack: 0,
    totalStock: 0,
  });

  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isDiscountFormOpen, setIsDiscountFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      const [menuRes, categoryRes, discountRes] = await Promise.all([
        fetch('https://vamos-api.sejadikopi.com/api/menu'),
        fetch('https://vamos-api.sejadikopi.com/api/categories'),
        fetch('https://vamos-api.sejadikopi.com/api/discount-codes'),
      ]);
      
      const menuData = menuRes.ok ? await menuRes.json() : { data: [] };
      setMenuItems(menuData.data || []);
      
      const categoryData = categoryRes.ok ? await categoryRes.json() : { data: [] };
      setCategories(categoryData.data || []);

      const discountData = discountRes.ok ? await discountRes.json() : { data: [] };
      setDiscounts(discountData.data || []);
      
       if (menuData.data) {
        const foodAndSnackCategoryIds = [3, 4, 5, 6, 7];
        const coffeeCategoryId = 1;

        const totalMenu = menuData.data.length;
        const totalStock = menuData.data.reduce((acc: number, item: { stok: number }) => acc + (item.stok || 0), 0);
        const totalCoffee = menuData.data.filter((item: { kategori_id: number }) => item.kategori_id === coffeeCategoryId).length;
        const totalFoodAndSnack = menuData.data.filter((item: { kategori_id: number }) => foodAndSnackCategoryIds.includes(item.kategori_id)).length;
        
        setStats({
          totalMenu,
          totalCoffee,
          totalFoodAndSnack,
          totalStock,
        });
      }

    } catch (error) {
      console.error("Gagal mengambil data menu", error);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Akses Ditolak</div>;
  }

  const handleMenuFormOpen = (menuItem: MenuItem | null = null) => {
    setEditingMenu(menuItem);
    setIsMenuFormOpen(true);
  };
  
  const handleCategoryFormOpen = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleDiscountFormOpen = (discount: Discount | null = null) => {
    setEditingDiscount(discount);
    setIsDiscountFormOpen(true);
  };

  const menuColumnsWithCategories = menuColumns({ onEdit: handleMenuFormOpen, onDeleteSuccess: fetchData, categories });
  const stockColumnsWithHandlers = stockColumns({ onUpdateSuccess: fetchData, categories });

  const filteredMenuItems = menuItems.filter(item => {
    const nameMatch = item.nama.toLowerCase().includes(menuSearchTerm.toLowerCase());
    const categoryMatch = menuFilterCategory === 'all' || (item.kategori_id !== null && item.kategori_id.toString() === menuFilterCategory);
    return nameMatch && categoryMatch;
  });
  
  const filteredStockItems = menuItems.filter(item => {
    const nameMatch = item.nama.toLowerCase().includes(stockSearchTerm.toLowerCase());
    
    const availabilityMatch = stockFilterAvailability === 'all' 
      || (stockFilterAvailability === 'available' && item.is_available)
      || (stockFilterAvailability === 'unavailable' && !item.is_available);

    return nameMatch && availabilityMatch;
  });


  return (
    <div className="space-y-8">
      {isMenuFormOpen && (
        <MenuForm
          isOpen={isMenuFormOpen}
          onClose={() => setIsMenuFormOpen(false)}
          onSuccess={fetchData}
          menuItem={editingMenu}
          categories={categories}
        />
      )}
      {isCategoryFormOpen && (
         <CategoryForm
          isOpen={isCategoryFormOpen}
          onClose={() => setIsCategoryFormOpen(false)}
          onSuccess={fetchData}
          category={editingCategory}
        />
      )}
      {isDiscountFormOpen && (
         <DiscountForm
          isOpen={isDiscountFormOpen}
          onClose={() => setIsDiscountFormOpen(false)}
          onSuccess={fetchData}
          discount={editingDiscount}
        />
      )}

      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Manajemen Menu</h1>
        <p className="text-muted-foreground">Tambah, ubah, dan kelola menu kedai kopi Anda.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Menu" value={stats.totalMenu.toString()} icon={BookOpen} description="Semua item di menu Anda." color="bg-blue-500 text-white" />
        <StatCard title="Kopi" value={stats.totalCoffee.toString()} icon={Coffee} description="Jumlah varian kopi." color="bg-amber-600 text-white" />
        <StatCard title="Makanan & Snack" value={stats.totalFoodAndSnack.toString()} icon={Utensils} description="Kue kering dan makanan ringan lainnya." color="bg-green-500 text-white" />
        <StatCard title="Total Stok" value={stats.totalStock.toString()} icon={Archive} description="Item yang saat ini tersedia." color="bg-slate-700 text-white" />
      </div>
      
      <Tabs defaultValue="menu">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="stock">Stok</TabsTrigger>
          <TabsTrigger value="discount">Diskon</TabsTrigger>
          <TabsTrigger value="category">Kategori</TabsTrigger>
        </TabsList>
        <TabsContent value="menu" className="mt-6">
          <div className="space-y-6">
            <Card className='rounded-xl'>
              <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-4 flex-grow">
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                          <BookOpen className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold">Kelola Menu</h3>
                          <p className="text-sm text-muted-foreground">Tambah dan kelola menu kopi & makanan</p>
                      </div>
                  </div>
                  <Button onClick={() => handleMenuFormOpen()} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Buat Menu Baru
                  </Button>
              </CardContent>
            </Card>
            <Card className='rounded-xl'>
                <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-grow w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Cari menu..."
                      className="pl-10"
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={menuFilterCategory} onValueChange={setMenuFilterCategory}>
                    <SelectTrigger className="w-full md:w-[240px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter Kategori" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
          </div>
          <div className="w-full overflow-x-auto mt-6">
            <DataTable 
                columns={menuColumnsWithCategories} 
                data={filteredMenuItems} 
              />
          </div>
        </TabsContent>
        <TabsContent value="stock" className="mt-6">
          <Card className="mb-6 rounded-xl">
              <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama item..."
                    className="pl-10"
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={stockFilterAvailability} onValueChange={setStockFilterAvailability}>
                  <SelectTrigger className="w-full md:w-[240px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filter Ketersediaan" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="available">Tersedia</SelectItem>
                    <SelectItem value="unavailable">Habis</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          <div className="w-full overflow-x-auto">
            <DataTable 
                columns={stockColumnsWithHandlers}
                data={filteredStockItems} 
              />
          </div>
        </TabsContent>
        <TabsContent value="discount" className="mt-6">
          <TabHeader icon={Percent} title="Kelola Diskon" description="Buat dan kelola promosi untuk item menu" buttonText="Buat Diskon Baru" onButtonClick={() => handleDiscountFormOpen()} />
          <div className="w-full overflow-x-auto">
            <DataTable 
              columns={discountColumns({ onEdit: handleDiscountFormOpen, onDeleteSuccess: fetchData })}
              data={discounts}
            />
          </div>
        </TabsContent>
        <TabsContent value="category" className="mt-6">
          <TabHeader icon={Utensils} title="Kelola Kategori" description="Kelompokkan item menu ke dalam kategori" buttonText="Buat Kategori Baru" onButtonClick={() => handleCategoryFormOpen()} />
          <div className="w-full overflow-x-auto">
            <DataTable
              columns={categoryColumns({ onEdit: handleCategoryFormOpen, onDeleteSuccess: fetchData })}
              data={categories}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
