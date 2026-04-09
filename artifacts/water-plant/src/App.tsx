import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

import Login from "@/pages/Login";
import Activation from "@/pages/Activation";
import Dashboard from "@/pages/Dashboard";
import ReceiveEmpty from "@/pages/inventory/ReceiveEmpty";
import FillingProcess from "@/pages/inventory/FillingProcess";
import StockView from "@/pages/inventory/StockView";
import ConsumableInventory from "@/pages/inventory/ConsumableInventory";
import ProductStock from "@/pages/inventory/ProductStock";
import Customers from "@/pages/customers/Customers";
import CustomerDetail from "@/pages/customers/CustomerDetail";
import NewInvoice from "@/pages/invoices/NewInvoice";
import InvoiceHistory from "@/pages/invoices/InvoiceHistory";
import InvoiceView from "@/pages/invoices/InvoiceView";
import Expenses from "@/pages/expenses/Expenses";
import ProductReturn from "@/pages/returns/ProductReturn";
import CanReturn from "@/pages/returns/CanReturn";
import ReceivePayment from "@/pages/payments/ReceivePayment";
import Reports from "@/pages/reports/Reports";
import Products from "@/pages/products/Products";
import BusinessSettings from "@/pages/settings/BusinessSettings";
import UsersPage from "@/pages/settings/Users";
import BackupRestore from "@/pages/settings/BackupRestore";
import Permissions from "@/pages/settings/Permissions";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inventory/receive" component={ReceiveEmpty} />
        <Route path="/inventory/fill" component={FillingProcess} />
        <Route path="/inventory/stock" component={StockView} />
        <Route path="/inventory/consumables" component={ConsumableInventory} />
        <Route path="/inventory/product-stock" component={ProductStock} />
        <Route path="/customers" component={Customers} />
        <Route path="/customers/:id" component={CustomerDetail} />
        <Route path="/invoices" component={InvoiceHistory} />
        <Route path="/invoices/new" component={NewInvoice} />
        <Route path="/invoices/:id" component={InvoiceView} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/returns/product" component={ProductReturn} />
        <Route path="/returns/can" component={CanReturn} />
        <Route path="/payments" component={ReceivePayment} />
        <Route path="/reports" component={Reports} />
        <Route path="/products" component={Products} />
        <Route path="/settings/business" component={BusinessSettings} />
        <Route path="/settings/users" component={UsersPage} />
        <Route path="/settings/backup" component={BackupRestore} />
        <Route path="/settings/permissions" component={Permissions} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ActivationGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<{ activated: boolean; displayId?: string } | null>(null);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.getMachineStatus) {
      // Running in web/browser — skip activation
      setStatus({ activated: true });
      return;
    }
    api.getMachineStatus().then((s: any) => setStatus(s));
  }, []);

  if (!status) return null; // Loading

  if (!status.activated && status.displayId) {
    return (
      <Activation
        displayId={status.displayId}
        onActivated={() => setStatus({ activated: true })}
      />
    );
  }

  return <>{children}</>;
}

const isElectron = !!(window as any).electronAPI;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ActivationGate>
          <AuthProvider>
            {isElectron ? (
              <WouterRouter hook={useHashLocation}>
                <AppRoutes />
              </WouterRouter>
            ) : (
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppRoutes />
              </WouterRouter>
            )}
            <Toaster />
          </AuthProvider>
        </ActivationGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
