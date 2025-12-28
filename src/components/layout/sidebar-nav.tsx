
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, History, BarChart3, BookOpen, LogOut, DoorClosed, Store, Fingerprint, UserCog, Users, CalendarCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import React, { useState, useEffect } from "react";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['admin', 'kasir'] },
  { href: "/orders", label: "Pesanan", icon: ShoppingCart, roles: ['admin', 'kasir'] },
  { href: "/history", label: "Riwayat", icon: History, roles: ['admin', 'kasir'] },
];

const managementNavItems = [
    { href: "/reports", label: "Pembukuan", icon: BarChart3, roles: ['admin', 'kasir'] },
    { href: "/menu", label: "Manajer Menu", icon: BookOpen, roles: ['admin'] },
];

const externalNavItems = [
    { href: "/workers", label: "Manajemen Pekerja", icon: Users, roles: ['admin'] },
    { href: "/attendance", label: "Laporan Absensi", icon: CalendarCheck, roles: ['admin', 'kasir'] },
];


function ShopStatusModal({ isOpen, onOpenChange, shopStatus, onConfirm, loading }: { isOpen: boolean, onOpenChange: (open: boolean) => void, shopStatus: boolean | null, onConfirm: () => void, loading: boolean }) {
    const nextStatusText = shopStatus ? 'menutup' : 'membuka';
    const currentStatusText = shopStatus ? 'BUKA' : 'TUTUP';
    const buttonText = shopStatus ? 'Tutup' : 'Buka';

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Perubahan Status Toko</AlertDialogTitle>
                <AlertDialogDescription>
                    {shopStatus === null
                    ? "Memuat status toko..."
                    : `Toko saat ini ${currentStatusText}. Apakah Anda yakin ingin ${nextStatusText} toko?`}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={onConfirm} 
                    disabled={loading}
                    className={cn(
                        shopStatus === false && "bg-green-600 hover:bg-green-700",
                        shopStatus === true && "bg-red-600 hover:bg-red-700"
                    )}
                >
                    {loading ? 'Memperbarui...' : `Ya, ${buttonText} Toko`}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isShopOpen, setIsShopOpen] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const userRole = user?.role || '';
  const userName = user?.email.split('@')[0];
  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : 'Admin';
  const roleDisplay = user?.role === 'admin' ? 'Administrator' : 'Kasir';

  const availableMainNavItems = mainNavItems.filter(item => item.roles.includes(userRole));
  const availableManagementNavItems = managementNavItems.filter(item => item.roles.includes(userRole));
  const availableExternalNavItems = externalNavItems.filter(item => item.roles.includes(userRole));


  const fetchShopStatus = async () => {
    try {
        const response = await fetch('https://vamos-api-v2.sejadikopi.com/api/settings');
        const data = await response.json();
        setIsShopOpen(data.is_open);
    } catch (error) {
        console.error("Gagal mengambil status toko:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Tidak dapat mengambil status toko.",
        });
    }
  };
  
  useEffect(() => {
    fetchShopStatus();
  }, []);

  const handleStoreButtonClick = () => {
    fetchShopStatus(); 
    setIsModalOpen(true);
  };
  
  const handleUpdateStatus = async () => {
    if (isShopOpen === null) return;
    setIsLoading(true);
    try {
        const newStatus = !isShopOpen;
        const response = await fetch('https://vamos-api-v2.sejadikopi.com/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_open: newStatus }),
        });
        if (!response.ok) {
            throw new Error('Gagal memperbarui status');
        }
        setIsShopOpen(newStatus);
        toast({
            title: "Sukses",
            description: `Toko berhasil di${newStatus ? 'buka' : 'tutup'}.`,
        });
    } catch (error: any) {
        console.error("Gagal memperbarui status toko:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Tidak dapat memperbarui status toko.",
        });
    } finally {
        setIsLoading(false);
        setIsModalOpen(false);
    }
  };

  const NavItem = ({ item }: { item: (typeof mainNavItems[0] & { target?: string }) }) => (
    <SidebarMenuItem key={item.label}>
      <Link href={item.href} target={item.target || '_self'} rel={item.target ? "noopener noreferrer" : ""}>
        <SidebarMenuButton
          isActive={!item.target && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))}
          className="group flex items-center gap-4 rounded-lg px-4 py-3"
        >
          <div className={cn(
              "p-2 rounded-lg bg-gray-100 group-data-[active=true]:bg-white"
          )}>
            <item.icon className={cn("h-6 w-6 text-gray-700 group-data-[active=true]:text-primary")} />
          </div>
          <span className="text-base font-medium group-data-[active=true]:text-white">
            {item.label}
          </span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
             <Image src="https://vamos-api-v2.sejadikopi.com/api/images?path=Logo/vamos.png" alt="Sejadi Kopi Logo" width={56} height={56} className="rounded-lg border border-sidebar-border shadow-lg" unoptimized />
            <div>
              <h1 className="text-lg font-headline font-bold">VAMOS</h1>
              <p className="text-sm text-muted-foreground">Panel Admin</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4">
            <SidebarGroup>
                <SidebarGroupLabel className="px-0">MENU UTAMA</SidebarGroupLabel>
                <SidebarMenu>
                    {availableMainNavItems.map((item) => <NavItem key={item.href} item={item} />)}
                </SidebarMenu>
            </SidebarGroup>
            {availableManagementNavItems.length > 0 && (
                <SidebarGroup>
                    <SidebarGroupLabel className="px-0">MANAJEMEN</SidebarGroupLabel>
                    <SidebarMenu>
                         {availableManagementNavItems.map((item) => <NavItem key={item.href} item={item} />)}
                    </SidebarMenu>
                </SidebarGroup>
            )}
             {availableExternalNavItems.length > 0 && (
                <SidebarGroup>
                    <SidebarGroupLabel className="px-0">LAINNYA</SidebarGroupLabel>
                    <SidebarMenu>
                         {availableExternalNavItems.map((item) => <NavItem key={item.href} item={item} />)}
                    </SidebarMenu>
                </SidebarGroup>
            )}
        </SidebarContent>
        <SidebarFooter className="p-4">
          <Separator className="my-2" />
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-yellow-100">
                <AvatarFallback className="bg-yellow-100 text-primary font-bold">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleDisplay}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleStoreButtonClick}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg",
                  isShopOpen === true
                    ? "bg-green-600/10 text-green-600 hover:bg-green-600/20"
                    : "bg-red-600/10 text-red-600 hover:bg-red-600/20",
                  isShopOpen === null && "bg-gray-100 text-gray-600"
                )}
              >
                {isShopOpen ? <Store className="h-5 w-5" /> : <DoorClosed className="h-5 w-5" />}
              </Button>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600/20">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin ingin keluar?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Anda akan dikembalikan ke halaman login.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={logout} className="bg-destructive hover:bg-destructive/90">
                        Keluar
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
        </SidebarFooter>
      </Sidebar>
      <ShopStatusModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        shopStatus={isShopOpen}
        onConfirm={handleUpdateStatus}
        loading={isLoading}
      />
    </>
  );
}
