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
  X,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
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
];

function NavItemComponent({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const [location] = useLocation();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((c) => c.href === location);
    }
    return false;
  });

  if (item.children) {
    const isActive = item.children.some((c) => c.href === location);
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80"
          )}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-7 mt-1 space-y-1">
            {item.children.map((child) => (
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
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sidebar-primary">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-tight">
              Water Plant
            </p>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItemComponent key={item.label} item={item} collapsed={false} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40 text-center">
            v1.0 — Offline Mode
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card no-print">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Water Plant Manager</span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
