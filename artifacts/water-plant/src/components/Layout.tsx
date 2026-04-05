import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  RotateCcw,
  DollarSign,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  Droplets,
  ShoppingBag,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/types";

const roleLabels: Record<UserRole, string> = {
  dev: "Developer",
  admin: "Admin",
  store_manager: "Store Manager",
};

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  children?: { label: string; href: string; roles?: UserRole[]; icon?: React.ComponentType<{ className?: string }> }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { label: "Receive Empty Bottles", href: "/inventory/receive" },
      { label: "Filling Process", href: "/inventory/fill" },
      { label: "Stock View", href: "/inventory/stock" },
      { label: "Labels & Caps", href: "/inventory/consumables" },
    ],
  },
  { label: "Customers", href: "/customers", icon: Users },
  {
    label: "Invoices",
    icon: FileText,
    children: [
      { label: "New Invoice", href: "/invoices/new" },
      { label: "Invoice History", href: "/invoices" },
    ],
  },
  {
    label: "Returns",
    icon: RotateCcw,
    children: [
      { label: "Product Return", href: "/returns/product" },
      { label: "19L Can Return", href: "/returns/can" },
    ],
  },
  { label: "Payments", href: "/payments", icon: DollarSign },
  { label: "Expenses", href: "/expenses", icon: DollarSign },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Products", href: "/products", icon: ShoppingBag, roles: ["dev", "admin"] },
  {
    label: "Settings",
    icon: Settings,
    roles: ["dev", "admin"],
    children: [
      { label: "Business Info", href: "/settings/business", roles: ["dev"] },
      { label: "Users", href: "/settings/users", roles: ["dev"] },
      { label: "Backup & Restore", href: "/settings/backup", icon: HardDrive, roles: ["dev", "admin"] },
    ],
  },
];

function NavItemComponent({ item }: { item: NavItem }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(() => {
    if (item.children) return item.children.some((c) => c.href === location);
    return false;
  });

  if (item.roles && user && !item.roles.includes(user.role)) return null;

  if (item.children) {
    const visibleChildren = item.children.filter(
      (c) => !c.roles || (user && c.roles.includes(user.role))
    );
    if (visibleChildren.length === 0) return null;
    const isActive = visibleChildren.some((c) => c.href === location);
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80"
          )}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {open && (
          <div className="ml-7 mt-1 space-y-1">
            {visibleChildren.map((child) => (
              <Link key={child.href} href={child.href}>
                <a
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                    location === child.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${child.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {child.label}
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = location === item.href;
  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-30 w-64 bg-sidebar flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sidebar-primary shrink-0">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Water Plant</p>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItemComponent key={item.label} item={item} />
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
          {user && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sidebar-accent/30">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-sidebar-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/50">{roleLabels[user.role]}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card no-print">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} data-testid="button-menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Water Plant Manager</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
