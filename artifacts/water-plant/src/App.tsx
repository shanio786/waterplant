import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ReceiveEmpty from "@/pages/inventory/ReceiveEmpty";
import FillingProcess from "@/pages/inventory/FillingProcess";
import StockView from "@/pages/inventory/StockView";
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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
