
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { columns as menuColumns } from "./columns";
import { columns as categoryColumns } from "./category-columns";
import { columns as discountColumns } from "./discount-columns";
import { columns as bestSellerColumns } from "./best-seller-columns";
import { columns as autoBestSellerColumns } from "./auto-best-seller-columns";
import { columns as variantColumns } from "./variant-columns";
import { columns as additionalColumns } from './additional-columns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';

import { PlusCircle, Coffee, Utensils, BookOpen, Percent, Star, Search, Filter, Layers, Package, Puzzle, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MenuItem } from '@/lib/data';
import { Category, Discount, Additional, Variant } from '@/lib/types';
import { MenuForm } from './menu-form';
import { CategoryForm } from './category-form';
import { DiscountForm } from './discount-form';
import { AdditionalForm } from './additional-form';
import { VariantForm } from './variant-form';


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
  const { toast } = useToast();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);

  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [menuFilterCategory, setMenuFilterCategory] = useState('all');
  const [bestSellerSearchTerm, setBestSellerSearchTerm] = useState('');

  const [isAutomaticBestSeller, setIsAutomaticBestSeller] = useState(true);
  const [isShopOpen, setIsShopOpen] = useState(true);

  const [stats, setStats] = useState({
    totalMenu: 0,
    activeMenu: 0,
    inactiveMenu: 0,
  });

  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isDiscountFormOpen, setIsDiscountFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  
  const [isAdditionalFormOpen, setIsAdditionalFormOpen] = useState(false);
  const [editingAdditional, setEditingAdditional] = useState<Additional | null>(null);

  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [menuRes, categoryRes, discountRes, bestSellerRes, additionalRes, variantRes, settingsRes] = await Promise.all([
        fetch('https://vamos-api-v2.sejadikopi.com/api/menus'),
        fetch('https://vamos-api-v2.sejadikopi.com/api/categories'),
        fetch('https://vamos-api-v2.sejadikopi.com/api/discounts'),
        fetch('https://vamos-api-v2.sejadikopi.com/api/menus?best_seller=1'),
        fetch('https://vamos-api-v2.sejadikopi.com/api/additionals'),
        fetch('https://vamos-api-v2.sejadikopi.com/api/variants'),
        fetch('https://vamos-api-v2.sejadikopi.com/api/settings'),
      ]);
      
      const menuData = menuRes.ok ? await menuRes.json() : { data: [] };
      const menuItemsData = menuData.data || [];
      setMenuItems(menuItemsData);
      
      const categoryData = categoryRes.ok ? await categoryRes.json() : { data: [] };
      setCategories(categoryData.data || []);

      const discountData = discountRes.ok ? await discountRes.json() : { data: [] };
      setDiscounts(discountData.data || []);
      
      const additionalData = additionalRes.ok ? await additionalRes.json() : { data: [] };
      setAdditionals(additionalData.data || []);

      const variantData = variantRes.ok ? await variantRes.json() : { data: [] };
      setVariants(variantData.data || []);

      const bestSellerData = bestSellerRes.ok ? await bestSellerRes.json() : { data: [] };
      setBestSellers(bestSellerData.data || []);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setIsAutomaticBestSeller(settingsData.is_auto_best_seller);
        setIsShopOpen(settingsData.is_open);
      }
      
       if (menuItemsData) {
        setStats({
          totalMenu: menuItemsData.length,
          activeMenu: menuItemsData.filter((item: MenuItem) => item.is_available).length,
          inactiveMenu: menuItemsData.filter((item: MenuItem) => !item.is_available).length,
        });
      }

    } catch (error) {
      console.error("Gagal mengambil data menu", error);
    }
  }, []);

  const handleBestSellerToggle = async (checked: boolean) => {
    setIsAutomaticBestSeller(checked);
    try {
        const response = await fetch('https://vamos-api-v2.sejadikopi.com/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                is_auto_best_seller: checked,
                is_open: isShopOpen // Include the current shop status
            }),
        });
        if (!response.ok) {
            throw new Error('Gagal memperbarui pengaturan menu terlaris.');
        }
        toast({
            title: 'Sukses',
            description: `Mode menu terlaris telah diubah ke ${checked ? 'Otomatis' : 'Manual'}.`,
        });
    } catch (error: any) {
        setIsAutomaticBestSeller(!checked); // Revert on failure
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message,
        });
    }
  };


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

  const handleMenuFormOpen = async (menuItem: MenuItem | null = null) => {
    if (menuItem) {
      try {
        const response = await fetch(`https://vamos-api-v2.sejadikopi.com/api/menus/${menuItem.id}`);
        const data = await response.json();
        setEditingMenu(data.data);
      } catch (error) {
        console.error("Gagal mengambil detail menu:", error);
        setEditingMenu(menuItem); // fallback to original data
      }
    } else {
      setEditingMenu(null);
    }
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

  const handleAdditionalFormOpen = (additional: Additional | null = null) => {
    setEditingAdditional(additional);
    setIsAdditionalFormOpen(true);
  };

  const handleVariantFormOpen = (variant: Variant | null = null) => {
    setEditingVariant(variant);
    setIsVariantFormOpen(true);
  }

  const menuColumnsWithHandlers = menuColumns({ onEdit: handleMenuFormOpen, onDeleteSuccess: fetchData, categories, variants, additionals });
  const categoryColumnsWithHandlers = categoryColumns({ onEdit: handleCategoryFormOpen, onDeleteSuccess: fetchData });
  const bestSellerColumnsWithHandlers = bestSellerColumns({ onUpdateSuccess: fetchData });
  const additionalColumnsWithHandlers = additionalColumns({ onEdit: handleAdditionalFormOpen, onDeleteSuccess: fetchData });
  const variantColumnsWithHandlers = variantColumns({ onEdit: handleVariantFormOpen, onDeleteSuccess: fetchData });


  const filteredMenuItems = menuItems.filter(item => {
    if (!item.name) return false;
    const nameMatch = item.name.toLowerCase().includes(menuSearchTerm.toLowerCase());
    const categoryMatch = menuFilterCategory === 'all' || (item.category_id !== null && item.category_id.toString() === menuFilterCategory);
    return nameMatch && categoryMatch;
  });
  
  const filteredBestSellerMenuItems = menuItems.filter(item =>
    item.name && item.name.toLowerCase().includes(bestSellerSearchTerm.toLowerCase())
  );
  
  const filteredAutomaticBestSellers = bestSellers.filter(item => 
    item.menu && item.menu.name && item.menu.name.toLowerCase().includes(bestSellerSearchTerm.toLowerCase())
  ).map((item:any, index:number) => ({...item, rank: index + 1}));


  return (
    <div className="space-y-8">
      {isMenuFormOpen && (
        <MenuForm
          isOpen={isMenuFormOpen}
          onClose={() => setIsMenuFormOpen(false)}
          onSuccess={fetchData}
          menuItem={editingMenu}
          categories={categories}
          additionals={additionals}
          variants={variants}
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
      {isAdditionalFormOpen && (
         <AdditionalForm
          isOpen={isAdditionalFormOpen}
          onClose={() => setIsAdditionalFormOpen(false)}
          onSuccess={fetchData}
          additional={editingAdditional}
        />
      )}
      {isVariantFormOpen && (
        <VariantForm 
          isOpen={isVariantFormOpen}
          onClose={() => setIsVariantFormOpen(false)}
          onSuccess={fetchData}
          variant={editingVariant}
        />
      )}

      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Manajemen Menu</h1>
        <p className="text-muted-foreground">Tambah, ubah, dan kelola semua aspek menu kedai kopi Anda.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Menu" value={stats.totalMenu.toString()} icon={BookOpen} description="Semua item di menu Anda." color="bg-gradient-to-tr from-blue-500 to-blue-700 text-white" />
        <StatCard title="Menu Aktif" value={stats.activeMenu.toString()} icon={CheckCircle} description="Item menu yang tersedia untuk dijual." color="bg-gradient-to-tr from-green-500 to-green-700 text-white" />
        <StatCard title="Menu Tidak Aktif" value={stats.inactiveMenu.toString()} icon={XCircle} description="Item menu yang tidak tersedia." color="bg-gradient-to-tr from-red-500 to-red-700 text-white" />
      </div>
      
      <Tabs defaultValue="menu">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 h-auto">
          <TabsTrigger value="menu">Menu Utama</TabsTrigger>
          <TabsTrigger value="category">Kategori</TabsTrigger>
          <TabsTrigger value="variant">Varian</TabsTrigger>
          <TabsTrigger value="additional">Tambahan</TabsTrigger>
          <TabsTrigger value="discount">Diskon</TabsTrigger>
          <TabsTrigger value="bestseller">Menu Terlaris</TabsTrigger>
        </TabsList>
        <TabsContent value="menu" className="mt-6">
          <div className="space-y-6">
            <TabHeader 
              icon={BookOpen} 
              title="Kelola Menu Utama" 
              description="Tambah dan kelola menu kopi & makanan" 
              buttonText="Buat Menu Baru" 
              onButtonClick={() => handleMenuFormOpen()} 
            />
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex flex-col md:flex-row items-center gap-4">
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
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable 
                  columns={menuColumnsWithHandlers} 
                  data={filteredMenuItems} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="category" className="mt-6">
          <TabHeader icon={Layers} title="Kelola Kategori" description="Kelompokkan item menu ke dalam kategori" buttonText="Buat Kategori Baru" onButtonClick={() => handleCategoryFormOpen()} />
          <Card className="rounded-xl">
             <CardContent className="p-0">
                <DataTable
                columns={categoryColumnsWithHandlers}
                data={categories}
                />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="variant" className="mt-6">
          <TabHeader icon={Package} title="Kelola Varian" description="Kelola varian menu seperti ukuran atau tipe" buttonText="Buat Varian Baru" onButtonClick={() => handleVariantFormOpen()} />
           <Card className="rounded-xl">
             <CardContent className="p-0">
                <DataTable
                  columns={variantColumnsWithHandlers}
                  data={variants}
                />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional" className="mt-6">
          <TabHeader icon={Puzzle} title="Kelola Tambahan" description="Kelola item tambahan untuk menu" buttonText="Buat Tambahan Baru" onButtonClick={() => handleAdditionalFormOpen()} />
           <Card className="rounded-xl">
             <CardContent className="p-0">
                <DataTable
                columns={additionalColumnsWithHandlers}
                data={additionals}
                />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discount" className="mt-6">
          <TabHeader icon={Percent} title="Kelola Diskon" description="Buat dan kelola promosi untuk item menu" buttonText="Buat Diskon Baru" onButtonClick={() => handleDiscountFormOpen()} />
          <Card className="rounded-xl">
             <CardContent className="p-0">
                <DataTable 
                columns={discountColumns({ onEdit: handleDiscountFormOpen, onDeleteSuccess: fetchData })}
                data={discounts}
                />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bestseller" className="mt-6">
          <TabHeader icon={Star} title="Manajer Menu Terlaris" description="Atur item menu yang paling direkomendasikan" buttonText="" onButtonClick={() => {}} buttonDisabled={true}>
             <div className="flex items-center space-x-2">
                <Label htmlFor="bestseller-mode" className={cn(!isAutomaticBestSeller && "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold")}>Manual</Label>
                <Switch
                  id="bestseller-mode"
                  checked={isAutomaticBestSeller}
                  onCheckedChange={handleBestSellerToggle}
                />
                <Label htmlFor="bestseller-mode" className={cn(isAutomaticBestSeller && "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold")}>Otomatis</Label>
              </div>
          </TabHeader>
          <Card className="rounded-xl">
             <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-300 focus-within:text-primary" />
                    <Input
                      placeholder="Cari nama menu..."
                      className="pl-10 transition-all duration-300 focus:shadow-md focus:shadow-primary/20"
                      value={bestSellerSearchTerm}
                      onChange={(e) => setBestSellerSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
              {isAutomaticBestSeller ? (
                <DataTable
                  columns={autoBestSellerColumns}
                  data={filteredAutomaticBestSellers}
                />
              ) : (
                <DataTable
                    columns={bestSellerColumnsWithHandlers}
                    data={filteredBestSellerMenuItems}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
