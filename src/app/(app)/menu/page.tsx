
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { menuItems } from "@/lib/data";
import { PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MenuPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage your coffee shop's menu.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New
        </Button>
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
        <TabsContent value="menu">
          <DataTable columns={columns} data={menuItems} />
        </TabsContent>
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
              <CardDescription>Manage stock levels for your items.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Stock management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="discount">
          <Card>
            <CardHeader>
              <CardTitle>Discount Management</CardTitle>
              <CardDescription>Create and manage discounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Discount management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>Manage menu categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Category management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="additional">
          <Card>
            <CardHeader>
              <CardTitle>Additional Items Management</CardTitle>
              <CardDescription>Manage add-ons and extras.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Additional items management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bestseller">
          <Card>
            <CardHeader>
              <CardTitle>Best Seller Management</CardTitle>
              <CardDescription>Manage your best-selling items.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Best seller management CRUD will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
