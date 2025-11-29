
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, LayoutDashboard, ClipboardList, History, BarChart3, BookOpen, User, Store, LogOut, DoorClosed } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['admin', 'kasir'] },
  { href: "/orders", label: "Orders", icon: ClipboardList, roles: ['admin', 'kasir'] },
  { href: "/menu", label: "Menu", icon: BookOpen, roles: ['admin'] },
  { href: "/history", label: "History", icon: History, roles: ['admin', 'kasir'] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ['admin', 'kasir'] },
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
  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';
  const roleDisplay = user?.role === 'admin' ? '(admin on duty)' : '(cashier on duty)';


  const availableNavItems = navItems.filter(item => item.roles.includes(userRole));

  const fetchShopStatus = async () => {
    try {
        const response = await fetch('https://api.sejadikopi.com/api/cafe_settings?select=is_open');
        const data = await response.json();
        setIsShopOpen(data.is_open);
    } catch (error) {
        console.error("Failed to fetch shop status:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch shop status.",
        });
    }
  };
  
  useEffect(() => {
    fetchShopStatus();
  }, []);

  const handleStoreButtonClick = () => {
    // Re-fetch status when opening modal to ensure it's fresh
    fetchShopStatus(); 
    setIsModalOpen(true);
  };
  
  const handleUpdateStatus = async () => {
    if (isShopOpen === null) return;
    setIsLoading(true);
    try {
        const newStatus = !isShopOpen;
        const response = await fetch('https://api.sejadikopi.com/api/cafe_settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_open: newStatus }),
        });
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        setIsShopOpen(newStatus);
        toast({
            title: "Sukses",
            description: `Toko berhasil di${newStatus ? 'buka' : 'tutup'}.`,
        });
    } catch (error) {
        console.error("Failed to update shop status:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update shop status.",
        });
    } finally {
        setIsLoading(false);
        setIsModalOpen(false);
    }
  };


  return (
    <>
        <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold">SejadiKopi</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
            {availableNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                <Link href={item.href}>
                    <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <Separator className="my-2" />
            <div className="p-2 flex items-center gap-3">
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
                            "h-9 w-9",
                            isShopOpen === true && "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700",
                            isShopOpen === false && "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700",
                            isShopOpen === null && "bg-gray-100 text-gray-600"
                        )}
                    >
                        {isShopOpen ? <Store className="h-5 w-5" /> : <DoorClosed className="h-5 w-5" />}
                    </Button>
                    <Button onClick={logout} variant="ghost" size="icon" className="h-9 w-9 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700">
                        <LogOut className="h-5 w-5" />
                    </Button>
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
