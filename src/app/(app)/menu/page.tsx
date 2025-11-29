
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { menuItems } from "@/lib/data";
import { PlusCircle, Coffee, Utensils, BookOpen, Archive, Percent, Package, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatCard({ title, value, icon: Icon, description, color }: { title: string, value: string, icon: React.ElementType, description: string, color: string }) {
  return (
    <Card className={cn("relative overflow-hidden", color)}>
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

function TabHeader({ icon: Icon, title, description, buttonText }: { icon: React.ElementType, title: string, description: string, buttonText: string }) {
  return (
    <Card className="mb-6 bg-card">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
             <Icon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function MenuPage() {
  const totalMenu = menuItems.length;
  const totalCoffee = menuItems.filter(item => item.category === 'Coffee').length;
  const totalFoodAndSnack = menuItems.filter(item => item.category === 'Pastry' || item.category === 'Tea').length;
  // Assuming total stock is the sum of all available items for now
  const totalStock = menuItems.filter(item => item.isAvailable).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Menu Management</h1>
        <p className="text-muted-foreground">Add, edit, and manage your coffee shop's menu.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Menu" value={totalMenu.toString()} icon={BookOpen} description="All items on your menu." color="bg-blue-500 text-white" />
        <StatCard title="Coffee" value={totalCoffee.toString()} icon={Coffee} description="Number of coffee varieties." color="bg-amber-600 text-white" />
        <StatCard title="Food & Snack" value={totalFoodAndSnack.toString()} icon={Utensils} description="Pastries and other snacks." color="bg-green-500 text-white" />
        <StatCard title="Total Stock" value={totalStock.toString()} icon={Archive} description="Items currently available." color="bg-slate-700 text-white" />
      </div>
      
      <Tabs defaultValue="menu">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="discount">Discount</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
          <TabsTrigger value="bestseller">Best Seller</TabsTrigger>
        </TabsList>
        <TabsContent value="menu" className="mt-6">
           <TabHeader icon={BookOpen} title="Kelola Menu" description="Tambah dan kelola menu kopi & makanan" buttonText="Buat Menu Baru" />
          <DataTable columns={columns} data={menuItems} />
        </TabsContent>
        <TabsContent value="stock" className="mt-6">
           <TabHeader icon={Archive} title="Kelola Stok" description="Atur dan perbarui jumlah stok untuk setiap item" buttonText="Tambah Stok" />
          <Card>
            <CardContent className="pt-6">
              <p>Stock management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="discount" className="mt-6">
          <TabHeader icon={Percent} title="Kelola Diskon" description="Buat dan kelola promosi untuk item menu" buttonText="Buat Diskon Baru" />
          <Card>
            <CardContent className="pt-6">
              <p>Discount management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="category" className="mt-6">
          <TabHeader icon={Utensils} title="Kelola Kategori" description="Kelompokkan item menu ke dalam kategori" buttonText="Buat Kategori Baru" />
          <Card>
            <CardContent className="pt-6">
              <p>Category management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="additional" className="mt-6">
           <TabHeader icon={Package} title="Kelola Tambahan" description="Atur topping, sirup, atau tambahan lainnya" buttonText="Buat Tambahan Baru" />
          <Card>
            <CardContent className="pt-6">
              <p>Additional items management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bestseller" className="mt-6">
          <TabHeader icon={Star} title="Kelola Best Seller" description="Tandai dan atur item menu yang paling populer" buttonText="Atur Best Seller" />
          <Card>
            <CardContent className="pt-6">
              <p>Best seller management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
